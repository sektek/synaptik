import { expect } from 'chai';
import { fake } from 'sinon';

import { EventBuilder } from '../../event-builder.js';
import { ParallelStrategy } from './paralellel-strategy.js';

describe('ParallelStrategy', function () {
  it('should execute all handlers in parallel', async function () {
    const event = await new EventBuilder().create();
    const handler1 = fake();
    const handler2 = fake();
    const strategy = new ParallelStrategy();

    await strategy.execute(event, [handler1, handler2]);

    expect(handler1.calledOnceWith(event)).to.be.true;
    expect(handler2.calledOnceWith(event)).to.be.true;
  });
});
