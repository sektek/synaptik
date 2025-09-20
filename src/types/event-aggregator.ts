import {
  Aggregator,
  AggregatorFn,
  AggregatorComponent,
} from '@sektek/utility-belt';

import { Event } from './event.js';

export type EventAggregatorFn<
  T extends Event = Event,
  R extends Event = T,
> = AggregatorFn<T, R>;

export interface EventAggregator<T extends Event = Event, R extends Event = T>
  extends Aggregator<T, R> {}

export type EventAggregatorComponent<
  T extends Event = Event,
  R extends Event = T,
> = AggregatorComponent<T, R>;
