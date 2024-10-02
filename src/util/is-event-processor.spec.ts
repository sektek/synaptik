import { expect } from 'chai';

import EventEmitter from 'events';

import { Event, EventChannel, EventProcessor } from '../types/index.js';
import { isEventProcessor } from './is-event-processor.js';

describe('isEventHandler', function () {
  it('should return true for an EventProcessor', function () {
    class TestEventProcessor implements EventProcessor {
      async process() {
        return {} as Event;
      }
    }

    expect(isEventProcessor(new TestEventProcessor())).to.be.true;
  });

  it('should return true for an object with a process method', function () {
    const obj = {
      process() {
        return {} as Event;
      },
    };

    expect(isEventProcessor(obj)).to.be.true;
  });

  it('should return false for an EventChannel', function () {
    class TestEventChannel extends EventEmitter implements EventChannel {
      async send() {
        return;
      }
    }

    expect(isEventProcessor(new TestEventChannel())).to.be.false;
  });

  it('should return false for a non-event handler', function () {
    expect(isEventProcessor({})).to.be.false;
  });

  it('should return false for a primitive', function () {
    expect(isEventProcessor(1)).to.be.false;
  });

  it('should return false for null', function () {
    expect(isEventProcessor(null)).to.be.false;
  });

  it('should return false for undefined', function () {
    expect(isEventProcessor(undefined)).to.be.false;
  });

  it('should return false for a function', function () {
    expect(isEventProcessor(() => {})).to.be.false;
  });
});
