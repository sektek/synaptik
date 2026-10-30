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

/**
 * Events emitted by a {@link FilterChannel} while processing an event.
 *
 * Extends {@link EventChannelEvents} with notifications indicating whether
 * an event passed the configured filter.
 *
 * @template T - The event type being filtered. Defaults to {@link Event}.
 */
export type FilterChannelEvents<T extends Event = Event> =
  EventChannelEvents<T> & {
    /** Emitted when the filter accepts an event, before its handler runs. */
    'event:accepted': (event: T) => void;
    /** Emitted when the filter rejects an event, before its rejection handler runs. */
    'event:rejected': (event: T) => void;
  };

/**
 * Options for configuring a {@link FilterChannel}.
 *
 * @template T - The event type accepted by the filter and handlers. Defaults to {@link Event}.
 */
export type FilterChannelOptions<T extends Event = Event> =
  EventComponentOptions & {
    /** Predicate used to determine whether an event is accepted. */
    filter: EventPredicateComponent<T>;
    /** Endpoint invoked for events accepted by the filter. */
    handler: EventEndpointComponent<T>;
    /**
     * Endpoint invoked for rejected events. When omitted, rejected events
     * are passed to a {@link NullHandler}.
     */
    rejectionHandler?: EventEndpointComponent<T>;
  };

/**
 * Routes events to an acceptance or rejection handler based on a predicate.
 *
 * Emits a received event before evaluating the filter, then an accepted or
 * rejected event before invoking the corresponding handler. A delivered event
 * is emitted after that handler completes. Errors from the predicate or
 * either handler are emitted as error events and are not rethrown by `send()`.
 *
 * @template T - The event type accepted by this channel. Defaults to {@link Event}.
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
   * Evaluates an event against the filter and invokes the matching handler.
   *
   * @param event - The event to evaluate and forward.
   * @returns A promise that resolves after handling completes, including when
   *   an error was emitted during processing.
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
