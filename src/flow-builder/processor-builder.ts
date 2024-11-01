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

  constructor(opts: ProcessingChannelOptions<T, R>) {
    this.#opts = opts;
  }

  create(): ProcessingChannel<T, R> {
    if (!this.#opts.processor) {
      throw new Error('No processor provided');
    }

    return new ProcessingChannel(this.#opts);
  }
}
