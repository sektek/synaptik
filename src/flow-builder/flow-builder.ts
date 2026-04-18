import { LoggerProvider } from '@sektek/utility-belt';

import {
  Event,
  EventChannelComponent,
  EventEndpointComponent,
  EventErrorHandlerComponent,
  EventHandlerComponent,
  EventHandlerFn,
  EventPredicateComponent,
  EventProcessorComponent,
  EventSplitterComponent,
} from '../types/index.js';
import {
  EventRouterOptions,
  RouteProviderComponent,
  RouteStoreOptions,
} from '../event-router/index.js';
import {
  RouteStore,
  isRouteStoreOptions,
} from '../event-router/route-store.js';
import { DispatchRouteProvider } from '../event-router/dispatch-route-provider.js';
import { EventRouter } from '../event-router/event-router.js';
import { NullHandler } from '../handlers/null-handler.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';

import {
  ChannelBuilder,
  ChannelBuilderCreateOptions,
  FlowChain,
  FlowCreateOptions,
  FlowProvider,
  OutputOfComponent,
} from './types/index.js';
import {
  ErrorTrapChannelBuilder,
  ErrorTrapChannelBuilderOptions,
  FilterChannelBuilder,
  FilterChannelBuilderOptions,
  ProcessingChannelBuilder,
  ProcessingChannelBuilderOptions,
  SplitterChannelBuilder,
  SplitterChannelBuilderOptions,
  TapChannelBuilder,
  TapChannelBuilderOptions,
} from './builders/index.js';

/**
 * Shared configuration for a {@link FlowBuilder} factory instance. Extends
 * {@link FlowCreateOptions} so that any option accepted by `create()` can be
 * set once on the factory and picked up automatically by `get()`.
 */
export type FlowBuilderOptions = FlowCreateOptions & {
  /** Provider used to scope a logger to each flow at resolution time. */
  loggerProvider?: LoggerProvider;
};

type BuilderEntry = (
  handler: EventEndpointComponent,
  opts?: ChannelBuilderCreateOptions,
) => EventHandlerFn<Event>;

type TerminalFactory<T extends Event = Event> = (
  opts: ChannelBuilderCreateOptions,
) => EventEndpointComponent<T>;

/**
 * Concrete implementation of {@link FlowChain}. Acts as a reusable factory:
 * call {@link FlowBuilder.with} once with shared config, then chain steps off
 * the returned instance to produce independent flows. Each chain method returns
 * a new `FlowBuilder` — the factory is never mutated.
 *
 * @template T - The event type at the entry point of the flow.
 */
export class FlowBuilder<T extends Event = Event> implements FlowChain<T> {
  #config: FlowBuilderOptions;
  #flowStack: BuilderEntry[];
  #terminal?: TerminalFactory<T>;

  constructor(config: FlowBuilderOptions = {}, flowStack: BuilderEntry[] = []) {
    this.#config = config;
    this.#flowStack = flowStack;
  }

  /**
   * Creates a reusable flow factory with shared configuration.
   *
   * @param config - Shared options applied to every flow built from this factory.
   * @returns A {@link FlowChain} from which individual flows can be declared.
   */
  static with<T extends Event = Event>(
    config: FlowBuilderOptions,
  ): FlowChain<T> {
    return new FlowBuilder<T>(config);
  }

  // -- Intermediate methods --

  /**
   * @inheritDoc
   */
  errorTrap(
    errorHandler: EventErrorHandlerComponent<T>,
    opts: Partial<ErrorTrapChannelBuilderOptions<T>> = {},
  ): FlowChain<T> {
    const builder = new ErrorTrapChannelBuilder<T>({ ...opts, errorHandler });
    return this.#append(builder);
  }

  /**
   * @inheritDoc
   */
  filter(
    predicate: EventPredicateComponent<T>,
    opts: Partial<FilterChannelBuilderOptions<T>> = {},
  ): FlowChain<T> {
    const builder = new FilterChannelBuilder<T>({ ...opts, filter: predicate });
    return this.#append(builder);
  }

  /**
   * @inheritDoc
   */
  process<P extends EventProcessorComponent<T, Event>>(
    processor: P,
    opts: Partial<
      ProcessingChannelBuilderOptions<T, OutputOfComponent<P, T>>
    > = {},
  ): FlowChain<OutputOfComponent<P, T>> {
    const builder = new ProcessingChannelBuilder({ ...opts, processor });
    return this.#append(builder) as unknown as FlowBuilder<
      OutputOfComponent<P, T>
    >;
  }

