import { LoggerProvider, getComponent } from '@sektek/utility-belt';

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
  ChannelBuilderComponent,
  ChannelBuilderCreateOptions,
  FlowCreateOptions,
} from './types.js';
import {
  ErrorTrapChannelBuilder,
  FilterChannelBuilder,
  ProcessingChannelBuilder,
  SplitterChannelBuilder,
  TapChannelBuilder,
} from './builders/index.js';
import {
  FlowBuilder,
  FlowProvider,
  OutputOfComponent,
} from './flow-builder-type.js';

export type FlowBuilderConfig = {
  loggerProvider?: LoggerProvider;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BuilderEntry = ChannelBuilderComponent<any>;

export class SimpleFlowBuilder<
  T extends Event = Event,
> implements FlowBuilder<T> {
  #config: FlowBuilderConfig;
  #flowStack: BuilderEntry[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #terminal?: EventEndpointComponent<any>;

  constructor(config: FlowBuilderConfig = {}, flowStack: BuilderEntry[] = []) {
    this.#config = config;
    this.#flowStack = flowStack;
  }

  static with<T extends Event = Event>(
    config: FlowBuilderConfig,
  ): FlowBuilder<T> {
    return new SimpleFlowBuilder<T>(config);
  }

  // -- Intermediate methods --

  errorTrap(
    errorHandler: EventErrorHandlerComponent<T>,
    opts: Partial<Omit<ErrorTrapChannelOptions<T>, 'handler'>> = {},
  ): FlowBuilder<T> {
    const builder = new ErrorTrapChannelBuilder<T>({ ...opts, errorHandler });
    return this.#append(builder);
  }

  filter(
    predicate: EventPredicateComponent<T>,
    opts: Partial<Omit<FilterChannelOptions<T>, 'handler' | 'filter'>> = {},
  ): FlowBuilder<T> {
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
  ): FlowBuilder<OutputOfComponent<P, T>> {
    const builder = new ProcessingChannelBuilder({ ...opts, processor });
    return this.#append(builder) as unknown as SimpleFlowBuilder<
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
  ): FlowBuilder<OutputOfComponent<P, T>> {
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
  ): FlowBuilder<OutputOfComponent<P, T>> {
    const builder = new SplitterChannelBuilder({ ...opts, splitter });
    return this.#append(builder) as unknown as SimpleFlowBuilder<
      OutputOfComponent<P, T>
    >;
  }

  tap(
    tapHandler: EventHandlerComponent<T>,
    opts: Partial<Omit<TapChannelOptions<T>, 'handler' | 'tapHandler'>> = {},
  ): FlowBuilder<T> {
    const builder = new TapChannelBuilder<T>({ ...opts, tapHandler });
    return this.#append(builder);
  }

  // -- Terminal methods --

  handle(handler: EventHandlerComponent<T>): FlowProvider<T> {
    return this.#setTerminal(handler);
  }

  outbound(channel: EventChannelComponent<T>): FlowProvider<T> {
    return this.#setTerminal(channel);
  }

  dispatch(handlers: EventHandlerComponent<T>[]): FlowProvider<T> {
    const routeProvider = new DispatchRouteProvider<T>({ routes: handlers });
    const router = new EventRouter<T>({ routeProvider });
    return this.#setTerminal(router);
  }

  route(
    routeProviderOrOptions: RouteProviderComponent<T> | RouteStoreOptions<T>,
    opts: Partial<Omit<EventRouterOptions<T>, 'routeProvider'>> = {},
  ): FlowProvider<T> {
    const routeProvider = isRouteStoreOptions<T>(routeProviderOrOptions)
      ? new RouteStore<T>(routeProviderOrOptions)
      : routeProviderOrOptions;

    const router = new EventRouter<T>({ ...opts, routeProvider });
    return this.#setTerminal(router);
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
      ? getEventHandlerComponent(this.#terminal)
      : getEventHandlerComponent(new NullHandler());

    return this.#flowStack.reduceRight<EventHandlerComponent<T>>(
      (handler, builderComponent) => {
        const createFn = getComponent(
          builderComponent,
          'create',
        ) as ChannelBuilder<Event>['create'];

        return createFn(handler, createOpts) as EventHandlerComponent<T>;
      },
      terminal as EventHandlerComponent<T>,
    );
  }

  // -- Private helpers --

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #setTerminal(terminal: EventEndpointComponent<any>): SimpleFlowBuilder<T> {
    const result = new SimpleFlowBuilder<T>(this.#config, [...this.#flowStack]);
    result.#terminal = terminal;
    return result;
  }

  #append(builder: BuilderEntry): SimpleFlowBuilder<T> {
    return new SimpleFlowBuilder<T>(this.#config, [
      ...this.#flowStack,
      builder,
    ]);
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
