import { getComponent } from '@sektek/utility-belt';

import { Event, Route, RouteFn } from '../types/index.js';

export const getRouteComponent = <T extends Event = Event>(
  route: Route<T> | null | undefined,
  fallback?: Route<T>,
): RouteFn<T> => getComponent(route, ['handle', 'send', 'process'], fallback);
