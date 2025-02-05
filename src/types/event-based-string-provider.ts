import {
  EventBasedProvider,
  EventBasedProviderComponent,
  EventBasedProviderFn,
} from './event-based-provider.js';
import { Event } from './event.js';

export type EventBasedStringProviderFn<T extends Event = Event> =
  EventBasedProviderFn<T, string>;

export interface EventBasedStringProvider<T extends Event = Event>
  extends EventBasedProvider<T, string> {}

export type EventBasedStringProviderComponent<T extends Event = Event> =
  EventBasedProviderComponent<T, string>;
