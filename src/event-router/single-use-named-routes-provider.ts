import { ProviderFn, Store, getComponent } from '@sektek/utility-belt';

import { RouteDeciderFn, RouteFn, RoutesProvider } from './types/index.js';
import { AbstractEventComponent } from '../abstract-event-component.js';
import { Event } from '../types/index.js';
import { NamedRoutesProviderOptions } from './named-routes-provider.js';
import { NullChannel } from '../channels/null-channel.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';

/**
 * Configures a routes provider that consumes stored named routes as they are
 * yielded. Unlike a regular named routes provider, this provider requires a
 * store from which selected routes are removed after use.
 *
 * @template E - Event type used to select and invoke routes.
 */
export type SingleUseNamedRoutesProviderOptions<E extends Event = Event> = Omit<
  NamedRoutesProviderOptions<E>,
  'routeProvider'
> & {
  /** Store mapping route names to handlers; selected entries are deleted after use. */
  store: Store<RouteFn<E>, string>;
};

/**
 * Supplies event routes by name, consuming each stored route after it is used.
 *
 * The route decider selects one or more names for an event. Matching routes
 * are yielded from the store and deleted when iteration proceeds past each
 * yield (or the iterator is closed). Missing names are skipped. If none of
 * the selected names resolve to a route, the configured default route is
 * supplied instead; without a configured default, a no-op route is used.
 *
 * A route is not removed merely by requesting the iterator: consumption
 * occurs as the caller advances it. The store therefore needs to support
 * retrieval and deletion, and concurrent consumers are not guaranteed to
 * claim a route exclusively.
 *
 * @template E - Event type accepted by the route decider and returned routes.
 */
export class SingleUseNamedRoutesProvider<E extends Event = Event>
  extends AbstractEventComponent
  implements RoutesProvider<E, E>
{
  #routeDecider: RouteDeciderFn<E>;
  #store: Store<RouteFn<E>, string>;
  #defaultRouteProvider: ProviderFn<RouteFn<E>>;

  /**
   * @param opts - Route selection, stored routes, and optional fallback configuration.
   */
  constructor(opts: SingleUseNamedRoutesProviderOptions<E>) {
    super(opts);
    this.#routeDecider = getComponent(opts.routeDecider, 'get');
    this.#store = opts.store;

    const defaultRoute = getEventHandlerComponent(opts.defaultRoute, {
      default: new NullChannel(),
    });
    this.#defaultRouteProvider = getComponent(
      opts.defaultRouteProvider,
      'get',
      {
        default: () => defaultRoute,
      },
    );
  }

  /**
   * Yields selected routes, removing each stored route when its yield completes.
   * Falls back to the default route only when no stored route is found.
   *
   * @param event - Event used to select route names.
   * @returns An asynchronous iterable of route handler functions.
   * @throws If route selection or store access fails, or the default route provider returns no route.
   */
  async *values(event: E): AsyncIterable<RouteFn<E>> {
    const names = [await this.#routeDecider(event)].flat();
    let yielded = false;

    for (const name of names) {
      const route = await this.#store.get(name);
      if (route) {
        yielded = true;
        try {
          yield route;
        } finally {
          await this.#store.delete(name);
        }
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
