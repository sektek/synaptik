import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { Event } from './types/index.js';

import { EventBuilder } from './event-builder.js';
import { IterableProviderSplitter } from './iterable-provider-splitter.js';

use(chaiAsPromised);

const collect = async (events: AsyncGenerator<Event>) => {
  const result: Event[] = [];
  for await (const event of events) {
    result.push(event);
  }

  return result;
};

async function* asyncValues(values: unknown[]) {
  for (const value of values) {
    yield value;
  }
}

describe('IterableProviderSplitter', function () {
  it('should yield one event per value of a sync iterable', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => ['a', 'b', 'c'],
    });

    const results = await collect(splitter.split(event));

    expect(results.map(e => e.data.item)).to.deep.equal(['a', 'b', 'c']);
  });

  it('should yield one event per value of an async iterable', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => asyncValues(['a', 'b']),
    });

    const results = await collect(splitter.split(event));

    expect(results.map(e => e.data.item)).to.deep.equal(['a', 'b']);
  });

  it('should yield one event per value of a promised iterable', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => Promise.resolve(['a', 'b']),
    });

    const results = await collect(splitter.split(event));

    expect(results.map(e => e.data.item)).to.deep.equal(['a', 'b']);
  });

  it('should call the provider with the original event', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const received: Event[] = [];
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: (e: Event) => {
        received.push(e);

        return ['a'];
      },
    });

    await collect(splitter.split(event));

    expect(received).to.have.lengthOf(1);
    expect(received[0]).to.equal(event);
  });

  it('should use a provider object with a values method', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: { values: () => [1, 2] },
    });

    const results = await collect(splitter.split(event));

    expect(results.map(e => e.data.item)).to.deep.equal([1, 2]);
  });

  it('should set the field to the bare value', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => ['a'],
    });

    const results = await collect(splitter.split(event));

    expect(results[0].data.item).to.equal('a');
  });

  it('should set a nested field', async function () {
    const event = await new EventBuilder().create({ order: { id: 'o-1' } });
    const splitter = new IterableProviderSplitter({
      field: 'order.item',
      provider: () => ['a', 'b'],
    });

    const results = await collect(splitter.split(event));

    expect(results.map(e => e.data.order)).to.deep.equal([
      { id: 'o-1', item: 'a' },
      { id: 'o-1', item: 'b' },
    ]);
  });

  it('should preserve the other data of the original event', async function () {
    const event = await new EventBuilder().create({ orderId: 'o-1' });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => ['a', 'b'],
    });

    const results = await collect(splitter.split(event));

    expect(results.map(e => e.data.orderId)).to.deep.equal(['o-1', 'o-1']);
  });

  it('should give each event a new id and set its parentId', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => ['a', 'b'],
    });

    const results = await collect(splitter.split(event));

    expect(results[0].id).to.not.equal(event.id);
    expect(results[0].id).to.not.equal(results[1].id);
    expect(results.map(e => e.parentId)).to.deep.equal([event.id, event.id]);
  });

  it('should not modify the original event', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => ['a'],
    });

    await collect(splitter.split(event));

    expect(event.data).to.deep.equal({ other: 1 });
  });

  it('should not share object values with the provider data', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const source = [{ id: 1 }];
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => source,
    });

    const results = await collect(splitter.split(event));
    (results[0].data.item as { id: number }).id = 99;

    expect(source[0].id).to.equal(1);
  });

  it('should yield no events by default when the provider is empty', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => [],
    });

    expect(await collect(splitter.split(event))).to.be.empty;
  });

  it('should throw when the provider is empty and errorOnEmpty is true', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => asyncValues([]),
      errorOnEmpty: true,
    });

    await expect(collect(splitter.split(event))).to.be.rejectedWith(
      'The provider did not supply any values to split on',
    );
  });

  it('should not throw when values exist and errorOnEmpty is true', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => ['a'],
      errorOnEmpty: true,
    });

    expect(await collect(splitter.split(event))).to.have.lengthOf(1);
  });

  it('should propagate provider errors', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => Promise.reject(new Error('provider failed')),
    });

    await expect(collect(splitter.split(event))).to.be.rejectedWith(
      'provider failed',
    );
  });

  it('should use the provided event builder', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new IterableProviderSplitter({
      field: 'item',
      provider: () => ['a'],
      eventBuilder: new EventBuilder({ type: 'Split' }),
    });

    const results = await collect(splitter.split(event));

    expect(results[0].type).to.equal('Split');
  });
});
