import { expect } from 'chai';
import { fake } from 'sinon';
import nock from 'nock';

import { EventBuilder } from '../event-builder.js';
import { HttpChannel } from './http-channel.js';

describe('HttpChannel', function () {
  setup(function () {
    nock('http://example.com').post('/api').reply(200);
  });

  teardown(function () {
    nock.cleanAll();
  });

  it('should emit event:received on receiving the event', async function () {
    const channel = new HttpChannel({ url: 'http://example.com/api' });
    const listener = fake();
    channel.on('event:received', listener);

    const event = new EventBuilder().create();
    await channel.send(event);

    expect(listener.calledOnceWith(event)).to.be.true;
  });

  it('should emit event:delivered on delivering the event', async function () {
    const channel = new HttpChannel({ url: 'http://example.com/api' });
    const listener = fake();
    channel.on('event:delivered', listener);

    const event = new EventBuilder().create();
    await channel.send(event);

    expect(listener.calledOnceWith(event)).to.be.true;
  });
});
