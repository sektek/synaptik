import { HttpOperator, HttpOperatorOptions } from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import {
  EVENT_DELIVERED,
  EVENT_ERROR,
  EVENT_RECEIVED,
  Event,
  EventChannel,
} from '../types/index.js';

import { HttpEventService } from './types/http-event-service.js';

/**
 * Options for the HttpChannel.
 *
 * @template T The type of event to send.
 * @property {HttpOperator<T>} [httpOperator] An optional HttpOperator instance to use.
 */
export type HttpChannelOptions<T extends Event = Event> = EventServiceOptions &
  HttpOperatorOptions<T> & {
    httpOperator?: HttpOperator<T>;
  };

/**
 * A channel for sending events over HTTP.
 * This class uses an HttpOperator to perform HTTP requests based on the
 * provided event.
 *
 * @template T The type of event to send.
 */
export class HttpChannel<T extends Event = Event>
  extends AbstractEventService
  implements EventChannel<T>, HttpEventService<T>
{
  #httpOperator: HttpOperator<T>;

  /**
   * Creates an instance of HttpChannel.
   *
   * @param {HttpChannelOptions<T>} [opts] The options for the channel.
   * @throws {Error} If neither httpOperator, url, nor urlProvider is provided.
   */
  constructor(opts: HttpChannelOptions<T> = {}) {
    super(opts);

    if (!opts.httpOperator && !opts.url && !opts.urlProvider) {
      throw new Error(
        'HttpChannel requires either an httpOperator, url, or urlProvider to be provided.',
      );
    }

    this.#httpOperator =
      opts.httpOperator ??
      new HttpOperator({
        method: 'POST',
        ...opts,
      });

    this.#httpOperator.on('request:received', (event, request) => {
      this.emit('request:received', event, request);
    });
    this.#httpOperator.on('request:error', (event, request, error) => {
      this.emit('request:error', event, request, error);
    });
    this.#httpOperator.on('response:received', (event, response) => {
      this.emit('response:received', event, response);
    });
    this.#httpOperator.on('response:error', (event, response, error) => {
      this.emit('response:error', event, response, error);
    });
  }

  /**
   * Sends an event over HTTP using the configured HttpOperator.
   *
   * @param {T} event The event to send.
   * @returns {Promise<void>} A promise that resolves when the event is sent.
   */
  async send(event: T): Promise<void> {
    this.emit(EVENT_RECEIVED, event);

    try {
      await this.#httpOperator.perform(event);

      this.emit(EVENT_DELIVERED, event);
    } catch (error) {
      this.emit(EVENT_ERROR, error, event);
      throw error;
    }
  }
}
