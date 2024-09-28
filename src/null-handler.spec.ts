import { expect } from 'chai';

import { EventBuilder } from './event-builder.js';
import { NullHandler } from './null-handler.js';

describe('NullHandler', function () {
  it('should emit an event:received event when handling an event', function (done) {
    const handler = new NullHandler();
    const event = new EventBuilder().create();
    handler.on('event:received', value => {
      expect(value).to.equal(event);
      done();
    });
    handler.handle(event);
  });

  it('should emit an event:processed event when handling an event', function (done) {
    const handler = new NullHandler();
    const event = new EventBuilder().create();
    handler.on('event:processed', (value, result) => {
      expect(value).to.equal(event);
      expect(result).to.be.undefined;
      done();
    });
    handler.handle(event);
  });
});
