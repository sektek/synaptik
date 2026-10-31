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

/**
 * Options for event components that forward events to a downstream endpoint.
 *
 * @template T - The event type accepted by the handler. Defaults to {@link Event}.
 */
export type EventHandlingComponentOptions<T extends Event = Event> =
  EventComponentOptions & {
    /** Downstream endpoint to receive events forwarded by the component. */
    handler: EventEndpointComponent<T>;
  };

/**
 * Base class for event components that forward events to a downstream endpoint.
 *
 * Resolves the configured downstream endpoint and exposes it to subclasses as
 * a handler function. Each subclass determines when to forward an event.
 *
 * See {@link EventHandlingComponentOptions} for handler configuration.
 *
 * @template T - The event type accepted by the handler. Defaults to {@link Event}.
 */
export abstract class AbstractEventHandlingComponent<
  T extends Event = Event,
> extends AbstractEventComponent {
  #handler: EventHandlerFn<T>;

  constructor(opts: EventHandlingComponentOptions<T>) {
    super(opts);
    this.#handler = getEventHandlerComponent(opts.handler);
  }

  /**
   * Provides the configured downstream event handler to derived components.
   *
   * @returns The function used to forward events to the configured endpoint.
   */
  protected get handler(): EventHandlerFn<T> {
    return this.#handler;
  }
}
