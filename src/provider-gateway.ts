import {
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
  IterableProviderComponent,
  IterableProviderFn,
  ProviderComponent,
  ProviderFn,
  Queue,
  QueueOptions,
  getComponent,
  parallelExecutionStrategy,
} from '@sektek/utility-belt';

import {
  AbstractEventHandlingService,
  EventHandlingServiceOptions,
} from './abstract-event-handling-service.js';
import {
  EVENT_ERROR,
  EVENT_PROCESSED,
  EVENT_RECEIVED,
  Event,
} from './types/index.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type ProviderGatewayOptions<T extends Event = Event> =
  EventHandlingServiceOptions<T> & {
    /** Returns an iterable of events per poll */
    provider: IterableProviderComponent<T>;
    /** Returns ms to wait before the next poll */
    schedule: ProviderComponent<number>;
    /** Controls concurrency of handler invocations; default: parallelExecutionStrategy */
    executionStrategy?: ExecutionStrategyComponent;
    /** Options forwarded to the internal Queue */
    queueOptions?: QueueOptions;
  };

/**
 * A pull-based gateway that periodically retrieves events from a provider and
 * dispatches them to a handler.
 *
 * Two concurrent loops run after {@link start} is called:
 *
 * - **Polling loop** — waits for the duration returned by `schedule`, calls
 *   `provider.values()` to obtain an iterable of events, emits `event:received`
 *   for each one, and enqueues them.
 * - **Consumer loop** — drains the internal {@link Queue} and dispatches each
 *   event to the handler, using the configured `executionStrategy` to control
 *   concurrency. Emits `event:processed` on success or `event:error` on
 *   failure, then continues with the next event.
 *
 * Provider errors are caught, emitted as `event:error`, and the polling loop
 * continues — the gateway does not stop on transient fetch failures.
 *
 * @template T The event type handled by this gateway.
 *
 * @example
 * ```ts
 * const gateway = new ProviderGateway({
 *   provider: myEventSource,       // values(): AsyncIterable<MyEvent>
 *   schedule: () => 5000,          // poll every 5 s
 *   handler: myHandler,
 *   executionStrategy: new ParallelExecutionStrategy({ maxConcurrency: 4 }),
 * });
 *
 * await gateway.start();
 * // ...
 * await gateway.stop();
 * ```
 */
export class ProviderGateway<
  T extends Event = Event,
> extends AbstractEventHandlingService<T> {
  #provider: IterableProviderFn<T>;
  #schedule: ProviderFn<number>;
  #executionStrategy: ExecutionStrategyFn;
  #queue: Queue<T>;
  #running = false;

  constructor(opts: ProviderGatewayOptions<T>) {
    super(opts);
    this.#provider = getComponent(opts.provider, 'values');
    this.#schedule = getComponent(opts.schedule, 'get');
    this.#executionStrategy = getComponent(opts.executionStrategy, 'execute', {
      default: parallelExecutionStrategy,
    });
    this.#queue = new Queue<T>(opts.queueOptions);
  }

  /**
   * Starts the polling and consumer loops. Idempotent — calling `start()`
   * on an already-running gateway has no effect.
   *
   * Emits `gateway:started` once the loops are running.
   */
  async start(): Promise<void> {
    if (this.#running) return;
    this.#running = true;
    this.#queue.start();
    this.#startConsumerLoop();
    this.#startPollingLoop();
    this.emit('gateway:started');
  }

  /**
   * Stops the polling loop and waits for the internal queue to drain before
   * resolving.
   *
   * Emits `gateway:stopped` after the queue has emptied.
   */
  async stop(): Promise<void> {
    this.#running = false;
    await this.#queue.stop();
    this.emit('gateway:stopped');
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
      const delayMs = await this.#schedule();
      await sleep(delayMs);
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
