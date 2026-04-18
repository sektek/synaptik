import { expect } from 'chai';
import { fake } from 'sinon';

import { EventBuilder } from '../event-builder.js';
import { NamedRoutesProvider } from './named-routes-provider.js';

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iter) {
    results.push(item);
  }
  return results;
}

describe('NamedRoutesProvider', function () {
  it('should return the matching route when decider hits', async function () {
    const route = fake();
    const routeDecider = async () => 'route-a';
    const routeProvider = async (name: string) =>
      name === 'route-a' ? route : undefined;

    const provider = new NamedRoutesProvider({ routeDecider, routeProvider });
    const event = await EventBuilder.create();

    const results = await collect(provider.values(event));
    expect(results).to.deep.equal([route]);
  });

  it('should return all matched routes in order for multiple names', async function () {
    const route1 = fake();
    const route2 = fake();
    const routeDecider = async () => ['route-a', 'route-b'];
    const routes: Record<string, typeof route1> = {
      'route-a': route1,
      'route-b': route2,
    };
    const routeProvider = async (name: string) => routes[name];

    const provider = new NamedRoutesProvider({ routeDecider, routeProvider });
    const event = await EventBuilder.create();

    const results = await collect(provider.values(event));
    expect(results).to.deep.equal([route1, route2]);
  });

  it('should return the default NullChannel.send when decider misses and no defaultRoute set', async function () {
    const routeDecider = async () => 'missing';
    const routeProvider = async () => undefined;

    const provider = new NamedRoutesProvider({ routeDecider, routeProvider });
    const event = await EventBuilder.create();

    const results = await collect(provider.values(event));
    expect(results).to.have.lengthOf(1);
    expect(typeof results[0]).to.equal('function');
  });

  it('should return custom defaultRoute when decider misses', async function () {
    const defaultRoute = fake();
    const routeDecider = async () => 'missing';
    const routeProvider = async () => undefined;

    const provider = new NamedRoutesProvider({
      routeDecider,
      routeProvider,
      defaultRoute,
    });
    const event = await EventBuilder.create();

    const results = await collect(provider.values(event));
    expect(results).to.deep.equal([defaultRoute]);
  });

  it('should call defaultRouteProvider when decider misses', async function () {
    const defaultRoute = fake();
    const defaultRouteProvider = fake.returns(defaultRoute);
    const routeDecider = async () => 'missing';
    const routeProvider = async () => undefined;

    const provider = new NamedRoutesProvider({
      routeDecider,
      routeProvider,
      defaultRouteProvider,
    });
    const event = await EventBuilder.create();

    const results = await collect(provider.values(event));
    expect(defaultRouteProvider.calledOnce).to.be.true;
    expect(results).to.deep.equal([defaultRoute]);
  });
});
