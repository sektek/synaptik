import {
  AbstractEventService,
  EventServiceOptions,
} from './abstract-event-service.js';
import {
  Event,
  EventEndpointComponent,
  EventHandlerFn,
} from './types/index.js';
import { getEventHandlerComponent } from './util/get-event-handler-component.js';

export type EventHandlingServiceOptions<T extends Event = Event> =
  EventServiceOptions & {
    handler: EventEndpointComponent<T>;
  };

export abstract class AbstractEventHandlingService<
  T extends Event = Event,
> extends AbstractEventService {
  #handler: EventHandlerFn<T>;

  constructor(opts: EventHandlingServiceOptions<T>) {
    super(opts);

    this.#handler = getEventHandlerComponent(opts.handler);
  }

  protected get handler(): EventHandlerFn<T> {
    return this.#handler;
  }
}
