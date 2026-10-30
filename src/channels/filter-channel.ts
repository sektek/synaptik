import { EventEmittingService, getComponent } from '@sektek/utility-belt';

import {
  AbstractEventComponent,
  EventComponentOptions,
} from '../abstract-event-component.js';
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

/** Events indicating the outcome of filtering, alongside standard channel events.
 * @template T - Event type evaluated by the filter; defaults to {@link Event}.
 */
export type FilterChannelEvents<T extends Event = Event> =
  EventChannelEvents<T> & {
    /** Emitted when an event passes the predicate, before forwarding. */
    'event:accepted': (event: T) => void;
    /** Emitted when an event fails the predicate, before rejection handling. */
    'event:rejected': (event: T) => void;
  };

/** Configuration for a {@link FilterChannel}.
 * @template T - Event type accepted by the predicate and handlers; defaults to {@link Event}.
 */
export type FilterChannelOptions<T extends Event = Event> =
  EventComponentOptions & {
    /** Predicate determining which events pass through the channel. */
    filter: EventPredicateComponent<T>;
    /** Endpoint receiving accepted events. */
    handler: EventEndpointComponent<T>;
    /** Optional endpoint for rejected events; without one, they are discarded. */
    rejectionHandler?: EventEndpointComponent<T>;
  };

/**
 * A channel that filters events before forwarding them to a handler.
 *
 * Only events satisfying the configured predicate reach the main handler.
 * Rejected events are discarded by default, or handled separately when a
 * rejection handler is provided.
 *
 * @template T - The event type filtered by this channel; defaults to {@link Event}.
 */
export class FilterChannel<T extends Event = Event>
  extends AbstractEventComponent
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

  /**
   * Filters an event and passes it to the appropriate handler.
   *
   * Errors from the predicate or handlers are emitted as error events rather
   * than causing this method to reject.
   *
   * @param event - The event to filter.
   * @returns A promise that resolves when processing finishes.
   */
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
