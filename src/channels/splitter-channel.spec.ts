import { expect, use } from 'chai';
import { fake } from 'sinon';
import sinonChai from 'sinon-chai';

import { EventBuilder } from '../event-builder.js';
import { SplitterChannel } from './splitter-channel.js';

use(sinonChai);

describe('SplitterChannel', function () {
  let eventBuilder: EventBuilder;

  beforeEach(function () {
    eventBuilder = new EventBuilder();
  });

  it('should split events correctly', async function () {
    const handler = fake();
    const channel = new SplitterChannel({
      splitter: async function* (event) {
        yield await eventBuilder.from(event).create();
        yield await eventBuilder.from(event).create();
      },
      handler,
    });

    const event = await eventBuilder.create();
    await channel.send(event);

    expect(handler).to.have.been.calledTwice;
  });

  it('should perform the split operation in batches', async function () {
    const handler = fake();
    const executionStrategy = fake(
      async (tasks: Array<() => Promise<void>>) => {
        for (const task of tasks) {
          await task();
        }
      },
    );
    const channel = new SplitterChannel({
      splitter: async function* (event) {
        yield await eventBuilder.from(event).create();
        yield await eventBuilder.from(event).create();
      },
      executionStrategy,
      handler,
    });

    const event = await eventBuilder.create();
    await channel.send(event);

    expect(executionStrategy).to.have.been.calledOnce;
    expect(handler).to.have.been.calledTwice;
  });

  it('should perform the split in multiple batches if the split exceeds the batch size', async function () {
    const handler = fake();
    const executionStrategy = fake(
      async (tasks: Array<() => Promise<void>>) => {
        for (const task of tasks) {
          await task();
        }
      },
    );
    const channel = new SplitterChannel({
      splitter: async function* (event) {
        yield await eventBuilder.from(event).create();
        yield await eventBuilder.from(event).create();
      },
      executionStrategy,
      batchSize: 1,
      handler,
    });

    const event = await eventBuilder.create();
    await channel.send(event);

    expect(executionStrategy).to.have.been.calledTwice;
    expect(handler).to.have.been.calledTwice;
  });

  describe('Event Emitter', function () {
    it('should emit an event:received', async function () {
      const handler = fake();
      const receivedListener = fake();
      const channel = new SplitterChannel({
        splitter: async function* (event) {
          yield await eventBuilder.from(event).create();
          yield await eventBuilder.from(event).create();
        },
        handler,
      });

      channel.on('event:received', receivedListener);

      const event = await eventBuilder.create();
      await channel.send(event);

      expect(receivedListener).to.have.been.calledOnceWith(event);
    });

    it('should emit an event:delivered for each split event', async function () {
      const handler = fake();
      const deliveredListener = fake();
      const channel = new SplitterChannel({
        splitter: async function* (event) {
          yield await eventBuilder.from(event).create();
          yield await eventBuilder.from(event).create();
        },
        handler,
      });

      channel.on('event:delivered', deliveredListener);

      const event = await eventBuilder.create();
      await channel.send(event);

      expect(deliveredListener).to.have.been.calledTwice;
    });
  });
});
