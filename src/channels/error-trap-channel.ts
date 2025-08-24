import { getComponent, noOp } from '@sektek/utility-belt';

import {
  Event,
  EventErrorHandlerComponent,
  EventErrorHandlerFn,
} from '../types/index.js';

import {
  AbstractEventHandlingService,
  EventHandlingServiceOptions,
} from '../abstract-event-handling-service.js';

export type ErrorTrapChannelOptions<T extends Event = Event> =
  EventHandlingServiceOptions<T> & {
    errorHandler?: EventErrorHandlerComponent<T>;
    rethrow?: boolean;
  };

export class ErrorTrapChannel<
  T extends Event = Event,
> extends AbstractEventHandlingService {
  #errorHandler: EventErrorHandlerFn<T>;
  #rethrow: boolean;

  constructor(opts: ErrorTrapChannelOptions<T>) {
    super(opts);

    this.#errorHandler = getComponent(opts.errorHandler, 'handle', {
      default: noOp,
    });

    this.#rethrow = opts.rethrow ?? false;
  }

  async send(event: T): Promise<void> {
    try {
      this.emit('event:received', event);
      await this.handler(event);
      this.emit('event:delivered', event);
    } catch (error) {
      this.emit('event:error', event, error);
      this.#errorHandler(event, error);
      if (this.#rethrow) {
        throw error;
      }
    }
  }
}
