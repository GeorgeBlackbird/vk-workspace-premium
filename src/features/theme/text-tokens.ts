import type { ThemeSettings } from "./types";
import {
  mixRgb,
  parseBackgroundColor,
  parseCssColor,
  relativeLuminance,
  rgbToHex,
  rgbToTriplet,
  type Rgb,
} from "./color-utils";

export const TEXT_THEME_VARS = {
  textSolid: "--theme-color-text_solid",
  textSolidPermanent: "--theme-color-text_solid_permanent",
  basePrimary: "--theme-color-base_primary",
  basePrimaryHover: "--theme-color-base_primary_hover",
  basePrimaryActive: "--theme-color-base_primary_active",
} as const;

export const PLUS_TEXT_VARS = {
  primary: "--vkt-plus-text-primary",
  secondary: "--vkt-plus-text-secondary",
  primaryHex: "--vkt-plus-text-primary-hex",
  secondaryHex: "--vkt-plus-text-secondary-hex",
} as const;

const DARK_TEXT: Rgb = { r: 255, g: 255, b: 255 };
const DARK_TEXT_SECONDARY: Rgb = { r: 158, g: 161, b: 163 };
const LIGHT_TEXT: Rgb = { r: 34, g: 34, b: 34 };
const LIGHT_TEXT_SECONDARY: Rgb = { r: 129, g: 140, b: 153 };

export function resolveTextColors(settings: ThemeSettings): {
  primary: string;
  secondary: string;
  primaryHex: string;
  secondaryHex: string;
} {
  const bg = parseBackgroundColor(settings.background);
  const light = relativeLuminance(bg) > 0.45;

  const primaryRgb = toRgbOrDerived(settings.textPrimary, () =>
    light ? LIGHT_TEXT : DARK_TEXT,
  );
  const secondaryRgb = toRgbOrDerived(settings.textSecondary, () =>
    light ? LIGHT_TEXT_SECONDARY : DARK_TEXT_SECONDARY,
  );

  return {
    primary: rgbToTriplet(primaryRgb),
    secondary: rgbToTriplet(secondaryRgb),
    primaryHex: rgbToHex(primaryRgb),
    secondaryHex: rgbToHex(secondaryRgb),
  };
}

export function getTextTokenValues(
  settings: ThemeSettings,
): Record<string, string> {
  const text = resolveTextColors(settings);
  const primaryRgb = parseTriplet(text.primary);
  const secondaryRgb = parseTriplet(text.secondary);

  return {
    [PLUS_TEXT_VARS.primary]: text.primary,
    [PLUS_TEXT_VARS.secondary]: text.secondary,
    [PLUS_TEXT_VARS.primaryHex]: text.primaryHex,
    [PLUS_TEXT_VARS.secondaryHex]: text.secondaryHex,

    [TEXT_THEME_VARS.textSolid]: text.primary,
    [TEXT_THEME_VARS.textSolidPermanent]: text.primary,
    [TEXT_THEME_VARS.basePrimary]: text.secondary,
    [TEXT_THEME_VARS.basePrimaryHover]: rgbToTriplet(
      mixRgb(secondaryRgb, primaryRgb, 0.15),
    ),
    [TEXT_THEME_VARS.basePrimaryActive]: rgbToTriplet(
      mixRgb(secondaryRgb, primaryRgb, 0.28),
    ),
  };
}

export function listTextVarNames(): readonly string[] {
  return [
    ...Object.values(PLUS_TEXT_VARS),
    ...Object.values(TEXT_THEME_VARS),
  ];
}

function toRgbOrDerived(
  override: string | undefined,
  derive: () => Rgb,
): Rgb {
  if (override?.trim()) {
    const parsed = parseCssColor(override.trim());
    if (parsed) return parsed;
  }
  return derive();
}

function parseTriplet(triplet: string): Rgb {
  const [r, g, b] = triplet.split(",").map((v) => Number(v.trim()));
  return { r: r ?? 0, g: g ?? 0, b: b ?? 0 };
}
