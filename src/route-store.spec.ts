import { expect } from 'chai';
import { fake } from 'sinon';

import { EventBuilder } from './event-builder.js';
import { RouteStore } from './route-store.js';

describe('RouteStore', function () {
  it('should return the route for a given event', async function () {
    const routeDecider = async () => 'route';
    const route = async () => {};
    const routeStore = new RouteStore({ routeDecider, routes: { route } });
    const event = new EventBuilder().create();

    const result = await routeStore.get(event);
    expect(result).to.deep.equal([route]);
  });

  it('should return the default route for a given event if no route is found', async function () {
    const routeDecider = async () => 'route';
    const defaultRoute = async () => {};
    const routeStore = new RouteStore({
      routeDecider,
      routes: {},
      defaultRoute,
    });
    const event = new EventBuilder().create();

    const result = await routeStore.get(event);
    expect(result).to.deep.equal([defaultRoute]);
  });

  it('should return multiple routes for a given event', async function () {
    const routeDecider = async () => ['route1', 'route2'];
    const route1 = async () => {};
    const route2 = async () => {};
    const routeStore = new RouteStore({
      routeDecider,
      routes: { route1, route2 },
    });
    const event = new EventBuilder().create();

    const result = await routeStore.get(event);
    expect(result).to.deep.equal([route1, route2]);
  });

  it('should pass the event to the route decider', async function () {
    const routeDecider = fake();
    const routeStore = new RouteStore({ routeDecider });
    const event = new EventBuilder().create();

    await routeStore.get(event);
    expect(routeDecider.calledOnceWith(event)).to.be.true;
  });
});
