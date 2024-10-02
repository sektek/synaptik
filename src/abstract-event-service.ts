import EventEmitter from 'events';

export type EventServiceOptions = {
  /**
   * The name of the service.
   */
  name: string;
};

export abstract class AbstractEventService extends EventEmitter {
  #name: string;
  constructor(opts: EventServiceOptions) {
    super();
    this.#name = opts.name;
  }

  /**
   * The name of the service.
   */
  get name(): string {
    return this.#name;
  }
}
