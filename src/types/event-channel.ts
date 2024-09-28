import { Event } from './event.js';
import { EventHandlerFn } from './event-handler.js';

/**
 * And EventChannel Function is an event handler that specifically should
 * be used to carry events from one component to the next. Often used as
 * outbound gateways for transporting events between systems.
 *
 * @typeParam T - The event type that the channel can send.
 */
export type EventChannelFn<T extends Event> = EventHandlerFn<T, void>;

export interface EventChannelEvents<T extends Event> {
  'event:received': (event: T) => void;
  'event:delivered': (event: T) => void;
}

/**
 * An EventChannel is an event handler that specifically should be used to
 * carry events from one component to the next. Often used as outbound gateways
 * for transporting events between systems.
 *
 * @typeParam T - The event type that the channel can send.
 */
export interface EventChannel<T extends Event> {
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
