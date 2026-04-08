import { Component, LoggerProvider } from '@sektek/utility-belt';

import {
  Event,
  EventHandlerComponent,
  EventHandlerFn,
} from '../types/index.js';

/**
 * Options passed to channel builders during the fold.
 * Carries flow-level context from FlowProvider.create().
 */
export type ChannelBuilderCreateOptions = {
  loggerProvider?: LoggerProvider;
};

/**
 * A ChannelBuilder constructs a pipeline channel that wraps a downstream
 * handler. Builders store partial configuration that merges at create time.
 *
 * @template T - The event type flowing into this channel.
 */
export interface ChannelBuilder<T extends Event = Event> {
  create(
    handler: EventHandlerComponent<T>,
    opts?: ChannelBuilderCreateOptions,
  ): EventHandlerFn<T>;
}

export type ChannelBuilderComponent<T extends Event = Event> = Component<
  ChannelBuilder<T>,
  'create'
>;

/**
 * An OutboundChannelBuilder constructs a terminal channel that sends events
 * to an external system. Unlike ChannelBuilder, it does not wrap a downstream
 * handler.
 *
 * @template T - The event type flowing into this channel.
 */
export interface OutboundChannelBuilder<T extends Event = Event> {
  create(opts?: ChannelBuilderCreateOptions): EventHandlerFn<T>;
}

export type OutboundChannelBuilderComponent<T extends Event = Event> =
  Component<OutboundChannelBuilder<T>, 'create'>;

/**
 * Options for FlowProvider.create() — propagated to each builder during the fold.
 */
export type FlowCreateOptions = {
  flowName?: string;
};
