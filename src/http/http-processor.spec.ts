import { expect, use } from 'chai';
import { fake, match } from 'sinon';
import nock from 'nock';
import sinonChai from 'sinon-chai';

import { Event } from '../types/event.js';
import { EventBuilder } from '../event-builder.js';
import { HttpProcessor } from './http-processor.js';

use(sinonChai);

describe('HttpProcessor', function () {
  let responseEvent: Event;
  let scope: nock.Scope;

  beforeEach(async function () {
    responseEvent = await EventBuilder.create({ key: 'value' });
    scope = nock('http://test.local/')
      .post('/')
      .reply(200, JSON.stringify(responseEvent));
  });

  afterEach(function () {
    nock.cleanAll();
  });

  it('should return the response event', async function () {
    const processor = new HttpProcessor({
      url: 'http://test.local/',
    });
    const event = await new EventBuilder().create();
    const response = await processor.process(event);

    expect(response).to.deep.equal(responseEvent);
    expect(scope.isDone()).to.be.true;
  });

  it('should emit event:received on receiving the event', async function () {
    const processor = new HttpProcessor({ url: 'http://test.local/' });
    const listener = fake();
    processor.on('event:processed', listener);

    const event = await new EventBuilder().create();
    await processor.process(event);

    expect(listener.calledOnceWith(event, match(responseEvent))).to.be.true;
    expect(scope.isDone()).to.be.true;
  });

  it('should emit event:processed on delivering the event', async function () {
    const processor = new HttpProcessor({ url: 'http://test.local/' });
    const listener = fake();
    processor.on('event:processed', listener);

    const event = await new EventBuilder().create();
    await processor.process(event);

    expect(listener).to.have.been.calledOnceWith(event, responseEvent);
    expect(scope.isDone()).to.be.true;
  });

  it('should emit event:error on error during processing', async function () {
    const errorScope = nock('http://error.local/')
      .post('/')
      .reply(500, 'Internal Server Error');

    const processor = new HttpProcessor({ url: 'http://error.local/' });
    const listener = fake();
    processor.on('event:error', listener);

    const event = await new EventBuilder().create();
    await expect(processor.process(event)).to.be.rejected;

    expect(listener.calledOnce).to.be.true;
    expect(listener.firstCall.args[0]).to.be.instanceOf(Error);
    expect(listener.firstCall.args[1]).to.equal(event);
    expect(errorScope.isDone()).to.be.true;
  });
});
