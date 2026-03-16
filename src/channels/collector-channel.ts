import { Collector } from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import { Event, EventChannel } from '../types/index.js';

/**
 * A channel that stores events in a Collector.
 * Useful for persisting events or for testing purposes.
 *
 * @template T The type of event to send.
 */
export type CollectorChannelOptions<T extends Event = Event> =
  EventServiceOptions & {
    /** The collector to use for storing events. */
    collector: Collector<T>;
  };

/**
 * A channel that stores events in a Collector.
 * Useful for persisting events or for testing purposes.
 *
 * @template T The type of event to send.
 */
export class CollectorChannel<T extends Event = Event>
  extends AbstractEventService
  implements EventChannel<T>
{
  #collector: Collector<T>;

  constructor(opts: CollectorChannelOptions<T>) {
    super(opts);
    this.#collector = opts.collector;
  }

  async send(event: T): Promise<void> {
    this.emit('event:received', event);
    try {
      await this.#collector.add(event);
    } catch (error) {
      this.emit('event:error', error, event);
      throw error;
    }
    this.emit('event:delivered', event);
  }
}
