import {
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
  getComponent,
  parallelExecutionStrategy,
} from '@sektek/utility-belt';

import {
  Event,
  EventErrorHandlerComponent,
  EventErrorHandlerFn,
} from '../types/index.js';

export type CompositeEventErrorHandlerOptions<T extends Event = Event> = {
  errorHandlers: Array<EventErrorHandlerComponent<T>>;
  executionStrategy?: ExecutionStrategyComponent<EventErrorHandlerFn<T>>;
};

export class CompositeEventErrorHandler<T extends Event = Event> {
  #errorHandlers: EventErrorHandlerFn<T>[];
  #executionStrategy: ExecutionStrategyFn<EventErrorHandlerFn<T>>;

  constructor(opts: CompositeEventErrorHandlerOptions<T>) {
    this.#errorHandlers = opts.errorHandlers.map(handler =>
      getComponent(handler, 'handle'),
    );
    this.#executionStrategy = getComponent(opts.executionStrategy, 'execute', {
      default: parallelExecutionStrategy,
    });
  }

  async handle(error: Error, event: T): Promise<void> {
    await this.#executionStrategy(this.#errorHandlers, error, event);
  }
}
