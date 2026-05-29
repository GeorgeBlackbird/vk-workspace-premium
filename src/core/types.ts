/** Настройки одной фичи в chrome.storage */
export type FeatureSettingsMap = Record<string, unknown>;

export interface AppSettings {
  /** Глобальный переключатель дополнения на странице */
  enabled: boolean;
  /** Настройки по id фичи: theme, reactions, … */
  features: FeatureSettingsMap;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  enabled: true,
  features: {},
};

export interface FeatureContext {
  /** Корневой элемент, куда фича может монтировать UI (shadow DOM и т.д.) */
  mountRoot: HTMLElement;
  /** Текущие настройки приложения */
  getSettings(): Promise<AppSettings>;
  /** Подписка на изменения настроек */
  onSettingsChanged(
    listener: (settings: AppSettings) => void,
  ): () => void;
}

export interface FeatureModule {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  /** Вызывается при загрузке content script */
  init(ctx: FeatureContext): void | Promise<void>;
  /** Очистка при выгрузке (редко, но полезно для тестов) */
  destroy?(): void;
}
