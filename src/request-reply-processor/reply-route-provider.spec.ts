import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { EventBuilder } from '../event-builder.js';
import { ReplyRouteProvider } from './reply-route-provider.js';

use(chaiAsPromised);

describe('ReplyRouteProvider', function () {
  describe('create', function () {
    it('should return a PromiseChannel function', async function () {
      const provider = new ReplyRouteProvider();
      const channel = provider.create('test');

      expect(channel).to.be.a('object');
      expect(channel.constructor.name).to.equal('PromiseChannel');
    });
  });

  describe('values', function () {
    it('should yield the channel handler', async function () {
      const event = await EventBuilder.create();
      const reply = await new EventBuilder({
        headers: { replyTo: [event.id] },
      }).create();
      const provider = new ReplyRouteProvider();
      const channel = provider.create(event.id);

      const handlers = [];
      for await (const handler of provider.values(reply)) {
        handlers.push(handler);
      }

      expect(handlers).to.have.length(1);

      handlers[0](reply);

      const result = await channel.get();
      expect(result).to.equal(reply);
    });

    it('should throw if no channel is found for the event', async function () {
      const event = await EventBuilder.create();
      const reply = await new EventBuilder({
        headers: { replyTo: [event.id] },
      }).create();
      const provider = new ReplyRouteProvider();

      const iter = provider.values(reply);
      await expect(iter.next()).to.be.rejectedWith(
        `No channel found for event with id: ${event.id}`,
      );
    });
  });

  describe('delete', function () {
    it('should delete the channel', async function () {
      const event = await EventBuilder.create();
      const reply = await new EventBuilder({
        headers: { replyTo: [event.id] },
      }).create();
      const provider = new ReplyRouteProvider();
      provider.create(event.id);

      provider.delete(event.id);

      const iter = provider.values(reply);
      await expect(iter.next()).to.be.rejectedWith(
        `No channel found for event with id: ${event.id}`,
      );
    });
  });
});
