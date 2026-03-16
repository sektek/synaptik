import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Event } from '../types/index.js';
import { EventBuilder } from '../event-builder.js';

import { StoreChannel } from './store-channel.js';

use(sinonChai);
use(chaiAsPromised);

describe('StoreChannel', function () {
  let channel: StoreChannel;
  let store: Map<string, Event>;

  beforeEach(function () {
    store = new Map();
    channel = new StoreChannel({ store });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should store events in the provided store', async function () {
    const event = await EventBuilder.create();

    await channel.send(event);

    const storedEvent = store.get(event.id);
    expect(storedEvent).to.deep.equal(event);
  });

  it('should emit event:received event', async function () {
    const event = await EventBuilder.create();
    const receivedSpy = sinon.spy();

    channel.on('event:received', receivedSpy);

    await channel.send(event);

    expect(receivedSpy).to.have.been.calledWith(event);
  });

  it('should emit event:delivered event', async function () {
    const event = await EventBuilder.create();
    const deliveredSpy = sinon.spy();

    channel.on('event:delivered', deliveredSpy);

    await channel.send(event);

    expect(deliveredSpy).to.have.been.calledWith(event);
  });

  it('should emit event:error if storing the event fails', async function () {
    const event = await EventBuilder.create();
    const error = new Error('Store failed');
    const errorSpy = sinon.spy();

    sinon.stub(store, 'set').rejects(error);

    channel.on('event:error', errorSpy);
    await expect(channel.send(event)).to.be.rejectedWith(error);
    expect(errorSpy).to.have.been.calledWith(event, error);
  });
});
