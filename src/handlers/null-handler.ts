import { EventEmitter } from 'events';

import { Event, EventHandler, EventService } from '../types/index.js';

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
  implements EventHandler<T>, EventService
{
  static handle(): Promise<void> {
    return Promise.resolve();
  }

  handle(event: T): Promise<void> {
    this.emit('event:received', event);
    return Promise.resolve();
  }

  get name(): string {
    return 'NullHandler';
  }
}
