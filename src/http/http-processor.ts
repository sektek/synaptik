import { Event, EventProcessor } from '../types/index.js';
import {
  EventDeserializerComponent,
  EventDeserializerFn,
  HttpEventService,
} from './types/index.js';
import {
  HttpEventServiceOptions,
  SimpleHttpEventService,
} from './simple-http-event-service.js';
import { getComponent } from '@sektek/utility-belt';

export type HttpProcessorOptions<
  T extends Event,
  R extends Event,
> = HttpEventServiceOptions<T> & {
  deserializer?: EventDeserializerComponent<R>;
};

export class HttpProcessor<T extends Event = Event, R extends Event = T>
  extends SimpleHttpEventService<T>
  implements EventProcessor<T, R>, HttpEventService<T>
{
  #deserializer: EventDeserializerFn<R>;

  constructor(opts: HttpProcessorOptions<T, R>) {
    super(opts);

    this.#deserializer = getComponent(
      opts.deserializer,
      'deserialize',
      async (response: Response) => await response.json(),
    );
  }

  async process(event: T): Promise<R> {
    this.emit('event:received', event);

    const response = await this.perform(event);

    const result = await this.#deserializer(response);
    this.emit('event:processed', result);

    return result;
  }
}
