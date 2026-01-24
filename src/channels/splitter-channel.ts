import {
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
  getComponent,
  parallelExecutionStrategy,
} from '@sektek/utility-belt';

import {
  EVENT_DELIVERED,
  EVENT_ERROR,
  EVENT_RECEIVED,
  Event,
  EventSplitterComponent,
  EventSplitterFn,
} from '../types/index.js';

import {
  AbstractEventHandlingService,
  EventHandlingServiceOptions,
} from '../abstract-event-handling-service.js';

const DEFAULT_BATCH_SIZE = 20;

export type SplitterChannelOptions<
  T extends Event = Event,
  R extends Event = T,
> = EventHandlingServiceOptions<R> & {
  splitter: EventSplitterComponent<T, R>;
  executionStrategy?: ExecutionStrategyComponent;
  batchSize?: number;
};

export class SplitterChannel<
  T extends Event = Event,
  R extends Event = T,
> extends AbstractEventHandlingService<R> {
  #splitter: EventSplitterFn<T, R>;
  #executionStrategy: ExecutionStrategyFn;
  #batchSize: number;

  constructor(opts: SplitterChannelOptions<T, R>) {
    super(opts);
    this.#splitter = getComponent(opts.splitter, 'split');
    this.#executionStrategy = getComponent(opts.executionStrategy, 'execute', {
      default: parallelExecutionStrategy,
    });
    this.#batchSize = opts.batchSize ?? DEFAULT_BATCH_SIZE;
  }

  async send(event: T): Promise<void> {
    this.emit(EVENT_RECEIVED, event);
    let events = [];
    try {
      for await (const splitEvent of this.#splitter(event)) {
        events.push(splitEvent);
        if (events.length >= this.#batchSize) {
          await this.#executeBatch(event, events);
          events = [];
        }
      }
      if (events.length > 0) {
        await this.#executeBatch(event, events);
      }
    } catch (error) {
      this.emit(EVENT_ERROR, error, event);
      throw error;
    }
  }

  async #executeBatch(event: T, events: Array<R>): Promise<void> {
    this.emit('event:batch:received', event, events);
    const tasks = events.map(e => async () => {
      await this.handler(e);
      this.emit(EVENT_DELIVERED, e);
    });
    await this.#executionStrategy(tasks);
    this.emit('event:batch:delivered', event, events);
  }
}
