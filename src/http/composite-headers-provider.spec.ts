import { expect } from 'chai';

import { CompositeHeadersProvider } from './composite-headers-provider.js';
import { EventBuilder } from '../event-builder.js';

describe('CompositeHeadersProvider', function () {
  it('should return the headers from both providers', async function () {
    const provider1 = () => ({ 'Content-Type': 'application/json' });
    const provider2 = () => ({ Authorization: 'Bearer token' });
    const compositeProvider = new CompositeHeadersProvider({
      providers: [provider1, provider2],
    });

    const event = await EventBuilder.create();
    const headers = await compositeProvider.get(event);

    expect(headers.get('Content-Type')).to.equal('application/json');
    expect(headers.get('Authorization')).to.equal('Bearer token');
  });
});
