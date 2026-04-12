import { Component, LoggerProvider } from '@sektek/utility-belt';

import {
  Event,
  EventEndpointComponent,
  EventHandlerFn,
} from '../../types/index.js';

/**
 * Options passed to {@link ChannelBuilder.create} during the flow fold.
 * Carries flow-level context resolved by {@link FlowBuilder.create}.
 */
export type ChannelBuilderCreateOptions = {
  loggerProvider?: LoggerProvider;
};

/**
 * Lazily constructs an intermediate pipeline channel that wraps a downstream
 * handler. Each step in a {@link FlowChain} is backed by a `ChannelBuilder`
 * that stores step-level configuration and defers channel construction until
 * the flow is resolved via `get()` or `create()`.
 *
 * @template T - The event type accepted by the channel.
 * @template O - The options type accepted by `create()`. Defaults to
 *   {@link ChannelBuilderCreateOptions}; concrete builders narrow this to
 *   their own builder options type so any step-level option can be overridden
 *   at flow-resolution time.
 */
export interface ChannelBuilder<
  T extends Event = Event,
  O extends ChannelBuilderCreateOptions = ChannelBuilderCreateOptions,
> {
  /**
   * Builds the channel, wrapping the given downstream endpoint.
   *
   * @param handler - The next endpoint in the pipeline. Accepts any
   *   {@link EventEndpointComponent} — handler, channel, or processor.
   * @param opts - Options that override step-level options stored at
   *   construction time.
   * @returns A bound handler function for the constructed channel.
   */
  create(handler: EventEndpointComponent<T>, opts?: O): EventHandlerFn<T>;
}

/**
 * Component form of {@link ChannelBuilder} — accepts either a `ChannelBuilder`
 * instance or a bare `create` function with the same signature.
 */
export type ChannelBuilderComponent<
  T extends Event = Event,
  O extends ChannelBuilderCreateOptions = ChannelBuilderCreateOptions,
> = Component<ChannelBuilder<T, O>, 'create'>;
