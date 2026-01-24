import {
  CommandComponent,
  CommandFn,
  ProviderComponent,
  ProviderFn,
  getComponent,
} from '@sektek/utility-belt';

import {
  EVENT_ERROR,
  EVENT_PROCESSED,
  EVENT_RECEIVED,
  Event,
  EventHandler,
} from '../types/index.js';

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
  /**
   * The context to be passed to the task command. If C is void, context
   * is undefined.
   */
  context?: C extends void ? undefined : C;
  /**
   * A provider component that supplies the context for the task command.
   * If not provided, the static context (if any) will be used.
   * Should not be provided if C is void.
   */
  contextProvider?: ProviderComponent<C, T>;
};

/**
 * A handler that executes a task command in response to an event.
 *
 * @template T - The type of the Event being handled.
 * @template C - The type of the context passed to the task command.
 *    Defaults to void if no context is needed.
 */
export class TaskExecutionHandler<T extends Event = Event, C = void>
  extends AbstractEventService
  implements EventHandler<T>
{
  #taskProvider: ProviderFn<CommandComponent<C>, T>;
  #contextProvider: ProviderFn<C, T>;

  constructor(opts: TaskExecutionHandlerOptions<T, C>) {
    super(opts);

    if (!opts.task && !opts.taskProvider) {
      throw new Error(
        'Either task or taskProvider must be provided to TaskExecutionHandler',
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
    this.emit(EVENT_RECEIVED, event);
    try {
      const taskComponent = await this.#taskProvider(event);
      const context = await this.#contextProvider(event);
      const task: CommandFn<C> = getComponent(taskComponent, 'execute');

      await task(context);
      this.emit(EVENT_PROCESSED, event);
    } catch (error) {
      this.emit(EVENT_ERROR, error, event);
      throw error;
    }
  }
}
