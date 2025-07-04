import { BuilderOptions, ObjectBuilder } from '@sektek/utility-belt';
import _ from 'lodash';

import { Event } from './types/index.js';

const randomUUID = globalThis.crypto.randomUUID.bind(globalThis.crypto);

type EventHeadersBuildOpts<T extends Event = Event> = BuilderOptions<
  Omit<T, 'data' | 'type'>
>;

type EventDataBuildOpts<T extends Event = Event> = BuilderOptions<T['data']>;

/**
 * Options for the EventBuilder.
 *
 * @template T The type of event to build. Defaults to Event.
 * @property {T['type']} [type] - The type of event to build. Defaults to 'Event'.
 * @property {Partial<EventHeadersBuildOpts<T>>} [headers] - Headers for the event.
 * @property {Array<keyof T['data']>} [copyKeys] - Keys to copy from the data when calling `from()`.
 * @property {Partial<BuilderOptions<T['data']>>} [defaults] - Default values for the event data.
 * @property {ObjectBuilder<T['data']>} [dataBuilder] - Custom data builder for the event data.
 * @property {ObjectBuilder<T>} [objectBuilder] - Custom object builder for the event.
 */
export type EventBuilderOptions<T extends Event = Event> = {
  type?: T['type'];
  headers?: Partial<EventHeadersBuildOpts<T>>;
  copyKeys?: Array<keyof T['data']>;
  defaults?: Partial<BuilderOptions<T['data']>>;
  dataBuilder?: ObjectBuilder<T['data']>;
  objectBuilder?: ObjectBuilder<T>;
};

/**
 * A builder for creating events.
 *
 * @template T The type of event to build.
 */
export class EventBuilder<T extends Event = Event> {
  #dataBuilder: ObjectBuilder<T['data']>;
  #objectBuilder: ObjectBuilder<T>;

  /**
   * Creates a new EventBuilder.
   *
   * @param {EventBuilderOptions<T>} [opts] - Options for the event builder.
   */
  constructor(opts: EventBuilderOptions<T> = {}) {
    const dataBuilder =
      opts.dataBuilder ??
      new ObjectBuilder<T['data']>({
        defaults: opts.defaults,
        copyKeys: opts.copyKeys,
      });
    this.#objectBuilder =
      opts.objectBuilder ??
      new ObjectBuilder<T>({
        defaults: {
          id: () => randomUUID(),
          type: opts.type ?? 'Event',
          data: dataBuilder.creator,
          ...(opts.headers ?? {}),
        },
      });
    this.#dataBuilder = dataBuilder;
  }

  /**
   * Clones an existing event with a new id. The parentId will be set to the
   * parentId of the original event or the original event's id if the parentId
   * is not set.
   */
  static async clone<T extends Event = Event>(event: T): Promise<T> {
    return await EventBuilder.from(event).create();
  }

  /**
   * Creates a new EventBuilder from an existing event. The new builder will
   * be set to create an event of the same type as the original event. The
   * parentId will be set to the parentId of the original event or the original
   * event's id if the parentId is not set. All data attributes and headers
   * will be copied from the original event.
   *
   * @param event The event to create the builder from.
   * @returns A new EventBuilder with the data from the provided event
   */
  static from<T extends Event = Event>(event: T): EventBuilder<T> {
    const headers = _.omit(event, 'id', 'data', 'type') as Partial<
      EventHeadersBuildOpts<T>
    >;
    headers.parentId ??= event.id;

    return new EventBuilder<T>({
      defaults: _.cloneDeep(event.data) as T['data'],
      headers,
      type: event.type,
    });
  }

  /**
   * Creates a new EventBuilder with the provided options. This is a static
   * version of the with() method.
   *
   * @param opts The options to use when creating the event.
   * @returns A new EventBuilder with the provided options.
   */
  static with<T extends Event = Event>(
    opts: EventBuilderOptions<T>,
  ): EventBuilder<T> {
    return new EventBuilder<T>(opts);
  }

  /**
   * Creates a new Event with the provided options. This is a static version
   * of the create() method. It can only be used to create events of type
   * 'Event'.
   *
   * @returns {Event} An empty event with only the id set.
   */
  static async create(createOps: EventDataBuildOpts = {}): Promise<Event> {
    return await new EventBuilder().create(createOps);
  }

  /**
   * Creates a new EventBuilder with the provided options merged with the
   * current options.
   *
   * @param opts The options to merge with the current options.
   * @returns A new EventBuilder with the merged options.
   */
  with(defaults: Partial<EventDataBuildOpts<T>>): EventBuilder<T> {
    const dataBuilder = this.#dataBuilder.with(defaults);
    return new EventBuilder<T>({
      dataBuilder,
      objectBuilder: this.#objectBuilder.with({
        data: dataBuilder.creator,
      }),
    });
  }

  withHeaders(headers: Partial<EventHeadersBuildOpts<T>>): EventBuilder<T> {
    return new EventBuilder<T>({
      dataBuilder: this.#dataBuilder,
      objectBuilder: this.#objectBuilder.with(
        headers as Partial<BuilderOptions<T>>,
      ),
    });
  }

  /**
   * Creates a new EventBuilder with the data from the provided event
   * merged with the current options. Will copy the parentId or event id to
   * the newly created event. Will also copy any data that is in the
   * copyableData array of the builder.
   *
   * @param event The event to copy data from.
   * @returns A new EventBuilder with the merged data.
   */
  from(event: Event): EventBuilder<T> {
    const headers = this.#headersFromEvent(event);
    const dataBuilder = this.#dataBuilder.from(event.data);
    return new EventBuilder<T>({
      dataBuilder,
      objectBuilder: this.#objectBuilder.with({
        ...headers,
        data: dataBuilder.creator,
      }),
    });
  }

  #headersFromEvent(event: Event): EventHeadersBuildOpts<T> {
    const result = _.omit(
      event,
      'id',
      'data',
      'type',
    ) as EventHeadersBuildOpts<T>;

    result.parentId ??= event.id;

    return result as EventHeadersBuildOpts<T>;
  }

  /**
   * Create an event using the data included within the builder
   * and allowing additional attributes to be provided to override
   * the builder's data. Only event data attributes can be overridden.
   *
   * @param createOpts The data to use when creating the event.
   * @returns The created event.
   */
  async create(createOpts: EventDataBuildOpts<T> = {}): Promise<T> {
    return await this.#objectBuilder.create({ data: createOpts });
  }
}
