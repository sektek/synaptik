import _ from 'lodash';

import { Event, EventSplitter } from './types/index.js';

import { EventBuilder } from './event-builder.js';

/**
 * Options for the FieldSplitter.
 *
 * The `eventBuilder` is only optional when the default builder produces events
 * assignable to R, that is when T is assignable to R. Otherwise it is
 * required.
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
   * Whether to throw an error when the field is not present on the event.
   * When false, a single event is yielded without the field being set.
   * Defaults to true.
   */
  errorOnMissing?: boolean;
} & ([T] extends [R]
  ? {
      /**
       * Builder used to create each split event. Defaults to
       * `EventBuilder.from(event)`, which copies all of the original's data.
       */
      eventBuilder?: EventBuilder<R>;
    }
  : {
      /** Builder used to create each split event. */
      eventBuilder: EventBuilder<R>;
    });

/**
 * Splits an event into one event per value of a field. If the field holds an
 * array each element becomes its own event and the field remains an array
 * holding just that element, otherwise a single event is produced. An empty
 * array produces no events. If the field is not present an error is thrown,
 * unless `errorOnMissing` is false, in which case a single event is produced
 * without the field. Each new event is built from the original, so it carries
 * the original's data and has its parentId set.
 *
 * @template T The type of event to split. Defaults to Event.
 * @template R The type of the split events. Defaults to T.
 */
export class FieldSplitter<
  T extends Event = Event,
  R extends Event = T,
> implements EventSplitter<T, R> {
  #field: string;
  #errorOnMissing: boolean;
  #eventBuilder: { from(event: T): EventBuilder<R> };

  /**
   * Creates a new FieldSplitter.
   *
   * @param opts The options for the field splitter.
   */
  constructor(opts: FieldSplitterOpts<T, R>) {
    this.#field = opts.field;
    this.#errorOnMissing = opts.errorOnMissing ?? true;
    this.#eventBuilder =
      opts.eventBuilder ??
      (EventBuilder as { from(event: T): EventBuilder<R> });
  }

  /**
   * Splits the event on the configured field.
   *
   * @param event The event to split.
   * @throws {Error} If the field is not present and `errorOnMissing` is true.
   * @yields {R} The split events, each with the field set to one of the
   *          values (wrapped in an array if the original field was an array).
   */
  async *split(event: T): AsyncGenerator<R> {
    const value = _.get(event.data, this.#field);
    const builder = this.#eventBuilder.from(event);

    if (value === undefined) {
      if (this.#errorOnMissing) {
        throw new Error(`Field '${this.#field}' is not present on the event`);
      }

      yield await builder.create();
      return;
    }

    const isArray = Array.isArray(value);
    const values = isArray ? value : [value];

    for (const val of values) {
      const newEvent = await builder.create();
      _.set(newEvent.data, this.#field, _.cloneDeep(isArray ? [val] : val));
      yield newEvent;
    }
  }
}
