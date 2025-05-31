import { Event, EventProcessor } from '../types/index.js';
import {
  HttpEventService,
  ResponseEventExtractorComponent,
  ResponseEventExtractorFn,
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
  eventExtractor?: ResponseEventExtractorComponent<R>;
};

export class HttpProcessor<T extends Event = Event, R extends Event = T>
  extends SimpleHttpEventService<T>
  implements EventProcessor<T, R>, HttpEventService<T>
{
  #eventExtractor: ResponseEventExtractorFn<R>;

  constructor(opts: HttpProcessorOptions<T, R>) {
    super(opts);

    this.#eventExtractor = getComponent(opts.eventExtractor, 'extract', {
      name: 'eventExtractor',
      default: (response: Response) => response.json() as Promise<R>,
    });
  }

  async process(event: T): Promise<R> {
    this.emit('event:received', event);

    try {
      const response = await this.perform(event);

      const result = await this.#eventExtractor(response);
      this.emit('event:processed', event, result);

      return result;
    } catch (error) {
      this.emit('event:error', event, error);
      throw error;
    }
  }
}
