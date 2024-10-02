import { Event } from './event.js';

/**
 * A function that provides one or more route names for a given event.
 */
export type RouteDeciderFn<T extends Event = Event> = (
  event: T,
) => Promise<string | string[]>;

/**
 * A class that provides one or more route names for a given event.
 */
export interface RouteDecider<T extends Event = Event> {
  get: RouteDeciderFn<T>;
}
