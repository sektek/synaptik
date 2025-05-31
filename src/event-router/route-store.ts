import { getComponent } from '@sektek/utility-belt';

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
} from './types/index.js';
import { Event } from '../types/index.js';
import { NullHandler } from '../null-handler.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';

type RouteRecord<T extends Event = Event> = Record<string, Route<T>>;

export type RouteStoreOptions<T extends Event = Event> = EventServiceOptions & {
  routeDecider: RouteDecider<T> | RouteDeciderFn<T>;
  defaultRoute?: Route<T>;
  routes?: RouteRecord<T>;
};

/**
 * A RouteStore is a RouteProvider that stores routes within a map and returns
 * one or more routes based on the route names provided by the route decider.
 */
export class RouteStore<T extends Event = Event>
  extends AbstractEventService
  implements RouteProvider
{
  #routeDecider: RouteDeciderFn<T>;
  #defaultRoute: RouteFn<T>;
  #routes: Map<string, RouteFn<T>> = new Map();

  constructor(opts: RouteStoreOptions<T>) {
    super(opts);
    this.#routeDecider = getComponent(opts.routeDecider, 'get');
    this.#defaultRoute = getEventHandlerComponent(opts.defaultRoute, {
      name: 'defaultRoute',
      default: () => new NullHandler<T>(),
    });
    if (opts.routes) {
      Object.entries(opts.routes).forEach(([name, route]) =>
        this.add(name, route),
      );
    }
  }

  add(name: string, route: Route<T>): void {
    this.routes.set(name, getEventHandlerComponent(route));
  }

  remove(names: string | string[]): void {
    [names].flat().forEach(name => this.routes.delete(name));
  }

  async get(event: T): Promise<RouteFn<T>[]> {
    const routeNames = await this.routeDecider(event);
    const routes = [routeNames]
      .flat()
      .map(name => this.#routes.get(name))
      .filter(Boolean);
    return routes?.length ? (routes as RouteFn<T>[]) : [this.defaultRoute];
  }

  protected get defaultRoute(): RouteFn<T> {
    return this.#defaultRoute;
  }

  protected get routes(): Map<string, RouteFn<T>> {
    return this.#routes;
  }

  protected get routeDecider(): RouteDeciderFn<T> {
    return this.#routeDecider;
  }
}
