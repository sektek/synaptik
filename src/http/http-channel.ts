import { Event, EventChannel } from '../types/index.js';
import { HttpEventService } from './types/http-event-service.js';
import { SimpleHttpEventService } from './simple-http-event-service.js';

export class HttpChannel<T extends Event = Event>
  extends SimpleHttpEventService<T>
  implements EventChannel<T>, HttpEventService<T>
{
  async send(event: T): Promise<void> {
    this.emit('event:received', event);

    try {
      await this.perform(event);

      this.emit('event:delivered', event);
    } catch (error) {
      this.emit('event:error', event, error);
      throw error;
    }
  }
}
