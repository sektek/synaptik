import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { fake } from 'sinon';
import sinonChai from 'sinon-chai';

import { EventBuilder } from '../event-builder.js';

import { ErrorTrapChannel } from './error-trap-channel.js';

use(chaiAsPromised);
use(sinonChai);

describe('ErrorTrapChannel', function () {
  it('swallows errors thrown by the handler by default', async function () {
    const handler = fake.throws(new Error('Test error'));
    const errorTrap = new ErrorTrapChannel({ handler });
    const event = await EventBuilder.create();

    expect(errorTrap.send(event)).to.eventually.be.fulfilled;
    expect(handler).to.have.been.calledOnceWith(event);
  });

  it('rethrows the error when rethrow is true', async function () {
    const error = new Error('Test error');
    const handler = fake.throws(error);
    const errorTrap = new ErrorTrapChannel({ handler, rethrow: true });
    const event = await EventBuilder.create();

    expect(errorTrap.send(event)).to.eventually.be.rejectedWith(error);
    expect(handler).to.have.been.calledOnceWith(event);
  });

  describe('errorHandler', function () {
    it('should be called when an error occurs', async function () {
      const error = new Error('Test error');
      const handler = fake.throws(error);
      const errorHandler = fake();
      const errorTrap = new ErrorTrapChannel({ handler, errorHandler });
      const event = await EventBuilder.create();

      await errorTrap.send(event);

      expect(handler).to.have.been.calledOnceWith(event);
      expect(errorHandler).to.have.been.calledOnceWith(event, error);
    });

    it('should be called prior to the error being rethrown', async function () {
      const error = new Error('Test error');
      const handler = fake.throws(error);
      const errorHandler = fake();
      const errorTrap = new ErrorTrapChannel({
        handler,
        errorHandler,
        rethrow: true,
      });
      const event = await EventBuilder.create();

      expect(errorTrap.send(event)).to.eventually.be.rejectedWith(error);
      expect(handler).to.have.been.calledOnceWith(event);
      expect(errorHandler).to.have.been.calledOnceWith(event, error);
    });

    it('should not be called when no error occurs', async function () {
      const handler = fake();
      const errorHandler = fake();
      const errorTrap = new ErrorTrapChannel({ handler, errorHandler });
      const event = await EventBuilder.create();

      await errorTrap.send(event);

      expect(handler).to.have.been.calledOnceWith(event);
      expect(errorHandler).to.not.have.been.called;
    });
  });

  describe('events', function () {
    it('should emit an event when an event is received', async function () {
      const handler = fake();
      const eventListener = fake();
      const errorTrap = new ErrorTrapChannel({ handler });
      errorTrap.on('event:received', eventListener);
      const event = await EventBuilder.create();

      await errorTrap.send(event);

      expect(eventListener).to.have.been.calledOnceWith(event);
    });

    it('should emit a delivered event after the event is sent to the handler', async function () {
      const handler = fake();
      const deliveredListener = fake();
      const errorTrap = new ErrorTrapChannel({ handler });
      errorTrap.on('event:delivered', deliveredListener);
      const event = await EventBuilder.create();

      await errorTrap.send(event);

      expect(deliveredListener).to.have.been.calledOnceWith(event);
      expect(handler).to.have.been.calledBefore(deliveredListener);
    });

    it('should not emit an event:delivered if the handler throws an error', async function () {
      const error = new Error('Test error');
      const handler = fake.throws(error);
      const errorTrap = new ErrorTrapChannel({ handler });
      const deliveredListener = fake();
      errorTrap.on('event:delivered', deliveredListener);
      const event = await EventBuilder.create();

      await errorTrap.send(event);

      expect(deliveredListener).to.not.have.been.called;
    });

    it('should emit an error event when an error is thrown', async function () {
      const error = new Error('Test error');
      const handler = fake.throws(error);
      const errorTrap = new ErrorTrapChannel({ handler });
      const errorListener = fake();
      errorTrap.on('event:error', errorListener);
      const event = await EventBuilder.create();

      await errorTrap.send(event);

      expect(errorListener).to.have.been.calledOnceWith(event, error);
    });

    it('should not emit an event:error when no error occurs', async function () {
      const handler = fake();
      const errorTrap = new ErrorTrapChannel({ handler });
      const errorListener = fake();
      errorTrap.on('event:error', errorListener);
      const event = await EventBuilder.create();

      await errorTrap.send(event);

      expect(errorListener).to.not.have.been.called;
    });
  });
});
