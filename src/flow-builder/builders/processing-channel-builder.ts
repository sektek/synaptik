import {
  Event,
  EventHandlerComponent,
  EventHandlerFn,
} from '../../types/index.js';
import {
  ProcessingChannel,
  ProcessingChannelOptions,
} from '../../channels/processing-channel.js';
import { getEventHandlerComponent } from '../../util/get-event-handler-component.js';

import { ChannelBuilder, ChannelBuilderCreateOptions } from '../types.js';

export type ProcessingChannelBuilderOptions<
  T extends Event = Event,
  R extends Event = T,
> = Omit<ProcessingChannelOptions<T, R>, 'handler'>;

export class ProcessingChannelBuilder<
  T extends Event = Event,
  R extends Event = T,
> implements ChannelBuilder<T> {
  #opts: ProcessingChannelBuilderOptions<T, R>;

  constructor(opts: ProcessingChannelBuilderOptions<T, R>) {
    this.#opts = opts;
  }

  create(
    handler: EventHandlerComponent<T>,
    opts?: ChannelBuilderCreateOptions,
  ): EventHandlerFn<T> {
    const channel = new ProcessingChannel<T, R>({
      ...this.#opts,
      ...opts,
      handler: handler as unknown as EventHandlerComponent<R>,
    });

    return getEventHandlerComponent(channel);
  }
}
