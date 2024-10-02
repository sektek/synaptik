import { Event, RouteProvider } from '../types/index.js';
import { isPrimitive } from './is-primitive.js';

export const isRouteProvider = <T extends Event = Event>(
  obj: unknown,
): obj is RouteProvider<T> => {
  return (
    !!obj &&
    !isPrimitive(obj) &&
    (obj as RouteProvider<T>).get instanceof Function
  );
};
