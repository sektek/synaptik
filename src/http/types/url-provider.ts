import {
  Event,
  EventBasedProvider,
  EventBasedProviderComponent,
  EventBasedProviderFn,
} from '../../types/index.js';

export type UrlProviderFn<T extends Event = Event> = EventBasedProviderFn<
  T,
  string
>;

export interface UrlProvider<T extends Event = Event>
  extends EventBasedProvider<T, string> {}

export type UrlProviderComponent<T extends Event = Event> =
  EventBasedProviderComponent<T, string>;
