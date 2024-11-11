import {
  AbstractEventHandlingService,
  EventHandlingServiceOptions,
} from '../abstract-event-handling-service.js';
import { Event, EventHandlerFn, EventProcessor } from '../types/index.js';
import { EventRouter } from '../event-router/event-router.js';
import { ReplyRouteProvider } from './reply-route-provider.js';
import { getEventHandlerComponent } from '../util/index.js';

export class RequestReplyProcessor<T extends Event = Event, R extends Event = T>
  extends AbstractEventHandlingService
  implements EventProcessor<T, R>
{
  #replyRouteProvider: ReplyRouteProvider<R>;
  #replyChannel: EventHandlerFn<R>;

  constructor(opts: EventHandlingServiceOptions) {
    super(opts);

    this.#replyRouteProvider = new ReplyRouteProvider<R>();
    const replyRouter = new EventRouter<R>({
      routeProvider: this.#replyRouteProvider,
    });
    this.#replyChannel = getEventHandlerComponent(replyRouter);
  }

  async process(event: T): Promise<R> {
    this.emit('event:received', event);

    const channel = this.#replyRouteProvider.create(event.id);
    channel.on('event:delivered', result =>
      this.emit('event:processed', event, result),
    );

    event.replyTo ??= [];
    event.replyTo.push(event.id);

    await this.handler(event);

    return channel.get();
  }

  get channel(): EventHandlerFn<R> {
    return this.#replyChannel;
  }
}
