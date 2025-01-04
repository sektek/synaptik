import {
  Event,
  EventBasedProvider,
  EventBasedProviderComponent,
  EventBasedProviderFn,
} from '../../types/index.js';

type HeadersInit = Headers | [string, string][] | Record<string, string>;

export type HeadersProviderFn<T extends Event = Event> = EventBasedProviderFn<
  T,
  HeadersInit
>;

export type HeadersProviderComponent<T extends Event = Event> =
  EventBasedProviderComponent<T, HeadersInit>;

export interface HeadersProvider<T extends Event = Event>
  extends EventBasedProvider<T, HeadersInit> {}
