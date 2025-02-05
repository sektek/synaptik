import { getComponent } from '@sektek/utility-belt';

import {
  Event,
  EventChannel,
  EventHandler,
  EventHandlerFn,
  EventHandlerReturnType,
  EventProcessor,
} from '../types/index.js';

type DefaultHandlerType<
  T extends Event = Event,
  R extends EventHandlerReturnType = unknown,
> =
  | EventHandlerFn<T, R>
  | (R extends Event ? EventProcessor<T, R> : never)
  | (R extends void | unknown ? EventHandler<T> | EventChannel<T> : never);

export const getEventHandlerComponent = <
  T extends Event = Event,
  R extends EventHandlerReturnType = unknown,
>(
  obj: unknown | null | undefined,
  defaultHandler?: DefaultHandlerType<T, R>,
): EventHandlerFn<T, R> => {
  return getComponent(
    obj,
    ['send', 'process', 'handle'],
    defaultHandler,
  ) as EventHandlerFn<T, R>;
};
