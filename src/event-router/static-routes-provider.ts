import {
  AbstractEventComponent,
  EventComponentOptions,
} from '../abstract-event-component.js';
import {
  Event,
  EventEndpointComponent,
  EventHandlerFn,
} from '../types/index.js';
import { RoutesProvider } from './types/index.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';

export type StaticRoutesProviderOptions<T extends Event = Event> =
  EventComponentOptions & {
    routes: EventEndpointComponent<T>[];
  };

export class StaticRoutesProvider<T extends Event = Event>
  extends AbstractEventComponent
  implements RoutesProvider<T>
{
  #routes: EventHandlerFn<T>[] = [];

  constructor(opts: StaticRoutesProviderOptions<T>) {
    super(opts);

    if (!opts.routes || [opts.routes].flat().length === 0) {
      throw new Error('StaticRoutesProvider requires at least one route');
    }

    this.#routes = [opts.routes]
      .flat()
      .map(route => getEventHandlerComponent(route));
  }

  async values(): Promise<EventHandlerFn<T>[]> {
    return this.#routes;
  }
}
