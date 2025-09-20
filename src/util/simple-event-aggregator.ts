import { Collection, Store } from '@sektek/utility-belt';

import { Event, EventAggregator } from '../types/index.js';

export type SimpleEventAggregatorOptions<T extends Event = Event> = {
  store: Store<T, T>;
};

export class SimpleEventAggregator<T extends Event = Event, R extends Event = T>
  implements EventAggregator<T, R>
{
  #storeMutator:

  constructor(opts: SimpleEventAggregatorOptions<T>) {
    this.#store = opts.store;
  }

  async aggregate(event: T): Promise<void> {
    
  }
}
