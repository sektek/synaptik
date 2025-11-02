import {
  EventBasedProvider,
  EventBasedProviderComponent,
  EventBasedProviderFn,
} from './event-based-provider.js';
import { Event } from './event.js';

export type EventBasedStringProviderFn<T extends Event = Event> =
  EventBasedProviderFn<string, T>;

export interface EventBasedStringProvider<T extends Event = Event>
  extends EventBasedProvider<string, T> {}

export type EventBasedStringProviderComponent<T extends Event = Event> =
  EventBasedProviderComponent<string, T>;
