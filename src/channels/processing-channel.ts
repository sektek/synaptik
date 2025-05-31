import { EventEmittingService, getComponent } from '@sektek/utility-belt';

import {
  AbstractEventHandlingService,
  EventHandlingServiceOptions,
} from '../abstract-event-handling-service.js';
import {
  Event,
  EventChannelEvents,
  EventProcessor,
  EventProcessorFn,
} from '../types/index.js';
import { EventBuilder } from '../event-builder.js';

export type ProcessingChannelOptions<
  T extends Event,
  R extends Event,
> = EventHandlingServiceOptions<R> & {
  processor: EventProcessor<T, R> | EventProcessorFn<T, R>;
  cloner?: EventProcessor<T, T> | EventProcessorFn<T, T>;
};

export type ProcessingChannelEvents<
  T extends Event = Event,
  R extends Event = Event,
> = EventChannelEvents<T> & {
  'event:processed': (event: T, processedEvent: R) => void;
  'event:delivered': (event: R) => void;
};

/**
 * A channel that performs processing on an event prior to send it to
 * the event handler.
 *
 * @typeParam T - The type of event that this channel processes.
 * @typeParam R - The type of event that this channel sends.
 */
export class ProcessingChannel<T extends Event = Event, R extends Event = T>
  extends AbstractEventHandlingService<R>
  implements EventEmittingService<ProcessingChannelEvents<T, R>>
{
  #processor: EventProcessorFn<T, R>;
  #cloner: EventProcessorFn<T, T>;

  constructor(opts: ProcessingChannelOptions<T, R>) {
    super(opts);
    this.#processor = getComponent(opts.processor, 'process');
    this.#cloner = getComponent(opts.cloner, 'process', {
      name: 'cloner',
      default: EventBuilder.clone.bind(EventBuilder),
    });
  }

  async send(event: T): Promise<void> {
    this.emit('event:received', event);

    let processedEvent: R;
    try {
      processedEvent = await this.#process(event);
      this.emit('event:processed', event, processedEvent);
    } catch (err) {
      this.emit('event:error', event, err);
      throw err;
    }

    await this.handler(processedEvent);
    this.emit('event:delivered', processedEvent);
  }

  async #process(event: T): Promise<R> {
    const eventClone = await this.#cloner(event);
    return this.#processor(eventClone);
  }
}
