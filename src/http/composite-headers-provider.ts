import { getComponent } from '@sektek/utility-belt';

import {
  HeadersProvider,
  HeadersProviderComponent,
  HeadersProviderFn,
} from './types/index.js';
import { Event } from '../types/index.js';

export class CompositeHeadersProvider<T extends Event = Event>
  implements HeadersProvider<T>
{
  #providers: HeadersProviderFn<T>[];

  constructor(...providers: HeadersProviderComponent<T>[]) {
    this.#providers = providers.map(provider => getComponent(provider, 'get'));
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
