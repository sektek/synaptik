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

export interface FlowProvider<T extends Event = Event> {
  get(): EventHandlerComponent<T> | PromiseLike<EventHandlerComponent<T>>;
}

type OutputProducingComponent<T extends Event = Event, R extends Event = T> =
  | EventProcessorComponent<T, R>
  | EventSplitterComponent<T, R>;

export type OutputOfComponent<P, T extends Event = Event> =
  P extends OutputProducingComponent<T, infer R> ? R : never;

export interface FlowBuilder<T extends Event = Event> extends FlowProvider<T> {
  errorTrap(
    errorHandler: EventErrorHandlerComponent<T>,
    opts: Partial<ErrorTrapChannelOptions<T>>,
  ): FlowBuilder<T>;
  filter(
    predicate: EventPredicateComponent<T>,
    opts: Partial<FilterChannelOptions<T>>,
  ): FlowBuilder<T>;
  process<P extends EventProcessorComponent<T, Event>>(
    processor: P,
    opts: Partial<ProcessingChannelOptions<T, OutputOfComponent<P, T>>>,
  ): FlowBuilder<OutputOfComponent<P, T>>;
  transform<P extends EventProcessorComponent<T, Event>>(
    processor: P,
    opts: Partial<ProcessingChannelOptions<T, OutputOfComponent<P, T>>>,
  ): FlowBuilder<OutputOfComponent<P, T>>;
  split<P extends EventSplitterComponent<T, Event>>(
    splitter: P,
    opts: Partial<SplitterChannelOptions<T>>,
  ): FlowBuilder<OutputOfComponent<P, T>>;
  tap(
    tapHandler: EventHandlerComponent<T>,
    opts: TapChannelOptions<T>,
  ): FlowBuilder<T>;

  dispatch(handlers: EventHandlerComponent<T>[]): FlowProvider<T>;
  handle(handler: EventHandlerComponent<T>): FlowProvider<T>;
  outbound(channel: EventChannelComponent<T>): FlowProvider<T>;
  route(
    routes: RouteStoreOptions<T>,
    opts: Partial<EventRouterOptions<T>>,
  ): FlowProvider<T>;
  route(
    routeProvider: RouteProviderComponent<T>,
    opts: Partial<EventRouterOptions<T>>,
  ): FlowProvider<T>;
}
