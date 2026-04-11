import { Component, LoggerProvider } from '@sektek/utility-belt';

import {
  Event,
  EventHandlerComponent,
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
 */
export interface ChannelBuilder<T extends Event = Event> {
  /**
   * Builds the channel, wrapping the given downstream handler.
   *
   * @param handler - The next handler in the pipeline.
   * @param opts - Flow-level options (e.g. `loggerProvider`) that override
   *   step-level options stored at construction time.
   * @returns A bound handler function for the constructed channel.
   */
  create(
    handler: EventHandlerComponent<T>,
    opts?: ChannelBuilderCreateOptions,
  ): EventHandlerFn<T>;
}

/**
 * Component form of {@link ChannelBuilder} — accepts either a `ChannelBuilder`
 * instance or a bare `create` function with the same signature.
 */
export type ChannelBuilderComponent<T extends Event = Event> = Component<
  ChannelBuilder<T>,
  'create'
>;
