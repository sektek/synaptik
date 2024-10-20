import { Component } from '@sektek/utility-belt';

import { Event } from '../../types/index.js';

export type EventDeserializerFn<T extends Event = Event> = (
  response: Response,
) => T | PromiseLike<T>;

export interface EventDeserializer<T extends Event = Event> {
  deserialize: EventDeserializerFn<T>;
}

export type EventDeserializerComponent<T extends Event = Event> = Component<
  EventDeserializer<T>,
  'deserialize'
>;
