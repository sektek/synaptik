type EventData = Record<string, unknown>;

/**
 * Options for building event data.
 * @template T The type of the event data, defaults to 'Event'
 */
export type EventHeaders = {
  id: string;
  parentId?: string;
  replyTo?: string[];
  type: string;
};

/**
 * Represents an event in the system.
 * @template T The type of the event, defaults to 'Event'.
 * @template D The data associated with the event, defaults to an empty object.
 * @property {string} id - Unique identifier for the event.
 */
export type Event<T = EventData> = EventHeaders & {
  data: T;
};

export const EmptyEvent: Event = {
  id: '',
  type: 'Event',
  data: {},
};
