import {
  CancellableSleep,
  EventEmittingService,
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
  IterableProviderComponent,
  IterableProviderFn,
  ParallelExecutionStrategy,
  ProviderComponent,
  ProviderFn,
  Queue,
  QueueOptions,
  SERVICE_STARTED,
  SERVICE_START_ERROR,
  SERVICE_STOPPED,
  SERVICE_STOP_ERROR,
  ServiceEvents,
  getComponent,
  isError,
  parallelExecutionStrategy,
  serialExecutionStrategy,
  sleep,
} from '@sektek/utility-belt';

import {
  AbstractEventHandlingComponent,
  EventHandlingComponentOptions,
} from './abstract-event-handling-component.js';
import {
  EVENT_ERROR,
  EVENT_PROCESSED,
  EVENT_RECEIVED,
  Event,
  EventHandlerEvents,
} from './types/index.js';

const DEFAULT_FREQUENCY = 60_000;

export type ProviderGatewayOptions<T extends Event = Event> =
  EventHandlingComponentOptions<T> & {
    /** Returns an iterable of events per poll */
    provider: IterableProviderComponent<T>;
    /**
     * Dynamic interval provider — returns ms to wait before the next poll.
     * Takes precedence over `frequency` when both are provided.
     */
    intervalProvider?: ProviderComponent<number>;
    /**
     * Fixed interval in ms between polls. Ignored when `intervalProvider` is
     * set. Defaults to `60000` (1 minute) if neither option is provided.
     */
    frequency?: number;
    /**
     * Maximum number of events processed concurrently. Ignored when
     * `executionStrategy` is also provided. Use `1` for serial processing,
     * `Infinity` for unlimited parallelism. Must be a positive integer or
     * `Infinity`.
     */
    concurrency?: number;
    /**
     * Custom execution strategy for handler invocations. Takes precedence
     * over `concurrency` when both are provided.
     */
    executionStrategy?: ExecutionStrategyComponent;
    /** Options forwarded to the internal Queue */
    queueOptions?: QueueOptions;
  };

/**
 * Events emitted by a {@link ProviderGateway}.
 *
 * @template T The event type handled by the gateway.
 */
export type ProviderGatewayEvents<T extends Event = Event> =
  EventHandlerEvents<T> &
    ServiceEvents & {
      'gateway:started': () => void;
      'gateway:stopped': () => void;
    };

/**
 * A pull-based gateway that periodically retrieves events from a provider and
 * dispatches them to a handler.
 *
 * Two concurrent loops run after {@link start} is called:
 *
 * - **Polling loop** — waits for the duration returned by `intervalProvider`
 *   (or the fixed `frequency`), calls `provider.values()` to obtain an
 *   iterable of events, emits `event:received` for each one, and enqueues them.
 * - **Consumer loop** — drains the internal {@link Queue} and dispatches each
 *   event to the handler, using the configured `executionStrategy` (or
 *   `concurrency`) to control parallelism. Emits `event:processed` on success
 *   or `event:error` on failure, then continues with the next event.
 *
 * Provider errors are caught, emitted as `event:error`, and the polling loop
 * continues — the gateway does not stop on transient fetch failures.
 *
 * **Lifecycle events** — `start()` and `stop()` emit the generic service
 * lifecycle events (`service:started`, `service:startError`,
 * `service:stopped`, `service:stopError`) alongside the gateway-specific
 * `gateway:started` and `gateway:stopped`, in the same way that
 * `event:received` accompanies a gateway's own receive event. On success the
 * gateway-specific event is emitted first, immediately followed by its
 * service counterpart. On failure only the matching `service:*Error` event
 * is emitted, carrying an `Error`, and the original thrown value is rethrown
 * unchanged.
 *
 * **Interval resolution** (first match wins):
 * 1. `intervalProvider` — dynamic ms-per-poll provider
 * 2. `frequency` — fixed ms between polls
 * 3. default — `60000` ms (1 minute)
 *
 * **Concurrency resolution** (first match wins):
 * 1. `executionStrategy` — full custom strategy
 * 2. `concurrency: 1` — serial processing
 * 3. `concurrency: N` — parallel with max N concurrent handlers
 * 4. default — unlimited parallel (`parallelExecutionStrategy`)
 *
 * @template T The event type handled by this gateway.
 *
 * @example
 * ```ts
 * // Dynamic interval + bounded concurrency
 * const gateway = new ProviderGateway({
 *   provider: myEventSource,
 *   intervalProvider: () => 5000,  // poll every 5 s
 *   concurrency: 4,
 *   handler: myHandler,
 * });
 *
 * // Fixed frequency shorthand
 * const gateway = new ProviderGateway({
 *   provider: myEventSource,
 *   frequency: 10_000,             // poll every 10 s
 *   handler: myHandler,
 * });
 *
 * await gateway.start();
 * // ...
 * await gateway.stop();
 * ```
 */
