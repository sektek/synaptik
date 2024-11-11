import { Event, EventHandlerFn } from '../types/index.js';
import { AbstractEventService } from '../abstract-event-service.js';
import { PromiseChannel } from '../channels/index.js';
import { RouteProvider } from '../event-router/index.js';
import { getEventHandlerComponent } from '../util/index.js';

export class ReplyRouteProvider<T extends Event = Event>
  extends AbstractEventService
  implements RouteProvider<T>
{
  #channelMap = new Map<string, PromiseChannel<T>>();

  get(event: T): EventHandlerFn<T> {
    const replyTo = event.replyTo?.pop();
    const channel = this.#channelMap.get(replyTo ?? '');
    if (!channel) {
      throw new Error(`No channel found for event with id: ${replyTo}`);
    }

    return getEventHandlerComponent(channel);
  }

  create(id: string): PromiseChannel<T> {
    const channel = new PromiseChannel<T>();
    this.#channelMap.set(id, channel);

    channel.on('channel:stateChange', () => this.delete(id));

    return channel;
  }

  delete(id: string): void {
    if (id.length === 0) {
      return;
    }

    this.#channelMap.delete(id);
  }
}
