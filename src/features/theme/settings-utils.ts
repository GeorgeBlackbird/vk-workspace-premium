import type { ThemeColorSettings, ThemeSettings } from "./types";
import { isGradientCss } from "./message-fill";

export function extractColorSettings(
  theme: ThemeSettings,
): ThemeColorSettings {
  const {
    enabled: _enabled,
    activePresetId: _activePresetId,
    ...colors
  } = theme;
  return migrateThemeColors(colors);
}

export function mergeColorSettings(
  base: ThemeSettings,
  colors: ThemeColorSettings,
): ThemeSettings {
  return {
    ...base,
    ...migrateThemeColors(colors),
  };
}

/** Перенос legacy messageBackground → surfaceMessage / surfaceOutgoing. */
export function migrateThemeColors(
  colors: ThemeColorSettings,
): ThemeColorSettings {
  const legacy = colors.messageBackground?.trim();
  if (!legacy) {
    const { messageBackground: _removed, ...rest } = colors;
    return rest;
  }

  const next = { ...colors };
  if (!next.surfaceMessage?.trim() && !isGradientCss(legacy)) {
    next.surfaceMessage = legacy;
  }
  if (!next.surfaceOutgoing?.trim() && isGradientCss(legacy)) {
    next.surfaceOutgoing = legacy;
  }

  delete next.messageBackground;
  return next;
}
