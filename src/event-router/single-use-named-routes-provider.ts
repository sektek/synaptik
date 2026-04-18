import { ProviderFn, Store, getComponent } from '@sektek/utility-belt';

import { RouteDeciderFn, RouteFn, RoutesProvider } from './types/index.js';
import { AbstractEventService } from '../abstract-event-service.js';
import { Event } from '../types/index.js';
import { NamedRoutesProviderOptions } from './named-routes-provider.js';
import { NullChannel } from '../channels/null-channel.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';

export type SingleUseNamedRoutesProviderOptions<E extends Event = Event> = Omit<
  NamedRoutesProviderOptions<E>,
  'routeProvider'
> & {
  store: Store<RouteFn<E>, string>;
};

export class SingleUseNamedRoutesProvider<E extends Event = Event>
  extends AbstractEventService
  implements RoutesProvider<E, E>
{
  #routeDecider: RouteDeciderFn<E>;
  #store: Store<RouteFn<E>, string>;
  #defaultRouteProvider: ProviderFn<RouteFn<E>>;

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
