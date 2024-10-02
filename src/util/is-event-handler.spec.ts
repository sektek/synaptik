import { expect } from 'chai';

import EventEmitter from 'events';

import { EventChannel, EventHandler } from '../types/index.js';
import { isEventHandler } from './is-event-handler.js';

describe('isEventHandler', function () {
  it('should return true for an event handler', function () {
    class TestEventHandler extends EventEmitter implements EventHandler {
      async handle() {
        return;
      }
    }

    expect(isEventHandler(new TestEventHandler())).to.be.true;
  });

  it('should return true for an object with a handle method', function () {
    const obj = {
      handle() {
        return;
      },
    };

    expect(isEventHandler(obj)).to.be.true;
  });

  it('should return false for an EventChannel', function () {
    class TestEventChannel extends EventEmitter implements EventChannel {
      async send() {
        return;
      }
    }

    expect(isEventHandler(new TestEventChannel())).to.be.false;
  });

  it('should return false for a non-event handler', function () {
    expect(isEventHandler({})).to.be.false;
  });

  it('should return false for a primitive', function () {
    expect(isEventHandler(1)).to.be.false;
  });

  it('should return false for null', function () {
    expect(isEventHandler(null)).to.be.false;
  });

  it('should return false for undefined', function () {
    expect(isEventHandler(undefined)).to.be.false;
  });

  it('should return false for a function', function () {
    expect(isEventHandler(() => {})).to.be.false;
  });
});
