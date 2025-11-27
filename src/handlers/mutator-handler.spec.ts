import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Event } from '../types/index.js';
import { EventBuilder } from '../event-builder.js';

import { MutatorHandler } from './mutator-handler.js';

use(chaiAsPromised);
use(sinonChai);

describe('MutatorHandler', function () {
  it('should store the event with the id as key by default', async function () {
    const event = await new EventBuilder().create();
    const store = new Map<string, Event>();
    const handler = new MutatorHandler<Event, string, Event>({
      mutator: store,
    });

    await handler.handle(event);

    expect(store.get(event.id)).to.equal(event);
  });

  it('should store using a custom keyExtractor', async function () {
    const event = await EventBuilder.create({ key: 'custom-key' });
    const store = new Map<string, Event>();
    const handler = new MutatorHandler<Event, string, Event>({
      mutator: store,
      keyExtractor: event => event.data.key as string,
    });

    await handler.handle(event);

    expect(store.get('custom-key')).to.equal(event);
  });

  it('should store using a custom valueExtractor', async function () {
    const event = await EventBuilder.create({ value: 'custom-value' });
    const store = new Map<string, string>();
    const handler = new MutatorHandler<Event, string, string>({
      mutator: store,
      valueExtractor: event => event.data.value as string,
    });

    await handler.handle(event);

    expect(store.get(event.id)).to.equal('custom-value');
  });

  it('should emit event:received when handling an event', async function () {
    const event = await new EventBuilder().create();
    const store = new Map<string, Event>();
    const handler = new MutatorHandler<Event, string, Event>({
      mutator: store,
    });
    const eventListener = sinon.fake();
    handler.on('event:received', eventListener);

    await handler.handle(event);

    expect(eventListener).to.have.been.calledOnceWithExactly(event);
  });

  it('should emit event:handled after handling an event', async function () {
    const event = await new EventBuilder().create();
    const store = new Map<string, Event>();
    const handler = new MutatorHandler<Event, string, Event>({
      mutator: store,
    });
    const eventListener = sinon.fake();
    handler.on('event:handled', eventListener);

    await handler.handle(event);

    expect(eventListener).to.have.been.calledOnceWithExactly(event);
  });

  it('should emit event:error if an error occurs during handling', async function () {
    const event = await new EventBuilder().create();
    const faultyMutator = {
      set: async () => {
        throw new Error('Mutator error');
      },
    };
    const handler = new MutatorHandler<Event, string, Event>({
      mutator: faultyMutator,
    });
    const errorListener = sinon.fake();
    handler.on('event:error', errorListener);

    await expect(handler.handle(event)).to.be.rejectedWith('Mutator error');

    expect(errorListener).to.have.been.calledOnceWith(
      event,
      sinon.match.instanceOf(Error),
    );
  });
});
