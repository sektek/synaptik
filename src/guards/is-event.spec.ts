import { expect } from 'chai';

import { Event } from '../types/index.js';
import { isEvent } from './is-event.js';

describe('isEvent', function () {
  const valid: Event = { id: 'e1', type: 'Test', data: { value: 1 } };

  it('should accept a minimal event', function () {
    expect(isEvent(valid)).to.be.true;
  });

  it('should accept an event with parentId and replyTo', function () {
    expect(isEvent({ ...valid, parentId: 'p1', replyTo: ['a', 'b'] })).to.be
      .true;
  });

  it('should accept an empty data object and extra properties', function () {
    expect(isEvent({ ...valid, data: {}, extra: true })).to.be.true;
  });

  it('should accept a parsed JSON round trip of an event', function () {
    expect(isEvent(JSON.parse(JSON.stringify(valid)))).to.be.true;
  });

  it('should reject values that are not objects', function () {
    for (const value of [null, undefined, 'event', 1, true, [valid]]) {
      expect(isEvent(value), String(value)).to.be.false;
    }
  });

  it('should reject a missing or non-string id or type', function () {
    expect(isEvent({ type: 'Test', data: {} })).to.be.false;
    expect(isEvent({ ...valid, id: 1 })).to.be.false;
    expect(isEvent({ id: 'e1', data: {} })).to.be.false;
    expect(isEvent({ ...valid, type: null })).to.be.false;
  });

  it('should reject data that is missing or not an object', function () {
    for (const data of [undefined, null, [], 'x', 1]) {
      expect(isEvent({ id: 'e1', type: 'Test', data }), String(data)).to.be
        .false;
    }
  });

  it('should reject a non-string parentId', function () {
    expect(isEvent({ ...valid, parentId: 1 })).to.be.false;
    expect(isEvent({ ...valid, parentId: null })).to.be.false;
  });

  it('should reject a replyTo that is not an array of strings', function () {
    expect(isEvent({ ...valid, replyTo: 'a' })).to.be.false;
    expect(isEvent({ ...valid, replyTo: ['a', 1] })).to.be.false;
    expect(isEvent({ ...valid, replyTo: null })).to.be.false;
  });
});
