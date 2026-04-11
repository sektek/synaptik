import {
  ErrorTrapChannel,
  ErrorTrapChannelOptions,
} from '../../channels/error-trap-channel.js';
import {
  Event,
  EventHandlerComponent,
  EventHandlerFn,
} from '../../types/index.js';
import { getEventHandlerComponent } from '../../util/get-event-handler-component.js';

import { ChannelBuilder, ChannelBuilderCreateOptions } from '../types/index.js';

export type ErrorTrapChannelBuilderOptions<T extends Event = Event> = Omit<
  ErrorTrapChannelOptions<T>,
  'handler' | keyof ChannelBuilderCreateOptions
>;

/**
 * A {@link ChannelBuilder} that creates an {@link ErrorTrapChannel}.
 *
 * Step-level options (set at construction time) are overridden by flow-level
 * options (passed to `create()`).
 */
export class ErrorTrapChannelBuilder<
  T extends Event = Event,
> implements ChannelBuilder<T> {
  #opts: ErrorTrapChannelBuilderOptions<T>;

  constructor(opts: ErrorTrapChannelBuilderOptions<T>) {
    this.#opts = opts;
  }

  /**
   * Builds an {@link ErrorTrapChannel} that wraps the given downstream handler.
   *
   * @param handler - The downstream handler to protect with error trapping.
   * @param opts - Flow-level options that override step-level options.
   * @returns A bound `handle` function for the constructed channel.
   */
  create(
    handler: EventHandlerComponent<T>,
    opts?: ChannelBuilderCreateOptions,
  ): EventHandlerFn<T> {
    const channel = new ErrorTrapChannel<T>({
      ...this.#opts,
      ...opts,
      handler,
    });

    return getEventHandlerComponent(channel);
  }
}
