import { Component } from '@sektek/utility-belt';
import { Event } from './event.js';
import { EventService } from './event-service.js';

export type EventBasedProviderFn<T extends Event, R> = (
  event: T,
) => R | PromiseLike<R>;

export interface EventBasedProvider<T extends Event, R> extends EventService {
  get: EventBasedProviderFn<T, R>;
}

export type EventBasedProviderComponent<T extends Event, R> = Component<
  EventBasedProvider<T, R>,
  'get'
>;
