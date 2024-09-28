import { Event } from './types/event.js';
import { EventChannel } from './types/event-channel.js';
import { EventEmitter } from 'events';

/**
 * An EventChannel class that does nothing but emit events.
 * If used statically. It will not emit events.
 *
 * @template T The type of event to send nowhere.
 */
export class NullChannel<T extends Event = Event>
  extends EventEmitter
  implements EventChannel<T>
{
  static send(): Promise<void> {
    return Promise.resolve();
  }

  send(event: T): Promise<void> {
    this.emit('event:received', event);
    return Promise.resolve();
  }
}
