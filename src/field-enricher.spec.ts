import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { Event } from './types/index.js';

import { EventBuilder } from './event-builder.js';
import { FieldEnricher } from './field-enricher.js';

use(chaiAsPromised);

describe('FieldEnricher', function () {
  it('should set a top-level field', async function () {
    const event = await EventBuilder.create({ name: 'widget' });
    const enricher = new FieldEnricher({
      field: 'price',
      provider: () => 42,
    });

    await enricher.process(event);

    expect(event.data.price).to.equal(42);
  });

  it('should set a nested field', async function () {
    const event = await EventBuilder.create({
      customer: { address: { street: 'Main' } },
    });
    const enricher = new FieldEnricher({
      field: 'customer.address.city',
      provider: () => 'Toronto',
    });

    await enricher.process(event);

    expect(event.data.customer).to.deep.equal({
      address: { street: 'Main', city: 'Toronto' },
    });
  });

  it('should create missing intermediate objects', async function () {
    const event = await EventBuilder.create({ name: 'widget' });
    const enricher = new FieldEnricher({
      field: 'customer.address.city',
      provider: () => 'Toronto',
    });

    await enricher.process(event);

    expect(event.data.customer).to.deep.equal({
      address: { city: 'Toronto' },
    });
  });

  it('should accept a provider object with a get method', async function () {
    const event = await EventBuilder.create({ id: 7 });
    const enricher = new FieldEnricher({
      field: 'label',
      provider: { get: (e: Event) => `item-${e.data.id}` },
    });

    await enricher.process(event);

    expect(event.data.label).to.equal('item-7');
  });

  it('should accept an async provider', async function () {
    const event = await EventBuilder.create();
    const enricher = new FieldEnricher({
      field: 'looked.up',
      provider: async () => 'value',
    });

    await enricher.process(event);

    expect(event.data.looked).to.deep.equal({ up: 'value' });
  });

  it('should call the provider with the event', async function () {
    const event = await EventBuilder.create();
    const received: Event[] = [];
    const enricher = new FieldEnricher({
      field: 'x',
      provider: (e: Event) => {
        received.push(e);
        return 1;
      },
    });

    await enricher.process(event);

    expect(received).to.deep.equal([event]);
    expect(received[0]).to.equal(event);
  });

  it('should preserve other data', async function () {
    const event = await EventBuilder.create({ name: 'widget', tags: ['a'] });
    const enricher = new FieldEnricher({
      field: 'price',
      provider: () => 42,
    });

    await enricher.process(event);

    expect(event.data).to.deep.equal({
      name: 'widget',
      tags: ['a'],
      price: 42,
    });
  });

  it('should return the same event instance with its id unchanged', async function () {
    const event = await EventBuilder.create({ name: 'widget' });
    const id = event.id;
    const parentId = event.parentId;
    const enricher = new FieldEnricher({
      field: 'price',
      provider: () => 42,
    });

    const result = await enricher.process(event);

    expect(result).to.equal(event);
    expect(result.id).to.equal(id);
    expect(result.parentId).to.equal(parentId);
  });

  it('should reject when the provider throws', async function () {
    const event = await EventBuilder.create({ name: 'widget' });
    const error = new Error('lookup failed');
    const enricher = new FieldEnricher({
      field: 'price',
      provider: () => {
        throw error;
      },
    });

    await expect(enricher.process(event)).to.be.rejectedWith(error);
    expect(event.data).to.deep.equal({ name: 'widget' });
  });
});
