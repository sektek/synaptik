import {
  AbstractEventHandlingService,
  EventHandlingServiceOptions,
} from '../abstract-event-handling-service.js';
import {
  EVENT_DELIVERED,
  EVENT_ERROR,
  EVENT_RECEIVED,
  Event,
  EventHandlerComponent,
  EventHandlerFn,
} from '../types/index.js';
import { getEventHandlerComponent } from '../util/get-event-handler-component.js';

export type TapChannelOptions<T extends Event = Event> =
  EventHandlingServiceOptions<T> & {
    tapHandler: EventHandlerComponent<T>;
    rethrow?: boolean;
  };

export class TapChannel<
  T extends Event = Event,
> extends AbstractEventHandlingService<T> {
  #tapHandler: EventHandlerFn<T>;
  #rethrow: boolean;

  constructor(opts: TapChannelOptions<T>) {
    super(opts);
    this.#tapHandler = getEventHandlerComponent(opts.tapHandler);
    this.#rethrow = opts.rethrow ?? true;
  }

  async send(event: T): Promise<void> {
    try {
      this.emit(EVENT_RECEIVED, event);
      await this.#tapHandler(event);
    } catch (error) {
      this.emit(EVENT_ERROR, error, event);
      if (this.#rethrow) {
        throw error;
      }
    }

    await this.handler(event);
    this.emit(EVENT_DELIVERED, event);
  }
}
