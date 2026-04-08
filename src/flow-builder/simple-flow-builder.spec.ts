import { expect } from 'chai';
import { fake } from 'sinon';

import { EventBuilder } from '../event-builder.js';
import { Event } from '../types/index.js';

import { SimpleFlowBuilder } from './simple-flow-builder.js';

describe('SimpleFlowBuilder', function () {
  describe('filter', function () {
    it('should route matching events to the downstream handler', async function () {
      const handler = fake();
      const pipeline = new SimpleFlowBuilder()
        .filter(() => true)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.have.been.calledOnceWith(event);
    });

    it('should not route rejected events to the downstream handler', async function () {
      const handler = fake();
      const pipeline = new SimpleFlowBuilder()
        .filter(() => false)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.not.have.been.called;
    });

    it('should accept a predicate object with a test method', async function () {
      const handler = fake();
      const predicate = { test: () => true };
      const pipeline = new SimpleFlowBuilder()
        .filter(predicate)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.have.been.calledOnce;
    });

    it('should pass opts through to FilterChannel', async function () {
      const handler = fake();
      const rejectionHandler = fake();
      const pipeline = new SimpleFlowBuilder()
        .filter(() => false, { rejectionHandler })
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.not.have.been.called;
      expect(rejectionHandler).to.have.been.calledOnceWith(event);
    });
  });

  describe('process', function () {
    it('should transform the event and forward the result', async function () {
      const handler = fake();
      const processor = async (event: Event) => ({
        ...event,
        data: { ...event.data, processed: true },
      });

      const pipeline = new SimpleFlowBuilder()
        .process(processor)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.have.been.calledOnce;
      expect(handler.firstCall.args[0].data.processed).to.be.true;
    });

    it('should accept a processor object with a process method', async function () {
      const handler = fake();
      const processor = {
        process: async (event: Event) => ({
          ...event,
          data: { ...event.data, enriched: true },
        }),
      };

      const pipeline = new SimpleFlowBuilder()
        .process(processor)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.have.been.calledOnce;
      expect(handler.firstCall.args[0].data.enriched).to.be.true;
    });
  });

  describe('transform', function () {
    it('should behave identically to process', async function () {
      const handler = fake();
      const processor = async (event: Event) => ({
        ...event,
        data: { ...event.data, transformed: true },
      });

      const pipeline = new SimpleFlowBuilder()
        .transform(processor)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.have.been.calledOnce;
      expect(handler.firstCall.args[0].data.transformed).to.be.true;
    });
  });

  describe('split', function () {
    it('should fan out one event into many and forward each', async function () {
      const handler = fake();
      const splitter = (event: Event) => [
        { ...event, data: { ...event.data, index: 0 } },
        { ...event, data: { ...event.data, index: 1 } },
      ];

      const pipeline = new SimpleFlowBuilder()
        .split(splitter)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.have.been.calledTwice;
      expect(handler.firstCall.args[0].data.index).to.equal(0);
      expect(handler.secondCall.args[0].data.index).to.equal(1);
    });
  });

  describe('tap', function () {
    it('should call tap handler and forward original event', async function () {
      const tapHandler = fake();
      const handler = fake();

      const pipeline = new SimpleFlowBuilder()
        .tap(tapHandler)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(tapHandler).to.have.been.calledOnceWith(event);
      expect(handler).to.have.been.calledOnceWith(event);
      expect(tapHandler).to.have.been.calledBefore(handler);
    });
  });

  describe('errorTrap', function () {
    it('should catch downstream errors and call errorHandler', async function () {
      const error = new Error('downstream failure');
      const errorHandler = fake();
      const handler = fake.throws(error);

      const pipeline = new SimpleFlowBuilder()
        .errorTrap(errorHandler)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(errorHandler).to.have.been.calledOnce;
    });

    it('should swallow errors by default', async function () {
      const handler = fake.throws(new Error('fail'));

      const pipeline = new SimpleFlowBuilder()
        .errorTrap(fake())
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();

      await expect(handlerFn(event)).to.not.be.rejected;
    });

    it('should rethrow when configured', async function () {
      const error = new Error('fail');
      const handler = fake.throws(error);

      const pipeline = new SimpleFlowBuilder()
        .errorTrap(fake(), { rethrow: true })
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();

      await expect(handlerFn(event)).to.be.rejectedWith(error);
    });
  });

  describe('terminal methods', function () {
    describe('handle', function () {
      it('should set the terminal handler', async function () {
        const handler = fake();
        const pipeline = new SimpleFlowBuilder().handle(handler);

        const handlerFn = pipeline.get();
        const event = await new EventBuilder().create();
        await handlerFn(event);

        expect(handler).to.have.been.calledOnceWith(event);
      });
    });

    describe('outbound', function () {
      it('should accept an EventChannel as terminal', async function () {
        const sendFn = fake();
        const channel = { send: sendFn };

        const pipeline = new SimpleFlowBuilder().outbound(channel);

        const handlerFn = pipeline.get();
        const event = await new EventBuilder().create();
        await handlerFn(event);

        expect(sendFn).to.have.been.calledOnceWith(event);
      });
    });

    describe('dispatch', function () {
      it('should fan out to all provided handlers', async function () {
        const handler1 = fake();
        const handler2 = fake();

        const pipeline = new SimpleFlowBuilder()
          .dispatch([handler1, handler2]);

        const handlerFn = pipeline.get();
        const event = await new EventBuilder().create();
        await handlerFn(event);

        expect(handler1).to.have.been.calledOnceWith(event);
        expect(handler2).to.have.been.calledOnceWith(event);
      });
    });

    describe('route', function () {
      it('should accept RouteStoreOptions and route events', async function () {
        const handler = fake();

        const pipeline = new SimpleFlowBuilder().route({
          routeDecider: () => Promise.resolve('myRoute'),
          routes: { myRoute: handler },
        });

        const handlerFn = pipeline.get();
        const event = await new EventBuilder().create();
        await handlerFn(event);

        expect(handler).to.have.been.calledOnceWith(event);
      });
    });
  });

  describe('get / create', function () {
    it('should throw when no steps and no terminal', function () {
      const builder = new SimpleFlowBuilder();
      expect(() => builder.get()).to.throw('at least one step or terminal');
    });

    it('should use NullHandler when steps exist but no terminal', async function () {
      const pipeline = new SimpleFlowBuilder()
        .filter(() => true);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();

      // Should not throw — NullHandler is the default terminal
      await expect(handlerFn(event)).to.not.be.rejected;
    });

    it('should fold right-to-left preserving step order', async function () {
      const order: string[] = [];

      const tapHandler1 = fake(() => { order.push('tap1'); });
      const tapHandler2 = fake(() => { order.push('tap2'); });
      const handler = fake(() => { order.push('handle'); });

      const pipeline = new SimpleFlowBuilder()
        .tap(tapHandler1)
        .tap(tapHandler2)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(order).to.deep.equal(['tap1', 'tap2', 'handle']);
    });
  });

  describe('factory / reusability', function () {
    it('should create independent flows from the same template', async function () {
      const template = new SimpleFlowBuilder();

      const handler1 = fake();
      const handler2 = fake();

      const flow1 = template.filter(() => true).handle(handler1);
      const flow2 = template.filter(() => false).handle(handler2);

      const event = await new EventBuilder().create();

      await flow1.get()(event);
      await flow2.get()(event);

      expect(handler1).to.have.been.calledOnce;
      expect(handler2).to.not.have.been.called;
    });

    it('should create a template via static with()', async function () {
      const handler = fake();
      const flow = SimpleFlowBuilder.with({})
        .filter(() => true)
        .handle(handler);

      const handlerFn = flow.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.have.been.calledOnce;
    });
  });

  describe('pipeline composition', function () {
    it('should compose filter -> process -> handle', async function () {
      const handler = fake();
      const processor = async (event: Event) => ({
        ...event,
        data: { ...event.data, processed: true },
      });

      const pipeline = new SimpleFlowBuilder()
        .filter(() => true)
        .process(processor)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.have.been.calledOnce;
      expect(handler.firstCall.args[0].data.processed).to.be.true;
    });

    it('should compose tap -> errorTrap -> handle', async function () {
      const tapHandler = fake();
      const errorHandler = fake();
      const error = new Error('fail');
      const handler = fake.throws(error);

      const pipeline = new SimpleFlowBuilder()
        .tap(tapHandler)
        .errorTrap(errorHandler)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(tapHandler).to.have.been.calledOnce;
      expect(errorHandler).to.have.been.calledOnce;
    });

    it('should compose filter -> split -> handle', async function () {
      const handler = fake();
      const splitter = (event: Event) => [event, event];

      const pipeline = new SimpleFlowBuilder()
        .filter(() => true)
        .split(splitter)
        .handle(handler);

      const handlerFn = pipeline.get();
      const event = await new EventBuilder().create();
      await handlerFn(event);

      expect(handler).to.have.been.calledTwice;
    });
  });
});
