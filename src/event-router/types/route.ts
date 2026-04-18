import {
  Event,
  EventEndpointComponent,
  EventHandlerFn,
} from '../../types/index.js';

export type RouteFn<T extends Event = Event> = EventHandlerFn<
  T,
  unknown | void
>;

export type Route<T extends Event = Event> = EventEndpointComponent<T>;
