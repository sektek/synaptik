import _ from 'lodash';

import {
  AbstractEventService,
  EventServiceOptions,
} from './abstract-event-service.js';
import {
  Event,
  EventChannel,
  EventChannelEvents,
  EventHandler,
  EventHandlerFn,
  EventProcessor,
  EventProcessorFn,
} from './types/index.js';
import { EventBuilder } from './event-builder.js';
import { getEventHandlerComponent } from './util/get-event-handler-component.js';
import { getEventProcessorComponent } from './util/get-event-processor-component.js';

export type ProcessingChannelOptions<
  T extends Event,
  R extends Event,
> = EventServiceOptions & {
  processor: EventProcessor<T, R> | EventProcessorFn<T, R>;
  handler: EventHandler<R> | EventHandlerFn<R>;
};

export interface ProcessingChannelEvents<
  T extends Event = Event,
  R extends Event = Event,
> extends EventChannelEvents<T> {
  'event:delivered': (event: R) => void;
}

interface ProcessingChannnel<T extends Event, R extends Event>
  extends EventChannel<T> {
  on<E extends keyof ProcessingChannelEvents<T, R>>(
    event: E,
    listener: ProcessingChannelEvents<T, R>[E],
  ): this;
  emit<E extends keyof ProcessingChannelEvents<T, R>>(
    event: E,
    ...args: Parameters<ProcessingChannelEvents<T, R>[E]>
  ): boolean;
}

/**
 * A channel that performs processing on an event prior to send it to
 * the event handler.
 *
 * @typeParam T - The type of event that this channel processes.
 * @typeParam R - The type of event that this channel sends.
 */
export class ProcessingChannel<T extends Event = Event, R extends Event = T>
  extends AbstractEventService
  implements ProcessingChannnel<T, R>
{
  #processor: EventProcessorFn<T, R>;
  #handler: EventHandlerFn<R>;

  constructor(options: ProcessingChannelOptions<T, R>) {
    super(options);
    this.#processor = getEventProcessorComponent<T, R>(options.processor);
    this.#handler = getEventHandlerComponent<R>(options.handler);
  }

  async send(event: T): Promise<void> {
    this.emit('event:received', event);

    const processorEvent = EventBuilder.clone(event);
    const processedEvent = await this.#processor(processorEvent);
    await this.#handler(processedEvent);
    this.emit('event:delivered', processedEvent);
  }
}
