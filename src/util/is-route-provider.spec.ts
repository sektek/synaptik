// Tests for isRouteProvider using chai

import { expect } from 'chai';

import { RouteProvider } from '../types/index.js';
import { isRouteProvider } from './is-route-provider.js';

describe('isRouteProvider', function () {
  it('should return true for a route provider', function () {
    class TestRouteProvider implements RouteProvider {
      async get() {
        return async () => '';
      }
    }

    expect(isRouteProvider(new TestRouteProvider())).to.be.true;
  });

  it('should return true for an object with a get method', function () {
    const obj = {
      get() {
        return async () => '';
      },
    };

    expect(isRouteProvider(obj)).to.be.true;
  });

  it('should return false for a non-route provider', function () {
    expect(isRouteProvider({})).to.be.false;
  });

  it('should return false for a primitive', function () {
    expect(isRouteProvider(1)).to.be.false;
  });

  it('should return false for null', function () {
    expect(isRouteProvider(null)).to.be.false;
  });

  it('should return false for undefined', function () {
    expect(isRouteProvider(undefined)).to.be.false;
  });

  it('should return false for a function', function () {
    expect(isRouteProvider(() => {})).to.be.false;
  });
});
