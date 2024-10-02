import { Event } from '../types/event.js';
import { EventProcessor } from '../types/event-processor.js';
import { isPrimitive } from './is-primitive.js';

export const isEventProcessor = <
  T extends Event = Event,
  R extends Event = Event,
>(
  obj: unknown,
): obj is EventProcessor<T, R> =>
  !!obj &&
  !isPrimitive(obj) &&
  (obj as EventProcessor<T, R>).process instanceof Function;
