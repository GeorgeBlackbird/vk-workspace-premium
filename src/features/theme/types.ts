/** Настраиваемые цвета темы (без флага enabled). */
export interface ThemeColorSettings {
  background: string;
  accent: string;
  /** Фон приложения при закрытом чате (--theme-color-chat_environment) */
  surfaceEnvironment?: string;
  surfacePinned?: string;
  surfaceMessage?: string;
  /** Исходящие сообщения (--theme-color-chat_secondary) */
  surfaceOutgoing?: string;
  surfaceMenu?: string;
  surfaceModal?: string;
  /**
   * Ховер: base_bright_inverse, base_globalwhite_bright_inverse, secondary_selected.
   */
  surfaceHover?: string;
  /** Плашка реакций (--theme-color-base_light) */
  surfaceReactions?: string;
  /** @deprecated используйте surfaceMessage / surfaceOutgoing */
  messageBackground?: string;
  /** Основной текст (--theme-color-text_solid). Пусто — авто от яркости фона */
  textPrimary?: string;
  /** Вторичный текст (--theme-color-base_primary). Пусто — авто */
  textSecondary?: string;
  /** Иконки сайдбара WorkSpace. Пусто — как основной текст */
  iconPrimary?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  settings: ThemeColorSettings;
}

export interface ThemeSettings extends ThemeColorSettings {
  enabled: boolean;
  /** id активного пресета из библиотеки (только для UI) */
  activePresetId?: string | null;
}

/** Значения по умолчанию VK Teams (paradigmBaseDark) */
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  enabled: false,
  background: "#232324",
  accent: "#0077ff",
};

export const DEFAULT_THEME_COLORS: ThemeColorSettings = {
  background: DEFAULT_THEME_SETTINGS.background,
  accent: DEFAULT_THEME_SETTINGS.accent,
};
