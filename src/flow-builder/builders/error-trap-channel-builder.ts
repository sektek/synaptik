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

import { ChannelBuilder, ChannelBuilderCreateOptions } from '../types.js';

export type ErrorTrapChannelBuilderOptions<T extends Event = Event> = Omit<
  ErrorTrapChannelOptions<T>,
  'handler'
>;

export class ErrorTrapChannelBuilder<
  T extends Event = Event,
> implements ChannelBuilder<T> {
  #opts: ErrorTrapChannelBuilderOptions<T>;

  constructor(opts: ErrorTrapChannelBuilderOptions<T>) {
    this.#opts = opts;
  }

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
