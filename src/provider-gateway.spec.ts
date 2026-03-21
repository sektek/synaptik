import { expect } from 'chai';
import { fake } from 'sinon';
import { parallelExecutionStrategy } from '@sektek/utility-belt';

import { EventBuilder } from './event-builder.js';
import { ProviderGateway } from './provider-gateway.js';

const WAIT = () => new Promise(resolve => setTimeout(resolve, 50));

const DEFAULT_PROVIDER_GATEWAY_OPTS = {
  intervalProvider: () => 10,
  queueOptions: { sleepDuration: 10 },
};

describe('ProviderGateway', function () {
  describe('lifecycle', function () {
    it('should emit gateway:started when started', async function () {
      const callback = fake();
      const gateway = new ProviderGateway({
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
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
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
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
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
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
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
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
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
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
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
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
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
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
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
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
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
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
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
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
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
        provider,
        handler,
      }).on('event:error', errorCallback);

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(errorCallback.called).to.be.true;
    });
  });

  describe('intervalProvider', function () {
    it('should accept intervalProvider as a function', async function () {
      const event = await new EventBuilder().create();
      const handler = fake();

      const gateway = new ProviderGateway({
        queueOptions: { sleepDuration: 10 },
        intervalProvider: () => 10,
        provider: () => [event],
        handler,
      });

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(handler.called).to.be.true;
    });

    it('should accept intervalProvider as an object with get()', async function () {
      const event = await new EventBuilder().create();
      const handler = fake();

      const gateway = new ProviderGateway({
        queueOptions: { sleepDuration: 10 },
        intervalProvider: { get: () => 10 },
        provider: () => [event],
        handler,
      });

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(handler.called).to.be.true;
    });
  });

  describe('frequency', function () {
    it('should use frequency as a fixed polling interval', async function () {
      const event = await new EventBuilder().create();
      const handler = fake();

      const gateway = new ProviderGateway({
        queueOptions: { sleepDuration: 10 },
        frequency: 10,
        provider: () => [event],
        handler,
      });

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(handler.called).to.be.true;
    });

    it('should prefer intervalProvider over frequency when both are set', async function () {
      const event = await new EventBuilder().create();
      const intervalProvider = fake.returns(10);

      const gateway = new ProviderGateway({
        queueOptions: { sleepDuration: 10 },
        intervalProvider,
        frequency: 999_999,
        provider: () => [event],
        handler: fake(),
      });

      await gateway.start();
      await WAIT();
      await gateway.stop();

      expect(intervalProvider.called).to.be.true;
    });
  });

  describe('concurrency', function () {
    it('should throw on negative concurrency', function () {
      expect(
        () =>
          new ProviderGateway({
            ...DEFAULT_PROVIDER_GATEWAY_OPTS,
            provider: () => [],
            handler: fake(),
            concurrency: -1,
          }),
      ).to.throw('non-negative');
    });

    it('should throw on NaN concurrency', function () {
      expect(
        () =>
          new ProviderGateway({
            ...DEFAULT_PROVIDER_GATEWAY_OPTS,
            provider: () => [],
            handler: fake(),
            concurrency: NaN,
          }),
      ).to.throw('non-negative');
    });

    it('should use serial execution when concurrency is 1', async function () {
      const events = await Promise.all([
        new EventBuilder().create(),
        new EventBuilder().create(),
        new EventBuilder().create(),
      ]);
      let concurrent = 0;
      let maxConcurrent = 0;

      const handler = async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(resolve => setTimeout(resolve, 10));
        concurrent--;
      };

      let provided = false;
      const provider = () => {
        if (!provided) {
          provided = true;
          return events;
        }
        return [];
      };

      const gateway = new ProviderGateway({
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
        provider,
        handler,
        concurrency: 1,
      });

      await gateway.start();
      await new Promise(resolve => setTimeout(resolve, 150));
      await gateway.stop();

      expect(maxConcurrent).to.equal(1);
    });

    it('should use parallel execution when concurrency is greater than 1', async function () {
      const events = await Promise.all([
        new EventBuilder().create(),
        new EventBuilder().create(),
        new EventBuilder().create(),
      ]);
      let concurrent = 0;
      let maxConcurrent = 0;

      const handler = async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(resolve => setTimeout(resolve, 20));
        concurrent--;
      };

      let provided = false;
      const provider = () => {
        if (!provided) {
          provided = true;
          return events;
        }
        return [];
      };

      const gateway = new ProviderGateway({
        ...DEFAULT_PROVIDER_GATEWAY_OPTS,
        provider,
        handler,
        concurrency: 3,
      });

      await gateway.start();
      await new Promise(resolve => setTimeout(resolve, 150));
      await gateway.stop();

      expect(maxConcurrent).to.be.greaterThan(1);
    });

    it('should accept Infinity as concurrency', async function () {
      const event = await new EventBuilder().create();

      expect(
        () =>
          new ProviderGateway({
            ...DEFAULT_PROVIDER_GATEWAY_OPTS,
            provider: () => [event],
            handler: fake(),
            concurrency: Infinity,
          }),
      ).not.to.throw();
    });

    it('should ignore concurrency when executionStrategy is also provided', async function () {
      // Providing concurrency: -1 would normally throw, but executionStrategy
      // takes precedence so it must be silently ignored
      expect(
        () =>
          new ProviderGateway({
            ...DEFAULT_PROVIDER_GATEWAY_OPTS,
            provider: () => [],
            handler: fake(),
            executionStrategy: parallelExecutionStrategy,
            concurrency: -1,
          }),
      ).not.to.throw();
    });
  });
});
