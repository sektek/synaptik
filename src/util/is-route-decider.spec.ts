import { expect } from 'chai';

import { RouteDecider } from '../types/index.js';
import { isRouteDecider } from './is-route-decider.js';

describe('isRouteDecider', function () {
  it('should return true for a route decider', function () {
    class TestRouteDecider implements RouteDecider {
      async get() {
        return '';
      }
    }

    expect(isRouteDecider(new TestRouteDecider())).to.be.true;
  });

  it('should return true for an object with a get method', function () {
    const obj = {
      get() {
        return '';
      },
    };

    expect(isRouteDecider(obj)).to.be.true;
  });

  it('should return false for a non-route decider', function () {
    expect(isRouteDecider({})).to.be.false;
  });

  it('should return false for a primitive', function () {
    expect(isRouteDecider(1)).to.be.false;
  });

  it('should return false for null', function () {
    expect(isRouteDecider(null)).to.be.false;
  });

  it('should return false for undefined', function () {
    expect(isRouteDecider(undefined)).to.be.false;
  });

  it('should return false for a function', function () {
    expect(isRouteDecider(() => {})).to.be.false;
  });
});
