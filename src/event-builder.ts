import { BuilderOptions, builderRender } from '@sektek/utility-belt';
import _ from 'lodash';

import { Event } from './types/index.js';

const randomUUID = globalThis.crypto.randomUUID.bind(globalThis.crypto);

type EventHeadersBuildOpts<T extends Event = Event> = BuilderOptions<
  Omit<T, 'data' | 'type'>
>;

type EventDataBuildOpts<T extends Event = Event> = BuilderOptions<T['data']>;

export type EventBuilderOptions<T extends Event = Event> = {
  data?: EventDataBuildOpts<T>;
  copyableData?: string[];
  headers?: EventHeadersBuildOpts<T>;
  type?: string;
};

/**
 * A builder for creating events.
 *
 * @template T The type of event to build.
 */
export class EventBuilder<T extends Event = Event> {
  #data: EventDataBuildOpts<T>;
  #headers: EventHeadersBuildOpts<T>;
  #type: T['type'];
  #copyableData: string[];

  /**
   * Creates a new EventBuilder with the provided options.
   *
   * @param opts The options to use when creating the event.
   * @param opts.copyableData The data attributes to copy from an existing
   *                          event when calling the from() method.
   * @param opts.data The data attributes to use when creating an event.
   *                  Will accept both a value or a function that returns
   *                  a value.
   * @param opts.headers The headers to use when creating an event. As with
   *                     the data attribute, will accept both a value or a
   *                     function that returns a value. The id header will
   *                     default to a random UUID.
   * @param opts.type The type of event to create. Will default to 'Event'.
   */
  constructor(opts: EventBuilderOptions<T> = {}) {
    this.#data = opts.data ?? {};
    this.#type = (opts.type ?? 'Event') as T['type'];
    this.#headers = {
      id: randomUUID,
      ...(opts.headers ?? {}),
    } as EventHeadersBuildOpts<T>;
    this.#copyableData = opts.copyableData ?? [];
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
    const headers = _.omit(event, 'data', 'type') as EventHeadersBuildOpts<T>;
    headers.parentId ??= event.id;
    headers.id = randomUUID;

    return new EventBuilder<T>({
      data: _.cloneDeep(event.data) as EventDataBuildOpts<T>,
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
    return await new EventBuilder({ data: createOps }).create();
  }

  /**
   * Creates a new EventBuilder with the provided options merged with the
   * current options.
   *
   * @param opts The options to merge with the current options.
   * @returns A new EventBuilder with the merged options.
   */
  with(opts: EventBuilderOptions<T>): EventBuilder<T> {
    return new EventBuilder<T>(_.merge(this.eventBuilderOptions, opts));
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
    return new EventBuilder<T>(
      _.merge(this.eventBuilderOptions, this.#optionsFromEvent(event)),
    );
  }

  #optionsFromEvent(event: Event): EventBuilderOptions<T> {
    return {
      data: this.#dataFromEvent(event),
      headers: this.#headersFromEvent(event),
    };
  }

  #dataFromEvent(event: Event): EventDataBuildOpts<T> {
    return _.cloneDeep(
      _.pick(event.data, this.#copyableData),
    ) as EventDataBuildOpts<T>;
  }

  #headersFromEvent(event: Event): EventHeadersBuildOpts<T> {
    const result = _.omit(event, 'data', 'type') as EventHeadersBuildOpts<T>;

    if (!this.#headers.parentId) {
      result.parentId ??= event.id;
    }

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
    const result: Record<string, unknown> = {
      ...(await builderRender(this.#headers)),
      type: this.#type,
      data: (await builderRender(
        _.merge({}, this.#data, createOpts),
      )) satisfies T['data'],
    };

    return result as T;
  }

  private get eventBuilderOptions(): EventBuilderOptions<T> {
    return {
      copyableData: this.#copyableData,
      data: this.#data,
      headers: this.#headers,
      type: this.#type,
    };
  }
}
