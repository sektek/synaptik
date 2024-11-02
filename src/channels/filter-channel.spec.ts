import { expect } from 'chai';
import { fake } from 'sinon';

import { EventBuilder } from '../event-builder.js';
import { FilterChannel } from './filter-channel.js';

import { ALLOW_ALL, DENY_ALL } from '../types/event-predicate.js';

describe('FilterChannel', function () {
  it('should send the event to the event handler when the filter returns true', async function () {
    const event = new EventBuilder().create();
    const handler = fake();
    const channel = new FilterChannel({
      filter: ALLOW_ALL,
      handler,
    });

    await channel.send(event);

    expect(handler.calledOnceWith(event)).to.be.true;
  });

  it('should emit an event:received event when getting an event', async function () {
    const event = new EventBuilder().create();
    const handler = fake();
    const callback = fake();
    const channel = new FilterChannel({ filter: ALLOW_ALL, handler }).on(
      'event:received',
      callback,
    );

    await channel.send(event);

    expect(callback.calledOnceWith(event)).to.be.true;
  });

  it('should emit an event:delivered event when event is accepted', async function () {
    const event = new EventBuilder().create();
    const handler = fake();
    const callback = fake();
    const channel = new FilterChannel({ filter: ALLOW_ALL, handler }).on(
      'event:delivered',
      callback,
    );

    await channel.send(event);

    expect(callback.calledOnceWith(event)).to.be.true;
  });

  it('should emit an event:delivered event when event is rejected', async function () {
    const event = new EventBuilder().create();
    const handler = fake();
    const callback = fake();
    const channel = new FilterChannel({ filter: DENY_ALL, handler }).on(
      'event:delivered',
      callback,
    );

    await channel.send(event);

    expect(callback.calledOnceWith(event)).to.be.true;
  });

  it('should send the event to the rejection handler when the filter returns false', async function () {
    const event = new EventBuilder().create();
    const rejectionHandler = fake();
    const channel = new FilterChannel({
      filter: DENY_ALL,
      handler: fake(),
      rejectionHandler,
    });

    await channel.send(event);

    expect(rejectionHandler.calledOnceWith(event)).to.be.true;
  });

  it('should emit an event:rejected event when the filter returns false', async function () {
    const event = new EventBuilder().create();
    const handler = fake();
    const callback = fake();
    const channel = new FilterChannel({ filter: DENY_ALL, handler }).on(
      'event:rejected',
      callback,
    );

    await channel.send(event);

    expect(callback.calledOnceWith(event)).to.be.true;
  });

  it('should emit an event:error event when the handler throws an error', async function () {
    const event = new EventBuilder().create();
    const error = new Error('test');
    const handler = fake.throws(error);
    const callback = fake();
    const channel = new FilterChannel({ filter: ALLOW_ALL, handler }).on(
      'event:error',
      callback,
    );

    await channel.send(event);

    expect(callback.calledOnceWith(event, error)).to.be.true;
  });
});
