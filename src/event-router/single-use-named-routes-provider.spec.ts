import { expect } from 'chai';
import { fake } from 'sinon';

import { EventBuilder } from '../event-builder.js';
import { SingleUseNamedRoutesProvider } from './single-use-named-routes-provider.js';

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iter) {
    results.push(item);
  }
  return results;
}

describe('SingleUseNamedRoutesProvider', function () {
  it('should retrieve a route then delete it so second call returns default', async function () {
    const route = fake();
    const defaultRoute = fake();
    const store = new Map([[('route-a'), route]]);
    const routeDecider = async () => 'route-a';

    const provider = new SingleUseNamedRoutesProvider({
      routeDecider,
      store,
      defaultRoute,
    });

    const event = await EventBuilder.create();

    const firstResults = await collect(provider.values(event));
    expect(firstResults).to.deep.equal([route]);

    const secondResults = await collect(provider.values(event));
    expect(secondResults).to.deep.equal([defaultRoute]);
  });

  it('should return the default route when store is empty', async function () {
    const defaultRoute = fake();
    const store = new Map<string, typeof defaultRoute>();
    const routeDecider = async () => 'route-a';

    const provider = new SingleUseNamedRoutesProvider({
      routeDecider,
      store,
      defaultRoute,
    });

    const event = await EventBuilder.create();

    const results = await collect(provider.values(event));
    expect(results).to.deep.equal([defaultRoute]);
  });
});
