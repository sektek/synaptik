import {
  Event,
  EventHandlerComponent,
  EventHandlerFn,
} from '../../types/index.js';
import { TapChannel, TapChannelOptions } from '../../channels/tap-channel.js';
import { getEventHandlerComponent } from '../../util/get-event-handler-component.js';

import { ChannelBuilder, ChannelBuilderCreateOptions } from '../types.js';

export type TapChannelBuilderOptions<T extends Event = Event> = Omit<
  TapChannelOptions<T>,
  'handler'
>;

export class TapChannelBuilder<
  T extends Event = Event,
> implements ChannelBuilder<T> {
  #opts: TapChannelBuilderOptions<T>;

  constructor(opts: TapChannelBuilderOptions<T>) {
    this.#opts = opts;
  }

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
