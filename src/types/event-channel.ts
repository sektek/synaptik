import { Component, EventEmittingService } from '@sektek/utility-belt';

import { EventHandlerEvents, EventHandlerFn } from './event-handler.js';
import { Event } from './event.js';
import { EventService } from './event-service.js';

export const EVENT_DELIVERED = 'event:delivered';

/**
 * An EventChannel Function is an event handler that specifically should
 * be used to carry events from one component to the next. Often used as
 * outbound gateways for transporting events between systems.
 *
 * @typeParam T - The event type that the channel can send.
 */
export type EventChannelFn<T extends Event = Event> = EventHandlerFn<T, void>;

export type EventChannelEvents<T extends Event = Event> = EventHandlerEvents<
  T,
  void
> & {
  [EVENT_DELIVERED]: (event: Event) => void;
};

/**
 * An EventChannel is an event handler that specifically should be used to
 * carry events from one component to the next. Often used as outbound gateways
 * for transporting events between systems.
 *
 * @typeParam T - The event type that the channel can send.
 */
export interface EventChannel<T extends Event = Event>
  extends EventService,
    EventEmittingService<EventChannelEvents<T>> {
  send: EventChannelFn<T>;
}

export type EventChannelComponent<T extends Event = Event> = Component<
  EventChannel<T>,
  'send'
>;
