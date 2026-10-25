import {
  IterableProviderComponent,
  IterableProviderFn,
  getComponent,
} from '@sektek/utility-belt';
import _ from 'lodash';

import { Event, EventSplitter } from './types/index.js';

import { EventBuilder } from './event-builder.js';

/**
 * Options for the IterableProviderSplitter.
 *
 * The `eventBuilder` is only optional when the default builder produces events
 * assignable to R, that is when T is assignable to R. Otherwise it is
 * required.
 *
 * @template T The type of event to split. Defaults to Event.
 * @template R The type of the split events. Defaults to T.
 */
export type IterableProviderSplitterOpts<
  T extends Event = Event,
  R extends Event = T,
> = {
  /**
   * Path of the field within the event data, in lodash `set` notation (e.g.
   * `order.item`), that receives each value.
   */
  field: string;
  /**
   * Provider of the values to split on. It is called with the original event
   * and may return a sync, async or promised iterable.
   */
  provider: IterableProviderComponent<unknown, T>;
  /**
   * Whether to throw an error when the provider yields no values. When false,
   * no events are produced. Defaults to false.
   */
  errorOnEmpty?: boolean;
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
 * Splits an event into one event per value supplied by a provider. The
 * provider is called with the original event, and each value is set on the
 * configured field of a new event. Each new event is built from the original,
 * so it carries the original's data and has its parentId set. Values are
 * consumed lazily.
 *
 * @template T The type of event to split. Defaults to Event.
 * @template R The type of the split events. Defaults to T.
 */
export class IterableProviderSplitter<
  T extends Event = Event,
  R extends Event = T,
> implements EventSplitter<T, R> {
  #field: string;
  #provider: IterableProviderFn<unknown, T>;
  #errorOnEmpty: boolean;
  #eventBuilder: { from(event: T): EventBuilder<R> };

  /**
   * Creates a new IterableProviderSplitter.
   *
   * @param opts The options for the iterable provider splitter.
   */
  constructor(opts: IterableProviderSplitterOpts<T, R>) {
    this.#field = opts.field;
    this.#provider = getComponent(opts.provider, 'values');
    this.#errorOnEmpty = opts.errorOnEmpty ?? false;
    this.#eventBuilder =
      opts.eventBuilder ??
      (EventBuilder as { from(event: T): EventBuilder<R> });
  }

  /**
   * Splits the event on the values supplied by the provider.
   *
   * @param event The event to split.
   * @throws {Error} If the provider yields no values and `errorOnEmpty` is
   *         true, or if the provider throws.
   * @yields {R} The split events, each with the field set to one of the
   *          provider's values.
   */
  async *split(event: T): AsyncGenerator<R> {
    const values = await this.#provider(event);
    const builder = this.#eventBuilder.from(event);
    let count = 0;

    for await (const value of values) {
      const newEvent = await builder.create();
      _.set(newEvent.data, this.#field, _.cloneDeep(value));
      count++;
      yield newEvent;
    }

    if (count === 0 && this.#errorOnEmpty) {
      throw new Error('The provider did not supply any values to split on');
    }
  }
}
