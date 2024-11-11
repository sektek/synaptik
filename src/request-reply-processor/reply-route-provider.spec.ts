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

  describe('get', function () {
    it('should return the channel', async function () {
      const event = await EventBuilder.create();
      const reply = await new EventBuilder({
        headers: { replyTo: [event.id] },
      }).create();
      const provider = new ReplyRouteProvider();
      const channel = provider.create(event.id);

      provider.get(reply)(reply);

      const result = await channel.get();
      expect(result).to.equal(reply);
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

      expect(() => provider.get(reply)).to.throw(
        `No channel found for event with id: ${event.id}`,
      );
    });
  });
});
