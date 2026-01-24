import { EventEmittingService, getComponent } from '@sektek/utility-belt';

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
  EventChannelEvents,
  EventEndpointComponent,
  EventHandlerFn,
  EventPredicateComponent,
  EventPredicateFn,
} from '../types/index.js';
import { NullHandler } from '../handlers/null-handler.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';

export type FilterChannelEvents<T extends Event = Event> =
  EventChannelEvents<T> & {
    'event:accepted': (event: T) => void;
    'event:rejected': (event: T) => void;
  };

export type FilterChannelOptions<T extends Event = Event> =
  EventServiceOptions & {
    filter: EventPredicateComponent<T>;
    handler: EventEndpointComponent<T>;
    rejectionHandler?: EventEndpointComponent<T>;
  };

export class FilterChannel<T extends Event = Event>
  extends AbstractEventService
  implements EventChannel<T>, EventEmittingService<FilterChannelEvents<T>>
{
  #filter: EventPredicateFn<T>;
  #handler: EventHandlerFn<T>;
  #rejectionHandler: EventHandlerFn<T>;

  constructor(opts: FilterChannelOptions<T>) {
    super(opts);

    this.#filter = getComponent(opts.filter, 'test', { name: 'filter' });
    this.#handler = getEventHandlerComponent(opts.handler);
    this.#rejectionHandler = getEventHandlerComponent(opts.rejectionHandler, {
      name: 'rejectionHandler',
      defaultProvider: () => new NullHandler<T>(),
    });
  }

  async send(event: T): Promise<void> {
    this.emit(EVENT_RECEIVED, event);
    try {
      if (await this.#filter(event)) {
        this.emit('event:accepted', event);
        await this.#handler(event);
        this.emit(EVENT_DELIVERED, event);
      } else {
        this.emit('event:rejected', event);
        await this.#rejectionHandler(event);
        this.emit(EVENT_DELIVERED, event);
      }
    } catch (err) {
      this.emit(EVENT_ERROR, err, event);
    }
  }
}
