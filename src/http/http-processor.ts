import {
  HttpOperator,
  HttpOperatorOptions,
  ResponseDeserializerComponent,
  ResponseDeserializerFn,
  getComponent,
} from '@sektek/utility-belt';

import {
  AbstractEventComponent,
  EventComponentOptions,
} from '../abstract-event-component.js';
import {
  EVENT_ERROR,
  EVENT_PROCESSED,
  EVENT_RECEIVED,
  Event,
  EventProcessor,
} from '../types/index.js';
import { HttpEventService } from './types/index.js';

/**
 * Options for the HttpProcessor.
 *
 * @template T The type of event to process.
 * @template R The type of event to return.
 */
export type HttpProcessorOptions<
  T extends Event,
  R extends Event,
> = HttpOperatorOptions<T> &
  EventComponentOptions & {
    /** Optional HTTP operator to reuse instead of constructing one from the request options. */
    httpOperator?: HttpOperator<T>;
    /**
     * Converts the HTTP response into the returned event. Defaults to parsing
     * the response body as JSON; the default does not validate the event shape.
     */
    responseDeserializer?: ResponseDeserializerComponent<R>;
  };

/**
 * Performs an HTTP request for an input event and returns the deserialized
 * response as an event.
 *
 * Uses a supplied HTTP operator or creates one from the request options,
 * defaulting the HTTP method to POST. The response deserializer defaults to
 * JSON parsing; callers requiring a different format or runtime validation
 * can supply their own deserializer.
 *
 * @template T The type of event to process.
 * @template R The type of event to return.
 */
export class HttpProcessor<T extends Event = Event, R extends Event = T>
  extends AbstractEventComponent
  implements EventProcessor<T, R>, HttpEventService<T>
{
  #httpOperator: HttpOperator<T>;
  #responseDeserializer: ResponseDeserializerFn<R>;

  /**
   * Configures HTTP request execution and response deserialization.
   *
   * @param opts - HTTP request options, optional operator, and deserializer.
   *
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
   * Executes the configured HTTP request and converts its response into an event.
   * Emits processing lifecycle events; failures are emitted and rethrown.
   *
   * @param event - Input event used to construct the request.
   * @returns The event produced by the response deserializer.
   * @throws If the HTTP operation or response deserializer fails.
   */
  async process(event: T): Promise<R> {
    this.emit(EVENT_RECEIVED, event);

    try {
      const response = await this.#httpOperator.perform(event);

      const result = await this.#responseDeserializer(response);
      this.emit(EVENT_PROCESSED, event, result);

      return result;
    } catch (error) {
      this.emit(EVENT_ERROR, error, event);
      throw error;
    }
  }
}
