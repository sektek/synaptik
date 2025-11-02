import { Provider, ProviderComponent, ProviderFn } from '@sektek/utility-belt';
import { Event } from './event.js';

export type EventBasedProviderFn<R, T extends Event = Event> = ProviderFn<R, T>;

export interface EventBasedProvider<R, T extends Event = Event>
  extends Provider<R, T> {}

export type EventBasedProviderComponent<
  R,
  T extends Event = Event,
> = ProviderComponent<R, T>;
