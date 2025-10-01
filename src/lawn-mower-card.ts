import { CSSResultGroup, LitElement, PropertyValues, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  hasConfigOrEntityChanged,
  fireEvent,
  HomeAssistant,
  ServiceCallRequest,
} from 'custom-card-helpers';
import registerTemplates from 'ha-template';
import get from 'lodash/get';
import localize from './localize';
import styles from './styles.css';
import buildConfig from './config';
import {
  Template,
  LawnMowerCardAction,
  LawnMowerCardConfig,
  LawnMowerEntity,
  HassEntity,
  LawnMowerEntityState,
  LawnMowerServiceCallParams,
  LawnMowerActionParams,
} from './types';
import DEFAULT_IMAGE from './lawn-mower.svg';

registerTemplates();

// String in the right side will be replaced by Rollup
const PKG_VERSION = 'PKG_VERSION_VALUE';

console.info(
  `%c LAWN-MOWER-CARD %c ${PKG_VERSION}`,
  'color: white; background: blue; font-weight: 700;',
  'color: blue; background: white; font-weight: 700;',
);

if (!customElements.get('ha-icon-button')) {
  customElements.define(
    'ha-icon-button',
    class extends (customElements.get('paper-icon-button') ?? HTMLElement) {},
  );
}

@customElement('lawn-mower-card')
export class LawnMowerCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: LawnMowerCardConfig;
  @state() private requestInProgress = false;
  @state() private thumbUpdater: ReturnType<typeof setInterval> | null = null;

  static get styles(): CSSResultGroup {
    return styles;
  }

  public static async getConfigElement() {
    await import('./editor');
    return document.createElement('lawn-mower-card-editor');
  }

  static getStubConfig(_: unknown, entities: string[]) {
    const [lawnMowerEntity] = entities.filter((eid) =>
      eid.startsWith('lawn-mower'),
    );

    return {
      entity: lawnMowerEntity ?? '',
    };
  }

  get entity(): LawnMowerEntity {
    return this.hass.states[this.config.entity] as LawnMowerEntity;
  }

  get map(): HassEntity | null {
    if (!this.hass || !this.config.map) {
      return null;
    }
    return this.hass.states[this.config.map];
  }

  public setConfig(config: LawnMowerCardConfig): void {
    this.config = buildConfig(config);
  }

  public getCardSize(): number {
    return this.config.compact_view ? 3 : 8;
  }

  public shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected updated(changedProps: PropertyValues) {
    if (
      changedProps.get('hass') &&
      changedProps.get('hass').states[this.config.entity].state !==
        this.hass.states[this.config.entity].state
    ) {
      this.requestInProgress = false;
    }
  }

  public connectedCallback() {
    super.connectedCallback();
    if (!this.config.compact_view && this.map) {
      this.requestUpdate();
      this.thumbUpdater = setInterval(
        () => this.requestUpdate(),
        this.config.map_refresh * 1000,
      );
    }
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    if (this.map && this.thumbUpdater) {
      clearInterval(this.thumbUpdater);
    }
  }

  private handleMore(entityId: string = this.entity.entity_id): void {
    fireEvent(
      this,
      'hass-more-info',
      {
        entityId,
      },
      {
        bubbles: false,
        composed: true,
      },
    );
  }

  private callService(action: LawnMowerCardAction) {
    const { service, service_data } = action;
    const [domain, name] = service.split('.');
    this.hass.callService(domain, name, service_data);
  }

  private callLawnMowerService(
    service: ServiceCallRequest['service'],
    params: LawnMowerServiceCallParams = { request: true },
    options: ServiceCallRequest['serviceData'] = {},
  ) {
    this.hass.callService('lawn-mower', service, {
      entity_id: this.config.entity,
      ...options,
    });

    if (params.request) {
      this.requestInProgress = true;
      this.requestUpdate();
    }
  }

  private handleSpeed(e: PointerEvent): void {
    const fan_speed = (<HTMLDivElement>e.target).getAttribute('value');
    this.callLawnMowerService(
      'set_fan_speed',
      { request: false },
      { fan_speed },
    );
  }

  private handleLawnMowerAction(
    action: string,
    params: LawnMowerActionParams = { request: true },
  ) {
    return () => {
      if (!this.config.actions[action]) {
        return this.callLawnMowerService(
          params.defaultService || action,
          params,
        );
      }

      this.callService(this.config.actions[action]);
    };
  }

  private getAttributes(entity: LawnMowerEntity) {
    const { status, state } = entity.attributes;

    return {
      ...entity.attributes,
      status: status ?? state ?? entity.state,
    };
  }



  private renderBattery(): Template {
    let battery_level;
    let battery_icon;
    const entityId = this.config.battery;

    if (entityId) {
      battery_level = Number(this.hass.states[entityId].state);
      if (isNaN(battery_level)) {
        return nothing;
      }

      const level = Number(battery_level);

      if (level > 90) {
        battery_icon = 'mdi:battery';
      } else if (level < 10) {
        battery_icon = 'mdi:battery-outline';
      } else {
        const iconLevel = Math.floor(level / 10) * 10;
        battery_icon = `mdi:battery-${iconLevel}`;
      }
    } else {
      ({ battery_level, battery_icon } = this.getAttributes(this.entity));
    }

    return html`
      <div class="tip" @click="${() => this.handleMore(entityId)}">
        <ha-icon icon="${battery_icon}"></ha-icon>
        <span class="icon-title">${battery_level}%</span>
      </div>
    `;
  }

  private renderTemperature(): Template {
    let value;
    let icon;
    const entityId = this.config.temperature;

    if (entityId) {
      value = Number(this.hass.states[entityId].state);
      if (isNaN(value)) {
        return nothing;
      }
      icon = 'mdi:thermometer';
    } else {
      return nothing;
    }

    return html`
      <div class="tip" @click="${() => this.handleMore(entityId)}">
        <ha-icon icon="${icon}"></ha-icon>
        <span class="icon-title">${value}°C</span>
      </div>
    `;
  }

  private renderHumidity(): Template {
    let value;
    let icon;
    const entityId = this.config.humidity;

    if (entityId) {
      value = Number(this.hass.states[entityId].state);
      if (isNaN(value)) {
        return nothing;
      }
      icon = 'mdi:water-percent';
    } else {
      return nothing;
    }

    return html`
      <div class="tip" @click="${() => this.handleMore(entityId)}">
        <ha-icon icon="${icon}"></ha-icon>
        <span class="icon-title">${value}%</span>
      </div>
    `;
  }

  private renderMapOrImage(state: LawnMowerEntityState): Template {
    if (!this.config.compact_view && this.map) {
      return this.map && this.map.attributes.entity_picture
        ? html`
            <img
              class="map"
              src="${this.map.attributes.entity_picture}&v=${Date.now()}"
              @click=${() => this.handleMore(this.config.map)}
            />
          `
        : nothing;
    }

    const src =
      this.config.image === 'default' ? DEFAULT_IMAGE : this.config.image;

    return html`
      <img
        class="lawn-mower ${state}"
        src="${src}"
        @click="${() => this.handleMore()}"
      />
    `;
  }

  private renderStats(state: LawnMowerEntityState): Template {
    const statsList =
      this.config.stats[state] || this.config.stats.default || [];

    const stats = statsList.map(
      ({ entity_id, attribute, value_template, unit, subtitle }) => {
        if (!entity_id && !attribute) {
          return nothing;
        }

        let state = '';

        if (entity_id && attribute) {
          state = get(this.hass.states[entity_id].attributes, attribute);
        } else if (attribute) {
          state = get(this.entity.attributes, attribute);
        } else if (entity_id) {
          state = this.hass.states[entity_id].state;
        } else {
          return nothing;
        }

        const value = html`
          <ha-template
            hass=${this.hass}
            template=${value_template}
            value=${state}
            variables=${{ value: state }}
          ></ha-template>
        `;

        return html`
          <div class="stats-block" @click="${() => this.handleMore(entity_id)}">
            <span class="stats-value">${value}</span>
            ${unit}
            <div class="stats-subtitle">${subtitle}</div>
          </div>
        `;
      },
    );

    if (!stats.length) {
      return nothing;
    }

    return html`<div class="stats">${stats}</div>`;
  }

  private renderName(): Template {
    const { friendly_name } = this.getAttributes(this.entity);

    if (!this.config.show_name) {
      return nothing;
    }

    return html` <div class="lawn-mower-name">${friendly_name}</div> `;
  }


  private renderStatus(): Template {
    if (!this.config.show_status) {
      return nothing;
    }
    const { status, raw_activity } = this.getAttributes(this.entity);

    let actualStatus = status;
    if (raw_activity) {
      //use raw_activity instead of status because it is more detailed
      actualStatus = raw_activity;
    }
    const localizedStatus =
      localize(`status.${actualStatus.toLowerCase()}`) || actualStatus;

    const progressBar = html`
      <ha-circular-progress
        .indeterminate="true"
        size="small"
      ></ha-circular-progress>
    `;

    return html`
      <div class="status">
        <span
          class="status-text"
          alt=${localizedStatus}
          title="${actualStatus}"
        >
          ${localizedStatus}
        </span>
        ${this.requestInProgress ? progressBar : ''}
      </div>
    `;
  }

  private renderShortcuts(): Template {
    if (!this.config.show_shortcuts) {
      return nothing;
    }

    const buttons = this.config.shortcuts.map(
      ({ name, service, icon, service_data }) => {
        const execute = () => {
          if (service) {
            return this.callService({ service, service_data });
          }
        };
        return html`
          <ha-icon-button label="${name}" @click="${execute}">
            <ha-icon icon="${icon}"></ha-icon>
          </ha-icon-button>
        `;
      },
    );


    return html` <div class="shortcuts">${buttons}</div> `;
  }

  private renderToolbar(state: LawnMowerEntityState): Template {
    const { raw_activity } = this.getAttributes(this.entity);

    if (!this.config.show_toolbar) {
      return nothing;
    }

    switch (state) {
      case 'on':
      case 'auto':
      case 'spot':
      case 'edge':
      case 'single_room':
      case 'edgecut':
      case 'mowing': {
        return html`
          <div class="toolbar">
            <paper-button @click="${this.handleLawnMowerAction('pause')}">
              <ha-icon icon="hass:pause"></ha-icon>
              ${localize('common.pause')}
            </paper-button>
            <paper-button @click="${this.handleLawnMowerAction('stop')}">
              <ha-icon icon="hass:stop"></ha-icon>
              ${localize('common.stop')}
            </paper-button>
            <paper-button
              @click="${this.handleLawnMowerAction('return_to_base')}"
            >
              <ha-icon icon="hass:home-map-marker"></ha-icon>
              ${localize('common.return_to_base')}
            </paper-button>
          </div>
        `;
      }

      case 'paused': {
        return html`
          <div class="toolbar">
            <paper-button
              @click="${this.handleLawnMowerAction('resume', {
                defaultService: 'start',
                request: true,
              })}"
            >
              <ha-icon icon="hass:play"></ha-icon>
              ${localize('common.continue')}
            </paper-button>
            <paper-button
              @click="${this.handleLawnMowerAction('return_to_base')}"
            >
              <ha-icon icon="hass:home-map-marker"></ha-icon>
              ${localize('common.return_to_base')}
            </paper-button>
          </div>
        `;
      }

      case 'returning': {
        return html`
          <div class="toolbar">
            <paper-button @click="${this.handleLawnMowerAction('stop')}">
              <ha-icon icon="hass:stop"></ha-icon>
              ${localize('common.stop')}
            </paper-button>
          </div>
        `;
      }
      case 'docked':
      case 'idle':
      default: {
        const dockButton = html`
          <paper-button
            @click="${this.handleLawnMowerAction('return_to_base')}"
          >
            <ha-icon icon="hass:home-map-marker"></ha-icon>
            ${localize('common.return_to_base')}
          </paper-button>
        `;

        const stopButton = html`
          <paper-button @click="${this.handleLawnMowerAction('stop')}">
            <ha-icon icon="hass:stop"></ha-icon>
            ${localize('common.stop')}
          </paper-button>
        `;

        const locateButton = html`
          <paper-button @click="${this.handleLawnMowerAction('locate')}">
            <ha-icon icon="hass:map-marker"></ha-icon>
            ${localize('common.locate')}
          </paper-button>
        `;

        return html`
          <div class="toolbar">
            <paper-button @click="${this.handleLawnMowerAction('start')}">
              <ha-icon icon="hass:play"></ha-icon>
              ${localize('common.start')}
            </paper-button>
            ${this.config.actions['locate'] ? locateButton : ''}
            ${raw_activity?.toLowerCase() === 'charging_with_task_suspend'
              ? stopButton
              : ''}
            ${state === 'idle' || raw_activity?.toLowerCase() === 'standby'
              ? dockButton
              : ''}
          </div>
        `;
      }
    }
  }

  private renderUnavailable(): Template {
    return html`
      <ha-card>
        <div class="preview not-available">
          <div class="metadata">
            <div class="not-available">
              ${localize('common.not_available')}
            </div>
          <div>
        </div>
      </ha-card>
    `;
  }

  protected render(): Template {
    if (!this.entity) {
      return this.renderUnavailable();
    }

    if (this.config.compact_view) {
      return html`
        <ha-card class="preview-compact">
          <div class="preview">
            <div class="header">
              <div class="tips">
                ${this.renderMapOrImage(this.entity.state)}
                ${this.renderStatus()} ${this.renderTemperature()}
                ${this.renderHumidity()} ${this.renderBattery()}
              </div>
              <ha-icon-button
                class="more-info"
                icon="mdi:dots-vertical"
                ?more-info="true"
                @click="${() => this.handleMore()}"
                ><ha-icon icon="mdi:dots-vertical"></ha-icon
              ></ha-icon-button>
            </div>
          </div>
          ${this.renderToolbar(this.entity.state)} ${this.renderShortcuts()}
        </ha-card>
      `;
    }

    return html`
      <ha-card>
        <div class="preview">
          <div class="header">
            <div class="tips">
              ${this.renderTemperature()} ${this.renderHumidity()}
              ${this.renderBattery()}
            </div>
            <ha-icon-button
              class="more-info"
              icon="mdi:dots-vertical"
              ?more-info="true"
              @click="${() => this.handleMore()}"
              ><ha-icon icon="mdi:dots-vertical"></ha-icon
            ></ha-icon-button>
          </div>

          ${this.renderMapOrImage(this.entity.state)}

          <div class="metadata">
            ${this.renderName()} ${this.renderStatus()}
          </div>

          ${this.renderStats(this.entity.state)}
        </div>

        ${this.renderToolbar(this.entity.state)} ${this.renderShortcuts()}
      </ha-card>
    `;
  }
}

declare global {
  interface Window {
    customCards?: unknown[];
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  preview: true,
  type: 'lawn-mower-card',
  name: localize('common.name'),
  description: localize('common.description'),
});
