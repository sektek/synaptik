import {
  Event,
  EventHandlerComponent,
  EventHandlerFn,
} from '../../types/index.js';
import { TapChannel, TapChannelOptions } from '../../channels/tap-channel.js';
import { getEventHandlerComponent } from '../../util/get-event-handler-component.js';

import { ChannelBuilder, ChannelBuilderCreateOptions } from '../types/index.js';

export type TapChannelBuilderOptions<T extends Event = Event> = Omit<
  TapChannelOptions<T>,
  'handler' | keyof ChannelBuilderCreateOptions
> &
  ChannelBuilderCreateOptions;

/**
 * A {@link ChannelBuilder} that creates a {@link TapChannel}.
 *
 * Step-level options (set at construction time) are overridden by flow-level
 * options (passed to `create()`).
 */
export class TapChannelBuilder<
  T extends Event = Event,
> implements ChannelBuilder<T> {
  #opts: TapChannelBuilderOptions<T>;

  constructor(opts: TapChannelBuilderOptions<T>) {
    this.#opts = opts;
  }

  /**
   * Builds a {@link TapChannel} that runs a side-effect before the given
   * downstream handler.
   *
   * @param handler - The downstream handler that receives the event after the tap.
   * @param opts - Flow-level options that override step-level options.
   * @returns A bound `send` function for the constructed channel.
   */
  create(
    handler: EventHandlerComponent<T>,
    opts?: ChannelBuilderCreateOptions,
  ): EventHandlerFn<T> {
    const channel = new TapChannel<T>({
      ...this.#opts,
      ...opts,
      handler,
    });

    return getEventHandlerComponent(channel);
  }
}
