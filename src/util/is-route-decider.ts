import { Event, RouteDecider } from '../types/index.js';
import { isPrimitive } from './is-primitive.js';

export const isRouteDecider = <T extends Event = Event>(
  obj: unknown,
): obj is RouteDecider<T> => {
  return (
    !!obj &&
    !isPrimitive(obj) &&
    (obj as RouteDecider<T>).get instanceof Function
  );
};
