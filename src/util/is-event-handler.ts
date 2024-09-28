import { Event } from '../types/event.js';
import { EventHandler } from '../types/event-handler.js';
import { isPrimitive } from './is-primitive.js';

export const isEventHandler = (obj: unknown): obj is EventHandler<Event> =>
  !!obj &&
  !isPrimitive(obj) &&
  (obj as EventHandler<Event>).handle instanceof Function;
