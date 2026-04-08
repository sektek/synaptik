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

import { ChannelBuilder, ChannelBuilderCreateOptions } from '../types.js';

export type FilterChannelBuilderOptions<T extends Event = Event> = Omit<
  FilterChannelOptions<T>,
  'handler'
>;

export class FilterChannelBuilder<
  T extends Event = Event,
> implements ChannelBuilder<T> {
  #opts: FilterChannelBuilderOptions<T>;

  constructor(opts: FilterChannelBuilderOptions<T>) {
    this.#opts = opts;
  }

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
