import { Component, EventEmittingService } from '@sektek/utility-belt';

import { Event } from './event.js';
import { EventService } from './event-service.js';

export type EventHandlerReturnType = Event | unknown | void;

/**
 * An event handler function is the base function for performing an action in
 * response to an event. When used as a handler, it should be considered an endpoint
 * and the returned value should be ignored. This allows a channel or a processor to
 * be used as a handler.
 */
export type EventHandlerFn<
  T extends Event = Event,
  R extends EventHandlerReturnType = unknown,
> = (event: T) => R | PromiseLike<R>;

export type EventHandlerEvents<
  T extends Event = Event,
  R extends EventHandlerReturnType = unknown,
> = {
  'event:received': (event: T) => void;
  'event:processed': (event: T, result: R) => void;
  'event:error': (event: T, err: Error) => void;
};

/**
 * An event handler represent an endpoint that performs an action in response
 * to an event.
 *
 * @typeParam T - The type of event that the handler can process.
 */
export interface EventHandler<T extends Event = Event>
  extends EventService,
    EventEmittingService<EventHandlerEvents<T>> {
  /**
   * Handle an event.
   * @param event - The event to handle.
   * @returns A promise that resolves when the event has been handled.
   */
  handle: EventHandlerFn<T>;
}

export type EventHandlerComponent<T extends Event = Event> = Component<
  EventHandler<T>,
  'handle'
>;
