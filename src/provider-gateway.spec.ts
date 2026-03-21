import { expect } from 'chai';
import { fake } from 'sinon';

import { EventBuilder } from './event-builder.js';
import { ProviderGateway } from './provider-gateway.js';

const WAIT = () => new Promise(resolve => setTimeout(resolve, 50));

const FAST_OPTS = {
  schedule: () => 10,
  queueOptions: { sleepDuration: 10 },
};

describe('ProviderGateway', function () {
  describe('lifecycle', function () {
    it('should emit gateway:started when started', async function () {
      const callback = fake();
      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider: () => [],
        handler: fake(),
      }).on('gateway:started', callback);

      await gateway.start();
      await gateway.stop();

      expect(callback.calledOnce).to.be.true;
    });

    it('should emit gateway:stopped when stopped', async function () {
      const callback = fake();
      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider: () => [],
        handler: fake(),
      }).on('gateway:stopped', callback);

      await gateway.start();
      await gateway.stop();

      expect(callback.calledOnce).to.be.true;
    });

    it('should be idempotent on start()', async function () {
      const startedCallback = fake();
      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider: () => [],
        handler: fake(),
      }).on('gateway:started', startedCallback);

      await gateway.start();
      await gateway.start();
      await gateway.stop();

      expect(startedCallback.calledOnce).to.be.true;
    });
  });

  describe('event processing', function () {
    it('should pass provider events to the handler', async function () {
      const event1 = await new EventBuilder().create();
      const event2 = await new EventBuilder().create();
      const handler = fake();

      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider: () => [event1, event2],
        handler,
      });

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(handler.calledWith(event1)).to.be.true;
      expect(handler.calledWith(event2)).to.be.true;
    });

    it('should emit event:received for each event from provider', async function () {
      const event = await new EventBuilder().create();
      const receivedCallback = fake();

      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider: () => [event],
        handler: fake(),
      }).on('event:received', receivedCallback);

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(receivedCallback.calledWith(event)).to.be.true;
    });

    it('should emit event:processed after handler completes', async function () {
      const event = await new EventBuilder().create();
      const processedCallback = fake();

      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider: () => [event],
        handler: fake(),
      }).on('event:processed', processedCallback);

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(processedCallback.calledWith(event)).to.be.true;
    });

    it('should support async iterable providers', async function () {
      const event = await new EventBuilder().create();
      const handler = fake();

      async function* asyncEvents() {
        yield event;
      }

      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider: () => asyncEvents(),
        handler,
      });

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(handler.calledWith(event)).to.be.true;
    });

    it('should accept provider as an object with values()', async function () {
      const event = await new EventBuilder().create();
      const handler = fake();

      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider: { values: () => [event] },
        handler,
      });

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(handler.calledWith(event)).to.be.true;
    });

    it('should poll the provider multiple times according to schedule', async function () {
      const event = await new EventBuilder().create();
      const provider = fake.returns([event]);

      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider,
        handler: fake(),
      });

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(provider.callCount).to.be.greaterThan(1);
    });
  });

  describe('error handling', function () {
    it('should emit event:error when provider throws, then continue polling', async function () {
      const event = await new EventBuilder().create();
      const handler = fake();
      const errorCallback = fake();
      let callCount = 0;

      // Fail first call, succeed on subsequent calls
      const provider = () => {
        callCount++;
        if (callCount === 1) throw new Error('provider error');
        return [event];
      };

      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider,
        handler,
      }).on('event:error', errorCallback);

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(errorCallback.called).to.be.true;
      expect(handler.called).to.be.true;
    });

    it('should emit event:error when handler throws, then continue processing', async function () {
      const event1 = await new EventBuilder().create();
      const event2 = await new EventBuilder().create();
      const errorCallback = fake();
      let callCount = 0;

      // Fail on first call, succeed on subsequent calls
      const handler = async () => {
        callCount++;
        if (callCount === 1) throw new Error('handler error');
      };

      const events = [event1, event2];
      let provided = false;
      const provider = () => {
        if (!provided) {
          provided = true;
          return events;
        }
        return [];
      };

      const gateway = new ProviderGateway({
        ...FAST_OPTS,
        provider,
        handler,
      }).on('event:error', errorCallback);

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(errorCallback.called).to.be.true;
    });
  });

  describe('schedule', function () {
    it('should accept schedule as an object with get()', async function () {
      const event = await new EventBuilder().create();
      const handler = fake();

      const gateway = new ProviderGateway({
        queueOptions: { sleepDuration: 10 },
        schedule: { get: () => 10 },
        provider: () => [event],
        handler,
      });

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(handler.called).to.be.true;
    });
  });
});
