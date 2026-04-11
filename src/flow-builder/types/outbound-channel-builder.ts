import { Component } from '@sektek/utility-belt';

import { Event, EventHandlerFn } from '../../types/index.js';

import { ChannelBuilderCreateOptions } from './channel-builder.js';

/**
 * Lazily constructs a terminal outbound channel for a pipeline. Unlike
 * {@link ChannelBuilder}, an `OutboundChannelBuilder` takes no downstream
 * handler — it is the end of the pipeline (e.g. a transport channel).
 *
 * @template T - The event type accepted by the channel.
 */
export interface OutboundChannelBuilder<T extends Event = Event> {
  /**
   * Builds the outbound channel.
   *
   * @param opts - Flow-level options (e.g. `loggerProvider`) resolved during
   *   the flow fold.
   * @returns A bound handler function for the constructed channel.
   */
  create(opts?: ChannelBuilderCreateOptions): EventHandlerFn<T>;
}

/**
 * Component form of {@link OutboundChannelBuilder} — accepts either an
 * `OutboundChannelBuilder` instance or a bare `create` function with the same
 * signature.
 */
export type OutboundChannelBuilderComponent<T extends Event = Event> =
  Component<OutboundChannelBuilder<T>, 'create'>;
