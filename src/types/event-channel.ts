import { Component } from '@sektek/utility-belt';
import { Event } from './event.js';
import { EventHandlerFn } from './event-handler.js';

/**
 * An EventChannel Function is an event handler that specifically should
 * be used to carry events from one component to the next. Often used as
 * outbound gateways for transporting events between systems.
 *
 * @typeParam T - The event type that the channel can send.
 */
export type EventChannelFn<T extends Event> = EventHandlerFn<T, void>;

export interface EventChannelEvents<T extends Event = Event> {
  'event:received': (event: T) => void;
  'event:delivered': (event: Event) => void;
}

/**
 * An EventChannel is an event handler that specifically should be used to
 * carry events from one component to the next. Often used as outbound gateways
 * for transporting events between systems.
 *
 * @typeParam T - The event type that the channel can send.
 */
export interface EventChannel<T extends Event = Event> {
  send: EventChannelFn<T>;
  on<E extends keyof EventChannelEvents<T>>(
    event: E,
    listener: EventChannelEvents<T>[E],
  ): this;
  emit<E extends keyof EventChannelEvents<T>>(
    event: E,
    ...args: Parameters<EventChannelEvents<T>[E]>
  ): boolean;
}

export type EventChannelComponent<T extends Event = Event> = Component<
  EventChannel<T>,
  'send'
>;
