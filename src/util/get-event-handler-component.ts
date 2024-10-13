import { Event, EventHandler, EventHandlerFn } from '../types/index.js';
import { isEventChannel } from './is-event-channel.js';
import { isEventHandler } from './is-event-handler.js';
import { isEventProcessor } from './is-event-processor.js';

export const getEventHandlerComponent = <T extends Event = Event>(
  obj: unknown | null | undefined,
  defaultHandler?: EventHandler<T> | EventHandlerFn<T>,
): EventHandlerFn<T> => {
  if (isEventChannel<T>(obj)) {
    return obj.send.bind(obj);
  }

  if (isEventProcessor<T>(obj)) {
    return obj.process.bind(obj);
  }

  if (isEventHandler<T>(obj)) {
    return obj.handle.bind(obj);
  }

  if (typeof obj === 'function') {
    return obj as EventHandlerFn<T>;
  }

  if (defaultHandler) {
    return getEventHandlerComponent(defaultHandler);
  }

  throw new Error('Invalid event channel');
};
