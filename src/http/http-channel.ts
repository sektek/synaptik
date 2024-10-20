import { Event, EventChannel } from '../types/index.js';
import { HttpEventService } from './types/http-event-service.js';
import { SimpleHttpEventService } from './simple-http-event-service.js';

export class HttpChannel<T extends Event = Event>
  extends SimpleHttpEventService<T>
  implements EventChannel<T>, HttpEventService<T>
{
  async send(event: T): Promise<void> {
    this.emit('event:received', event);

    await this.perform(event);

    this.emit('event:delivered', event);
  }
}
