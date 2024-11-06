import { expect } from 'chai';

import { Event } from '../types/index.js';
import { EventBuilder } from '../event-builder.js';
import { PromiseChannel } from './promise-channel.js';

describe('PromiseChannel', function () {
  it('should resolve the promise when sending an event', async function () {
    const channel = new PromiseChannel<Event>();
    const event = await new EventBuilder().create();
    const promise = channel.get();
    channel.send(event);

    const result = await promise;
    expect(result).to.equal(event);
  });

  it('should emit an event:received event when sending an event', async function () {
    const channel = new PromiseChannel<Event>();
    const event = await new EventBuilder().create();
    channel.on('event:received', value => {
      expect(value).to.equal(event);
    });
    await channel.send(event);
  });

  it('should emit an event:delivered event when sending an event', async function () {
    const channel = new PromiseChannel<Event>();
    const event = await new EventBuilder().create();
    channel.on('event:delivered', value => {
      expect(value).to.equal(event);
    });
    await channel.send(event);
  });
});
