import {
  Component,
  IterableProvider,
  IterableProviderFn,
} from '@sektek/utility-belt';

import { Event } from '../../types/index.js';
import { RouteFn } from './route.js';

/**
 * A function that provides zero or more route handlers for a given input.
 */
export type RoutesProviderFn<
  E extends Event = Event,
  T = E,
> = IterableProviderFn<RouteFn<E>, T>;

/**
 * A class that provides zero or more route handlers for a given input.
 */
export interface RoutesProvider<
  E extends Event = Event,
  T = E,
> extends IterableProvider<RouteFn<E>, T> {}

export type RoutesProviderComponent<E extends Event = Event, T = E> = Component<
  RoutesProvider<E, T>,
  'values'
>;
