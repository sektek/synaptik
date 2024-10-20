import { Component } from '@sektek/utility-belt';
import { Event } from '../../types/index.js';

type BufferSource = ArrayBufferView | ArrayBuffer;
type XMLHttpRequestBodyInit =
  | string
  | Blob
  | BufferSource
  | FormData
  | URLSearchParams;
type BodyInit = ReadableStream<number> | XMLHttpRequestBodyInit;

export type EventSerializerFn<T extends Event = Event> = (
  event: T,
) => BodyInit | PromiseLike<BodyInit> | null | undefined;

export interface EventSerializer<T extends Event = Event> {
  serialize: EventSerializerFn<T>;
}

export type EventSerializerComponent<T extends Event = Event> = Component<
  EventSerializer<T>,
  'serialize'
>;
