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
 * Options for event components that delegate processing to a handler.
 *
 * @template T - The event type accepted by the handler. Defaults to {@link Event}.
 */
export type EventHandlingComponentOptions<T extends Event = Event> =
  EventComponentOptions & {
    /** Endpoint responsible for handling events passed to the component. */
    handler: EventEndpointComponent<T>;
  };

/**
 * Base class for event components that delegate processing to a handler.
 *
 * Makes the configured endpoint available to subclasses as a handler function,
 * without requiring each subclass to resolve the endpoint itself.
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
   * Provides the configured handler to derived components.
   *
   * @returns The resolved event handler function.
   */
  protected get handler(): EventHandlerFn<T> {
    return this.#handler;
  }
}
