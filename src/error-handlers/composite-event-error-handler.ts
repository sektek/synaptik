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

export type CompositeEventErrorHandlerOptions<
  T extends Event = Event,
  E extends Error = Error,
> = {
  errorHandlers: Array<EventErrorHandlerComponent<T, E>>;
  executionStrategy?: ExecutionStrategyComponent<EventErrorHandlerFn<T, E>>;
};

export class CompositeEventErrorHandler<
  T extends Event = Event,
  E extends Error = Error,
> {
  #errorHandlers: EventErrorHandlerFn<T, E>[];
  #executionStrategy: ExecutionStrategyFn<EventErrorHandlerFn<T, E>>;

  constructor(opts: CompositeEventErrorHandlerOptions<T, E>) {
    this.#errorHandlers = opts.errorHandlers.map(handler =>
      getComponent(handler, 'handle'),
    );
    this.#executionStrategy = getComponent(opts.executionStrategy, 'execute', {
      default: parallelExecutionStrategy,
    });
  }

  async handle(event: T, error: E) {
    await this.#executionStrategy(this.#errorHandlers, event, error);
  }
}
