import { expect } from 'chai';

import { Event } from './types/index.js';

import { EventBuilder } from './event-builder.js';
import { FieldSplitter } from './field-splitter.js';

const collect = async (events: AsyncGenerator<Event>) => {
  const result: Event[] = [];
  for await (const event of events) {
    result.push(event);
  }

  return result;
};

describe('FieldSplitter', function () {
  it('should yield one event per element of an array field, keeping the field an array', async function () {
    const event = await new EventBuilder().create({ items: ['a', 'b', 'c'] });
    const splitter = new FieldSplitter({ field: 'items' });

    const results = await collect(splitter.split(event));

    expect(results.map(e => e.data.items)).to.deep.equal([['a'], ['b'], ['c']]);
  });

  it('should yield a single event when the field is not an array', async function () {
    const event = await new EventBuilder().create({ item: 'a' });
    const splitter = new FieldSplitter({ field: 'item' });

    const results = await collect(splitter.split(event));

    expect(results).to.have.lengthOf(1);
    expect(results[0].data.item).to.equal('a');
  });

  it('should yield a single event when the field is missing', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new FieldSplitter({ field: 'item' });

    const results = await collect(splitter.split(event));

    expect(results).to.have.lengthOf(1);
    expect(results[0].data.item).to.be.undefined;
  });

  it('should yield no events when the field is an empty array', async function () {
    const event = await new EventBuilder().create({ items: [] });
    const splitter = new FieldSplitter({ field: 'items' });

    expect(await collect(splitter.split(event))).to.be.empty;
  });

  it('should split on a nested field', async function () {
    const event = await new EventBuilder().create({
      order: { items: [1, 2] },
    });
    const splitter = new FieldSplitter({ field: 'order.items' });

    const results = await collect(splitter.split(event));

    expect(
      results.map(e => (e.data.order as { items: number[] }).items),
    ).to.deep.equal([[1], [2]]);
  });

  it('should preserve the other data of the original event', async function () {
    const event = await new EventBuilder().create({
      orderId: 'o-1',
      items: ['a', 'b'],
    });
    const splitter = new FieldSplitter({ field: 'items' });

    const results = await collect(splitter.split(event));

    expect(results.map(e => e.data.orderId)).to.deep.equal(['o-1', 'o-1']);
  });

  it('should give each event a new id and set its parentId', async function () {
    const event = await new EventBuilder().create({ items: ['a', 'b'] });
    const splitter = new FieldSplitter({ field: 'items' });

    const results = await collect(splitter.split(event));

    expect(results[0].id).to.not.equal(event.id);
    expect(results[0].id).to.not.equal(results[1].id);
    expect(results.map(e => e.parentId)).to.deep.equal([event.id, event.id]);
  });

  it('should not share data between the split events', async function () {
    const event = await new EventBuilder().create({
      meta: { tags: ['x'] },
      items: ['a', 'b'],
    });
    const splitter = new FieldSplitter({ field: 'items' });

    const results = await collect(splitter.split(event));
    (results[0].data.meta as { tags: string[] }).tags.push('y');

    expect((results[1].data.meta as { tags: string[] }).tags).to.deep.equal([
      'x',
    ]);
  });

  it('should not modify the original event', async function () {
    const event = await new EventBuilder().create({ items: ['a', 'b'] });
    const splitter = new FieldSplitter({ field: 'items' });

    await collect(splitter.split(event));

    expect(event.data.items).to.deep.equal(['a', 'b']);
  });

  it('should use the provided event builder', async function () {
    const event = await new EventBuilder().create({ items: ['a'] });
    const splitter = new FieldSplitter({
      field: 'items',
      eventBuilder: new EventBuilder({ type: 'Split' }),
    });

    const results = await collect(splitter.split(event));

    expect(results[0].type).to.equal('Split');
  });
});
