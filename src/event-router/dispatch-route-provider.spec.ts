import { expect } from 'chai';
import { fake } from 'sinon';

import { DispatchRouteProvider } from './dispatch-route-provider.js';

describe('DispatchRouteProvider', function () {
  it('should throw an error when no routes are provided', function () {
    expect(() => new DispatchRouteProvider({ routes: [] })).to.throw(
      'DispatchRouteProvider requires at least one route',
    );
  });

  it ('should return the provided routes', async function () {
    const route1 = fake();
    const route2 = fake();
    const routeProvider = new DispatchRouteProvider({
      routes: [route1, route2],
    });

    const routes = await routeProvider.get();

    expect(routes).to.deep.equal([route1, route2]);
  });
});
