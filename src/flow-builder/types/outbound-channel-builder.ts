import { Component } from '@sektek/utility-belt';

import { Event, EventHandlerFn } from '../../types/index.js';

import { ChannelBuilderCreateOptions } from './channel-builder.js';

export interface OutboundChannelBuilder<T extends Event = Event> {
  create(opts?: ChannelBuilderCreateOptions): EventHandlerFn<T>;
}

export type OutboundChannelBuilderComponent<T extends Event = Event> = Component<
  OutboundChannelBuilder<T>,
  'create'
>;
