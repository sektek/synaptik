import {
  ErrorHandler,
  ErrorHandlerComponent,
  ErrorHandlerFn,
} from '@sektek/utility-belt';

import { Event } from './event.js';

export type EventErrorHandlerFn<T extends Event> = ErrorHandlerFn<T>;

export interface EventErrorHandler<T extends Event = Event>
  extends ErrorHandler<T> {}

export type EventErrorHandlerComponent<T extends Event = Event> =
  ErrorHandlerComponent<T>;
