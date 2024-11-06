import { getComponent } from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import {
  EventSerializerComponent,
  EventSerializerFn,
  HeadersProviderComponent,
  HeadersProviderFn,
  HttpEventService,
  UrlProviderComponent,
  UrlProviderFn,
} from './types/index.js';

import { CompositeHeadersProvider } from './composite-headers-provider.js';
import { Event } from '../types/index.js';
import { contentTypeHeadersProvider } from './content-type-headers-provider.js';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const METHOD_DEFAULT_BODY_SERIALIZER: Record<HttpMethod, EventSerializerFn> = {
  GET: () => undefined,
  POST: JSON.stringify,
  PUT: JSON.stringify,
  DELETE: () => undefined,
};

export type HttpEventServiceOptions<T extends Event = Event> =
  EventServiceOptions & {
    headersProvider?: HeadersProviderComponent<T>;
    urlProvider?: UrlProviderComponent<T>;
    eventSerializer?: EventSerializerComponent<T>;
    method?: HttpMethod;
    contentType?: string;
    url?: string;
  };

export class SimpleHttpEventService<T extends Event = Event>
  extends AbstractEventService
  implements HttpEventService
{
  #headersProvider: HeadersProviderFn<T>;
  #urlProvider: UrlProviderFn<T>;
  #eventSerializer: EventSerializerFn<T>;
  #method: HttpMethod;

  constructor(opts: HttpEventServiceOptions<T>) {
    super(opts);

    if (!opts.urlProvider && !opts.url) {
      throw new Error('Must provide either urlProvider or url');
    }
    this.#urlProvider = getComponent(opts.urlProvider, 'get', () => opts.url!);
    this.#eventSerializer = getComponent(
      opts.eventSerializer,
      'serialize',
      METHOD_DEFAULT_BODY_SERIALIZER[opts.method ?? 'POST'],
    );
    this.#method = opts.method ?? 'POST';
    const contentType = opts.contentType ?? 'application/json';
    if (opts.headersProvider && opts.contentType) {
      this.#headersProvider = getComponent(
        new CompositeHeadersProvider<T>({
          providers: [
            opts.headersProvider,
            contentTypeHeadersProvider(contentType),
          ],
        }) as HeadersProviderComponent<T>,
        'get',
      );
    } else {
      this.#headersProvider = getComponent(
        opts.headersProvider,
        'get',
        contentTypeHeadersProvider(contentType),
      );
    }
  }

  async perform(event: T): Promise<Response> {
    const request = new Request(await this.#urlProvider(event), {
      method: this.#method,
      headers: await this.#headersProvider(event),
      body: await this.#eventSerializer(event),
    });
    this.emit('request:created', event, request);

    const response = await fetch(request);
    this.emit('response:received', event, response);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }

    return response;
  }
}
