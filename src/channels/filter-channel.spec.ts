import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { fake } from 'sinon';

import { EventBuilder } from '../event-builder.js';
import { FilterChannel } from './filter-channel.js';

import { ALLOW_ALL, DENY_ALL } from '../types/event-predicate.js';

use(chaiAsPromised);

describe('FilterChannel', function () {
  it('should send the event to the event handler when the filter returns true', async function () {
    const event = await new EventBuilder().create();
    const handler = fake();
    const channel = new FilterChannel({
      filter: ALLOW_ALL,
      handler,
    });

    await channel.send(event);

    expect(handler.calledOnceWith(event)).to.be.true;
  });

  it('should emit an event:received event when getting an event', async function () {
    const event = await new EventBuilder().create();
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
    const event = await new EventBuilder().create();
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
    const event = await new EventBuilder().create();
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
    const event = await new EventBuilder().create();
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
    const event = await new EventBuilder().create();
    const handler = fake();
    const callback = fake();
    const channel = new FilterChannel({ filter: DENY_ALL, handler }).on(
      'event:rejected',
      callback,
    );

    await channel.send(event);

    expect(callback.calledOnceWith(event)).to.be.true;
  });

  describe('when processing fails', function () {
    const error = new Error('test');

    it('should emit event:error and reject when the filter throws', async function () {
      const event = await new EventBuilder().create();
      const callback = fake();
      const channel = new FilterChannel({
        filter: fake.throws(error),
        handler: fake(),
      }).on('event:error', callback);

      await expect(channel.send(event)).to.be.rejectedWith(error);

      expect(callback.calledOnceWith(error, event)).to.be.true;
    });

    it('should emit event:error and reject when the filter rejects', async function () {
      const event = await new EventBuilder().create();
      const callback = fake();
      const channel = new FilterChannel({
        filter: fake.rejects(error),
        handler: fake(),
      }).on('event:error', callback);

      await expect(channel.send(event)).to.be.rejectedWith(error);

      expect(callback.calledOnceWith(error, event)).to.be.true;
    });

    it('should emit event:error and reject when the handler throws', async function () {
      const event = await new EventBuilder().create();
      const callback = fake();
      const channel = new FilterChannel({
        filter: ALLOW_ALL,
        handler: fake.throws(error),
      }).on('event:error', callback);

      await expect(channel.send(event)).to.be.rejectedWith(error);

      expect(callback.calledOnceWith(error, event)).to.be.true;
    });

    it('should emit event:error and reject when the handler rejects', async function () {
      const event = await new EventBuilder().create();
      const callback = fake();
      const channel = new FilterChannel({
        filter: ALLOW_ALL,
        handler: fake.rejects(error),
      }).on('event:error', callback);

      await expect(channel.send(event)).to.be.rejectedWith(error);

      expect(callback.calledOnceWith(error, event)).to.be.true;
    });

    it('should emit event:error and reject when the rejection handler throws', async function () {
      const event = await new EventBuilder().create();
      const callback = fake();
      const channel = new FilterChannel({
        filter: DENY_ALL,
        handler: fake(),
        rejectionHandler: fake.throws(error),
      }).on('event:error', callback);

      await expect(channel.send(event)).to.be.rejectedWith(error);

      expect(callback.calledOnceWith(error, event)).to.be.true;
    });

    it('should emit event:error and reject when the rejection handler rejects', async function () {
      const event = await new EventBuilder().create();
      const callback = fake();
      const channel = new FilterChannel({
        filter: DENY_ALL,
        handler: fake(),
        rejectionHandler: fake.rejects(error),
      }).on('event:error', callback);

      await expect(channel.send(event)).to.be.rejectedWith(error);

      expect(callback.calledOnceWith(error, event)).to.be.true;
    });

    it('should not emit event:delivered when processing fails', async function () {
      const event = await new EventBuilder().create();
      const callback = fake();
      const channel = new FilterChannel({
        filter: ALLOW_ALL,
        handler: fake.throws(error),
      }).on('event:delivered', callback);

      await expect(channel.send(event)).to.be.rejectedWith(error);

      expect(callback.called).to.be.false;
    });
  });
});
