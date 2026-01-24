import { expect, use } from 'chai';
import { fake } from 'sinon';
import sinonChai from 'sinon-chai';

import { EventBuilder } from '../event-builder.js';

import { TapChannel } from './tap-channel.js';

use(sinonChai);

describe('TapChannel', function () {
  it('should call the tapHandler prior to the handler', async function () {
    const tapHandler = fake();
    const handler = fake();
    const channel = new TapChannel({ tapHandler, handler });
    const event = await EventBuilder.create();

    await channel.send(event);

    expect(tapHandler).to.have.been.calledOnceWith(event);
    expect(handler).to.have.been.calledOnceWith(event);
    expect(tapHandler).to.have.been.calledBefore(handler);
  });

  describe('Event Emitter', function () {
    it('should emit an event:received event', async function () {
      const tapHandler = fake();
      const handler = fake();
      const eventListener = fake();
      const channel = new TapChannel({ tapHandler, handler });
      channel.on('event:received', eventListener);
      const event = await EventBuilder.create();

      await channel.send(event);

      expect(eventListener).to.have.been.calledOnceWith(event);
    });

    it('should emit an event:delivered event following delivery to the handler', async function () {
      const tapHandler = fake();
      const handler = fake();
      const deliveredListener = fake();
      const channel = new TapChannel({ tapHandler, handler });
      channel.on('event:delivered', deliveredListener);
      const event = await EventBuilder.create();

      await channel.send(event);

      expect(deliveredListener).to.have.been.calledOnceWith(event);
      expect(handler).to.have.been.calledBefore(deliveredListener);
    });

    it('should emit an event:error event if an error occurs in the tapHandler', async function () {
      const error = new Error('Test error');
      const tapHandler = fake.throws(error);
      const handler = fake();
      const errorListener = fake();
      const channel = new TapChannel({ tapHandler, handler });
      channel.on('event:error', errorListener);
      const event = await EventBuilder.create();

      await channel.send(event).catch(() => {});

      expect(errorListener).to.have.been.calledOnceWith(error, event);
      expect(handler).to.not.have.been.called;
    });
  });
});
