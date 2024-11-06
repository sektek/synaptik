import { Component } from '@sektek/utility-belt';

import { Event } from './event.js';
import { EventService } from './event-service.js';

export type EventPredicateFn<T extends Event = Event> = (
  event: T,
) => boolean | PromiseLike<boolean>;

export const ALLOW_ALL: EventPredicateFn = () => true;
export const DENY_ALL: EventPredicateFn = () => false;

export interface EventPredicate<T extends Event = Event> extends EventService {
  test: EventPredicateFn<T>;
}

export type EventPredicateComponent<T extends Event = Event> = Component<
  EventPredicate<T>,
  'test'
>;
