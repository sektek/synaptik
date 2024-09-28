import { Event } from '../types/event.js';
import { EventChannel } from '../types/event-channel.js';
import { isPrimitive } from './is-primitive.js';

export const isEventChannel = (obj: unknown): obj is EventChannel<Event> =>
  !!obj &&
  !isPrimitive(obj) &&
  (obj as EventChannel<Event>).send instanceof Function;
