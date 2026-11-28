import _ from 'lodash';

import { Event } from '../types/index.js';

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
