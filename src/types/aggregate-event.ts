import { Event } from './event.js';

type AggregateEventData<T extends Event = Event> = {
  events: T[];
};

export type AggregateEvent<T extends Event = Event> = T & {
  data: AggregateEventData<T>;
};
