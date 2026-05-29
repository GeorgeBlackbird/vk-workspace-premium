import type { ThemeColorSettings, ThemeSettings } from "./types";

export function extractColorSettings(
  theme: ThemeSettings,
): ThemeColorSettings {
  const {
    enabled: _enabled,
    activePresetId: _activePresetId,
    ...colors
  } = theme;
  return colors;
}

export function mergeColorSettings(
  base: ThemeSettings,
  colors: ThemeColorSettings,
): ThemeSettings {
  return {
    ...base,
    ...colors,
  };
}
