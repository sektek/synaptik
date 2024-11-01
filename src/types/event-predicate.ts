import { Component } from '@sektek/utility-belt';

import { Event } from './event.js';

export type EventPredicateFn<T extends Event = Event> = (
  event: T,
) => boolean | PromiseLike<boolean>;

export interface EventPredicate<T extends Event = Event> {
  test: EventPredicateFn<T>;
}

export type EventPredicateComponent<T extends Event = Event> = Component<
  EventPredicate<T>,
  'test'
>;