  /**
   * @inheritDoc
   */
  transform<P extends EventProcessorComponent<T, Event>>(
    processor: P,
    opts: Partial<
      ProcessingChannelBuilderOptions<T, OutputOfComponent<P, T>>
    > = {},
  ): FlowChain<OutputOfComponent<P, T>> {
    return this.process(processor, opts);
  }

  /**
   * @inheritDoc
   */
  split<P extends EventSplitterComponent<T, Event>>(
    splitter: P,
    opts: Partial<
      SplitterChannelBuilderOptions<T, OutputOfComponent<P, T>>
    > = {},
  ): FlowChain<OutputOfComponent<P, T>> {
    const builder = new SplitterChannelBuilder({ ...opts, splitter });
    return this.#append(builder) as unknown as FlowBuilder<
      OutputOfComponent<P, T>
    >;
  }

  /**
   * @inheritDoc
   */
  tap(
    tapHandler: EventHandlerComponent<T>,
    opts: Partial<TapChannelBuilderOptions<T>> = {},
  ): FlowChain<T> {
    const builder = new TapChannelBuilder<T>({ ...opts, tapHandler });
    return this.#append(builder);
  }

  // -- Terminal methods --

  /**
   * @inheritDoc
   */
  handle(handler: EventHandlerComponent<T>): FlowProvider<T> {
    return this.#setTerminal(() => handler);
  }

  /**
   * @inheritDoc
   */
  outbound(channel: EventChannelComponent<T>): FlowProvider<T> {
    return this.#setTerminal(() => channel);
  }

  /**
   * @inheritDoc
   */
  dispatch(
    handlers: EventEndpointComponent<T>[],
    opts: Partial<Omit<EventRouterOptions<T>, 'routeProvider'>> = {},
  ): FlowProvider<T> {
    return this.#setTerminal(createOpts => {
      const routeProvider = new DispatchRouteProvider<T>({ routes: handlers });
      return new EventRouter<T>({
        ...opts,
        routeProvider,
        loggerProvider: createOpts.loggerProvider,
      });
    });
  }

  /**
   * @inheritDoc
   */
  route(
    routeProviderOrOptions: RouteProviderComponent<T> | RouteStoreOptions<T>,
    opts: Partial<Omit<EventRouterOptions<T>, 'routeProvider'>> = {},
  ): FlowProvider<T> {
    return this.#setTerminal(createOpts => {
      const routeProvider = isRouteStoreOptions<T>(routeProviderOrOptions)
        ? new RouteStore<T>({
            ...routeProviderOrOptions,
            loggerProvider: createOpts.loggerProvider,
          })
        : routeProviderOrOptions;

      return new EventRouter<T>({
        ...opts,
        routeProvider,
        loggerProvider: createOpts.loggerProvider,
      });
    });
  }

  // -- Resolution methods --

  /**
   * @inheritDoc
   */
  get(): EventHandlerComponent<T> {
    return this.create();
  }

  /**
   * @inheritDoc
   */
  create(opts: FlowCreateOptions = {}): EventHandlerComponent<T> {
    if (this.#flowStack.length === 0 && !this.#terminal) {
      throw new Error('FlowBuilder requires at least one step or terminal.');
    }

    const createOpts = this.#buildCreateOptions(opts);

    const terminal = this.#terminal
      ? getEventHandlerComponent(this.#terminal(createOpts))
      : getEventHandlerComponent(new NullHandler());

    return this.#flowStack.reduceRight<EventHandlerComponent<T>>(
      (handler, entry) =>
        entry(
          handler as EventEndpointComponent,
          createOpts,
        ) as EventHandlerComponent<T>,
      terminal as EventHandlerComponent<T>,
    );
  }

  // -- Private helpers --

  #setTerminal(factory: TerminalFactory<T>): FlowBuilder<T> {
    const result = new FlowBuilder<T>(this.#config, [...this.#flowStack]);
    result.#terminal = factory;
    return result;
  }

  #append<O extends ChannelBuilderCreateOptions>(
    builder: ChannelBuilder<T, O>,
  ): FlowBuilder<T> {
    const entry: BuilderEntry = (handler, opts) =>
      builder.create(handler, opts as O) as EventHandlerFn<Event>;
    return new FlowBuilder<T>(this.#config, [...this.#flowStack, entry]);
  }

  #buildCreateOptions(opts: FlowCreateOptions): ChannelBuilderCreateOptions {
    const createOpts: ChannelBuilderCreateOptions = {};
    const flowName = opts.flowName ?? this.#config.flowName;

    if (this.#config.loggerProvider && flowName) {
      createOpts.loggerProvider = this.#config.loggerProvider.with({
        flowName,
      });
    } else if (this.#config.loggerProvider) {
      createOpts.loggerProvider = this.#config.loggerProvider;
    }

    return createOpts;
  }
}
