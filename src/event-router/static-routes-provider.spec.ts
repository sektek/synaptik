import { expect } from 'chai';
import { fake } from 'sinon';

import { StaticRoutesProvider } from './static-routes-provider.js';

describe('StaticRoutesProvider', function () {
  describe('values()', function () {
    it('should return all static routes as an iterable', async function () {
      const route1 = fake();
      const route2 = fake();
      const provider = new StaticRoutesProvider({ routes: [route1, route2] });

      const routes = await provider.values();

      expect(routes).to.have.length(2);
      expect(routes[0]).to.equal(route1);
      expect(routes[1]).to.equal(route2);
    });
  });

  it('should throw if constructed with no routes', function () {
    expect(() => new StaticRoutesProvider({ routes: [] })).to.throw(
      'StaticRoutesProvider requires at least one route',
    );
  });
});
