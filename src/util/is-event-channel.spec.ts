import { expect } from 'chai';

import EventEmitter from 'events';

import { EventChannel, EventHandler } from '../types/index.js';
import { isEventChannel } from './is-event-channel.js';

describe('isEventHandler', function () {
  it('should return true for an event channel', function () {
    class TestEventChannel extends EventEmitter implements EventChannel {
      async send() {
        return;
      }
    }

    expect(isEventChannel(new TestEventChannel())).to.be.true;
  });

  it('should return true for an object with a send method', function () {
    const obj = {
      send() {
        return;
      },
    };

    expect(isEventChannel(obj)).to.be.true;
  });

  it('should return false for an EventHandler', function () {
    class TestEventHandler extends EventEmitter implements EventHandler {
      async handle() {
        return;
      }
    }

    expect(isEventChannel(new TestEventHandler())).to.be.false;
  });

  it('should return false for a non-event handler', function () {
    expect(isEventChannel({})).to.be.false;
  });

  it('should return false for a primitive', function () {
    expect(isEventChannel(1)).to.be.false;
  });

  it('should return false for null', function () {
    expect(isEventChannel(null)).to.be.false;
  });

  it('should return false for undefined', function () {
    expect(isEventChannel(undefined)).to.be.false;
  });

  it('should return false for a function', function () {
    expect(isEventChannel(() => {})).to.be.false;
  });
});
