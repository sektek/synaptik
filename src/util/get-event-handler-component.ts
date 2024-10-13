import { getComponent } from '@sektek/utility-belt';

import { Event, EventHandler, EventHandlerFn } from '../types/index.js';

export const getEventHandlerComponent = <T extends Event = Event>(
  obj: unknown | null | undefined,
  defaultHandler?: EventHandler<T> | EventHandlerFn<T>,
): EventHandlerFn<T> => {
  return getComponent(
    obj,
    ['send', 'process', 'handle'],
    defaultHandler,
  ) as EventHandlerFn<T>;
};
