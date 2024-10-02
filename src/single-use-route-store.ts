import { Event, RouteFn } from './types/index.js';
import { RouteStore } from './route-store.js';

/**
 * A SingleUseRouteStore is a RouteStore that removes routes after they are
 * retrieved.
 */
export class SingleUseRouteStore<
  T extends Event = Event,
> extends RouteStore<T> {
  async get(event: T): Promise<RouteFn[]> {
    const routeNames = await this.routeDecider(event);
    const routes = [routeNames]
      .flat()
      .map(name => this.routes.get(name))
      .filter(Boolean);

    this.remove(routeNames);

    return routes?.length ? (routes as RouteFn<T>[]) : [this.defaultRoute];
  }
}
