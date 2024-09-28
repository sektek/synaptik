import { Event } from './types/event.js';
import { EventEmitter } from 'stream';
import { EventHandler } from './types/event-handler.js';

/**
 * An EventHandler function that does nothing.
 */
export const NullHandlerFn = () => Promise<void>;

/**
 * An EventHandler class that does nothing but emit events.
 *
 * @template T The type of event to do nothing with.
 */
export class NullHandler<T extends Event = Event>
  extends EventEmitter
  implements EventHandler<T>
{
  static handle(): Promise<void> {
    return Promise.resolve();
  }

  handle(event: T): Promise<void> {
    this.emit('event:received', event);
    this.emit('event:processed', event, undefined);
    return Promise.resolve();
  }
}
