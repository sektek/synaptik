import { Component } from '@sektek/utility-belt';

import { Event } from '../../types/index.js';

// Having some typing issues with BodyInit and fetch
// So I'm commenting out the types that are causing conflicts
type BodyInit =
  | ArrayBuffer
  // | AsyncIterable<Uint8Array>
  | Blob
  | FormData
  // | Iterable<Uint8Array>
  // | ArrayBufferView
  | URLSearchParams
  | null
  | string;

type EventSerializerReturnType = undefined | BodyInit;

export type EventSerializerFn<T extends Event = Event> = (
  event: T,
) => EventSerializerReturnType | PromiseLike<EventSerializerReturnType>;

export interface EventSerializer<T extends Event = Event> {
  serialize: EventSerializerFn<T>;
}

export type EventSerializerComponent<T extends Event = Event> = Component<
  EventSerializer<T>,
  'serialize'
>;
