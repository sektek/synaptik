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

/** Options shared by event components that delegate to a handler.
 * @template T - Event type accepted by the handler; defaults to {@link Event}.
 */
export type EventHandlingComponentOptions<T extends Event = Event> =
  EventComponentOptions & {
    /** Endpoint responsible for handling events received by the component. */
    handler: EventEndpointComponent<T>;
  };

/**
 * Base class for event components that delegate processing to a handler.
 *
 * Exposes the configured endpoint as a handler function for subclasses to use.
 *
 * @template T - Event type accepted by the handler; defaults to {@link Event}.
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
   * Accesses the configured handler from a derived component.
   *
   * @returns The resolved event handler function.
   */
  protected get handler(): EventHandlerFn<T> {
    return this.#handler;
  }
}
