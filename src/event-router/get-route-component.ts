import { getComponent } from '@sektek/utility-belt';

import { Route, RouteFn } from './types/index.js';
import { Event } from '../types/index.js';

export const getRouteComponent = <T extends Event = Event>(
  route: Route<T> | null | undefined,
  fallback?: Route<T>,
): RouteFn<T> => getComponent(route, ['handle', 'send', 'process'], fallback);
