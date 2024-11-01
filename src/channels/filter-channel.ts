import { getComponent } from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import {
  Event,
  EventChannel,
  EventChannelEvents,
  EventEndpointComponent,
  EventHandlerFn,
  EventPredicateComponent,
  EventPredicateFn,
} from '../types/index.js';
import { NullHandler } from '../null-handler.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';

export interface FilterChannelEvents<T extends Event = Event>
  extends EventChannelEvents<T> {
  'event:rejected': (event: T) => void;
}

interface FilterChannelEventsEmitter<T extends Event = Event> {
  on<E extends keyof FilterChannelEvents<T>>(
    event: E,
    listener: FilterChannelEvents<T>[E],
  ): this;
  emit<E extends keyof FilterChannelEvents<T>>(
    event: E,
    ...args: Parameters<FilterChannelEvents<T>[E]>
  ): boolean;
}

export type FilterChannelOptions<T extends Event = Event> =
  EventServiceOptions & {
    filter: EventPredicateComponent<T>;
    handler: EventEndpointComponent<T>;
    rejectionHandler?: EventEndpointComponent<T>;
  };

export class FilterChannel<T extends Event = Event>
  extends AbstractEventService
  implements EventChannel<T>, FilterChannelEventsEmitter<T>
{
  #filter: EventPredicateFn<T>;
  #handler: EventHandlerFn<T>;
  #rejectionHandler: EventHandlerFn<T>;

  constructor(opts: FilterChannelOptions<T>) {
    super(opts);

    this.#filter = getComponent(opts.filter, 'test');
    this.#handler = getEventHandlerComponent(opts.handler);
    this.#rejectionHandler = getEventHandlerComponent(
      opts.rejectionHandler,
      new NullHandler<T>(),
    );
  }

  async send(event: T): Promise<void> {
    this.emit('event:received', event);
    try {
      if (this.#filter(event)) {
        this.emit('event:delivered', event);
        await this.#handler(event);
      } else {
        this.emit('event:rejected', event);
        await this.#rejectionHandler(event);
      }
    } catch (err) {
      this.emit('event:error', event, err);
    }
  }
}
