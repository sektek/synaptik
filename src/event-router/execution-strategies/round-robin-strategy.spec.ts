import { expect } from 'chai';
import { fake } from 'sinon';

import { EventBuilder } from '../../event-builder.js';
import { RoundRobinStrategy } from './round-robin-strategy.js';

describe('RoundRobinStrategy', function () {
  it('should execute all handlers in round-robin', async function () {
    const event = await new EventBuilder().create();
    const handler1 = fake();
    const handler2 = fake();
    const handler3 = fake();
    const strategy = new RoundRobinStrategy();
    await strategy.execute(event, [handler1, handler2, handler3]);

    expect(handler1.calledOnceWith(event)).to.be.true;
    expect(handler2.calledOnceWith(event)).to.be.false;
    expect(handler3.calledOnceWith(event)).to.be.false;

    await strategy.execute(event, [handler1, handler2, handler3]);
    expect(handler1.calledOnceWith(event)).to.be.true;
    expect(handler2.calledOnceWith(event)).to.be.true;
    expect(handler3.calledOnceWith(event)).to.be.false;

    await strategy.execute(event, [handler1, handler2, handler3]);
    expect(handler1.calledOnceWith(event)).to.be.true;
    expect(handler2.calledOnceWith(event)).to.be.true;
    expect(handler3.calledOnceWith(event)).to.be.true;

    await strategy.execute(event, [handler1, handler2, handler3]);
    expect(handler1.callCount).to.equal(2);
    expect(handler2.calledOnceWith(event)).to.be.true;
    expect(handler3.calledOnceWith(event)).to.be.true;
  });
});
