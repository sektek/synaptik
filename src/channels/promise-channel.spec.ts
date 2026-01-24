import { expect, use } from 'chai';
import { fake, match } from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';

import { Event } from '../types/index.js';
import { EventBuilder } from '../event-builder.js';
import { PromiseChannel } from './promise-channel.js';

use(chaiAsPromised);
use(sinonChai);

describe('PromiseChannel', function () {
  it('should initialize to a pending state', async function () {
    const channel = new PromiseChannel<Event>();

    expect(channel.state).to.equal('pending');
  });

  it('should resolve the promise when sending an event', async function () {
    const channel = new PromiseChannel<Event>();
    const event = await new EventBuilder().create();
    const promise = channel.get();
    channel.send(event);

    const result = await promise;
    expect(result).to.equal(event);
  });

  it('should have a state of fulfilled after sending an event', async function () {
    const channel = new PromiseChannel<Event>();
    const event = await new EventBuilder().create();
    await channel.send(event);

    expect(channel.state).to.equal('fulfilled');
  });

  it('should emit an event:received event when sending an event', async function () {
    const channel = new PromiseChannel<Event>();
    const event = await new EventBuilder().create();
    channel.on('event:received', value => {
      expect(value).to.equal(event);
    });
    await channel.send(event);
  });

  it('should emit an event:delivered event when sending an event', async function () {
    const channel = new PromiseChannel<Event>();
    const event = await new EventBuilder().create();
    channel.on('event:delivered', value => {
      expect(value).to.equal(event);
    });
    await channel.send(event);
  });

  it('should emit an event:error event when sending an event after the promise has been resolved', async function () {
    const listener = fake();
    const channel = new PromiseChannel<Event>();
    const event = await new EventBuilder().create();
    await channel.send(event);
    channel.on('event:error', listener);
    expect(channel.send(event)).to.be.rejectedWith('Promise already resolved');

    expect(
      listener.calledOnceWith(
        match
          .instanceOf(Error)
          .and(match.has('message', 'Promise already resolved')),
        event,
      ),
    ).to.be.true;
  });

  it('should emit an event:error event when the get times out', async function () {
    const listener = fake();
    const channel = new PromiseChannel<Event>({ timeout: 10 });
    channel.on('event:error', listener);
    await expect(channel.get()).to.be.rejectedWith('Promise timed out');

    expect(
      listener.calledOnceWith(
        match.instanceOf(Error).and(match.has('message', 'Promise timed out')),
      ),
    ).to.be.true;
  });

  it('should have a rejected state when the promise is rejected', async function () {
    const channel = new PromiseChannel<Event>({ timeout: 10 });
    await expect(channel.get()).to.be.rejectedWith('Promise timed out');

    expect(channel.state).to.equal('rejected');
  });
});
