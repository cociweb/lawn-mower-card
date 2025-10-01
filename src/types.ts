import {
  HassEntityAttributeBase,
  HassEntityBase,
} from 'home-assistant-js-websocket';
import { TemplateResult, nothing } from 'lit';

export * from 'home-assistant-js-websocket';

export type TemplateNothing = typeof nothing;
export type Template = TemplateResult | TemplateNothing;

export type LawnMowerEntityState =
  | 'mowing'
  | 'docked'
  | 'idle'
  | 'paused'
  | 'returning'
  | 'error'
  | 'unknown'
  | string; // for other states

export type LawnMowerEntityActivity =
  | 'standby'
  | 'emergency'
  | 'charging'
  | 'charging_with_task_suspend'
  | 'park'
  | LawnMowerEntityState
  | string; // for other states

export interface LawnMowerEntityAttributes extends HassEntityAttributeBase {
  status?: LawnMowerEntityState;
  state?: LawnMowerEntityState;
  fan_speed?: string;
  fan_speed_list?: string[];
  battery_level?: number;
  battery_icon?: string;
  raw_activity?: LawnMowerEntityActivity;
}

export interface LawnMowerEntity extends HassEntityBase {
  attributes: LawnMowerEntityAttributes;
  state: LawnMowerEntityState;
}

export interface LawnMowerCardStat {
  entity_id?: string;
  attribute?: string;
  value_template?: string;
  unit?: string;
  subtitle?: string;
}

export interface LawnMowerCardAction {
  service: string;
  service_data?: Record<string, unknown>;
}

export interface LawnMowerCardShortcut {
  name?: string;
  icon?: string;
  service?: string;
  service_data?: Record<string, unknown>;
}

export interface LawnMowerCardConfig {
  entity: string;
  map: string;
  map_refresh: number;
  image: string;
  battery: string;
  temperature: string;
  humidity: string;
  show_name: boolean;
  show_status: boolean;
  show_toolbar: boolean;
  show_shortcuts: boolean;
  compact_view: boolean;
  stats: Record<string, LawnMowerCardStat[]>;
  actions: Record<string, LawnMowerCardAction>;
  shortcuts: LawnMowerCardShortcut[];
}

export interface LawnMowerServiceCallParams {
  request: boolean;
}

export interface LawnMowerActionParams extends LawnMowerServiceCallParams {
  defaultService?: string;
}
