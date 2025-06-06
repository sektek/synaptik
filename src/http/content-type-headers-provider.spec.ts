import { expect } from 'chai';

import { EventBuilder } from '../event-builder.js';
import { contentTypeHeadersProvider } from './content-type-headers-provider.js';

describe('ContentTypeHeadersProvider', function () {
  it('should return the headers with the content type', async function () {
    const provider = contentTypeHeadersProvider('application/json');

    const event = await EventBuilder.create();
    expect(provider(event)).to.deep.equal({
      'Content-Type': 'application/json',
    });
  });
});
