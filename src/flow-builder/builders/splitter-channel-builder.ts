import {
  Event,
  EventEndpointComponent,
  EventHandlerFn,
} from '../../types/index.js';
import {
  SplitterChannel,
  SplitterChannelOptions,
} from '../../channels/splitter-channel.js';
import { getEventHandlerComponent } from '../../util/get-event-handler-component.js';

import { ChannelBuilder, ChannelBuilderCreateOptions } from '../types/index.js';

export type SplitterChannelBuilderOptions<
  T extends Event = Event,
  R extends Event = T,
> = Omit<
  SplitterChannelOptions<T, R>,
  'handler' | keyof ChannelBuilderCreateOptions
> &
  ChannelBuilderCreateOptions;

/**
 * A {@link ChannelBuilder} that creates a {@link SplitterChannel}.
 *
 * Step-level options (set at construction time) are overridden by flow-level
 * options (passed to `create()`).
 */
export class SplitterChannelBuilder<
  T extends Event = Event,
  R extends Event = T,
> implements ChannelBuilder<T, SplitterChannelBuilderOptions<T, R>> {
  #opts: SplitterChannelBuilderOptions<T, R>;

  constructor(opts: SplitterChannelBuilderOptions<T, R>) {
    this.#opts = opts;
  }

  /**
   * Builds a {@link SplitterChannel} wrapping the given downstream handler.
   *
   * @param handler - The downstream handler that receives each split `R` event.
   * @param opts - Options that override step-level options.
   * @returns A bound `send` function for the constructed channel.
   */
  create(
    handler: EventEndpointComponent<R>,
    opts?: SplitterChannelBuilderOptions<T, R>,
  ): EventHandlerFn<T> {
    const channel = new SplitterChannel<T, R>({
      ...this.#opts,
      ...opts,
      handler,
    });

    return getEventHandlerComponent(channel);
  }
}
