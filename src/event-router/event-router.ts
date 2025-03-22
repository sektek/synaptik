import {
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
  getComponent,
  parallelExecutionStrategy,
} from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import { Event, EventChannel } from '../types/index.js';
import { RouteFn, RouteProvider, RouteProviderFn } from './types/index.js';

type EventRouterOptions<T extends Event = Event> = EventServiceOptions & {
  routeProvider: RouteProvider<T> | RouteProviderFn<T>;
  executionStrategy?: ExecutionStrategyComponent<RouteFn<T>>;
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
  #executionStrategy: ExecutionStrategyFn<RouteFn<T>>;

  constructor(options: EventRouterOptions<T>) {
    super(options);
    this.#routeProvider = getComponent(options.routeProvider, 'get');

    this.#executionStrategy = getComponent(
      options.executionStrategy,
      'execute',
      parallelExecutionStrategy,
    );
  }

  async send(event: T): Promise<void> {
    this.emit('event:received', event);
    const routes = await this.#routeProvider(event);
    await this.#executionStrategy([routes].flat(), event);
    this.emit('event:delivered', event);
  }
}
