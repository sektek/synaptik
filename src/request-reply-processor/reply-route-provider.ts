import { Event, EventHandlerFn } from '../types/index.js';
import { AbstractEventService } from '../abstract-event-service.js';
import { PromiseChannel } from '../channels/index.js';
import { RoutesProvider } from '../event-router/index.js';
import { getEventHandlerComponent } from '../util/index.js';

export class ReplyRouteProvider<T extends Event = Event>
  extends AbstractEventService
  implements RoutesProvider<T>
{
  #channelMap = new Map<string, PromiseChannel<T>>();

  async *values(event: T): AsyncIterable<EventHandlerFn<T>> {
    const replyTo = event.replyTo?.pop();
    if (!replyTo) {
      throw new Error('No channel found for reply event: missing replyTo');
    }

    const channel = this.#channelMap.get(replyTo);
    if (!channel) {
      throw new Error(`No channel found for replyTo: ${replyTo}`);
    }

    yield getEventHandlerComponent(channel);
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
