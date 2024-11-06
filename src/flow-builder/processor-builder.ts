import { BuilderOptions, builderRender } from '@sektek/utility-belt';

import {
  Event,
  EventEndpointComponent,
  EventProcessorComponent,
} from '../types/index.js';
import {
  ProcessingChannel,
  ProcessingChannelOptions,
} from '../channels/processing-channel.js';

export class ProcessorBuilder<T extends Event = Event, R extends Event = T> {
  #opts: Partial<ProcessingChannelOptions<T, R>> = {};
  #handler?: EventEndpointComponent<R>;

  constructor(opts: Omit<ProcessingChannelOptions<T, R>, 'handler'>) {
    this.#opts = opts;
  }

  processor(processor: EventProcessorComponent<T, R>): this {
    this.#opts.processor = processor;
    return this;
  }

  handler(handler: EventEndpointComponent<R>): this {
    this.#handler = handler;
    return this;
  }

  create(): ProcessingChannel<T, R> {
    const opts =

    return new ProcessingChannel({ ...this.#opts, handler: this.#handler });
  }
}
