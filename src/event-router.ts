import {
  AbstractEventService,
  EventServiceOptions,
} from './abstract-event-service.js';
import { Event, EventChannel } from './types/index.js';
import { RouteProvider, RouteProviderFn } from './types/route-provider.js';
import { getRouteProviderComponent } from './util/get-route-provider-component.js';

type EventRouterOptions<T extends Event = Event> = EventServiceOptions & {
  routeProvider: RouteProvider<T> | RouteProviderFn<T>;
};

/**
 * An EventRouter is an EventChannel that routes events to one or more
 * destinations based on the routes provided by the route provider.
 */
export class EventRouter<T extends Event = Event>
  extends AbstractEventService
  implements EventChannel<T>
{
  #routeProvider: RouteProviderFn<T>;

  constructor(options: EventRouterOptions<T>) {
    super(options);
    this.#routeProvider = getRouteProviderComponent<T>(options.routeProvider);
  }

  async send(event: T): Promise<void> {
    this.emit('event:received', event);
    const routes = await this.#routeProvider(event);
    await Promise.all([routes].flat().map(route => route(event)));
    this.emit('event:delivered', event);
  }
}
