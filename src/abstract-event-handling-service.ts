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

  // This is just a concept for the time being. I've been thinking about
  // adding a ProcessorFlow that would allow for the final event handler
  // to return the final value. This would allow for an event to be processed
  // through a flow and ultimately return a value, which normally would not
  // be the case with a flow. This would be useful for request/response
  // That said... this may not be the best way to implement it.
  //
  // set handler(handler: EventEndpointComponent<T>) {
  //   this.#handler = getEventHandlerComponent(handler);
  //   this.emit('component:update:handler', handler);
  // }
}
