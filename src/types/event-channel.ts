import { Component, EventEmittingService } from '@sektek/utility-belt';

import { Event } from './event.js';
import { EventHandlerEvents } from './event-handler.js';
import { EventService } from './event-service.js';

export const EVENT_DELIVERED = 'event:delivered';

export type EventChannelSendOptions = Record<string, unknown>;

/**
 * An EventChannel Function is an event handler that specifically should
 * be used to carry events from one component to the next. Often used as
 * outbound gateways for transporting events between systems.
 *
 * @template T - The event type that the channel can send.
 *
 * @param event - The event to send.
 * @param options - Optional options for sending the event.
 *
 * @returns A promise that resolves when the event has been sent.
 */
export type EventChannelFn<T extends Event = Event> = (
  event: T,
  options?: EventChannelSendOptions,
) => void | Promise<void>;

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
 * @template T - The event type that the channel can send.
 */
export interface EventChannel<T extends Event = Event>
  extends EventService, EventEmittingService<EventChannelEvents<T>> {
  send: EventChannelFn<T>;
}

export type EventChannelComponent<T extends Event = Event> = Component<
  EventChannel<T>,
  'send'
>;
