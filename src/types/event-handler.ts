import { Event } from './event.js';
import { isPrimitive } from '../util/is-primitive.js';

export type EventHandlerReturnType = Event | unknown | void;

/**
 * An event handler function is the base function for performing an action in
 * response to an event. When used as a handler, it should be considered an endpoint
 * and the returned value should be ignored. This allows a channel or a processor to
 * be used as a handler.
 */
export type EventHandlerFn<
  T extends Event,
  R extends EventHandlerReturnType,
> = (event: T) => Promise<R>;

export interface EventHandlerEvents<
  T extends Event,
  R extends EventHandlerReturnType,
> {
  'event:received': (event: T) => void;
  'event:processed': (event: T, result: R) => void;
}

/**
 * An event handler represent an endpoint that performs an action in response
 * to an event.
 *
 * @typeParam T - The type of event that the handler can process.
 */
export interface EventHandler<T extends Event> {
  /**
   * Handle an event.
   * @param event - The event to handle.
   * @returns A promise that resolves when the event has been handled.
   */
  handle: EventHandlerFn<T, unknown>;
  on<E extends keyof EventHandlerEvents<T, unknown>>(
    event: E,
    listener: EventHandlerEvents<T, unknown>[E],
  ): this;
  emit<E extends keyof EventHandlerEvents<T, unknown>>(
    event: E,
    ...args: Parameters<EventHandlerEvents<T, unknown>[E]>
  ): boolean;
}

export const isEventHandler = (obj: unknown): obj is EventHandler<Event> =>
  !!obj &&
  !isPrimitive(obj) &&
  (obj as EventHandler<Event>).handle instanceof Function;
