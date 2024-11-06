import { expect } from 'chai';

import { EventBuilder } from '../event-builder.js';
import { NullChannel } from './null-channel.js';

describe('NullChannel', function () {
  it('should emit an event:received event when getting an event', async function () {
    const channel = new NullChannel();
    const event = await new EventBuilder().create();
    channel.on('event:received', value => {
      expect(value).to.be.equal(event);
    });
    await channel.send(event);
  });
});
