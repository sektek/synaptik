import { Provider } from '@sektek/utility-belt';

import {
  ErrorTrapChannelBuilderOptions,
  FilterChannelBuilderOptions,
  ProcessingChannelBuilderOptions,
  SplitterChannelBuilderOptions,
  TapChannelBuilderOptions,
} from '../builders/index.js';
import {
  Event,
  EventChannelComponent,
  EventEndpointComponent,
  EventErrorHandlerComponent,
  EventHandlerComponent,
  EventPredicateComponent,
  EventProcessorComponent,
  EventSplitterComponent,
} from '../../types/index.js';
import {
  EventRouterOptions,
  NamedRoutesProviderOptions,
  RoutesProviderComponent,
} from '../../event-router/index.js';

/** Options accepted by {@link FlowProvider.create} at flow resolution time. */
export type FlowCreateOptions = {
  /** Scopes the logger provider to this flow name for all channels in the pipeline. */
  flowName?: string;
};

type OutputProducingComponent<T extends Event = Event, R extends Event = T> =
  | EventProcessorComponent<T, R>
  | EventSplitterComponent<T, R>;

/**
 * Infers the output event type produced by a processor or splitter component.
 *
 * @template P - The processor or splitter component type.
 * @template T - The input event type.
 */
export type OutputOfComponent<P, T extends Event = Event> =
  P extends OutputProducingComponent<T, infer R> ? R : never;

/**
 * A FlowProvider represents a completed flow that can produce an event handler.
 * Implements Provider for simple resolution via get(), and supports create()
 * for builder-style resolution with flow-level options.
 *
 * @template T - The event type at the entry point of the flow.
 */
export interface FlowProvider<T extends Event = Event> extends Provider<
  EventHandlerComponent<T>
> {
  /**
   * Builds the composed pipeline handler, applying flow-level options to each
   * channel in the chain.
   *
   * @param opts - Flow-level options such as `flowName` for logger scoping.
   * @returns The composed handler for the entry point of the flow.
   */
  create(opts?: FlowCreateOptions): EventHandlerComponent<T>;
}

/**
 * A FlowChain represents the in-progress state of a flow being constructed.
 * Steps are declared top-down in the order events flow through them.
 *
 * Intermediate methods (filter, process, etc.) return a new FlowChain
 * for further chaining. Terminal methods (handle, outbound, etc.) return
 * a FlowProvider that can produce the composed handler.
 *
 * get() and create() are intentionally absent — call a terminal method first
 * to obtain a FlowProvider.
 *
 * @template T - The event type at the current point in the chain.
 */
export interface FlowChain<T extends Event = Event> {
  // Intermediate — return FlowChain for chaining

  /**
   * Adds an error trap step that catches errors thrown by downstream handlers
   * and routes them to the given error handler.
   *
   * @param errorHandler - Handles errors thrown downstream.
   * @param opts - Additional options for the underlying channel.
   * @returns A new FlowChain with the error trap appended.
   */
  errorTrap(
    errorHandler: EventErrorHandlerComponent<T>,
    opts?: Partial<ErrorTrapChannelBuilderOptions<T>>,
  ): FlowChain<T>;

  /**
   * Adds a filter step that passes events matching the predicate downstream
   * and discards those that do not.
   *
   * @param predicate - Determines whether an event proceeds downstream.
   * @param opts - Additional options for the underlying channel.
   * @returns A new FlowChain with the filter appended.
   */
  filter(
    predicate: EventPredicateComponent<T>,
    opts?: Partial<FilterChannelBuilderOptions<T>>,
  ): FlowChain<T>;

  /**
   * Adds a processing step that transforms each `T` event into an `R` event
   * before passing it downstream.
   *
   * @param processor - Transforms the incoming event.
   * @param opts - Additional options for the underlying channel.
   * @returns A new FlowChain typed to the processor's output event type.
   */
  process<P extends EventProcessorComponent<T, Event>>(
    processor: P,
    opts?: Partial<ProcessingChannelBuilderOptions<T, OutputOfComponent<P, T>>>,
  ): FlowChain<OutputOfComponent<P, T>>;

  /**
   * Alias for {@link FlowChain.process}.
   *
   * @param processor - Transforms the incoming event.
   * @param opts - Additional options for the underlying channel.
   * @returns A new FlowChain typed to the processor's output event type.
   */
  transform<P extends EventProcessorComponent<T, Event>>(
    processor: P,
    opts?: Partial<ProcessingChannelBuilderOptions<T, OutputOfComponent<P, T>>>,
  ): FlowChain<OutputOfComponent<P, T>>;

  /**
   * Adds a splitter step that fans one `T` event out into multiple `R` events,
   * each forwarded downstream independently.
   *
   * @param splitter - Produces the iterable of output events from a single input.
   * @param opts - Additional options for the underlying channel.
   * @returns A new FlowChain typed to the splitter's output event type.
   */
  split<P extends EventSplitterComponent<T, Event>>(
    splitter: P,
    opts?: Partial<SplitterChannelBuilderOptions<T, OutputOfComponent<P, T>>>,
  ): FlowChain<OutputOfComponent<P, T>>;

  /**
   * Adds a tap step that invokes a side-effect handler before passing the
   * original event downstream unchanged.
   *
   * @param tapHandler - Invoked as a side effect for each event.
   * @param opts - Additional options for the underlying channel.
   * @returns A new FlowChain with the tap appended.
   */
  tap(
    tapHandler: EventHandlerComponent<T>,
    opts?: Partial<TapChannelBuilderOptions<T>>,
  ): FlowChain<T>;

  // Terminal — end the chain, return FlowProvider

  /**
   * Sets the terminal to an {@link EventRouter} that dispatches each event to
   * all provided handlers in parallel.
   *
   * @param handlers - The handlers to dispatch to.
   * @param opts - Additional options for the underlying router.
   * @returns A FlowProvider ready to produce the composed handler.
   */
  dispatch(
    handlers: EventEndpointComponent<T>[],
    opts?: Partial<Omit<EventRouterOptions<T>, 'routesProvider'>>,
  ): FlowProvider<T>;

  /**
   * Sets the terminal to a fixed event handler.
   *
   * @param handler - The handler that receives events at the end of the chain.
   * @returns A FlowProvider ready to produce the composed handler.
   */
  handle(handler: EventHandlerComponent<T>): FlowProvider<T>;

  /**
   * Sets the terminal to an outbound event channel.
   *
   * @param channel - The channel that receives events at the end of the chain.
   * @returns A FlowProvider ready to produce the composed handler.
   */
  outbound(channel: EventChannelComponent<T>): FlowProvider<T>;

  /**
   * Sets the terminal to an {@link EventRouter} backed by a
   * {@link NamedRoutesProvider} constructed from the given options.
   *
   * @param routerOptions - Configuration for the NamedRoutesProvider (decider and route provider).
   * @param opts - Additional options for the underlying router.
   * @returns A FlowProvider ready to produce the composed handler.
   */
  route(
    routerOptions: NamedRoutesProviderOptions<T>,
    opts?: Partial<Omit<EventRouterOptions<T>, 'routesProvider'>>,
  ): FlowProvider<T>;

  /**
   * Sets the terminal to an {@link EventRouter} backed by the given routes
   * provider.
   *
   * @param routesProvider - A pre-built {@link RoutesProviderComponent} to use directly.
   * @param opts - Additional options for the underlying router.
   * @returns A FlowProvider ready to produce the composed handler.
   */
  route(
    routesProvider: RoutesProviderComponent<T>,
    opts?: Partial<Omit<EventRouterOptions<T>, 'routesProvider'>>,
  ): FlowProvider<T>;
}
