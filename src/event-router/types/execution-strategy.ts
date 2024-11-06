import { Component } from '@sektek/utility-belt';

import { Event } from '../../types/event.js';
import { EventHandlerFn } from '../../types/event-handler.js';

export type ExecutionStrategyFn<T extends Event = Event> = (
  event: T,
  handlers: EventHandlerFn<T>[],
) => PromiseLike<void>;

export interface ExecutionStrategy<T extends Event = Event> {
  execute: ExecutionStrategyFn<T>;
}

export type ExecutionStrategyComponent<T extends Event = Event> = Component<
  ExecutionStrategy<T>,
  'execute'
>;
