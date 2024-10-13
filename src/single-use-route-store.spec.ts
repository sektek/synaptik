import { expect } from 'chai';

import { EventBuilder } from './event-builder.js';
import { SingleUseRouteStore } from './single-use-route-store.js';

describe('SingleUseRouteStore', function () {
  it('should remove routes after they are retrieved', async function () {
    const defaultRoute = async () => 'default';
    const route1 = async () => 'route1';

    const store = new SingleUseRouteStore({
      routeDecider: async () => ['route1'],
      defaultRoute,
      routes: { route1 },
    });

    const event = new EventBuilder().create();

    const routes = await store.get(event);
    expect(routes).to.have.lengthOf(1);
    expect(routes[0]).to.equal(route1);

    const nextRoutes = await store.get(event);
    expect(nextRoutes).to.have.lengthOf(1);
    expect(nextRoutes[0]).to.equal(defaultRoute);
  });
});
