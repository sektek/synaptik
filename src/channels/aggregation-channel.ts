import {
  Collection,
  ProviderFn,
  Store,
  getComponent,
} from '@sektek/utility-belt';

import {
  AggregateEvent,
  Event,
  EventHandlerFn,
  EventPredicateFn,
} from '../types/index.js';
import { AbstractEventService } from '../abstract-event-service.js';

interface Aggregator<T extends Event = Event, R extends Event = T> {
  aggregate(event: T): null | R;
}

export type AggregationChannelOptions<
  T extends Event = Event,
  R extends Event = AggregateEvent<T>,
> = {
  aggregator: Aggregator<T, R>;
};

export class AggregationChannel<
  T extends Event = Event,
  R extends Event = AggregateEvent<T>,
> extends AbstractEventService {
  #aggregateEventProvider: ProviderFn<R, T>;
  #store: Store<Collection<T>, T>;
  #handler: EventHandlerFn<R>;
  #releasePredicate: EventPredicateFn<T>;
  #timeoutHandler: EventHandlerFn<R>;
  #rejectionHandler: EventHandlerFn<T>;
  #timeout: number;

  constructor(opts: AggregationChannelOptions<T, R>) {
    super(opts);
    this.#aggregator = opts.aggregator;
  }

  async send(event: T) {
    if (this.#timeout > 0) {
      
    }
    await (await this.#store.get(event))?.add(event);
    if (await this.#releasePredicate(event)) {
      await this.#handler(await this.#aggregateEventProvider(event));
    } else {
      await this.#rejectionHandler(event);
    }
  }
}
