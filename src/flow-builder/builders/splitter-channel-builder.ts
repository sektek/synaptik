import {
  Event,
  EventHandlerComponent,
  EventHandlerFn,
} from '../../types/index.js';
import {
  SplitterChannel,
  SplitterChannelOptions,
} from '../../channels/splitter-channel.js';
import { getEventHandlerComponent } from '../../util/get-event-handler-component.js';

import { ChannelBuilder, ChannelBuilderCreateOptions } from '../types.js';

export type SplitterChannelBuilderOptions<
  T extends Event = Event,
  R extends Event = T,
> = Omit<SplitterChannelOptions<T, R>, 'handler'>;

export class SplitterChannelBuilder<
  T extends Event = Event,
  R extends Event = T,
> implements ChannelBuilder<T> {
  #opts: SplitterChannelBuilderOptions<T, R>;

  constructor(opts: SplitterChannelBuilderOptions<T, R>) {
    this.#opts = opts;
  }

  create(
    handler: EventHandlerComponent<T>,
    opts?: ChannelBuilderCreateOptions,
  ): EventHandlerFn<T> {
    const channel = new SplitterChannel<T, R>({
      ...this.#opts,
      ...opts,
      handler: handler as unknown as EventHandlerComponent<R>,
    });

    return getEventHandlerComponent(channel);
  }
}
