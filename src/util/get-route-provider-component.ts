import { Event, RouteProvider, RouteProviderFn } from '../types/index.js';
import { isRouteProvider } from './is-route-provider.js';

export const getRouteProviderComponent = <T extends Event = Event>(
  obj: unknown,
  defaultRouteProvider?: RouteProvider<T> | RouteProviderFn<T>,
): RouteProviderFn<T> => {
  if (isRouteProvider(obj)) {
    return obj.get.bind(obj);
  }

  if (typeof obj === 'function') {
    return obj as RouteProviderFn<T>;
  }

  if (defaultRouteProvider) {
    return getRouteProviderComponent(defaultRouteProvider);
  }

  throw new Error('Invalid route provider');
};
