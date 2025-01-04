import { Component } from '@sektek/utility-belt';

import { Event } from '../../types/index.js';

export type ResponseEventExtractorFn<T extends Event = Event> = (
  response: Response,
) => T | PromiseLike<T>;

export interface ResponseEventExtractor<T extends Event = Event> {
  extract: ResponseEventExtractorFn<T>;
}

export type ResponseEventExtractorComponent<T extends Event = Event> =
  Component<ResponseEventExtractor<T>, 'extract'>;
