import { expect } from 'chai';
import { fake } from 'sinon';

import { Event } from '../types/index.js';
import { EventBuilder } from '../event-builder.js';
import { ProcessingChannel } from './processing-channel.js';

describe('ProcessingChannel', function () {
  it('should process an event before sending it to the handler', async function () {
    const processor = async (event: Event) => {
      event.data.processed = true;
      return event;
    };
    const handler = fake();
    const channel = new ProcessingChannel({ processor, handler });
    const event = new EventBuilder().create();

    await channel.send(event);

    const args = handler.firstCall.args;
    expect(args[0].data.processed).to.be.true;
  });

  it('should clone the event before processing', async function () {
    const processor = async (event: Event) => {
      event.data.processed = true;
      return event;
    };
    const handler = fake();
    const channel = new ProcessingChannel({ processor, handler });
    const event = new EventBuilder().create();

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
    const handler = fake();
    const channel = new ProcessingChannel({ processor, handler });
    const event = new EventBuilder().create();

    await channel.send(event);

    expect(event.data.processed).to.be.undefined;
  });

  it('should emit an event when the event is received', async function () {
    const processor = async (event: Event) => event;
    const handler = fake();
    const channel = new ProcessingChannel({ processor, handler });
    const event = new EventBuilder().create();

    const listener = fake();
    channel.on('event:received', listener);

    await channel.send(event);

    expect(listener.calledOnceWith(event)).to.be.true;
  });

  it('should emit an event when the event is delivered', async function () {
    const processor = async (event: Event) => {
      event.data.processed = true;
      return event;
    };
    const handler = fake();
    const channel = new ProcessingChannel({ processor, handler });
    const event = new EventBuilder().create();

    const listener = fake();
    channel.on('event:delivered', listener);

    await channel.send(event);

    const args = listener.firstCall.args;
    expect(args[0].data.processed).to.be.true;
    expect(args[0]).to.not.equal(event);
  });
});
