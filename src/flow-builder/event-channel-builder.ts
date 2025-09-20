import { Provider } from '@sektek/utility-belt';

import { Event, EventChannel } from '../types/index.js';

type ChannelClass<T extends EventChannel> = new (...args: unknown[]) => T;
type ChannelOptions<T extends EventChannel> = ConstructorParameters<
  ChannelClass<T>
>[0];

export interface EventChannelBuilder<
  C extends EventChannel<T>,
  T extends Event = Event,
> extends Provider<C> {
  create(options: Partial<ChannelOptions<C>>): C;
}

export class AbstractEventChannelBuilder<
  C extends EventChannel<T>,
  T extends Event = Event,
> implements EventChannelBuilder<C, T>
{
  #channelClass: ChannelClass<C>;
  #options: Partial<ChannelOptions<C>>;

  constructor(
    channelClass: ChannelClass<C>,
    options: Partial<ChannelOptions<C>> = {},
  ) {
    this.#channelClass = channelClass;
    this.#options = options;
  }

  with(options: Partial<ChannelOptions<C>>): AbstractEventChannelBuilder<C, T> {
    return new AbstractEventChannelBuilder<C, T>(this.#channelClass, {
      ...this.#options,
      ...options,
    });
  }

  create(options: Partial<ChannelOptions<C>>): C {
    const Channel = this.#channelClass;
    const channelOptions = {
      ...options,
      ...this.#options,
    } as ChannelOptions<C>;

    return new Channel(channelOptions);
  }

  get(): C {
    return this.create(this.#options);
  }
}
