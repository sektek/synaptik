import { Provider } from '@sektek/utility-belt';

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

import { FlowCreateOptions } from './types.js';

type OutputProducingComponent<T extends Event = Event, R extends Event = T> =
  | EventProcessorComponent<T, R>
  | EventSplitterComponent<T, R>;

export type OutputOfComponent<P, T extends Event = Event> =
  P extends OutputProducingComponent<T, infer R> ? R : never;

/**
 * A FlowProvider represents a completed flow that can produce an event handler.
 * Implements Provider for simple resolution via get(), and supports create()
 * for builder-style resolution with flow-level options.
 *
 * @typeParam T - The event type at the entry point of the flow.
 */
export interface FlowProvider<T extends Event = Event>
  extends Provider<EventHandlerComponent<T>>
{
  create(opts?: FlowCreateOptions): EventHandlerComponent<T>;
}

/**
 * A FlowBuilder constructs event processing pipelines using a fluent DSL.
 * Steps are declared top-down in the order events flow through them.
 *
 * Intermediate methods (filter, process, etc.) return a new FlowBuilder
 * for further chaining. Terminal methods (handle, outbound, etc.) return
 * a FlowProvider that can produce the composed handler.
 *
 * @typeParam T - The event type at the current point in the chain.
 */
export interface FlowBuilder<T extends Event = Event> extends FlowProvider<T> {
  // Intermediate — return FlowBuilder for chaining

  errorTrap(
    errorHandler: EventErrorHandlerComponent<T>,
    opts?: Partial<Omit<ErrorTrapChannelOptions<T>, 'handler'>>,
  ): FlowBuilder<T>;

  filter(
    predicate: EventPredicateComponent<T>,
    opts?: Partial<Omit<FilterChannelOptions<T>, 'handler' | 'filter'>>,
  ): FlowBuilder<T>;

  process<P extends EventProcessorComponent<T, Event>>(
    processor: P,
    opts?: Partial<
      Omit<ProcessingChannelOptions<T, OutputOfComponent<P, T>>, 'handler' | 'processor'>
    >,
  ): FlowBuilder<OutputOfComponent<P, T>>;

  transform<P extends EventProcessorComponent<T, Event>>(
    processor: P,
    opts?: Partial<
      Omit<ProcessingChannelOptions<T, OutputOfComponent<P, T>>, 'handler' | 'processor'>
    >,
  ): FlowBuilder<OutputOfComponent<P, T>>;

  split<P extends EventSplitterComponent<T, Event>>(
    splitter: P,
    opts?: Partial<
      Omit<SplitterChannelOptions<T, OutputOfComponent<P, T>>, 'handler' | 'splitter'>
    >,
  ): FlowBuilder<OutputOfComponent<P, T>>;

  tap(
    tapHandler: EventHandlerComponent<T>,
    opts?: Partial<Omit<TapChannelOptions<T>, 'handler' | 'tapHandler'>>,
  ): FlowBuilder<T>;

  // Terminal — end the chain, return FlowProvider

  dispatch(handlers: EventHandlerComponent<T>[]): FlowProvider<T>;

  handle(handler: EventHandlerComponent<T>): FlowProvider<T>;

  outbound(channel: EventChannelComponent<T>): FlowProvider<T>;

  route(
    routes: RouteStoreOptions<T>,
    opts?: Partial<Omit<EventRouterOptions<T>, 'routeProvider'>>,
  ): FlowProvider<T>;

  route(
    routeProvider: RouteProviderComponent<T>,
    opts?: Partial<Omit<EventRouterOptions<T>, 'routeProvider'>>,
  ): FlowProvider<T>;
}
