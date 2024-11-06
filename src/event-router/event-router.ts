import { getComponent } from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import { Event, EventChannel } from '../types/index.js';
import {
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
  RouteProvider,
  RouteProviderFn,
} from './types/index.js';
import { ParallelStrategy } from './execution-strategies/index.js';

type EventRouterOptions<T extends Event = Event> = EventServiceOptions & {
  routeProvider: RouteProvider<T> | RouteProviderFn<T>;
  executionStrategy?: ExecutionStrategyComponent<T>;
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
  #executionStrategy: ExecutionStrategyFn<T>;

  constructor(options: EventRouterOptions<T>) {
    super(options);
    this.#routeProvider = getComponent(options.routeProvider, 'get');

    this.#executionStrategy = getComponent(
      options.executionStrategy,
      'execute',
      new ParallelStrategy<T>(),
    );
  }

  async send(event: T): Promise<void> {
    this.emit('event:received', event);
    const routes = await this.#routeProvider(event);
    await this.#executionStrategy(event, [routes].flat());
    this.emit('event:delivered', event);
  }
}
