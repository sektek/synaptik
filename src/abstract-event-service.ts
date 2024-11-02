import EventEmitter from 'events';

import { EventService } from './types/event-service.js';

export type EventServiceOptions = {
  /**
   * The name of the service.
   */
  name?: string;
};

const SERVICE_NAME_IDS = new Map<string, number>();

const generateName = (prefix: string): string => {
  const id = SERVICE_NAME_IDS.get(prefix) || 0;
  SERVICE_NAME_IDS.set(prefix, id + 1);

  return `${prefix}#${id}`;
};

export abstract class AbstractEventService
  extends EventEmitter
  implements EventService
{
  #name: string;

  constructor(opts: EventServiceOptions) {
    super();
    this.#name = opts.name ?? generateName(this.constructor.name);
  }

  /**
   * @returns The name of the service.
   */
  get name(): string {
    return this.#name;
  }
}
