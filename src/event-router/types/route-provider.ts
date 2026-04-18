import { Component, Provider, ProviderFn } from '@sektek/utility-belt';

import { Event } from '../../types/index.js';
import { RouteFn } from './route.js';

/**
 * A function that retrieves a single route handler by key.
 */
export type RouteProviderFn<E extends Event = Event, T = string> = ProviderFn<
  RouteFn<E>,
  T
>;

/**
 * A class that retrieves a single route handler by key.
 */
export interface RouteProvider<
  E extends Event = Event,
  T = string,
> extends Provider<RouteFn<E>, T> {}

export type RouteProviderComponent<
  E extends Event = Event,
  T = string,
> = Component<RouteProvider<E, T>, 'get'>;
