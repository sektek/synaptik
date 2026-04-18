import { ProviderFn, Store, getComponent } from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import { NullChannel } from '../channels/null-channel.js';
import { Event } from '../types/index.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';
import {
  Route,
  RouteDecider,
  RouteDeciderFn,
  RouteFn,
  RoutesProvider,
} from './types/index.js';
import { NamedRoutesProviderOptions } from './named-routes-provider.js';

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
  #defaultRouteProvider: ProviderFn<RouteFn<E>, void>;

  constructor(opts: SingleUseNamedRoutesProviderOptions<E>) {
    super(opts);
    this.#routeDecider = getComponent(opts.routeDecider, 'get');
    this.#store = opts.store;

    if (opts.defaultRouteProvider) {
      this.#defaultRouteProvider = getComponent(opts.defaultRouteProvider, 'get');
    } else if (opts.defaultRoute) {
      const fn = getEventHandlerComponent(opts.defaultRoute);
      this.#defaultRouteProvider = () => fn;
    } else {
      this.#defaultRouteProvider = () => NullChannel.send;
    }
  }

  async *values(event: E): AsyncIterable<RouteFn<E>> {
    const names = [await this.#routeDecider(event)].flat();
    let yielded = false;

    for (const name of names) {
      const route = await this.#store.get(name);
      if (route) {
        yield route;
        yielded = true;
        await this.#store.delete(name);
      }
    }

    if (!yielded) {
      yield await this.#defaultRouteProvider();
    }
  }
}
