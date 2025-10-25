import {
  Predicate,
  PredicateComponent,
  PredicateFn,
} from '@sektek/utility-belt';

import { Event } from './event.js';

export type EventPredicateFn<T extends Event = Event> = PredicateFn<T>;

export const ALLOW_ALL: EventPredicateFn = () => true;
export const DENY_ALL: EventPredicateFn = () => false;

export interface EventPredicate<T extends Event = Event> extends Predicate<T> {}

export type EventPredicateComponent<T extends Event = Event> =
  PredicateComponent<T>;
