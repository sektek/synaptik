export type EventData = Record<string, unknown>;

export type EventHeaders = {
  id: string;
  parentId?: string;
  type: string;
};

export type Event = EventHeaders & {
  data: EventData;
};

export const EmtpyEvent: Event = {
  id: '',
  type: 'Event',
  data: {},
};
