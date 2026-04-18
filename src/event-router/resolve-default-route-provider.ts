import { Provider, ProviderFn, getComponent } from '@sektek/utility-belt';

import { Route, RouteFn } from './types/index.js';
import { Event } from '../types/index.js';
import { NullChannel } from '../channels/null-channel.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';

type DefaultRouteProviderOpts<E extends Event = Event> = {
  defaultRoute?: Route<E>;
  defaultRouteProvider?: Provider<RouteFn<E>> | ProviderFn<RouteFn<E>>;
};

/**
 * Resolves a default route provider function from the given options. Falls back
 * to {@link NullChannel.send} when neither `defaultRouteProvider` nor
 * `defaultRoute` is supplied.
 *
 * @template E - The event type.
 * @param opts - Options containing an optional `defaultRoute` or
 *   `defaultRouteProvider`.
 * @returns A provider function that returns the default {@link RouteFn}.
 */
export function resolveDefaultRouteProvider<E extends Event = Event>(
  opts: DefaultRouteProviderOpts<E>,
): ProviderFn<RouteFn<E>> {
  if (opts.defaultRouteProvider) {
    return getComponent(opts.defaultRouteProvider, 'get');
  } else if (opts.defaultRoute) {
    const fn = getEventHandlerComponent(opts.defaultRoute);
    return () => fn;
  } else {
    return () => NullChannel.send;
  }
}
