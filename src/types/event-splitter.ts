import { Component } from '@sektek/utility-belt';

import { Event } from './event.js';

export type EventSplitterFn<T extends Event = Event, R extends Event = T> = (
  event: T,
) => Iterable<R> | AsyncIterable<R>;

export interface EventSplitter<T extends Event = Event, R extends Event = T> {
  split: EventSplitterFn<T, R>;
}

export type EventSplitterComponent<
  T extends Event = Event,
  R extends Event = T,
> = Component<EventSplitter<T, R>, 'split'>;
