import { Event, EventProcessorComponent } from '../types/index.js';
import { ProcessingChannel } from '../channels/processing-channel.js';
import { }

export class FlowBuilder<T extends Event = Event> {
  #stack: FlowFn[] = [];

  transform(processor: EventProcessorComponent<T>, opts: ProcessingChannelOptions<T>) {}

  create() {}
}
