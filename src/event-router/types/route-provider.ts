import {
  Component,
  IterableProvider,
  IterableProviderFn,
  Provider,
  ProviderFn,
} from '@sektek/utility-belt';

import {
  Event,
  EventEndpointComponent,
  EventHandlerFn,
} from '../../types/index.js';

export type RouteFn<T extends Event = Event> = EventHandlerFn<
  T,
  unknown | void
>;

export type Route<T extends Event = Event> = EventEndpointComponent<T>;

/**
 * A function that retrieves a single route handler by key.
 */
export type RouteProviderFn<
  E extends Event = Event,
  T = string,
> = ProviderFn<RouteFn<E>, T>;

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

export type RoutesProviderComponent<
  E extends Event = Event,
  T = E,
> = Component<RoutesProvider<E, T>, 'values'>;
