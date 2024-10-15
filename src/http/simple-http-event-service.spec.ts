import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';

use(chaiAsPromised);

import { EventBuilder } from '../event-builder.js';
import { SimpleHttpEventService } from './simple-http-event-service.js';

const UUID_REGEX =
  /^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/iu;

describe('SimpleHttpEventService', function () {
  before(function () {
    nock.disableNetConnect();
  });

  afterEach(function () {
    nock.cleanAll();
  });

  after(function () {
    nock.enableNetConnect();
  });

  it('should perform an http request with the event', async function () {
    nock('http://test.local', {
      reqheaders: { 'Content-Type': 'application/json' },
    })
      .post('/', { type: 'Event', id: UUID_REGEX, data: {} })
      .reply(200, 'OK');

    const service = new SimpleHttpEventService({
      url: 'http://test.local',
    });

    const event = EventBuilder.create();
    const response = await service.perform(event);
    expect(response.ok).to.be.true;
  });

  it('should throw an error if the response status is not 2xx', async function () {
    nock('http://test.local').post('/').reply(500, 'Internal Server Error');

    const service = new SimpleHttpEventService({
      url: 'http://test.local/',
    });

    const event = EventBuilder.create();

    expect(service.perform(event)).to.be.rejectedWith(
      'Unexpected status code: 500',
    );
  });

  it('should take the url from the urlProvider', async function () {
    const scope = nock('http://test.local', {
      reqheaders: { 'Content-Type': 'application/json' },
    })
      .post('/event', { type: 'Event', id: UUID_REGEX, data: {} })
      .reply(200, 'OK');

    const service = new SimpleHttpEventService({
      urlProvider: () => 'http://test.local/event',
    });

    const event = EventBuilder.create();
    const response = await service.perform(event);
    expect(response.ok).to.be.true;
    expect(scope.isDone()).to.be.true;
  });

  it('should use the method from the options', async function () {
    const scope = nock('http://test.local', {
      reqheaders: { 'Content-Type': 'application/json' },
    })
      .get('/')
      .reply(200, 'OK');

    const service = new SimpleHttpEventService({
      url: 'http://test.local',
      method: 'GET',
    });

    const event = EventBuilder.create();
    const response = await service.perform(event);
    expect(response.ok).to.be.true;
    expect(scope.isDone()).to.be.true;
  });

  it('should use the contentType from the options', async function () {
    const scope = nock('http://test.local')
      .matchHeader('Content-Type', 'application/xml')
      .post('/', { type: 'Event', id: UUID_REGEX, data: {} })
      .reply(200, 'OK');

    const service = new SimpleHttpEventService({
      url: 'http://test.local',
      contentType: 'application/xml',
    });

    service.on('request:created', (_event, request) => {
      expect(request.headers.get('Content-Type')).to.equal('application/xml');
    });

    const event = EventBuilder.create();
    const response = await service.perform(event);
    expect(response.ok).to.be.true;
    expect(scope.isDone()).to.be.true;
  });

  it('should use the headersProvider from the options', async function () {
    const scope = nock('http://test.local', {
      reqheaders: { 'Content-Type': 'application/xml' },
    })
      .post('/', { type: 'Event', id: UUID_REGEX, data: {} })
      .reply(200, 'OK');

    const service = new SimpleHttpEventService({
      url: 'http://test.local',
      headersProvider: () => ({ 'Content-Type': 'application/xml' }),
    });

    const event = EventBuilder.create();
    const response = await service.perform(event);
    expect(response.ok).to.be.true;
    expect(scope.isDone()).to.be.true;
  });

  it(`should build a composite headersProvider
      if both headersProvider and contentType are provided`, async function () {
    const scope = nock('http://test.local', {
      reqheaders: {
        'Content-Type': 'text/plain',
        'X-Test': 'test',
      },
    })
      .post('/', { type: 'Event', id: UUID_REGEX, data: {} })
      .reply(200, 'OK');

    const service = new SimpleHttpEventService({
      url: 'http://test.local',
      headersProvider: () => ({ 'X-Test': 'test' }),
      contentType: 'text/plain',
    });

    const event = EventBuilder.create();
    const response = await service.perform(event);
    expect(response.ok).to.be.true;
    expect(scope.isDone()).to.be.true;
  });
});
