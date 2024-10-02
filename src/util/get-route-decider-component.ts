import { Event, RouteDecider, RouteDeciderFn } from '../types/index.js';
import { isRouteDecider } from './is-route-decider.js';

export const getRouteDeciderComponent = <T extends Event = Event>(
  obj: unknown,
  defaultRouteProvider?: RouteDecider<T> | RouteDeciderFn<T>,
): RouteDeciderFn<T> => {
  if (isRouteDecider(obj)) {
    return obj.get.bind(obj);
  }

  if (typeof obj === 'function') {
    return obj as RouteDeciderFn<T>;
  }

  if (defaultRouteProvider) {
    return getRouteDeciderComponent(defaultRouteProvider);
  }

  throw new Error('Invalid route provider');
};
