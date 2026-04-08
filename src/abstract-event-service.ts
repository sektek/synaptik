import EventEmitter from 'events';

import { LoggerProvider, NullLoggerProvider } from '@sektek/utility-belt';

import { EventService } from './types/event-service.js';

export type EventServiceOptions = {
  /**
   * The name of the service.
   */
  name?: string;

  /**
   * Logger provider used to create loggers for this service.
   */
  loggerProvider?: LoggerProvider;
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
  #loggerProvider: LoggerProvider;

  constructor(opts: EventServiceOptions = {}) {
    super();
    this.#name = opts.name ?? generateName(this.constructor.name);
    this.#loggerProvider = opts.loggerProvider ?? new NullLoggerProvider();
  }

  /**
   * @returns The name of the service.
   */
  get name(): string {
    return this.#name;
  }

  /**
   * @returns The logger provider for this service.
   */
  get loggerProvider(): LoggerProvider {
    return this.#loggerProvider;
  }
}
