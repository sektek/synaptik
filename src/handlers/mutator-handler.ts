import {
  MutatorComponent,
  MutatorFn,
  ProviderComponent,
  ProviderFn,
  getComponent,
} from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';

import {
  EVENT_ERROR,
  EVENT_PROCESSED,
  EVENT_RECEIVED,
  EventHandler,
} from '../types/event-handler.js';
import { Event } from '../types/event.js';

/**
 * Options for the MutatorHandler constructor.
 */
export type MutatorHandlerOptions<
  T extends Event = Event,
  K = string,
  V = T,
> = EventServiceOptions & {
  /** The mutator component used to set values. */
  mutator: MutatorComponent<V, K>;
  /**
   * The provider component used to extract keys from events.
   * If not provided, defaults to a provider that returns the event's id as the key.
   */
  keyExtractor?: ProviderComponent<K, T>;
  /**
   * The provider component used to extract values from events.
   * If not provided, defaults to a provider that returns the event itself as the value.
   */
  valueExtractor?: ProviderComponent<V, T>;
};

/**
 * MutatorHandler is an EventHandler that uses a Mutator to set values based on
 * extracted keys and values from incoming events. Usually used to update state or
 * save data to a store.
 *
 * @template T - The type of the Event being processed.
 * @template K - The type of the key used by the Mutator.
 * @template V - The type of the value being set by the Mutator.
 */
export class MutatorHandler<T extends Event = Event, K = string, V = T>
  extends AbstractEventService
  implements EventHandler<T>
{
  #mutator: MutatorFn<V, K>;
  #keyExtractor: ProviderFn<K, T>;
  #valueExtractor: ProviderFn<V, T>;

  constructor(opts: MutatorHandlerOptions<T, K, V>) {
    super(opts);

    this.#mutator = getComponent(opts.mutator, 'set');
    this.#keyExtractor = getComponent(opts.keyExtractor, 'provide', {
      default: (event: T) => event.id as unknown as K,
    });
    this.#valueExtractor = getComponent(opts.valueExtractor, 'provide', {
      default: (event: T) => event as unknown as V,
    });
  }

  async handle(event: T): Promise<void> {
    this.emit(EVENT_RECEIVED, event);
    try {
      const key = await this.#keyExtractor(event);
      const value = await this.#valueExtractor(event);
      await this.#mutator(key, value);
      this.emit(EVENT_PROCESSED, event);
    } catch (error) {
      this.emit(EVENT_ERROR, error, event);
      throw error;
    }
  }
}
