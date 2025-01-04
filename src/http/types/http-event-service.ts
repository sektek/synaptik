import { EventEmittingService } from '@sektek/utility-belt';

import { Event } from '../../types/index.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type HttpEventServiceEvents<T extends Event = Event> = {
  'request:created': (event: T, request: Request) => void;
  'response:received': (event: T, response: Response) => void;
};

export interface HttpEventService<T extends Event = Event>
  extends EventEmittingService<HttpEventServiceEvents<T>> {}
