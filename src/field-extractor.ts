import _ from 'lodash';

import { Event, EventBasedOptionalProvider } from './types/index.js';

/**
 * Options for the FieldExtractor.
 */
export type FieldExtractorOpts = {
  /**
   * Path of the field within the event data, in lodash `get` notation (e.g.
   * `customer.address.city`).
   */
  field: string;
};

/**
 * Provides the value found at a field path within an event's data.
 *
 * @template T The type of the extracted value.
 * @template E The type of event to extract from. Defaults to Event.
 */
export class FieldExtractor<
  T,
  E extends Event = Event,
> implements EventBasedOptionalProvider<T, E> {
  #field: string;

  /**
   * Creates a new FieldExtractor.
   *
   * @param opts The options for the field extractor.
   */
  constructor(opts: FieldExtractorOpts) {
    this.#field = opts.field;
  }

  /**
   * Gets the value at the configured field path.
   *
   * @param event The event to extract the value from.
   * @returns The value at the field path, or undefined if the path does not
   *          resolve.
   */
  async get(event: E): Promise<T | undefined> {
    return _.get(event.data, this.#field) as T | undefined;
  }
}
