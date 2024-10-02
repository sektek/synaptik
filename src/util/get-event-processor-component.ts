import { Event, EventProcessor, EventProcessorFn } from '../types/index.js';
import { isEventProcessor } from './is-event-processor.js';

/**
 *
 * @param {EventProcessor|Event} obj
 * @returns
 */
export const getEventProcessorComponent = <
  T extends Event = Event,
  R extends Event = Event,
>(
  obj: unknown,
  defaultProcessor?: EventProcessor<T, R> | EventProcessorFn<T, R>,
): EventProcessorFn<T, R> => {
  if (isEventProcessor<T, R>(obj)) {
    return obj.process.bind(obj);
  }

  if (typeof obj === 'function') {
    return obj as EventProcessorFn<T, R>;
  }

  if (defaultProcessor) {
    return getEventProcessorComponent(defaultProcessor);
  }

  throw new Error('Invalid event processor');
};
