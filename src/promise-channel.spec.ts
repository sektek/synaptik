import { expect } from 'chai';

import { Event } from './types/event.js';
import { EventBuilder } from './event-builder.js';
import { PromiseChannel } from './promise-channel.js';

describe('PromiseChannel', function () {
  it('should resolve the promise when sending an event', async function () {
    const channel = new PromiseChannel<Event>();
    const event = new EventBuilder().create();
    const promise = channel.get();
    channel.send(event);

    const result = await promise;
    expect(result).to.equal(event);
  });

  it('should emit an event:received event when sending an event', function (done) {
    const channel = new PromiseChannel<Event>();
    const event = new EventBuilder().create();
    channel.on('event:received', value => {
      expect(value).to.equal(event);
      done();
    });
    channel.send(event);
  });

  it('should emit an event:delivered event when sending an event', function (done) {
    const channel = new PromiseChannel<Event>();
    const event = new EventBuilder().create();
    channel.on('event:delivered', value => {
      expect(value).to.equal(event);
      done();
    });
    channel.send(event);
  });
});
