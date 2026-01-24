import { expect, use } from 'chai';
import { serialExecutionStrategy } from '@sektek/utility-belt';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { EventBuilder } from '../event-builder.js';

import { CompositeEventErrorHandler } from './composite-event-error-handler.js';

use(sinonChai);

describe('CompositeEventErrorHandler', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('should call all error handlers', async function () {
    const handler1 = sinon.spy();
    const handler2 = sinon.spy();
    const errorHandler = new CompositeEventErrorHandler({
      errorHandlers: [handler1, handler2],
    });

    const event = EventBuilder.create();
    const error = new Error('Test error');

    await errorHandler.handle(error, event);

    expect(handler1).to.have.been.calledOnceWith(error, event);
    expect(handler2).to.have.been.calledOnceWith(error, event);
  });

  it('should allow custom execution strategy', async function () {
    const handler1 = sinon.fake();
    const handler2 = sinon.fake();
    const errorHandler = new CompositeEventErrorHandler({
      errorHandlers: [handler1, handler2],
      executionStrategy: serialExecutionStrategy,
    });

    const event = EventBuilder.create();
    const error = new Error('Test error');

    await errorHandler.handle(error, event);

    expect(handler1).to.have.been.calledOnceWith(error, event);
    expect(handler2).to.have.been.calledOnceWith(error, event);
    expect(handler1).to.have.been.calledBefore(handler2);
  });
});
