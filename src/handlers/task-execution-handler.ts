import {
  CommandComponent,
  CommandFn,
  ProviderComponent,
  ProviderFn,
  getComponent,
} from '@sektek/utility-belt';

import { Event } from '../types/index.js';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';

/** Options for configuring the TaskExecutionHandler */
export type TaskExecutionHandlerOptions<T, C> = EventServiceOptions & {
  /**
   * The task command component to be executed. If not provided,
   * a taskProvider must be specified to supply the task component.
   */
  task?: CommandComponent<C>;
  /**
   * A provider component that supplies the task command component.
   * If not provided, a task must be specified directly.
   */
  taskProvider?: ProviderComponent<CommandComponent<C>, T>;
  context?: C extends void ? undefined : C;
  contextProvider?: ProviderComponent<C, T>;
};

/**
 * A handler that executes a task command in response to an event.
 */
export class TaskExecutionHandler<
  T extends Event = Event,
  C = void,
> extends AbstractEventService {
  #taskProvider: ProviderFn<CommandComponent<C>, T>;
  #contextProvider: ProviderFn<C, T>;

  constructor(opts: TaskExecutionHandlerOptions<T, C>) {
    super(opts);

    if (!opts.task && !opts.taskProvider) {
      throw new Error(
        'Either task or taskProvider must be provided to RepeatingExecutor',
      );
    }

    this.#taskProvider = getComponent(opts.taskProvider, 'get', {
      default: () => opts.task!,
    });

    this.#contextProvider = getComponent(opts.contextProvider, 'get', {
      default: () => opts.context as unknown as C,
    });
  }

  async handle(event: T): Promise<void> {
    this.emit('event:received', event);
    try {
      const taskComponent = this.#taskProvider(event);
      const context = await this.#contextProvider(event);
      const task: CommandFn<C> = getComponent(taskComponent, 'execute');

      await task(context);
      this.emit('event:processed', event);
    } catch (error) {
      this.emit('event:error', event, error);
      throw error;
    }
  }
}
