import { EventEmittingService } from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import {
  EVENT_DELIVERED,
  EVENT_ERROR,
  EVENT_RECEIVED,
  Event,
  EventChannel,
  EventChannelEvents,
} from '../types/index.js';

type PromiseState = 'pending' | 'fulfilled' | 'rejected';

type PromiseChannelEvents<T extends Event = Event> = EventChannelEvents<T> & {
  'channel:stateChange': (state: PromiseState) => void;
};

export type PromiseChannelOptions = EventServiceOptions & {
  timeout?: number;
};

const DEFAULT_TIMEOUT = 0;

/**
 * An EventChannel class that resolves a promise when an event is sent to it.
 * A PromiseChannel can only be sent to once.
 *
 * @template T The type of event to send.
 */
export class PromiseChannel<T extends Event = Event>
  extends AbstractEventService
  implements EventChannel<T>, EventEmittingService<PromiseChannelEvents<T>>
{
  #timeout: number;
  #promise: Promise<T>;
  #state: PromiseState = 'pending';
  #resolve?: (value: T | PromiseLike<T>) => void;
  #reject?: (reason?: unknown) => void;

  constructor(opts: PromiseChannelOptions = { timeout: DEFAULT_TIMEOUT }) {
    super(opts);
    this.#timeout = opts.timeout ?? DEFAULT_TIMEOUT;
    this.#promise = new Promise<T>((resolve, reject) => {
      this.#resolve = (value: T | PromiseLike<T>) => {
        this.#state = 'fulfilled';
        resolve(value);
      };
      this.#reject = (reason?: unknown) => {
        this.#state = 'rejected';
        if (reason instanceof Error) {
          this.emit(EVENT_ERROR, reason);
        } else {
          this.emit(EVENT_ERROR, new Error('Promise rejected'));
        }
        reject(reason);
      };
    });
  }

  async get(): Promise<T> {
    if (this.#timeout > 0) {
      setTimeout(() => {
        if (this.#state === 'pending') {
          this.#reject?.(new Error('Promise timed out'));
        }
      }, this.#timeout);
    }

    return this.#promise;
  }

  /**
   * Delivers an event to the promise created with the channel.
   * The promise will resolve with the event.
   *
   * @param event - The event to send.
   * @throws If the channel has not been initialized.
   */
  async send(event: T) {
    this.emit(EVENT_RECEIVED, event);

    if (this.#state !== 'pending') {
      const error = new Error('Promise already resolved');
      this.emit(EVENT_ERROR, error, event);
      throw error;
    }

    if (!this.#resolve) {
      const error = new Error('Promise not initialized');
      this.emit(EVENT_ERROR, error, event);
      throw error;
    }

    this.#resolve(event);
    this.emit(EVENT_DELIVERED, event);
  }

  get state(): PromiseState {
    return this.#state;
  }

  set state(state: PromiseState) {
    if (this.#state !== 'pending') {
      throw new Error('Promise already resolved');
    }
    this.emit('channel:stateChange', state);

    this.#state = state;
  }
}
