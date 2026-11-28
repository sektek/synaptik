import _ from 'lodash';

type EventData = Record<string, unknown>;

/**
 * Options for building event data.
 *
 * @template T The type of the event data, defaults to 'Event'
 */
export type EventHeaders = {
  id: string;
  parentId?: string;
  replyTo?: string[];
  type: string;
};

/**
 * Represents an event in the system.
 *
 * @template T The type of the event, defaults to 'Event'.
 * @template D The data associated with the event, defaults to an empty object.
 */
export type Event<T = EventData> = EventHeaders & {
  /** The data associated with the event. */
  data: T;
};

export const EmptyEvent: Event = {
  id: '',
  type: 'Event',
  data: {},
};

const isDataRecord = (value: unknown): value is Record<string, unknown> =>
  _.isObjectLike(value) && !Array.isArray(value);

/**
 * Checks whether a value has the shape of an {@link Event}: string `id` and
 * `type`, a non-array object `data`, an optional string `parentId`, and an
 * optional `replyTo` that is an array of strings. Extra properties are
 * allowed.
 *
 * Use it to validate untrusted input, such as a deserialized message body.
 *
 * @param value - The value to check.
 * @returns `true` if the value is an Event.
 */
export const isEvent = (value: unknown): value is Event =>
  isDataRecord(value) &&
  _.isString(value.id) &&
  _.isString(value.type) &&
  isDataRecord(value.data) &&
  (value.parentId === undefined || _.isString(value.parentId)) &&
  (value.replyTo === undefined ||
    (Array.isArray(value.replyTo) && value.replyTo.every(_.isString)));
