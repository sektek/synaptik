import { getComponent } from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import { Event } from '../types/index.js';

import {
  HeadersProvider,
  HeadersProviderComponent,
  HeadersProviderFn,
} from './types/index.js';

export type CompositeHeadersProviderOptions<T extends Event = Event> =
  EventServiceOptions & {
    providers: HeadersProviderComponent<T> | HeadersProviderComponent<T>[];
  };

export class CompositeHeadersProvider<T extends Event = Event>
  extends AbstractEventService
  implements HeadersProvider<T>
{
  #providers: HeadersProviderFn<T>[];

  constructor(opts: CompositeHeadersProviderOptions<T>) {
    super(opts);

    this.#providers = [opts.providers]
      .flat()
      .map(provider => getComponent(provider, 'get'));
  }

  async get(event: T): Promise<Headers> {
    const headers = new Headers();

    await Promise.all(
      this.#providers.map(async provider => {
        const providerHeaders = await provider(event);

        if (providerHeaders instanceof Headers) {
          providerHeaders.forEach((value, name) => {
            headers.set(name, value);
          });
        } else if (Array.isArray(providerHeaders)) {
          providerHeaders.forEach(([name, value]) => {
            headers.set(name, value);
          });
        } else {
          Object.entries(providerHeaders).forEach(([name, value]) => {
            headers.set(name, value);
          });
        }
      }),
    );

    return headers;
  }
}
