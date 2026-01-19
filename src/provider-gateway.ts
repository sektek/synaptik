import {
  ProviderComponent,
  ProviderFn,
  getComponent,
} from '@sektek/utility-belt';

import { Event } from './types/event.js';
import { EventHandler } from './types/event-handler.js';

import { EventBuilder } from './event-builder.js';

import {
  AbstractEventHandlingService,
  EventHandlingServiceOptions,
} from './abstract-event-handling-service.js';
import { AbstractEventService } from '../index.js';

export type ProviderGatewayOptions<
  T,
  E extends Event = Event,
> = EventHandlingServiceOptions<E> & {
  provider: ProviderComponent<T>;
  eventExtractor?: ProviderComponent<E, T>;
};

class DefaultEventExtractor<T, E extends Event = Event> {
  #eventBuilder: EventBuilder<E>;

  constructor() {
    this.#eventBuilder = new EventBuilder<E>();
  }

  async get(data: T): Promise<E> {
    if (data && typeof data === 'object') {
      return this.#eventBuilder.create(data);
    }
    return this.#eventBuilder.create({
      value: data,
    });
  }
}

export class ProviderGateway<
  T,
  E extends Event = Event,
> extends AbstractEventHandlingService<E> {
  #provider: ProviderFn<T>;
  #eventExtractor: ProviderFn<E, T>;

  constructor(opts: ProviderGatewayOptions<T, E>) {
    super(opts);

    this.#provider = getComponent(opts.provider, 'get');
    this.#eventExtractor = getComponent(opts.eventExtractor, 'get', {
      defaultProvider: () => new DefaultEventExtractor<T, E>(),
    });
  }

  start() {}

  async #execute(): Promise<void> {
    try {
      const data = await this.#provider();
      const event = await this.#eventExtractor(data);
      this.emit('event:received', event);
      await this.handler(event);
      this.emit('event:handled', event);
    } catch (error) {
      this.emit('event:error', error);
    }
  }
}
