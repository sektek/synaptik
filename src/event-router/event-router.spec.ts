import { expect } from 'chai';
import { fake } from 'sinon';

import { EventBuilder } from '../event-builder.js';
import { EventRouter } from './event-router.js';

describe('EventRouter', function () {
  it('should route an event to a provided handler', async function () {
    const route = fake();
    const routeProvider = async () => [route];
    const event = new EventBuilder().create();

    const router = new EventRouter({ routeProvider });
    await router.send(event);

    expect(route.calledOnceWith(event)).to.be.true;
  });

  it('should route an event to multiple provided handlers', async function () {
    const route1 = fake();
    const route2 = fake();
    const routeProvider = async () => [route1, route2];
    const event = new EventBuilder().create();

    const router = new EventRouter({ routeProvider });
    await router.send(event);

    expect(route1.calledOnceWith(event)).to.be.true;
    expect(route2.calledOnceWith(event)).to.be.true;
  });

  it('should emit an event:received event when sending an event', function (done) {
    const routeProvider = async () => [];
    const router = new EventRouter({ routeProvider });
    const event = new EventBuilder().create();

    router.on('event:received', value => {
      expect(value).to.equal(event);
      done();
    });

    router.send(event);
  });

  it('should emit an event:delivered event when sending an event', function (done) {
    const routeProvider = async () => [];
    const router = new EventRouter({ routeProvider });
    const event = new EventBuilder().create();

    router.on('event:delivered', value => {
      expect(value).to.equal(event);
      done();
    });

    router.send(event);
  });
});
