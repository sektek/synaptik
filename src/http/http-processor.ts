import {
  HttpOperator,
  HttpOperatorOptions,
  ResponseDeserializerComponent,
  ResponseDeserializerFn,
  getComponent,
} from '@sektek/utility-belt';

import {
  AbstractEventService,
  EventServiceOptions,
} from '../abstract-event-service.js';
import { Event, EventProcessor } from '../types/index.js';
import { HttpEventService } from './types/index.js';

/**
 * Options for the HttpProcessor.
 *
 * @template T The type of event to process.
 * @template R The type of event to return.
 * @property {HttpOperator<T>} [httpOperator] An optional HttpOperator instance to use.
 * @property {ResponseDeserializerComponent<R>} [responseDeserializer] An optional
 *   response deserializer component to use for processing the HTTP response.
 */
export type HttpProcessorOptions<
  T extends Event,
  R extends Event,
> = HttpOperatorOptions<T> &
  EventServiceOptions & {
    httpOperator?: HttpOperator<T>;
    responseDeserializer?: ResponseDeserializerComponent<R>;
  };

/**
 * A processor for handling HTTP events.
 * This class uses an HttpOperator to perform HTTP requests based on the
 * provided event and deserializes the response using a response deserializer.
 *
 * @template T The type of event to process.
 * @template R The type of event to return.
 * @extends AbstractEventService
 * @implements {EventProcessor<T, R>}
 * @implements {HttpEventService<T>}
 */
export class HttpProcessor<T extends Event = Event, R extends Event = T>
  extends AbstractEventService
  implements EventProcessor<T, R>, HttpEventService<T>
{
  #httpOperator: HttpOperator<T>;
  #responseDeserializer: ResponseDeserializerFn<R>;

  /**
   * Creates an instance of HttpProcessor.
   *
   * @param {HttpProcessorOptions<T, R>} opts The options for the processor.
   * @throws {Error} If neither httpOperator, url, nor urlProvider is provided.
   */
  constructor(opts: HttpProcessorOptions<T, R>) {
    super(opts);

    if (!opts.httpOperator && !opts.url && !opts.urlProvider) {
      throw new Error(
        'HttpProcessor requires either an httpOperator, url, or urlProvider to be provided.',
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

    this.#responseDeserializer = getComponent(
      opts.responseDeserializer,
      'deserialize',
      {
        default: (response: Response) => response.json() as Promise<R>,
      },
    );
  }

  /**
   * Processes the given event by performing an HTTP request and deserializing
   * the response.
   *
   * @param {T} event The event to process.
   * @returns {Promise<R>} A promise that resolves to the processed event.
   */
  async process(event: T): Promise<R> {
    this.emit('event:received', event);

    try {
      const response = await this.#httpOperator.perform(event);

      const result = await this.#responseDeserializer(response);
      this.emit('event:processed', event, result);

      return result;
    } catch (error) {
      this.emit('event:error', event, error);
      throw error;
    }
  }
}
