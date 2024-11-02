import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import {
  Event,
  EventEndpointComponent,
  EventHandlerFn,
} from '../types/index.js';
import { RouteProvider } from './types/route-provider.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';

export type DispatchRouteProviderOptions<T extends Event = Event> =
  EventServiceOptions & {
    routes: EventEndpointComponent<T>[];
  };

export class DispatchRouteProvider<T extends Event = Event>
  extends AbstractEventService
  implements RouteProvider<T>
{
  #routes: EventHandlerFn<T>[] = [];

  constructor(opts: DispatchRouteProviderOptions<T>) {
    super(opts);

    if (!opts.routes || [opts.routes].flat().length === 0) {
      throw new Error('DispatchRouteProvider requires at least one route');
    }

    this.#routes = [opts.routes]
      .flat()
      .map(route => getEventHandlerComponent(route));
  }

  async get(): Promise<EventHandlerFn<T>[]> {
    return this.#routes;
  }
}
