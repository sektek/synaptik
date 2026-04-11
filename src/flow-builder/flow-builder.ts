import { LoggerProvider } from '@sektek/utility-belt';

import {
  ErrorTrapChannelOptions,
  FilterChannelOptions,
  ProcessingChannelOptions,
  SplitterChannelOptions,
  TapChannelOptions,
} from '../channels/index.js';
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
  FilterChannelBuilder,
  ProcessingChannelBuilder,
  SplitterChannelBuilder,
  TapChannelBuilder,
} from './builders/index.js';

export type FlowBuilderOptions = {
  loggerProvider?: LoggerProvider;
};

type BuilderEntry = (
  handler: EventHandlerComponent<Event>,
  opts?: ChannelBuilderCreateOptions,
) => EventHandlerFn<Event>;

type TerminalFactory<T extends Event = Event> = (
  opts: ChannelBuilderCreateOptions,
) => EventEndpointComponent<T>;

export class FlowBuilder<T extends Event = Event> implements FlowChain<T> {
  #config: FlowBuilderOptions;
  #flowStack: BuilderEntry[];
  #terminal?: TerminalFactory<T>;

  constructor(config: FlowBuilderOptions = {}, flowStack: BuilderEntry[] = []) {
    this.#config = config;
    this.#flowStack = flowStack;
  }

  static with<T extends Event = Event>(
    config: FlowBuilderOptions,
  ): FlowChain<T> {
    return new FlowBuilder<T>(config);
  }

  // -- Intermediate methods --

  errorTrap(
    errorHandler: EventErrorHandlerComponent<T>,
    opts: Partial<Omit<ErrorTrapChannelOptions<T>, 'handler'>> = {},
  ): FlowChain<T> {
    const builder = new ErrorTrapChannelBuilder<T>({ ...opts, errorHandler });
    return this.#append(builder);
  }

  filter(
    predicate: EventPredicateComponent<T>,
    opts: Partial<Omit<FilterChannelOptions<T>, 'handler' | 'filter'>> = {},
  ): FlowChain<T> {
    const builder = new FilterChannelBuilder<T>({ ...opts, filter: predicate });
    return this.#append(builder);
  }

  process<P extends EventProcessorComponent<T, Event>>(
    processor: P,
    opts: Partial<
      Omit<
        ProcessingChannelOptions<T, OutputOfComponent<P, T>>,
        'handler' | 'processor'
      >
    > = {},
  ): FlowChain<OutputOfComponent<P, T>> {
    const builder = new ProcessingChannelBuilder({ ...opts, processor });
    return this.#append(builder) as unknown as FlowBuilder<
      OutputOfComponent<P, T>
    >;
  }

  transform<P extends EventProcessorComponent<T, Event>>(
    processor: P,
    opts: Partial<
      Omit<
        ProcessingChannelOptions<T, OutputOfComponent<P, T>>,
        'handler' | 'processor'
      >
    > = {},
  ): FlowChain<OutputOfComponent<P, T>> {
    return this.process(processor, opts);
  }

  split<P extends EventSplitterComponent<T, Event>>(
    splitter: P,
    opts: Partial<
      Omit<
        SplitterChannelOptions<T, OutputOfComponent<P, T>>,
        'handler' | 'splitter'
      >
    > = {},
  ): FlowChain<OutputOfComponent<P, T>> {
    const builder = new SplitterChannelBuilder({ ...opts, splitter });
    return this.#append(builder) as unknown as FlowBuilder<
      OutputOfComponent<P, T>
    >;
  }

  tap(
    tapHandler: EventHandlerComponent<T>,
    opts: Partial<Omit<TapChannelOptions<T>, 'handler' | 'tapHandler'>> = {},
  ): FlowChain<T> {
    const builder = new TapChannelBuilder<T>({ ...opts, tapHandler });
    return this.#append(builder);
  }

  // -- Terminal methods --

  handle(handler: EventHandlerComponent<T>): FlowProvider<T> {
    return this.#setTerminal(() => handler);
  }

  outbound(channel: EventChannelComponent<T>): FlowProvider<T> {
    return this.#setTerminal(() => channel);
  }

  dispatch(handlers: EventEndpointComponent<T>[]): FlowProvider<T> {
    return this.#setTerminal(opts => {
      const routeProvider = new DispatchRouteProvider<T>({ routes: handlers });
      return new EventRouter<T>({
        routeProvider,
        loggerProvider: opts.loggerProvider,
      });
    });
  }

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

  get(): EventHandlerComponent<T> {
    return this.create();
  }

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
          handler as EventHandlerComponent<Event>,
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
      builder.create(
        handler as EventHandlerComponent<T>,
        opts as O,
      ) as EventHandlerFn<Event>;
    return new FlowBuilder<T>(this.#config, [...this.#flowStack, entry]);
  }

  #buildCreateOptions(opts: FlowCreateOptions): ChannelBuilderCreateOptions {
    const createOpts: ChannelBuilderCreateOptions = {};

    if (this.#config.loggerProvider && opts.flowName) {
      createOpts.loggerProvider = this.#config.loggerProvider.with({
        flowName: opts.flowName,
      });
    } else if (this.#config.loggerProvider) {
      createOpts.loggerProvider = this.#config.loggerProvider;
    }

    return createOpts;
  }
}
