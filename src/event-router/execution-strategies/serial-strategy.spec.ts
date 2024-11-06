import { expect } from 'chai';

import { EventBuilder } from '../../event-builder.js';
import { SerialStrategy } from './serial-strategy.js';

describe('SerialStrategy', function () {
  it('should execute all handlers in serial', async function () {
    const event = await EventBuilder.create();
    let value = 0;
    const handler1 = async () => {
      value = 1;
    };
    const handler2 = async () => {
      expect(value).to.equal(1);
      value = 2;
    };
    const handler3 = async () => {
      expect(value).to.equal(2);
      value = 3;
    };

    const strategy = new SerialStrategy();
    await strategy.execute(event, [handler1, handler2, handler3]);
  });
});
