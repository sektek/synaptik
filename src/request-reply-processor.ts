import {
  AbstractEventService,
  EventServiceOptions,
} from './abstract-event-service.js';
import {
  Event,
  EventChannel,
  EventChannelFn,
  EventEndpointComponent,
  EventHandlerFn,
  EventProcessor,
  EventProcessorFn,
} from './types/index.js';
import { PromiseChannel } from './channels/index.js';
import { getEventHandlerComponent } from './util/get-event-handler-component.js';

type RequestReplyProcessorOptions<T extends Event = Event> =
  EventServiceOptions & {
    handler: EventEndpointComponent<T>;
  };

export class RequestReplyProcessor<T extends Event = Event, R extends Event = T>
  extends AbstractEventService
  implements EventChannel<R>, EventProcessor<T, R>
{
  #handler: EventHandlerFn<T>;
  #channelMap = new Map<string, PromiseChannel<R>>();

  constructor(opts: RequestReplyProcessorOptions<T>) {
    super(opts);
    this.#handler = getEventHandlerComponent(opts.handler);
  }

  async process(event: T): Promise<R> {
    this.emit('event:received', event);

    const channel = new PromiseChannel<R>();
    this.#channelMap.set(event.id, channel);

    event.replyTo ??= [];
    event.replyTo.push(event.id);

    await this.#handler(event);

    return await channel.get();
  }

  async send(event: R): Promise<void> {
    this.emit('event:received', event);
    const replyTo = event.replyTo?.pop();
    const channel = this.#channelMap.get(replyTo ?? '');
    if (!channel) {
      throw new Error(`No channel found for event with id: ${replyTo}`);
    }

    await channel.send(event);
    this.emit('event:delivered', event);
    this.emit('event:processed', event);
    this.#channelMap.delete(event.id);
  }

  get processor(): EventProcessorFn<T, R> {
    return this.process.bind(this);
  }

  get channel(): EventChannelFn<R> {
    return this.send.bind(this);
  }
}
