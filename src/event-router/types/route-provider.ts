import {
  Component,
  OptionalProvider,
  OptionalProviderFn,
} from '@sektek/utility-belt';

import { Event } from '../../types/index.js';
import { RouteFn } from './route.js';

/**
 * A function that retrieves a single route handler by key, or undefined if no
 * route is found.
 */
export type RouteProviderFn<
  E extends Event = Event,
  T = E,
> = OptionalProviderFn<RouteFn<E>, T>;

/**
 * A class that retrieves a single route handler by key, or undefined if no
 * route is found.
 */
export interface RouteProvider<
  E extends Event = Event,
  T = E,
> extends OptionalProvider<RouteFn<E>, T> {}

export type RouteProviderComponent<E extends Event = Event, T = E> = Component<
  RouteProvider<E, T>,
  'get'
>;
