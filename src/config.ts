import localize from './localize';
import { LawnMowerCardConfig } from './types';

export default function buildConfig(
  config?: Partial<LawnMowerCardConfig>,
): LawnMowerCardConfig {
  if (!config) {
    throw new Error(localize('error.invalid_config'));
  }

  if (!config.entity) {
    throw new Error(localize('error.missing_entity'));
  }

  const actions = config.actions;
  if (actions && Array.isArray(actions)) {
    console.warn(localize('warning.actions_array'));
  }

  return {
    entity: config.entity,
    map: config.map ?? '',
    map_refresh: config.map_refresh ?? 5,
    image: config.image ?? 'default',
    battery: config.battery ?? '',
    show_name: config.show_name ?? true,
    show_status: config.show_status ?? true,
    show_toolbar: config.show_toolbar ?? true,
    show_shortcuts: config.show_shortcuts ?? true,
    compact_view: config.compact_view ?? false,
    stats: config.stats ?? {},
    actions: config.actions ?? [],
    shortcuts: config.shortcuts ?? [],
  };
}
