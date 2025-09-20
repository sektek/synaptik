import {
  FilterChannel,
  FilterChannelOptions,
} from '../channels/filter-channel.js';
import { Event } from '../types/index.js';
import { EventChannelBuilder } from './event-channel-builder.js';

export class FilterChannelBuilder<T extends Event> implements EventChannelBuilder<T> {
  #options: Partial<FilterChannelOptions<T>>;

  constructor(options: Partial<FilterChannelOptions<T>>) {
    this.#options = options;
  }

  create(options: Partial<FilterChannelOptions<T>>): FilterChannel<T> {
    return new FilterChannel<T>({
      ...this.#options,
      ...options,
    });
  }

  get(): FilterChannel<T> {
    return this.create({});
  }
