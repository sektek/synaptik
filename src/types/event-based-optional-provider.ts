import {
  OptionalProvider,
  OptionalProviderComponent,
  OptionalProviderFn,
} from '@sektek/utility-belt';

import { Event } from './event.js';

export type EventBasedOptionalProviderFn<
  R,
  T extends Event = Event,
> = OptionalProviderFn<R, T>;

export interface EventBasedOptionalProvider<
  R,
  T extends Event = Event,
> extends OptionalProvider<R, T> {}

export type EventBasedOptionalProviderComponent<
  R,
  T extends Event = Event,
> = OptionalProviderComponent<R, T>;
