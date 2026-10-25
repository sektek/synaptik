import {
  ProviderComponent,
  ProviderFn,
  getComponent,
} from '@sektek/utility-belt';
import _ from 'lodash';

import {
  EVENT_ERROR,
  EVENT_PROCESSED,
  EVENT_RECEIVED,
  Event,
  EventProcessor,
} from './types/index.js';

import {
  AbstractEventComponent,
  EventComponentOptions,
} from './abstract-event-component.js';

/**
 * Options for the FieldEnricher.
 *
 * @template T The type of event to enrich. Defaults to Event.
 */
export type FieldEnricherOptions<T extends Event = Event> =
  EventComponentOptions & {
    /**
     * Path of the field within the event data, in lodash `set` notation (e.g.
     * `customer.address.city`). Missing intermediate objects are created.
     */
    field: string;
    /**
     * Provider of the value to set. It is called with the event being
     * enriched.
     */
    provider: ProviderComponent<unknown, T>;
  };

/**
 * Enriches an event by setting a field of its data to a value obtained from a
 * provider. The event is mutated in place: the same instance is returned, with
 * its id and parentId unchanged.
 *
 * @template T The type of event to enrich. Defaults to Event.
 */
export class FieldEnricher<T extends Event = Event>
  extends AbstractEventComponent
  implements EventProcessor<T, T>
{
  #field: string;
  #provider: ProviderFn<unknown, T>;

  /**
   * Creates a new FieldEnricher.
   *
   * @param opts The options for the field enricher.
   */
  constructor(opts: FieldEnricherOptions<T>) {
    super(opts);

    this.#field = opts.field;
    this.#provider = getComponent(opts.provider, 'get');
  }

  /**
   * Sets the configured field of the event's data to the value returned by
   * the provider. The event is mutated in place.
   *
   * @param event The event to enrich. Its data is modified.
   * @returns The same event instance, with the field set.
   * @throws {Error} Whatever the provider throws or rejects with; the event is
   *         left unmodified in that case.
   */
  async process(event: T): Promise<T> {
    this.emit(EVENT_RECEIVED, event);

    try {
      const value = await this.#provider(event);
      _.set(event.data, this.#field, value);
      this.emit(EVENT_PROCESSED, event);

      return event;
    } catch (error) {
      this.emit(EVENT_ERROR, error, event);
      throw error;
    }
  }
}
