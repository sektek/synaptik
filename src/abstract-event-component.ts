import { AbstractComponent, ComponentOptions } from '@sektek/utility-belt';

import { EventService } from './types/index.js';

export type EventComponentOptions<T = void> = ComponentOptions<T>;

export abstract class AbstractEventComponent<T = void>
  extends AbstractComponent<T>
  implements EventService {}
