import {
  Event,
  EventHandlerComponent,
  EventHandlerFn,
} from '../../types/index.js';
import {
  FilterChannel,
  FilterChannelOptions,
} from '../../channels/filter-channel.js';
import { getEventHandlerComponent } from '../../util/get-event-handler-component.js';

import { ChannelBuilder, ChannelBuilderCreateOptions } from '../types/index.js';

export type FilterChannelBuilderOptions<T extends Event = Event> = Omit<
  FilterChannelOptions<T>,
  'handler' | keyof ChannelBuilderCreateOptions
>;

/**
 * A {@link ChannelBuilder} that creates a {@link FilterChannel}.
 *
 * Step-level options (set at construction time) are overridden by flow-level
 * options (passed to `create()`).
 */
export class FilterChannelBuilder<
  T extends Event = Event,
> implements ChannelBuilder<T> {
  #opts: FilterChannelBuilderOptions<T>;

  constructor(opts: FilterChannelBuilderOptions<T>) {
    this.#opts = opts;
  }

  /**
   * Builds a {@link FilterChannel} that guards the given downstream handler.
   *
   * @param handler - The downstream handler that receives events passing the filter.
   * @param opts - Flow-level options that override step-level options.
   * @returns A bound `send` function for the constructed channel.
   */
  create(
    handler: EventHandlerComponent<T>,
    opts?: ChannelBuilderCreateOptions,
  ): EventHandlerFn<T> {
    const channel = new FilterChannel<T>({
      ...this.#opts,
      ...opts,
      handler,
    });

    return getEventHandlerComponent(channel);
  }
}
