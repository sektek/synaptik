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
import { RouteFn, RoutesProvider, RoutesProviderFn } from './types/index.js';

export type EventRouterOptions<T extends Event = Event> =
  EventServiceOptions & {
    routesProvider: RoutesProvider<T> | RoutesProviderFn<T>;
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
  #routesProvider: RoutesProviderFn<T>;
  #executionStrategy: ExecutionStrategyFn<RouteFn<T>>;

  constructor(options: EventRouterOptions<T>) {
    super(options);
    this.#routesProvider = getComponent(options.routesProvider, 'values');

    this.#executionStrategy = getComponent(
      options.executionStrategy,
      'execute',
      {
        name: 'executionStrategy',
        default: parallelExecutionStrategy,
      },
    );
  }

  async send(event: T): Promise<void> {
    this.emit('event:received', event);
    const routes: RouteFn<T>[] = [];
    for await (const route of await this.#routesProvider(event)) {
      routes.push(route);
    }
    await this.#executionStrategy(routes, event);
    this.emit('event:delivered', event);
  }
}
