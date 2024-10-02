import { EventHandler, EventHandlerFn } from './event-handler.js';

import { Event } from './event.js';
import { EventChannel } from './event-channel.js';

export type RouteFn<T extends Event = Event> = EventHandlerFn<
  T,
  unknown | void
>;

export type Route<T extends Event = Event> =
  | EventChannel<T>
  | EventHandler<T>
  | RouteFn<T>;

/**
 * A function that provides one or more event handlers for a given event.
 */
export type RouteProviderFn<T extends Event = Event> = (
  event: T,
) => Promise<RouteFn<T> | RouteFn<T>[]>;

/**
 * A class that provides one or more event handlers for a given event.
 */
export interface RouteProvider<T extends Event = Event> {
  get: RouteProviderFn<T>;
}
