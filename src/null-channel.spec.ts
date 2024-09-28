import { expect } from 'chai';

import { EventBuilder } from './event-builder.js';
import { NullChannel } from './null-channel.js';

describe('NullChannel', function () {
  it('should emit an event:received event when getting an event', function (done) {
    const channel = new NullChannel();
    channel.on('event:received', value => {
      expect(value).to.be.undefined;
      done();
    });
    channel.send(new EventBuilder().create());
  });

  it('should emit an event:delivered event when getting an event', function (done) {
    const channel = new NullChannel();
    channel.on('event:delivered', value => {
      expect(value).to.be.undefined;
      done();
    });
    channel.send(new EventBuilder().create());
  });
});
