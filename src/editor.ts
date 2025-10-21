import { LitElement, html, nothing } from 'lit';
import {
  HomeAssistant,
  LovelaceCardConfig,
  LovelaceCardEditor,
  fireEvent,
} from 'custom-card-helpers';
import localize from './localize';
import { customElement, property, state } from 'lit/decorators.js';
import { Template, LawnMowerCardConfig } from './types';
import styles from './editor.css';

type ConfigElement = HTMLInputElement & {
  configValue?: keyof LawnMowerCardConfig;
};

@customElement('lawn-mower-card-editor')
export class LawnMowerCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private config!: Partial<LawnMowerCardConfig>;

  @state() private image? = undefined;
  @state() private compact_view = false;
  @state() private show_name = true;
  @state() private show_status = true;
  @state() private show_toolbar = true;
  @state() private show_shortcuts = true;
  @state() private animated = true;

  setConfig(config: LovelaceCardConfig & LawnMowerCardConfig): void {
    // Initialize config with default values
    this.config = {
      entity: '',
      show_name: true,
      show_status: true,
      show_toolbar: true,
      show_shortcuts: true,
      animated: true,
      ...config
    };

    // Set default entity if not provided
    if (!this.config.entity) {
      const entities = this.getEntitiesByType('lawn_mower');
      if (entities.length > 0) {
        this.config.entity = entities[0];
        fireEvent(this, 'config-changed', { config: this.config });
      }
    }
  }

  private getEntitiesByType(type: string): string[] {
    if (!this.hass) {
      return [];
    }
    return Object.keys(this.hass.states).filter((id) => id.startsWith(type));
  }

  protected render(): Template {
    if (!this.hass) {
      return nothing;
    }

    const lawnMowerEntities = this.getEntitiesByType('lawn_mower');
    const cameraEntities = [
      ...this.getEntitiesByType('camera'),
      ...this.getEntitiesByType('image'),
    ];

    return html`
      <div class="card-config">
        <div class="option">
          <ha-select
            .label=${localize('editor.entity')}
            @selected=${this.valueChanged}
            .configValue=${'entity'}
            .value=${this.config.entity}
            @closed=${(e: Event) => e.stopPropagation()}
            fixedMenuPosition
            naturalMenuWidth
            required
            validationMessage=${localize('error.missing_entity')}
          >
            ${lawnMowerEntities.map(
              (entity) =>
                html` <mwc-list-item .value=${entity}
                  >${entity}</mwc-list-item
                >`,
            )}
          </ha-select>
        </div>

        <div class="option">
          <ha-select
            .label=${localize('editor.map')}
            @selected=${this.valueChanged}
            .configValue=${'map'}
            .value=${this.config.map}
            @closed=${(e: Event) => e.stopPropagation()}
            fixedMenuPosition
            naturalMenuWidth
          >
            ${cameraEntities.map(
              (entity) =>
                html` <mwc-list-item .value=${entity}
                  >${entity}</mwc-list-item
                >`,
            )}
          </ha-select>
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
            .checked=${Boolean(this.config.show_shortcuts ?? this.show_shortcuts)}
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
    const target = event.target as ConfigElement;
    if (
      !target.configValue ||
      (this.config[target.configValue] && this.config[target.configValue] === target?.value)
    ) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        delete this.config[target.configValue];
      } else {
        this.config = {
          ...this.config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this.config });
  }

  static get styles() {
    return styles;
  }
}
