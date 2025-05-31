import { EventEmittingService, getComponent } from '@sektek/utility-belt';

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

export type FilterChannelEvents<T extends Event = Event> =
  EventChannelEvents<T> & {
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
    this.emit('event:received', event);
    try {
      if (await this.#filter(event)) {
        this.emit('event:accepted', event);
        await this.#handler(event);
        this.emit('event:delivered', event);
      } else {
        this.emit('event:rejected', event);
        await this.#rejectionHandler(event);
        this.emit('event:delivered', event);
      }
    } catch (err) {
      this.emit('event:error', event, err);
    }
  }
}
