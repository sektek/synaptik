import { Component } from '@sektek/utility-belt';

import { EventHandler, EventHandlerFn } from './event-handler.js';
import { Event } from './event.js';
import { EventChannel } from './event-channel.js';

interface EventProcessorAsEndpoint<T extends Event = Event> {
  process: EventHandlerFn<T, void>;
}

export type EventEndpoint<T extends Event = Event> =
  | EventHandler<T>
  | EventChannel<T>
  | EventProcessorAsEndpoint<T>;

export type EventEndpointComponent<T extends Event = Event> = Component<
  EventEndpoint<T>,
  'handle' | 'send' | 'process'
>;
