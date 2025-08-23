import { Component } from '@sektek/utility-belt';

import { Event } from './event.js';

export type EventErrorHandlerFn<
  T extends Event = Event,
  E extends Error = Error,
> = (event: T, error: E) => void;

export interface EventErrorHandler<
  T extends Event = Event,
  E extends Error = Error,
> {
  handle: EventErrorHandlerFn<T, E>;
}

export type EventErrorHandlerComponent<
  T extends Event = Event,
  E extends Error = Error,
> = Component<EventErrorHandler<T, E>, 'handle'>;
