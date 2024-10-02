import { Event } from '../types/event.js';
import { EventHandler } from '../types/event-handler.js';
import { isPrimitive } from './is-primitive.js';

export const isEventHandler = <T extends Event = Event>(
  obj: unknown,
): obj is EventHandler<T> =>
  !!obj &&
  !isPrimitive(obj) &&
  (obj as EventHandler<T>).handle instanceof Function;
