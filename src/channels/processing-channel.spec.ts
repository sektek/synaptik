import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Event } from '../types/index.js';
import { EventBuilder } from '../event-builder.js';
import { ProcessingChannel } from './processing-channel.js';

use(chaiAsPromised);
use(sinonChai);

describe('ProcessingChannel', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('should process an event before sending it to the handler', async function () {
    const processor = async (event: Event) => {
      event.data.processed = true;
      return event;
    };
    const handler = sinon.fake();
    const channel = new ProcessingChannel({ processor, handler });
    const event = await new EventBuilder().create();

    await channel.send(event);

    const args = handler.firstCall.args;
    expect(args[0].data.processed).to.be.true;
  });

  it('should clone the event before processing', async function () {
    const processor = async (event: Event) => {
      event.data.processed = true;
      return event;
    };
    const handler = sinon.fake();
    const channel = new ProcessingChannel({ processor, handler });
    const event = await new EventBuilder().create();

    await channel.send(event);

    const args = handler.firstCall.args;
    expect(args[0]).to.not.equal(event);
    expect(args[0].id).to.not.equal(event.id);
    expect(args[0].parentId).to.equal(event.id);
  });

  it('should not affect the original event when processing', async function () {
    const processor = async (event: Event) => {
      event.data.processed = true;
      return event;
    };
    const handler = sinon.fake();
    const channel = new ProcessingChannel({ processor, handler });
    const event = await new EventBuilder().create();

    await channel.send(event);

    expect(event.data.processed).to.be.undefined;
  });

  it('should emit an event when the event is received', async function () {
    const processor = async (event: Event) => event;
    const handler = sinon.fake();
    const channel = new ProcessingChannel({ processor, handler });
    const event = await new EventBuilder().create();

    const listener = sinon.fake();
    channel.on('event:received', listener);

    await channel.send(event);

    expect(listener.calledOnceWith(event)).to.be.true;
  });

  it('should emit an event when the event is delivered', async function () {
    const processor = async (event: Event) => {
      event.data.processed = true;
      return event;
    };
    const handler = sinon.fake();
    const channel = new ProcessingChannel({ processor, handler });
    const event = await new EventBuilder().create();

    const listener = sinon.fake();
    channel.on('event:delivered', listener);

    await channel.send(event);

    const args = listener.firstCall.args;
    expect(args[0].data.processed).to.be.true;
    expect(args[0]).to.not.equal(event);
  });

  it('should emit an event when an error occurs', async function () {
    const error = new Error('Test error');
    const processor = sinon.fake.throws(error);
    const handler = sinon.fake();
    const event = await new EventBuilder().create();
    const listener = sinon.fake();

    const channel = new ProcessingChannel({ processor, handler });
    channel.on('event:error', listener);

    await expect(channel.send(event)).to.eventually.be.rejectedWith(error);

    expect(listener).to.have.been.calledOnceWith(error, event);
    expect(handler).to.not.have.been.called;
  });
});
