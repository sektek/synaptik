import { Event } from '../types/event.js';
import { EventProcessor } from '../types/event-processor.js';
import { isPrimitive } from './is-primitive.js';

export const isEventHandler = (
  obj: unknown,
): obj is EventProcessor<Event, Event> =>
  !!obj &&
  !isPrimitive(obj) &&
  (obj as EventProcessor<Event, Event>).process instanceof Function;
