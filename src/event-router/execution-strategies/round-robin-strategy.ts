import { Event, EventHandlerFn } from '../../types/index.js';

export class RoundRobinStrategy<T extends Event = Event> {
  #lastIndex = -1;

  async execute(event: T, handlers: EventHandlerFn<T>[]): Promise<void> {
    this.#lastIndex = (this.#lastIndex + 1) % handlers.length;
    await handlers[this.#lastIndex](event);
  }
}
