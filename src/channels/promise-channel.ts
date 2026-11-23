import { EventEmittingService, isError } from '@sektek/utility-belt';

import {
  AbstractEventComponent,
  EventComponentOptions,
} from '../abstract-event-component.js';
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

/** Options for a one-shot channel that exposes its received event as a promise. */
export type PromiseChannelOptions = EventComponentOptions & {
  /** Milliseconds before a pending `get()` rejects; zero disables the timeout. */
  timeout?: number;
};

const DEFAULT_TIMEOUT = 0;

/**
 * A one-shot event channel that exposes its first received event through a promise.
 *
 * Call `get()` to await the event, and `send()` to fulfill it. Sending an Error
 * rejects the promise instead. After fulfillment or rejection, subsequent
 * sends fail. A positive timeout applies when `get()` is called; it rejects
 * the promise if the channel remains pending.
 *
 * @template T The type of event to send.
 */
export class PromiseChannel<T extends Event = Event>
  extends AbstractEventComponent
  implements EventChannel<T>, EventEmittingService<PromiseChannelEvents<T>>
{
  #timeout: number;
  #promise: Promise<T>;
  #state: PromiseState = 'pending';
  #resolve?: (value: T | PromiseLike<T>) => void;
  #reject?: (reason?: unknown) => void;

  /** @param opts - Optional timeout and base component configuration. */
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
        if (isError(reason)) {
          this.emit(EVENT_ERROR, reason);
        } else {
          this.emit(EVENT_ERROR, new Error('Promise rejected'));
        }
        reject(reason);
      };
    });
  }

  /**
   * Returns the channel's shared promise, scheduling a timeout if configured.
   * Repeated calls return the same outcome; each call while pending can
   * schedule another timeout check.
   *
   * @returns The first event sent to the channel.
   * @throws If an Error is sent or the configured timeout expires.
   */
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
   * The promise will resolve with the event, or reject if an `Error` is
   * sent instead.
   *
   * @param event - The event, or an `Error` to reject the promise with.
   * Only the first send can settle the promise. A later send rejects with
   * `Promise already resolved`.
   *
   * @throws If the channel has already been fulfilled or rejected.
   */
  async send(event: T | Error) {
    const eventIsError = isError(event);
    if (!eventIsError) {
      this.emit(EVENT_RECEIVED, event);
    }

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

    if (eventIsError) {
      this.#reject?.(event);
      return;
    }

    this.#resolve(event);
    this.emit(EVENT_DELIVERED, event);
  }

  /** Current settlement state of the channel's promise. */
  get state(): PromiseState {
    return this.#state;
  }

  /**
   * Sets the reported state while pending and emits `channel:stateChange`.
   * This does not itself fulfill or reject the underlying promise.
   *
   * @throws If the channel is no longer pending.
   */
  set state(state: PromiseState) {
    if (this.#state !== 'pending') {
      throw new Error('Promise already resolved');
    }
    this.emit('channel:stateChange', state);

    this.#state = state;
  }
}
