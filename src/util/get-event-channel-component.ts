import { Event, EventChannel, EventChannelFn } from '../types/index.js';
import { isEventChannel } from './is-event-channel.js';

export const getEventChannelComponent = <T extends Event = Event>(
  obj: unknown,
  defaultChannel?: EventChannel<T> | EventChannelFn<T>,
): EventChannelFn<T> => {
  if (isEventChannel<T>(obj)) {
    return obj.send.bind(obj);
  }

  if (typeof obj === 'function') {
    return obj as EventChannelFn<T>;
  }

  if (defaultChannel) {
    return getEventChannelComponent(defaultChannel);
  }

  throw new Error('Invalid event channel');
};
