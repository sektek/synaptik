import { Event } from '../../types/index.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface HttpEventServiceEvents<T extends Event = Event> {
  'request:created': (event: T, request: Request) => void;
  'response:received': (event: T, response: Response) => void;
}

export interface HttpEventService<T extends Event = Event> {
  on<E extends keyof HttpEventServiceEvents<T>>(
    event: E,
    listener: HttpEventServiceEvents<T>[E],
  ): this;
  emit<E extends keyof HttpEventServiceEvents<T>>(
    event: E,
    ...args: Parameters<HttpEventServiceEvents<T>[E]>
  ): boolean;
}
