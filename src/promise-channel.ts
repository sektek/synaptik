import { EventEmitter } from 'events';

import { Event, EventChannel } from './types/index.js';

/**
 * An EventChannel class that resolves a promise when an event is sent to it.
 * A PromiseChannel can only be sent to once.
 *
 * @template T The type of event to send.
 */
export class PromiseChannel<T extends Event = Event>
  extends EventEmitter
  implements EventChannel<T>
{
  private promise: Promise<T>;
  resolve?: (value: T | PromiseLike<T>) => void;
  reject?: (reason?: unknown) => void;

  constructor() {
    super();
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  get(): Promise<T> {
    return this.promise;
  }

  /**
   * Delivers an event to the promise created with the channel.
   * The promise will resolve with the event.
   *
   * @param value - The event to send.
   * @throws If the channel has not been initialized.
   */
  async send(value: T) {
    this.emit('event:received', value);
    if (!this.resolve) {
      throw new Error('Promise not initialized');
    }
    this.resolve(value);
    this.emit('event:delivered', value);
  }
}
