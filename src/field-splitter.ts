import _ from 'lodash';

import { Event, EventSplitter } from './types/index.js';

import { EventBuilder } from './event-builder.js';

/**
 * Options for the FieldSplitter.
 *
 * @template T The type of event to split. Defaults to Event.
 * @template R The type of the split events. Defaults to T.
 */
export type FieldSplitterOpts<T extends Event = Event, R extends Event = T> = {
  /**
   * Path of the field within the event data, in lodash `get` notation (e.g.
   * `order.items`).
   */
  field: string;
  /**
   * Builder used to create each split event. Defaults to
   * `EventBuilder.from(event)`, which copies all of the original's data.
   */
  eventBuilder?: EventBuilder<R>;
};

/**
 * Splits an event into one event per value of a field. If the field holds an
 * array each element becomes its own event and the field remains an array
 * holding just that element, otherwise a single event is produced. Each new
 * event is built from the original, so it carries the original's data and has
 * its parentId set.
 *
 * @template T The type of event to split. Defaults to Event.
 * @template R The type of the split events. Defaults to T.
 */
export class FieldSplitter<
  T extends Event = Event,
  R extends Event = T,
> implements EventSplitter<T, R> {
  #field: string;
  #eventBuilder?: EventBuilder<R>;

  /**
   * Creates a new FieldSplitter.
   *
   * @param opts The options for the field splitter.
   */
  constructor(opts: FieldSplitterOpts<T, R>) {
    this.#field = opts.field;
    this.#eventBuilder = opts.eventBuilder;
  }

  /**
   * Splits the event on the configured field.
   *
   * @param event The event to split.
   * @yields {R} The split events, each with the field set to one of the
   *          values (wrapped in an array if the original field was an array).
   */
  async *split(event: T): AsyncGenerator<R> {
    const value = _.get(event.data, this.#field);
    const isArray = Array.isArray(value);
    const values = isArray ? value : [value];
    const builder =
      this.#eventBuilder?.from(event) ??
      (EventBuilder.from(event) as unknown as EventBuilder<R>);

    for (const val of values) {
      const newEvent = await builder.create();
      _.set(newEvent.data, this.#field, isArray ? [val] : val);
      yield newEvent;
    }
  }
}