export class ProviderGateway<T extends Event = Event>
  extends AbstractEventHandlingComponent<T>
  implements EventEmittingService<ProviderGatewayEvents<T>>
{
  #provider: IterableProviderFn<T>;
  #intervalProvider: ProviderFn<number>;
  #executionStrategy: ExecutionStrategyFn;
  #queue: Queue<T>;
  #running = false;
  #currentSleep: CancellableSleep | null = null;
  #pollingLoopPromise: Promise<void> = Promise.resolve();
  #consumerLoopPromise: Promise<void> = Promise.resolve();

  constructor(opts: ProviderGatewayOptions<T>) {
    super(opts);
    this.#provider = getComponent(opts.provider, 'values');
    this.#intervalProvider = resolveIntervalProvider(opts);
    this.#executionStrategy = resolveExecutionStrategy(opts);
    this.#queue = new Queue<T>(opts.queueOptions);
  }

  /**
   * Starts the polling and consumer loops. Idempotent — calling `start()`
   * on an already-running gateway has no effect.
   *
   * Emits `gateway:started` followed by `service:started` once the loops are
   * running. If starting fails, emits `service:startError` and rethrows.
   */
  async start(): Promise<void> {
    if (this.#running) return;
    try {
      this.#running = true;
      this.#queue.start();
      this.#consumerLoopPromise = this.#startConsumerLoop();
      this.#pollingLoopPromise = this.#startPollingLoop();
    } catch (err) {
      this.emit(SERVICE_START_ERROR, toError(err));
      throw err;
    }
    this.emit('gateway:started');
    this.emit(SERVICE_STARTED);
  }

  /**
   * Stops the polling loop and waits for the internal queue to drain and both
   * loops to exit before resolving. Any in-progress interval sleep is cancelled
   * immediately so the gateway shuts down without waiting for the next poll to
   * be due.
   *
   * Emits `gateway:stopped` followed by `service:stopped` after both loops
   * have fully exited. If stopping fails, emits `service:stopError` and
   * rethrows.
   */
  async stop(): Promise<void> {
    try {
      this.#running = false;
      this.#currentSleep?.cancel();
      await this.#pollingLoopPromise;
      await this.#queue.stop();
      await this.#consumerLoopPromise;
    } catch (err) {
      this.emit(SERVICE_STOP_ERROR, toError(err));
      throw err;
    }
    this.emit('gateway:stopped');
    this.emit(SERVICE_STOPPED);
  }

  async #startConsumerLoop(): Promise<void> {
    try {
      await this.#runConsumerLoop();
    } catch (err) {
      this.emit(EVENT_ERROR, err);
    }
  }

  async #startPollingLoop(): Promise<void> {
    try {
      await this.#runPollingLoop();
    } catch (err) {
      this.emit(EVENT_ERROR, err);
    }
  }

  async #runPollingLoop(): Promise<void> {
    while (this.#running) {
      const delayMs = await this.#intervalProvider();
      if (!this.#running) break;
      this.#currentSleep = sleep(delayMs);
      try {
        await this.#currentSleep;
      } catch (err) {
        if (!this.#running) break;
        throw err;
      } finally {
        this.#currentSleep = null;
      }
      if (!this.#running) break;
      try {
        for await (const event of await this.#provider()) {
          this.emit(EVENT_RECEIVED, event);
          await this.#queue.add(event);
        }
      } catch (err) {
        this.emit(EVENT_ERROR, err);
      }
    }
  }

  async *#eventFns(): AsyncGenerator<() => Promise<void>> {
    for await (const event of this.#queue) {
      yield async () => {
        try {
          await this.handler(event);
          this.emit(EVENT_PROCESSED, event);
        } catch (err) {
          this.emit(EVENT_ERROR, err, event);
        }
      };
    }
  }

  async #runConsumerLoop(): Promise<void> {
    await this.#executionStrategy(this.#eventFns());
  }
}

/**
 * Resolves the effective interval provider from the gateway options.
 * Prefers `intervalProvider` over `frequency`, falling back to `DEFAULT_FREQUENCY`.
 *
 * @param opts - The gateway options.
 * @returns A function that returns the ms delay before the next poll.
 */
function resolveIntervalProvider<T extends Event>(
  opts: ProviderGatewayOptions<T>,
): ProviderFn<number> {
  if (opts.intervalProvider !== undefined) {
    return getComponent(opts.intervalProvider, 'get');
  }
  const ms = opts.frequency ?? DEFAULT_FREQUENCY;
  return () => ms;
}

/**
 * Resolves the effective execution strategy from the gateway options.
 * Prefers `executionStrategy`, then derives one from `concurrency`, then falls
 * back to `parallelExecutionStrategy`. Throws if `concurrency` is not a
 * positive integer or `Infinity`.
 *
 * @param opts - The gateway options.
 * @returns The resolved execution strategy function.
 * @throws {Error} If `concurrency` is zero, negative, non-integer, or NaN (and `executionStrategy` is not set).
 */
function resolveExecutionStrategy<T extends Event>(
  opts: ProviderGatewayOptions<T>,
): ExecutionStrategyFn {
  if (opts.executionStrategy !== undefined) {
    return getComponent(opts.executionStrategy, 'execute');
  }
  if (opts.concurrency !== undefined) {
    if (
      Number.isNaN(opts.concurrency) ||
      opts.concurrency <= 0 ||
      (Number.isFinite(opts.concurrency) && !Number.isInteger(opts.concurrency))
    ) {
      throw new Error('concurrency must be a positive integer or Infinity');
    }
    if (opts.concurrency === 1) {
      return serialExecutionStrategy;
    }
    const strategy = new ParallelExecutionStrategy({
      maxConcurrency: opts.concurrency,
    });
    return strategy.execute.bind(strategy);
  }
  return parallelExecutionStrategy;
}

/**
 * Normalizes a thrown value to an `Error` for lifecycle error events.
 *
 * @param thrown - The value that was thrown.
 * @returns `thrown` if it is an `Error`, otherwise an `Error` wrapping it as `cause`.
 */
function toError(thrown: unknown): Error {
  return isError(thrown)
    ? thrown
    : new Error(String(thrown), { cause: thrown });
}
