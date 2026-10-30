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
 * Options for components that delegate event processing to a handler.
 *
 * @template T - The event type accepted by the handler. Defaults to {@link Event}.
 */
export type EventHandlingComponentOptions<T extends Event = Event> =
  EventComponentOptions & {
    /** Endpoint that handles events received by the component. */
    handler: EventEndpointComponent<T>;
  };

/**
 * Base class for event components that use a configured handler.
 *
 * Resolves the supplied {@link EventEndpointComponent} into a handler function
 * that subclasses can invoke through the protected `handler` accessor.
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
   * The handler function resolved from the component's configured endpoint.
   *
   * @returns The event handler used by derived components.
   */
  protected get handler(): EventHandlerFn<T> {
    return this.#handler;
  }
}
