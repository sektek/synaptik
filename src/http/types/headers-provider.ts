import {
  Event,
  EventBasedProvider,
  EventBasedProviderComponent,
  EventBasedProviderFn,
} from '../../types/index.js';

// Pretty certain I can import this from somewhere else. For now, I'll just copy it.
type HeadersInit = [string, string][] | Record<string, string> | Headers;

export type HeadersProviderFn<T extends Event = Event> = EventBasedProviderFn<
  T,
  HeadersInit
>;

export type HeadersProviderComponent<T extends Event = Event> =
  EventBasedProviderComponent<T, HeadersInit>;

export interface HeadersProvider<T extends Event = Event>
  extends EventBasedProvider<T, HeadersInit> {}
