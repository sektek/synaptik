export type EventData = Record<string, unknown>;

export type EventHeaders = {
  id: string;
  parentId?: string;
  replyTo?: string[];
  type: string;
};

export type Event = EventHeaders & {
  data: EventData;
};

export const EmptyEvent: Event = {
  id: '',
  type: 'Event',
  data: {},
};
