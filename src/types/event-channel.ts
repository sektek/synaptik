import { Component, EventEmittingService } from '@sektek/utility-belt';
import { Event } from './event.js';
import { EventHandlerFn } from './event-handler.js';
import { EventService } from './event-service.js';

/**
 * An EventChannel Function is an event handler that specifically should
 * be used to carry events from one component to the next. Often used as
 * outbound gateways for transporting events between systems.
 *
 * @typeParam T - The event type that the channel can send.
 */
export type EventChannelFn<T extends Event = Event> = EventHandlerFn<T, void>;

export type EventChannelEvents<T extends Event = Event> = {
  'event:received': (event: T) => void;
  'event:delivered': (event: Event) => void;
  'event:error': (event: Event, err: Error) => void;
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
