import { Component } from '@sektek/utility-belt';

import {
  Event,
  EventBasedProvider,
  EventBasedProviderFn,
  EventEndpointComponent,
  EventHandlerFn,
} from '../../types/index.js';

export type RouteFn<T extends Event = Event> = EventHandlerFn<
  T,
  unknown | void
>;

export type Route<T extends Event = Event> = EventEndpointComponent<T>;

/**
 * A function that provides one or more event handlers for a given event.
 */
export type RouteProviderFn<T extends Event = Event> = EventBasedProviderFn<
  RouteFn<T> | RouteFn<T>[],
  T
>;

/**
 * A class that provides one or more event handlers for a given event.
 */
export interface RouteProvider<T extends Event = Event>
  extends EventBasedProvider<RouteFn<T> | RouteFn<T>[], T> {}

export type RouteProviderComponent<T extends Event = Event> = Component<
  RouteProvider<T>,
  'get'
>;
