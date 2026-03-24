import { LitElement, html, nothing } from 'lit';
import { HomeAssistant, fireEvent } from 'custom-card-helpers';
import { LovelaceCardConfig, LovelaceCardEditor } from './declarations';
import localize from './localize';
import { customElement, property, state } from 'lit/decorators.js';
import { Template } from './types';
import { LawnMowerCardConfig } from './types';
import styles from './editor.css';

@customElement('lawn-mower-card-editor')
export class LawnMowerCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: LawnMowerCardConfig;

  @state() private image? = undefined;
  @state() private compact_view = false;
  @state() private show_name = true;
  @state() private show_status = true;
  @state() private show_toolbar = true;
  @state() private show_shortcuts = true;
  @state() private animated = true;

  setConfig(config: LovelaceCardConfig & LawnMowerCardConfig): void {
    this.config = config;
  }

  private getEntitiesByType(type: string): string[] {
    if (!this.hass) {
      return [];
    }
    return Object.keys(this.hass.states).filter((id) => id.startsWith(type));
  }

  private findBatterySensor(): string | undefined {
    const mainEntity = this.config?.entity;
    if (!mainEntity || !this.hass) return undefined;
    const entities = (this.hass as Record<string, unknown>).entities as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (!entities) return undefined;
    const deviceId = entities[mainEntity]?.device_id;
    if (!deviceId) return undefined;
    for (const [id, e] of Object.entries(entities)) {
      if (
        (e as Record<string, unknown>).device_id === deviceId &&
        id.startsWith('sensor.') &&
        this.hass.states[id]?.attributes?.device_class === 'battery'
      ) {
        return id;
      }
    }
    return undefined;
  }

  protected render(): Template {
    if (!this.hass || !this.config) {
      return nothing;
    }

    return html`
      <div class="card-config">
        <div class="option">
          <ha-selector
            .hass=${this.hass}
            .selector=${{
              entity: {
                domain: 'lawn_mower',
              },
            }}
            .label=${localize('editor.entity')}
            .value=${this.config.entity}
            .required=${true}
            @value-changed=${this.valueChanged}
            .configValue=${'entity'}
          ></ha-selector>
        </div>

        <div class="option">
          <ha-selector
            .hass=${this.hass}
            .selector=${{
              entity: {
                domain: 'sensor',
                device_class: 'battery',
              },
            }}
            .label=${localize('editor.battery')}
            .value=${this.config.battery || this.findBatterySensor()}
            @value-changed=${this.valueChanged}
            .configValue=${'battery'}
          ></ha-selector>
        </div>

        <div class="option">
          <ha-selector
            .hass=${this.hass}
            .selector=${{
              entity: {
                domain: ['camera', 'image'],
              },
            }}
            .label=${localize('editor.map')}
            .value=${this.config.map}
            @value-changed=${this.valueChanged}
            .configValue=${'map'}
          ></ha-selector>
        </div>

        <div class="option">
          <ha-textfield
            .label="${localize('editor.image')}"
            .value=${this.config.image ?? this.image}
            .configValue=${'image'}
            @change=${this.valueChanged}
            fixedMenuPosition
            naturalMenuWidth
          ></ha-textfield>
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.compact_view
                ? 'editor.compact_view_aria_label_off'
                : 'editor.compact_view_aria_label_on',
            )}
            .checked=${Boolean(this.config.compact_view ?? this.compact_view)}
            .configValue=${'compact_view'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.compact_view')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_name
                ? 'editor.show_name_aria_label_off'
                : 'editor.show_name_aria_label_on',
            )}
            .checked=${Boolean(this.config.show_name ?? this.show_name)}
            .configValue=${'show_name'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_name')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_status
                ? 'editor.show_status_aria_label_off'
                : 'editor.show_status_aria_label_on',
            )}
            .checked=${Boolean(this.config.show_status ?? this.show_status)}
            .configValue=${'show_status'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_status')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_toolbar
                ? 'editor.show_toolbar_aria_label_off'
                : 'editor.show_toolbar_aria_label_on',
            )}
            .checked=${Boolean(this.config.show_toolbar ?? this.show_toolbar)}
            .configValue=${'show_toolbar'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_toolbar')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_shortcuts
                ? 'editor.show_shortcuts_aria_label_off'
                : 'editor.show_shortcuts_aria_label_on',
            )}
            .checked=${Boolean(
              this.config.show_shortcuts ?? this.show_shortcuts,
            )}
            .configValue=${'show_shortcuts'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_shortcuts')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.animated
                ? 'editor.animated_aria_label_off'
                : 'editor.animated_aria_label_on',
            )}
            .checked=${Boolean(this.config.animated ?? this.animated)}
            .configValue=${'animated'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.animated')}
        </div>

        <strong>${localize('editor.code_only_note')}</strong>
      </div>
    `;
  }

  private valueChanged(event: Event): void {
    if (!this.config || !this.hass || !event.target) {
      return;
    }
    const target = event.target as HTMLElement & {
      configValue?: string;
      dataset?: { configValue?: string };
      checked?: boolean;
      value?: string;
    };
    const configValue = target.configValue || target.dataset?.configValue;

    // For ha-selector with @value-changed event, get value from detail.value
    let value: string | boolean | undefined;
    if (
      event.type === 'value-changed' &&
      (event as CustomEvent<{ value?: string }>)?.detail?.value !== undefined
    ) {
      value = (event as CustomEvent<{ value?: string }>).detail.value;
    } else if (
      event.type === 'selected' &&
      (event as CustomEvent<{ index: number }>)?.detail?.index !== undefined
    ) {
      // ha-select @selected event - get value from the selected item
      const selectedIndex = (event as CustomEvent<{ index: number }>).detail
        .index;
      const items = target.querySelectorAll('mwc-list-item');
      if (items[selectedIndex]) {
        value =
          (items[selectedIndex] as HTMLElement).getAttribute('value') || '';
      }
    } else {
      value = target.checked !== undefined ? target.checked : target.value;
    }

    if (
      !configValue ||
      (this.config[configValue as keyof LawnMowerCardConfig] &&
        this.config[configValue as keyof LawnMowerCardConfig] === value)
    ) {
      return;
    }

    // Deep copy to avoid read-only property issues
    const newConfig = JSON.parse(JSON.stringify(this.config));
    newConfig[configValue as keyof LawnMowerCardConfig] = value;
    this.config = newConfig;

    fireEvent(this, 'config-changed', { config: this.config });
  }

  static get styles() {
    return styles;
  }
}
