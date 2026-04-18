import { Provider, ProviderFn, getComponent } from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import {
  Route,
  RouteDecider,
  RouteDeciderFn,
  RouteFn,
  RouteProvider,
  RouteProviderFn,
  RoutesProvider,
} from './types/index.js';
import { Event } from '../types/index.js';
import { resolveDefaultRouteProvider } from './resolve-default-route-provider.js';

export type NamedRoutesProviderOptions<E extends Event = Event> =
  EventServiceOptions & {
    routeDecider: RouteDecider<E> | RouteDeciderFn<E>;
    routeProvider: RouteProvider<E, string> | RouteProviderFn<E, string>;
    defaultRoute?: Route<E>;
    defaultRouteProvider?: Provider<RouteFn<E>> | ProviderFn<RouteFn<E>>;
  };

/**
 * Type guard that checks whether an object is a {@link NamedRoutesProviderOptions}.
 *
 * @param obj - The value to test.
 * @returns `true` if `obj` has a `routeDecider` property, indicating it is a
 *   {@link NamedRoutesProviderOptions} rather than another component type.
 */
export function isNamedRoutesProviderOptions<E extends Event = Event>(
  obj: unknown,
): obj is NamedRoutesProviderOptions<E> {
  return typeof obj === 'object' && obj !== null && 'routeDecider' in obj;
}

export class NamedRoutesProvider<E extends Event = Event>
  extends AbstractEventService
  implements RoutesProvider<E, E>
{
  #routeDecider: RouteDeciderFn<E>;
  #routeProvider: RouteProviderFn<E, string>;
  #defaultRouteProvider: ProviderFn<RouteFn<E>, void>;

  constructor(opts: NamedRoutesProviderOptions<E>) {
    super(opts);
    this.#routeDecider = getComponent(opts.routeDecider, 'get');
    this.#routeProvider = getComponent(opts.routeProvider, 'get');

    this.#defaultRouteProvider = resolveDefaultRouteProvider(opts);
  }

  async *values(event: E): AsyncIterable<RouteFn<E>> {
    const names = [await this.#routeDecider(event)].flat();
    let yielded = false;

    for (const name of names) {
      const route = await this.#routeProvider(name);
      if (route) {
        yield route;
        yielded = true;
      }
    }

    if (!yielded) {
      const defaultRoute = await this.#defaultRouteProvider();
      if (!defaultRoute) {
        throw new Error('defaultRouteProvider returned undefined');
      }
      yield defaultRoute;
    }
  }
}
