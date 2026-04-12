import {
  Event,
  EventEndpointComponent,
  EventHandlerFn,
} from '../../types/index.js';
import {
  ProcessingChannel,
  ProcessingChannelOptions,
} from '../../channels/processing-channel.js';
import { getEventHandlerComponent } from '../../util/get-event-handler-component.js';

import { ChannelBuilder, ChannelBuilderCreateOptions } from '../types/index.js';

export type ProcessingChannelBuilderOptions<
  T extends Event = Event,
  R extends Event = T,
> = Omit<
  ProcessingChannelOptions<T, R>,
  'handler' | keyof ChannelBuilderCreateOptions
> &
  ChannelBuilderCreateOptions;

/**
 * A {@link ChannelBuilder} that creates a {@link ProcessingChannel}.
 *
 * Step-level options (set at construction time) are overridden by flow-level
 * options (passed to `create()`).
 */
export class ProcessingChannelBuilder<
  T extends Event = Event,
  R extends Event = T,
> implements ChannelBuilder<T, ProcessingChannelBuilderOptions<T, R>> {
  #opts: ProcessingChannelBuilderOptions<T, R>;

  constructor(opts: ProcessingChannelBuilderOptions<T, R>) {
    this.#opts = opts;
  }

  /**
   * Builds a {@link ProcessingChannel} wrapping the given downstream handler.
   *
   * @param handler - The downstream handler that receives the transformed `R` events.
   * @param opts - Options that override step-level options.
   * @returns A bound `send` function for the constructed channel.
   */
  create(
    handler: EventEndpointComponent<R>,
    opts?: ProcessingChannelBuilderOptions<T, R>,
  ): EventHandlerFn<T> {
    const channel = new ProcessingChannel<T, R>({
      ...this.#opts,
      ...opts,
      handler,
    });

    return getEventHandlerComponent(channel);
  }
}
