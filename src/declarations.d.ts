// declaration.d.ts

// Specific CSS module declarations
declare module './editor.css' {
  const content: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  export default content;
}
declare module './styles.css' {
  const content: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  export default content;
}

// Specific SVG module declarations
declare module './lawn-mower.svg' {
  const content: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  export default content;
}

// home-assistant-js-websocket type declarations
declare module 'home-assistant-js-websocket' {
  export interface HassEntityAttributeBase {
    [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  export interface HassEntityBase {
    entity_id: string;
    state: string;
    attributes: HassEntityAttributeBase;
    last_changed: string;
    last_updated: string;
    context?: {
      id: string;
      user_id?: string | null;
      parent_id?: string | null;
    };
  }

  export type HassEntity = HassEntityBase;
}

// lit type declarations
declare module 'lit' {
  export class LitElement extends HTMLElement {
    requestUpdate(name?: PropertyKey, oldValue?: unknown): Promise<void>;
    connectedCallback(): void;
    disconnectedCallback(): void;
  }

  export class PropertyValues {
    get(key: string): any; // eslint-disable-line @typescript-eslint/no-explicit-any
    has(key: string): boolean;
    keys(): IterableIterator<string>;
    values(): IterableIterator<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    entries(): IterableIterator<[string, any]>; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  export class CSSResultGroup {
    styles: string;
  }

  export function html(
    strings: TemplateStringsArray,
    ...values: any[]
  ): TemplateResult; // eslint-disable-line @typescript-eslint/no-explicit-any

  export const nothing: symbol;

  export class TemplateResult {
    constructor(strings: TemplateStringsArray, values: any[]); // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

declare module 'lit/decorators.js' {
  export function customElement(name: string): ClassDecorator;
  export function property(options?: any): PropertyDecorator; // eslint-disable-line @typescript-eslint/no-explicit-any
  export function state(options?: any): PropertyDecorator; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Augment ha-template module to add the default export
declare module 'ha-template' {
  function register(componentName?: string): void;
  export default register;
}

declare module 'custom-card-helpers' {
  export interface HomeAssistant {
    states: Record<string, HassEntity>;
    callService(
      domain: string,
      service: string,
      serviceData?: Record<string, any>,
    ): Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  export function hasConfigOrEntityChanged(
    element: HTMLElement,
    changedProps: PropertyValues,
    forceUpdate?: boolean,
  ): boolean;

  export function fireEvent(
    node: HTMLElement,
    type: string,
    detail?: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ): void;

  export interface ServiceCallRequest {
    domain: string;
    service: string;
    serviceData?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

// Additional type declarations
export interface LovelaceCardConfig {
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface LovelaceCardEditor extends HTMLElement {
  setConfig(config: LovelaceCardConfig): void;
}
