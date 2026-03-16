import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Event } from '../types/index.js';
import { EventBuilder } from '../event-builder.js';

import { CollectorChannel } from './collector-channel.js';

use(sinonChai);
use(chaiAsPromised);

describe('CollectorChannel', function () {
  let channel: CollectorChannel;
  let collector: Set<Event>;

  beforeEach(function () {
    collector = new Set<Event>();
    channel = new CollectorChannel({ collector });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should add events to the collector', async function () {
    const event = await EventBuilder.create();

    await channel.send(event);

    expect(collector.has(event)).to.be.true;
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

  it('should emit event:error if adding the event fails', async function () {
    const event = await EventBuilder.create();
    const error = new Error('Collector failed');
    const errorSpy = sinon.spy();

    sinon.stub(collector, 'add').rejects(error);

    channel.on('event:error', errorSpy);
    await expect(channel.send(event)).to.be.rejectedWith(error);
    expect(errorSpy).to.have.been.calledWith(error, event);
  });
});
