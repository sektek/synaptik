import {
  AbstractEventComponent,
  EventComponentOptions,
} from './abstract-event-component.js';
import {
  Event,
  EventEndpointComponent,
  EventHandlerFn,
} from './types/index.js';
import { getEventHandlerComponent } from './util/get-event-handler-component.js';

export type EventHandlingComponentOptions<T extends Event = Event> =
  EventComponentOptions & {
    handler: EventEndpointComponent<T>;
  };

export abstract class AbstractEventHandlingComponent<
  T extends Event = Event,
> extends AbstractEventComponent {
  #handler: EventHandlerFn<T>;

  constructor(opts: EventHandlingComponentOptions<T>) {
    super(opts);
    this.#handler = getEventHandlerComponent(opts.handler);
  }

  protected get handler(): EventHandlerFn<T> {
    return this.#handler;
  }
}
