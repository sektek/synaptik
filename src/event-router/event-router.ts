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
import {
  EVENT_DELIVERED,
  EVENT_ERROR,
  EVENT_RECEIVED,
  Event,
  EventChannel,
} from '../types/index.js';
import {
  RouteFn,
  RoutesProviderComponent,
  RoutesProviderFn,
} from './types/index.js';

export type EventRouterOptions<T extends Event = Event> =
  EventServiceOptions & {
    routesProvider: RoutesProviderComponent<T>;
    executionStrategy?: ExecutionStrategyComponent;
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
  #executionStrategy: ExecutionStrategyFn;

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

  async *#wrapRoutes(
    source: Iterable<RouteFn<T>> | AsyncIterable<RouteFn<T>>,
    event: T,
  ) {
    for await (const route of source) {
      yield () => route(event);
    }
  }

  async send(event: T): Promise<void> {
    this.emit(EVENT_RECEIVED, event);
    try {
      await this.#executionStrategy(
        this.#wrapRoutes(await this.#routesProvider(event), event),
      );
    } catch (error) {
      this.emit(EVENT_ERROR, error, event);
      throw error;
    }
    this.emit(EVENT_DELIVERED, event);
  }
}
