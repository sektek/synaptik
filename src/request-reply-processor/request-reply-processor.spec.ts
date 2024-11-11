import { expect, use } from 'chai';
import { fake, match } from 'sinon';
import chaiAsPromised from 'chai-as-promised';

import { EventBuilder } from '../event-builder.js';
import { RequestReplyProcessor } from './request-reply-processor.js';

use(chaiAsPromised);

describe('RequestReplyProcessor', function () {
  it('should return a promise', async function () {
    const handler = fake();
    const processorChannel = new RequestReplyProcessor({ handler });
    const event = await new EventBuilder().create();

    const promise = processorChannel.process(event);

    expect(handler.calledOnceWith(match.has('id', event.id))).to.be.true;
    expect(promise).to.be.instanceOf(Promise);
  });

  it('should resolve the promise when a matching reply is received', async function () {
    const handler = fake();
    const processorChannel = new RequestReplyProcessor({ handler });
    const event = await new EventBuilder().create();

    const promise = processorChannel.process(event);
    const reply = await new EventBuilder().create();
    reply.replyTo = [event.id];

    processorChannel.channel(reply);

    const result = await promise;
    expect(result).to.equal(reply);
  });

  it('should throw an error when a non-matching reply is received', async function () {
    const handler = fake();
    const processorChannel = new RequestReplyProcessor({ handler });
    const event = await new EventBuilder().create();

    processorChannel.process(event);
    const reply = await new EventBuilder().create();
    reply.replyTo = ['non-matching-id'];

    expect(processorChannel.channel(reply)).to.be.rejectedWith(
      'No channel found for event with id: non-matching-id',
    );
  });

  it('should emit an event:received event when processing an event', async function () {
    const handler = fake();
    const listener = fake();
    const processorChannel = new RequestReplyProcessor({ handler });
    const event = await new EventBuilder().create();

    processorChannel.on('event:received', listener);

    const promise = processorChannel.process(event);

    const reply = await new EventBuilder().create();
    reply.replyTo = [event.id];

    await processorChannel.channel(reply);
    await promise;

    expect(listener.calledOnceWith(event)).to.be.true;
  });

  it('should emit an event:processed event when processing an event', async function () {
    const handler = fake();
    const listener = fake();
    const processorChannel = new RequestReplyProcessor({ handler });
    const event = await new EventBuilder().create();

    processorChannel.on('event:processed', listener);

    const promise = processorChannel.process(event);

    const reply = await new EventBuilder().create();
    reply.replyTo = [event.id];

    await processorChannel.channel(reply);
    await promise;

    expect(listener.calledOnceWith(event, reply)).to.be.true;
  });
});
