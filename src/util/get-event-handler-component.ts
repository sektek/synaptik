import { GetComponentOptions, getComponent } from '@sektek/utility-belt';

import {
  Event,
  EventChannelComponent,
  EventHandlerComponent,
  EventHandlerFn,
  EventHandlerReturnType,
  EventProcessorComponent,
} from '../types/index.js';

/**
 * Type representing a component that can handle events.
 * It can be an EventProcessorComponent, EventChannelComponent, or EventHandlerComponent.
 * @param T - The type of the event.
 * @param R - The return type of the event handler.
 * @returns A type that can be an EventProcessorComponent, EventChannelComponent, or EventHandlerComponent.
 */
export type EventEndpointComponent<
  T extends Event = Event,
  R extends EventHandlerReturnType = unknown,
> =
  | (R extends Event ? EventProcessorComponent<T, R> : never)
  | (R extends void | unknown
      ? EventChannelComponent<T> | EventHandlerComponent<T>
      : never);

export type GetEventHandlerComponentOptions<
  T extends Event = Event,
  R extends EventHandlerReturnType = unknown,
> = GetComponentOptions<EventEndpointComponent<T, R>>;

export const getEventHandlerComponent = <
  T extends Event = Event,
  R extends EventHandlerReturnType = unknown,
>(
  obj: unknown | null | undefined,
  opts: GetEventHandlerComponentOptions<T, R> = {},
  // defaultHandler?: DefaultHandlerType<T, R>,
): EventHandlerFn<T, R> => {
  return getComponent(
    obj,
    ['send', 'process', 'handle'],
    opts,
  ) as EventHandlerFn<T, R>;
};
