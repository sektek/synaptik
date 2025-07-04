import { expect } from 'chai';

import { Event } from './types/index.js';
import { EventBuilder } from './event-builder.js';

type TestEventType = 'TestEvent';
type TestEventData = {
  value: string;
};
type TestEvent = Event<TestEventData> & {
  type: TestEventType;
};

describe('EventBuilder', function () {
  describe('without type', function () {
    it('should create an event', async function () {
      const eventBuilder = new EventBuilder();
      const event = await eventBuilder.create();
      expect(event.type).to.equal('Event');
    });

    it('should create an event with a uuid id', async function () {
      const eventBuilder = new EventBuilder();
      const event = await eventBuilder.create();
      expect(event.id).to.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should create an event with data', async function () {
      const eventBuilder = new EventBuilder();
      const event = await eventBuilder.create({ value: 'test' });
      expect(event.data?.value).to.equal('test');
    });

    it('should create data from a provided function', async function () {
      const eventBuilder = new EventBuilder();
      const event = await eventBuilder.create({ value: () => 'test' });
      expect(event.data?.value).to.equal('test');
    });

    it('should permit data to be provided in the constructor', async function () {
      const eventBuilder = new EventBuilder({ defaults: { value: 'test' } });
      const event = await eventBuilder.create();
      expect(event.data?.value).to.equal('test');
    });

    it('should override data provided in the constructor', async function () {
      const eventBuilder = new EventBuilder({ defaults: { value: 'test' } });
      const event = await eventBuilder.create({ value: 'test2' });
      expect(event.data?.value).to.equal('test2');
    });
  });

  describe('with type', function () {
    it('should create an event', async function () {
      const eventBuilder = new EventBuilder<TestEvent>({ type: 'TestEvent' });
      const event = await eventBuilder.create({ value: 'test' });
      expect(event.type).to.equal('TestEvent');
      expect(event.data.value).to.equal('test');
    });

    it('should permit data to be provided in the constructor', async function () {
      const eventBuilder = new EventBuilder<TestEvent>({
        type: 'TestEvent',
        defaults: { value: 'test' },
      });
      const event = await eventBuilder.create();
      expect(event.data.value).to.equal('test');
    });

    it('should permit data to be provided in the constructor and create', async function () {
      const eventBuilder = new EventBuilder<TestEvent>({ type: 'TestEvent' });
      const event = await eventBuilder.create({ value: 'test' });
      expect(event.data.value).to.equal('test');
    });
  });

  describe('with() method', function () {
    it('should create an event', async function () {
      const eventBuilder = new EventBuilder();
      const event = await eventBuilder.with({ value: 'test' }).create();
      expect(event.data.value).to.equal('test');
    });

    it('should override data', async function () {
      const eventBuilder = new EventBuilder({ defaults: { value: 'test' } });
      const event = await eventBuilder.with({ value: 'test2' }).create();
      expect(event.data.value).to.equal('test2');
    });
  });

  describe('from() method', function () {
    it('should copy id from event to parentId', async function () {
      const eventBuilder = new EventBuilder();
      const event = await eventBuilder.create();
      const event2 = await eventBuilder.from(event).create();
      expect(event2.parentId).to.equal(event.id);
    });

    it('should copy parentId from event to parentId', async function () {
      const eventBuilder = new EventBuilder();
      const event = await eventBuilder
        .withHeaders({ parentId: 'test' })
        .create();
      const event2 = await eventBuilder.from(event).create();
      expect(event2.parentId).to.equal('test');
    });

    it('should copy data from event', async function () {
      const eventBuilder = new EventBuilder<TestEvent>({
        copyKeys: ['value'],
      });
      const event = await eventBuilder.create({ value: 'test' });
      const event2 = await eventBuilder.from(event).create();
      expect(event2.data.value).to.equal('test');
    });

    it('should allow any copyable data for non-typed events', async function () {
      const eventBuilder = new EventBuilder({
        copyKeys: ['value'],
      });
      const event = await eventBuilder.create({ value: 'test' });
      const event2 = await eventBuilder.from(event).create();
      expect(event2.data.value).to.equal('test');
    });

    it('should override data from event', async function () {
      const eventBuilder = new EventBuilder<TestEvent>({
        copyKeys: ['value'],
      });
      const event = await eventBuilder.create({ value: 'test' });
      const event2 = await eventBuilder.from(event).create({ value: 'test2' });
      expect(event2.data.value).to.equal('test2');
    });

    it('should copy data from event regardless of type', async function () {
      const event = await new EventBuilder().create({ value: 'test' });
      const eventBuilder = new EventBuilder<TestEvent>({
        copyKeys: ['value'],
      });
      const event2 = await eventBuilder.from(event).create();
      expect(event2.data.value).to.equal('test');
    });

    it('should copy id to parentId from event regardless of type', async function () {
      const event = await new EventBuilder().create();
      const eventBuilder = new EventBuilder<TestEvent>();
      const event2 = await eventBuilder.from(event).create();
      expect(event2.parentId).to.equal(event.id);
    });
  });

  describe('clone() method', function () {
    it('should create a new event with a new id', async function () {
      const event = await new EventBuilder().create();
      const event2 = await EventBuilder.clone(event);
      expect(event2.id).to.not.equal(event.id);
    });

    it('should copy parentId from event to parentId', async function () {
      const event = await new EventBuilder().create();
      const event2 = await EventBuilder.clone(event);
      expect(event2.parentId).to.equal(event.id);
    });

    it('should copy data from event', async function () {
      const event = await new EventBuilder().create({ value: 'test' });
      const event2 = await EventBuilder.clone(event);
      expect(event2.data.value).to.equal('test');
    });

    it('should copy the type from the event', async function () {
      const TestEventBuilder = new EventBuilder<TestEvent>({
        type: 'TestEvent',
      });
      const event = await TestEventBuilder.create({ value: 'test' });
      const event2 = await EventBuilder.clone(event);
      expect(event2.type).to.equal(event.type);
    });
  });

  describe('static from() method', function () {
    it('should copy id from event to parentId', async function () {
      const event = await EventBuilder.create();
      const event2 = await EventBuilder.from(event).create();
      expect(event2.parentId).to.equal(event.id);
    });

    it('should copy parentId from event to parentId', async function () {
      const event = await EventBuilder.with({
        headers: { parentId: 'test' },
      }).create();
      const event2 = await EventBuilder.from(event).create();
      expect(event2.parentId).to.equal('test');
    });

    it('should copy data from event', async function () {
      const event = await EventBuilder.create({ value: 'test' });
      const event2 = await EventBuilder.from(event).create();
      expect(event2.data.value).to.equal('test');
    });

    it('should copy the type from the event', async function () {
      const TestEventBuilder = new EventBuilder<TestEvent>({
        type: 'TestEvent',
      });
      const event = await TestEventBuilder.create({ value: 'test' });
      const event2 = await EventBuilder.from(event).create();
      expect(event2.type).to.equal(event.type);
    });
  });

  describe('static with() method', function () {
    it('should create an EventBuilder with the provided options', async function () {
      const eventBuilder = EventBuilder.with({
        defaults: { value: 'test' },
        headers: { id: 'test' },
        type: 'TestEvent',
      });
      const event = await eventBuilder.create();
      expect(event.data.value).to.equal('test');
      expect(event.id).to.equal('test');
      expect(event.type).to.equal('TestEvent');
    });
  });

  describe('static create() method', function () {
    it('should create an event', async function () {
      const event = await EventBuilder.create();
      expect(event.type).to.equal('Event');
    });

    it('should create an event with a uuid id', async function () {
      const event = await EventBuilder.create();
      expect(event.id).to.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should allow attributes to be set', async function () {
      const event = await EventBuilder.create({ value: 'test' });
      expect(event.data.value).to.equal('test');
    });
  });
});
