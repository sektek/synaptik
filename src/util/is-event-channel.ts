import { Event } from '../types/event.js';
import { EventChannel } from '../types/event-channel.js';
import { isPrimitive } from './is-primitive.js';

export const isEventChannel = <T extends Event = Event>(
  obj: unknown,
): obj is EventChannel<T> =>
  !!obj &&
  !isPrimitive(obj) &&
  (obj as EventChannel<T>).send instanceof Function;
