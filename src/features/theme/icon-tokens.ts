import type { ThemeSettings } from "./types";
import { parseCssColor, rgbToHex, rgbToTriplet } from "./color-utils";
import { resolveTextColors } from "./text-tokens";

export const PLUS_ICON_VARS = {
  primary: "--vkt-plus-icon-primary",
  primaryHex: "--vkt-plus-icon-primary-hex",
} as const;

export function resolveIconColors(settings: ThemeSettings): {
  triplet: string;
  hex: string;
} {
  const override = settings.iconPrimary?.trim();
  if (override) {
    const parsed = parseCssColor(override);
    if (parsed) {
      return {
        triplet: rgbToTriplet(parsed),
        hex: rgbToHex(parsed),
      };
    }
  }

  const text = resolveTextColors(settings);
  return {
    triplet: text.primary,
    hex: text.primaryHex,
  };
}

export function getIconTokenValues(
  settings: ThemeSettings,
): Record<string, string> {
  const icon = resolveIconColors(settings);
  return {
    [PLUS_ICON_VARS.primary]: icon.triplet,
    [PLUS_ICON_VARS.primaryHex]: icon.hex,
  };
}

export function listIconVarNames(): readonly string[] {
  return Object.values(PLUS_ICON_VARS);
}
