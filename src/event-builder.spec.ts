import { expect } from 'chai';

import { Event } from './types/index.js';
import { EventBuilder } from './event-builder.js';

type TestEventType = 'TestEvent';
type TestEventData = {
  value: string;
};
type TestEvent = Event & {
  type: TestEventType;
  data: TestEventData;
};

describe('EventBuilder', function () {
  describe('without type', function () {
    it('should create an event', function () {
      const eventBuilder = new EventBuilder();
      const event = eventBuilder.create();
      expect(event.type).to.equal('Event');
    });

    it('should create an event with a uuid id', function () {
      const eventBuilder = new EventBuilder();
      const event = eventBuilder.create();
      expect(event.id).to.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should create an event with data', function () {
      const eventBuilder = new EventBuilder();
      const event = eventBuilder.create({ value: 'test' });
      expect(event.data?.value).to.equal('test');
    });

    it('should create data from a provided function', function () {
      const eventBuilder = new EventBuilder();
      const event = eventBuilder.create({ value: () => 'test' });
      expect(event.data?.value).to.equal('test');
    });

    it('should permit data to be provided in the constructor', function () {
      const eventBuilder = new EventBuilder({ data: { value: 'test' } });
      const event = eventBuilder.create();
      expect(event.data?.value).to.equal('test');
    });

    it('should override data provided in the constructor', function () {
      const eventBuilder = new EventBuilder({ data: { value: 'test' } });
      const event = eventBuilder.create({ value: 'test2' });
      expect(event.data?.value).to.equal('test2');
    });

    it('should permit headers to be provided in the constructor', function () {
      const eventBuilder = new EventBuilder({ headers: { id: 'test' } });
      const event = eventBuilder.create();
      expect(event.id).to.equal('test');
    });
  });

  describe('with type', function () {
    it('should create an event', function () {
      const eventBuilder = new EventBuilder<TestEvent>({ type: 'TestEvent' });
      const event = eventBuilder.create({ value: 'test' });
      expect(event.type).to.equal('TestEvent');
      expect(event.data.value).to.equal('test');
    });

    it('should permit data to be provided in the constructor', function () {
      const eventBuilder = new EventBuilder<TestEvent>({
        type: 'TestEvent',
        data: { value: 'test' },
      });
      const event = eventBuilder.create();
      expect(event.data.value).to.equal('test');
    });

    it('should permit data to be provided in the constructor and create', function () {
      const eventBuilder = new EventBuilder<TestEvent>({ type: 'TestEvent' });
      const event = eventBuilder.create({ value: 'test' });
      expect(event.data.value).to.equal('test');
    });
  });

  describe('with() method', function () {
    it('should create an event', function () {
      const eventBuilder = new EventBuilder();
      const event = eventBuilder.with({ data: { value: 'test' } }).create();
      expect(event.data.value).to.equal('test');
    });

    it('should override data', function () {
      const eventBuilder = new EventBuilder({ data: { value: 'test' } });
      const event = eventBuilder.with({ data: { value: 'test2' } }).create();
      expect(event.data.value).to.equal('test2');
    });
  });

  describe('from() method', function () {
    it('should copy id from event to parentId', function () {
      const eventBuilder = new EventBuilder();
      const event = eventBuilder.create();
      const event2 = eventBuilder.from(event).create();
      expect(event2.parentId).to.equal(event.id);
    });

    it('should copy parentId from event to parentId', function () {
      const eventBuilder = new EventBuilder();
      const event = eventBuilder
        .with({ headers: { parentId: 'test' } })
        .create();
      const event2 = eventBuilder.from(event).create();
      expect(event2.parentId).to.equal('test');
    });

    it('should copy data from event', function () {
      const eventBuilder = new EventBuilder<TestEvent>({
        copyableData: ['value'],
      });
      const event = eventBuilder.create({ value: 'test' });
      const event2 = eventBuilder.from(event).create();
      expect(event2.data.value).to.equal('test');
    });

    it('should allow any copyable data for non-typed events', function () {
      const eventBuilder = new EventBuilder({
        copyableData: ['value'],
      });
      const event = eventBuilder.create({ value: 'test' });
      const event2 = eventBuilder.from(event).create();
      expect(event2.data.value).to.equal('test');
    });

    it('should override data from event', function () {
      const eventBuilder = new EventBuilder<TestEvent>({
        copyableData: ['value', 'blah'],
      });
      const event = eventBuilder.create({ value: 'test' });
      const event2 = eventBuilder.from(event).create({ value: 'test2' });
      expect(event2.data.value).to.equal('test2');
    });

    it('should copy data from event regardless of type', function () {
      const event = new EventBuilder().create({ value: 'test' });
      const eventBuilder = new EventBuilder<TestEvent>({
        copyableData: ['value'],
      });
      const event2 = eventBuilder.from(event).create();
      expect(event2.data.value).to.equal('test');
    });

    it('should copy id to parentId from event regardless of type', function () {
      const event = new EventBuilder().create();
      const eventBuilder = new EventBuilder<TestEvent>();
      const event2 = eventBuilder.from(event).create();
      expect(event2.parentId).to.equal(event.id);
    });
  });

  describe('clone() method', function () {
    it('should create a new event with a new id', function () {
      const event = new EventBuilder().create();
      const event2 = EventBuilder.clone(event);
      expect(event2.id).to.not.equal(event.id);
    });

    it('should copy parentId from event to parentId', function () {
      const event = new EventBuilder().create();
      const event2 = EventBuilder.clone(event);
      expect(event2.parentId).to.equal(event.id);
    });

    it('should copy data from event', function () {
      const event = new EventBuilder().create({ value: 'test' });
      const event2 = EventBuilder.clone(event);
      expect(event2.data.value).to.equal('test');
    });

    it('should copy the type from the event', function () {
      const TestEventBuilder = new EventBuilder<TestEvent>({
        type: 'TestEvent',
      });
      const event = TestEventBuilder.create({ value: 'test' });
      const event2 = EventBuilder.clone(event);
      expect(event2.type).to.equal(event.type);
    });
  });

  describe('static from() method', function () {
    it('should copy id from event to parentId', function () {
      const event = EventBuilder.create();
      const event2 = EventBuilder.from(event).create();
      expect(event2.parentId).to.equal(event.id);
    });

    it('should copy parentId from event to parentId', function () {
      const event = EventBuilder.with({
        headers: { parentId: 'test' },
      }).create();
      const event2 = EventBuilder.from(event).create();
      expect(event2.parentId).to.equal('test');
    });

    it('should copy data from event', function () {
      const event = EventBuilder.create({ value: 'test' });
      const event2 = EventBuilder.from(event).create();
      expect(event2.data.value).to.equal('test');
    });

    it('should copy the type from the event', function () {
      const TestEventBuilder = new EventBuilder<TestEvent>({
        type: 'TestEvent',
      });
      const event = TestEventBuilder.create({ value: 'test' });
      const event2 = EventBuilder.from(event).create();
      expect(event2.type).to.equal(event.type);
    });
  });

  describe('static with() method', function () {
    it('should create an EventBuilder with the provided options', function () {
      const eventBuilder = EventBuilder.with({
        data: { value: 'test' },
        headers: { id: 'test' },
        type: 'TestEvent',
      });
      const event = eventBuilder.create();
      expect(event.data.value).to.equal('test');
      expect(event.id).to.equal('test');
      expect(event.type).to.equal('TestEvent');
    });
  });

  describe('static create() method', function () {
    it('should create an event', function () {
      const event = EventBuilder.create();
      expect(event.type).to.equal('Event');
    });

    it('should create an event with a uuid id', function () {
      const event = EventBuilder.create();
      expect(event.id).to.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should allow attributes to be set', function () {
      const event = EventBuilder.create({ value: 'test' });
      expect(event.data.value).to.equal('test');
    });
  });
});
