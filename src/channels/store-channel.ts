import {
  ProviderComponent,
  ProviderFn,
  Store,
  getComponent,
} from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import { Event, EventChannel } from '../types/index.js';

const DEFAULT_KEY_PROVIDER = <T extends Event, K = string>(event: T): K =>
  event.id as unknown as K;

/**
 * Options for the StoreChannel.
 *
 * @template T The type of event to send.
 * @template K The type of key to use for storing the event.
 */
export type StoreChannelOptions<
  T extends Event = Event,
  K = string,
> = EventServiceOptions & {
  /** The store to use for storing events. */
  store: Store<T, K>;
  /**
   * A provider component that generates a key for storing the event.
   * If not provided, a default key provider will be used that uses the
   * event 'id' property as the key. This assumes that K is a string.
   * If your events do not have an 'id' property or you want to use a
   * different key type, you should provide your own key provider.
   */
  keyProvider?: ProviderComponent<K, T>;
};

/**
 * A channel that stores events in a Store.
 * Useful for persisting events or for testing purposes.
 *
 * @template T The type of event to send.
 * @template K The type of key to use for storing the event.
 */
export class StoreChannel<T extends Event = Event, K = string>
  extends AbstractEventService
  implements EventChannel<T>
{
  #store: Store<T, K>;
  #keyProvider: ProviderFn<K, T>;

  constructor(opts: StoreChannelOptions<T, K>) {
    super();
    this.#store = opts.store;
    this.#keyProvider = getComponent(opts.keyProvider, 'get', {
      default: DEFAULT_KEY_PROVIDER,
    });
  }

  async send(event: T): Promise<void> {
    this.emit('event:received', event);
    try {
      const key = await this.#keyProvider(event);
      await this.#store.set(key, event);
    } catch (error) {
      this.emit('event:error', event, error);
      throw error;
    }
    this.emit('event:delivered', event);
  }
}
