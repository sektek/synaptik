import { expect } from 'chai';

import { Event } from './types/index.js';

import { EventBuilder } from './event-builder.js';
import { FieldExtractor } from './field-extractor.js';

describe('FieldExtractor', function () {
  it('should extract a top-level field', async function () {
    const event = await new EventBuilder().create({ name: 'widget' });
    const extractor = new FieldExtractor<string>({ field: 'name' });

    expect(await extractor.get(event)).to.equal('widget');
  });

  it('should extract a nested field', async function () {
    const event = await new EventBuilder().create({
      customer: { address: { city: 'Toronto' } },
    });
    const extractor = new FieldExtractor<string>({
      field: 'customer.address.city',
    });

    expect(await extractor.get(event)).to.equal('Toronto');
  });

  it('should extract a field by array index', async function () {
    const event = await new EventBuilder().create({
      items: [{ sku: 'a' }, { sku: 'b' }],
    });
    const extractor = new FieldExtractor<string>({ field: 'items[1].sku' });

    expect(await extractor.get(event)).to.equal('b');
  });

  it('should extract a non-primitive value', async function () {
    const tags = ['x', 'y'];
    const event = await new EventBuilder().create({ tags });
    const extractor = new FieldExtractor<string[]>({ field: 'tags' });

    expect(await extractor.get(event)).to.deep.equal(tags);
  });

  it('should return undefined when the field does not exist', async function () {
    const event = await new EventBuilder().create({ name: 'widget' });
    const extractor = new FieldExtractor<string>({ field: 'missing.field' });

    expect(await extractor.get(event)).to.be.undefined;
  });

  it('should return undefined when a nested path is missing', async function () {
    const event = await new EventBuilder().create({ customer: {} });
    const extractor = new FieldExtractor<string>({
      field: 'customer.address.city',
    });

    expect(await extractor.get(event)).to.be.undefined;
  });

  it('should return null when the field is null', async function () {
    const event: Event = { id: 'e-1', type: 'Event', data: { name: null } };
    const extractor = new FieldExtractor<string>({ field: 'name' });

    expect(await extractor.get(event)).to.be.null;
  });
});
