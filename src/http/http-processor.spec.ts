import { expect, use } from 'chai';
import { fake, match } from 'sinon';
import nock from 'nock';
import sinonChai from 'sinon-chai';

import { EventBuilder } from '../event-builder.js';
import { HttpProcessor } from './http-processor.js';

use(sinonChai);

describe('HttpProcessor', function () {
  beforeEach(async function () {
    this.context = {};
    this.context.responseEvent = await EventBuilder.create({ key: 'value' });
    this.context.scope = nock('http://test.local/')
      .post('/')
      .reply(200, JSON.stringify(this.context.responseEvent));
  });

  afterEach(function () {
    delete this.context;
    nock.cleanAll();
  });

  it('should return the response event', async function () {
    const processor = new HttpProcessor({
      url: 'http://test.local/',
      deserializer: async (response: Response) =>
        JSON.parse(await response.text()),
    });
    const event = await new EventBuilder().create();
    const response = await processor.process(event);

    expect(response).to.deep.equal(this.context.responseEvent);
    expect(this.context.scope.isDone()).to.be.true;
  });

  it('should emit event:received on receiving the event', async function () {
    const processor = new HttpProcessor({ url: 'http://test.local/' });
    const listener = fake();
    processor.on('event:processed', listener);

    const event = await new EventBuilder().create();
    await processor.process(event);

    expect(listener.calledOnceWith(match(this.context.responseEvent))).to.be
      .true;
    expect(this.context.scope.isDone()).to.be.true;
  });

  it('should emit event:processed on delivering the event', async function () {
    const processor = new HttpProcessor({ url: 'http://test.local/' });
    const listener = fake();
    processor.on('event:processed', listener);

    const event = await new EventBuilder().create();
    await processor.process(event);

    expect(listener).to.have.been.calledOnceWith(this.context.responseEvent);
    expect(this.context.scope.isDone()).to.be.true;
  });
});
