import { Component, LoggerProvider } from '@sektek/utility-belt';

import {
  Event,
  EventHandlerComponent,
  EventHandlerFn,
} from '../../types/index.js';

export type ChannelBuilderCreateOptions = {
  loggerProvider?: LoggerProvider;
};

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
