import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { Event } from './types/index.js';

import { EventBuilder } from './event-builder.js';
import { FieldSplitter } from './field-splitter.js';

use(chaiAsPromised);

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

  it('should throw when the field is missing', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new FieldSplitter({ field: 'item' });

    await expect(collect(splitter.split(event))).to.be.rejectedWith(
      "Field 'item' is not present on the event",
    );
  });

  it('should throw when a nested field is missing', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new FieldSplitter({ field: 'order.items' });

    await expect(collect(splitter.split(event))).to.be.rejectedWith(
      "Field 'order.items' is not present on the event",
    );
  });

  it('should yield a single event without the field when missing and errorOnMissing is false', async function () {
    const event = await new EventBuilder().create({ other: 1 });
    const splitter = new FieldSplitter({
      field: 'order.items',
      errorOnMissing: false,
    });

    const results = await collect(splitter.split(event));

    expect(results).to.have.lengthOf(1);
    expect(results[0].data).to.deep.equal({ other: 1 });
    expect(results[0].parentId).to.equal(event.id);
  });

  it('should yield a single event when the field is null', async function () {
    const event: Event = { id: 'e-1', type: 'Event', data: { item: null } };
    const splitter = new FieldSplitter({ field: 'item' });

    const results = await collect(splitter.split(event));

    expect(results).to.have.lengthOf(1);
    expect(results[0].data.item).to.be.null;
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

  it('should not share split values with the original event', async function () {
    const event = await new EventBuilder().create({
      items: [{ id: 1 }, { id: 2 }],
    });
    const splitter = new FieldSplitter({ field: 'items' });

    const results = await collect(splitter.split(event));
    (results[0].data.items as Array<{ id: number }>)[0].id = 99;

    expect((event.data.items as Array<{ id: number }>)[0].id).to.equal(1);
  });

  it('should not share a scalar object value with the original event', async function () {
    const event = await new EventBuilder().create({ item: { id: 1 } });
    const splitter = new FieldSplitter({ field: 'item' });

    const results = await collect(splitter.split(event));
    (results[0].data.item as { id: number }).id = 99;

    expect((event.data.item as { id: number }).id).to.equal(1);
  });

  it('should keep the other data when the event builder copies those keys', async function () {
    const event = await new EventBuilder().create({
      orderId: 'o-1',
      items: ['a', 'b'],
    });
    const splitter = new FieldSplitter({
      field: 'items',
      eventBuilder: new EventBuilder({ copyKeys: ['orderId'] }),
    });

    const results = await collect(splitter.split(event));

    expect(results.map(e => e.data.orderId)).to.deep.equal(['o-1', 'o-1']);
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
