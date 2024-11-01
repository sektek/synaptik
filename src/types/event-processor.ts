import { Component } from '@sektek/utility-belt';

import { Event } from './event.js';
import { EventHandlerFn } from './event-handler.js';

/**
 * An EventProcessor function is an EventHandler function that is to be used
 * when the return value of the EventHandler is expected to be another event.
 * EventProcessors are often used for Event Transformers or Event Enrichment.
 *
 * @typeParam T - The inbound event type.
 * @typeParam R - The returned event type.
 */
export type EventProcessorFn<
  T extends Event = Event,
  R extends Event = Event,
> = EventHandlerFn<T, R>;

/**
 * A class implementing the EventProcessor interface is an EventHandler that
 * is to be used when the return value of the EventHandler is expected to be
 * another event. EventProcessors are often used for Event Transformers or
 * Event Enrichment.
 *
 * @typeParam T - The inbound event type.
 * @typeParam R - The returned event type.
 */
export interface EventProcessor<
  T extends Event = Event,
  R extends Event = Event,
> {
  /**
   * Process an event.
   * @param event - The event to process.
   * @returns A promise that resolves with the processed event.
   */
  process: EventProcessorFn<T, R>;
}

export type EventProcessorComponent<
  T extends Event = Event,
  R extends Event = Event,
> = Component<EventProcessor<T, R>, 'process'>;
