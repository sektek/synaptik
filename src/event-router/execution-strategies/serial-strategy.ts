import { Event, EventHandlerFn } from '../../types/index.js';

export class SerialStrategy<T extends Event = Event> {
  async execute(event: T, handlers: EventHandlerFn<T>[]): Promise<void> {
    for (const handler of handlers) {
      await handler(event);
    }
  }
}
