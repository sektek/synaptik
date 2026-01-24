import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Event } from '../types/index.js';
import { EventBuilder } from '../event-builder.js';

import { TaskExecutionHandler } from './task-execution-handler.js';

use(chaiAsPromised);
use(sinonChai);

describe('TaskExecutionHandler', function () {
  it('should throw an error if neither task nor taskProvider is provided', function () {
    expect(() => new TaskExecutionHandler<Event>({})).to.throw(
      'Either task or taskProvider must be provided to TaskExecutionHandler',
    );
  });

  it('should execute the provided task function when handling an event', async function () {
    const taskFn = sinon.fake();
    const handler = new TaskExecutionHandler<Event>({
      task: taskFn,
    });

    const event = await EventBuilder.create({ key: 'value' });

    await handler.handle(event);

    expect(taskFn).to.have.been.calledOnceWithExactly(undefined);
  });

  it('should execute the task provided by the taskProvider', async function () {
    const taskFn = sinon.fake();
    const taskProvider = () => taskFn;
    const handler = new TaskExecutionHandler<Event>({
      taskProvider: taskProvider,
    });

    const event = await EventBuilder.create({ key: 'value' });

    await handler.handle(event);

    expect(taskFn).to.have.been.calledOnceWithExactly(undefined);
  });

  it('should use the provided context when executing the task', async function () {
    const taskFn = sinon.fake();
    const handler = new TaskExecutionHandler<Event, { userId: string }>({
      task: taskFn,
      context: { userId: '123' },
    });

    const event = await EventBuilder.create({});

    await handler.handle(event);

    expect(taskFn).to.have.been.calledOnceWithExactly({ userId: '123' });
  });

  it('should use the context provided by the contextProvider', async function () {
    const taskFn = sinon.fake();
    const contextProvider = () => ({ userId: '456' });
    const handler = new TaskExecutionHandler<Event, { userId: string }>({
      task: taskFn,
      contextProvider: contextProvider,
    });

    const event = await EventBuilder.create({});

    await handler.handle(event);

    expect(taskFn).to.have.been.calledOnceWithExactly({ userId: '456' });
  });

  it('should emit event:received when handling an event', async function () {
    const taskFn = sinon.fake();
    const handler = new TaskExecutionHandler<Event>({
      task: taskFn,
    });
    const eventListener = sinon.fake();
    handler.on('event:received', eventListener);

    const event = await EventBuilder.create({});

    await handler.handle(event);

    expect(eventListener).to.have.been.calledOnceWithExactly(event);
  });

  it('should emit event:processed after handling an event', async function () {
    const taskFn = sinon.fake();
    const handler = new TaskExecutionHandler<Event>({
      task: taskFn,
    });
    const eventListener = sinon.fake();
    handler.on('event:processed', eventListener);

    const event = await EventBuilder.create({});

    await handler.handle(event);

    expect(eventListener).to.have.been.calledOnceWithExactly(event);
  });

  it('should emit event:error if an error occurs during handling', async function () {
    const error = new Error('Task failed');
    const taskFn = sinon.fake.throws(error);
    const handler = new TaskExecutionHandler<Event>({
      task: taskFn,
    });
    const eventListener = sinon.fake();
    handler.on('event:error', eventListener);

    const event = await EventBuilder.create({});

    await expect(handler.handle(event)).to.eventually.be.rejectedWith(error);

    expect(eventListener).to.have.been.calledOnceWith(error, event);
  });
});
