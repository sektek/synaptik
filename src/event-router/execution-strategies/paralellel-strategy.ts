import { Event, EventHandlerFn } from '../../types/index.js';

export class ParallelStrategy<T extends Event = Event> {
  async execute(event: T, handlers: EventHandlerFn<T>[]): Promise<void> {
    await Promise.all(handlers.map(handler => handler(event)));
  }
}
