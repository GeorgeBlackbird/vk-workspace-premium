import type { ThemeSettings } from "./types";
import {
  BLACK,
  mixRgb,
  parseBackgroundColor,
  parseCssColor,
  rgbToHex,
  rgbToTriplet,
  WHITE,
  type Rgb,
} from "./color-utils";

/** IM-токены (формат «R, G, B» для rgba(var(--theme-color-…))). */
export const TEAMS_THEME_VARS = {
  baseGlobalwhite: "--theme-color-base_globalwhite",
  baseBright: "--theme-color-base_bright",
  baseBrightHover: "--theme-color-base_bright_hover",
  baseBrightActive: "--theme-color-base_bright_active",
  chatPrimary: "--theme-color-chat_primary",
  chatPrimaryHover: "--theme-color-chat_primary_hover",
  chatPrimaryActive: "--theme-color-chat_primary_active",
} as const;

export const PLUS_SURFACE_VARS = {
  pinned: "--vkt-plus-surface-pinned",
  message: "--vkt-plus-surface-message",
  menu: "--vkt-plus-surface-menu",
  modal: "--vkt-plus-surface-modal",
  messageBg: "--vkt-plus-message-bg",
} as const;

export interface ThemeSurfaces {
  pinned: string;
  message: string;
  menu: string;
  modal: string;
}

export function resolveThemeSurfaces(settings: ThemeSettings): ThemeSurfaces {
  const base = parseBackgroundColor(settings.background);

  const pinned = toTripletOrDerived(settings.surfacePinned, () =>
    mixRgb(base, BLACK, 0.06),
  );
  const messageOverride =
    settings.surfaceMessage?.trim() ||
    solidColorOverride(settings.messageBackground);
  const message = toTripletOrDerived(messageOverride, () =>
    mixRgb(base, WHITE, 0.14),
  );
  const menu = toTripletOrDerived(settings.surfaceMenu, () =>
    mixRgb(base, WHITE, 0.06),
  );
  const modal = settings.surfaceModal?.trim()
    ? (parseCssColor(settings.surfaceModal) ?? mixRgb(base, WHITE, 0.1))
    : mixRgb(base, WHITE, 0.1);

  return {
    pinned,
    message,
    menu,
    modal: rgbToTriplet(modal),
  };
}

export function getTeamsTokenValues(settings: ThemeSettings): Record<string, string> {
  const surfaces = resolveThemeSurfaces(settings);
  const messageRgb = parseTriplet(surfaces.message);

  return {
    [PLUS_SURFACE_VARS.pinned]: surfaces.pinned,
    [PLUS_SURFACE_VARS.message]: surfaces.message,
    [PLUS_SURFACE_VARS.menu]: surfaces.menu,
    [PLUS_SURFACE_VARS.modal]: surfaces.modal,

    [TEAMS_THEME_VARS.baseGlobalwhite]: surfaces.pinned,
    [TEAMS_THEME_VARS.baseBright]: surfaces.message,
    [TEAMS_THEME_VARS.baseBrightHover]: rgbToTriplet(
      mixRgb(messageRgb, WHITE, 0.08),
    ),
    [TEAMS_THEME_VARS.baseBrightActive]: rgbToTriplet(
      mixRgb(messageRgb, WHITE, 0.16),
    ),
    [TEAMS_THEME_VARS.chatPrimary]: surfaces.menu,
    [TEAMS_THEME_VARS.chatPrimaryHover]: rgbToTriplet(
      mixRgb(parseTriplet(surfaces.menu), BLACK, 0.12),
    ),
    [TEAMS_THEME_VARS.chatPrimaryActive]: rgbToTriplet(
      mixRgb(parseTriplet(surfaces.menu), BLACK, 0.2),
    ),
  };
}

export function getModalHex(settings: ThemeSettings): string {
  const surfaces = resolveThemeSurfaces(settings);
  return rgbToHex(parseTriplet(surfaces.modal));
}

export function listTeamsVarNames(): readonly string[] {
  return [...Object.values(PLUS_SURFACE_VARS), ...Object.values(TEAMS_THEME_VARS)];
}

function toTripletOrDerived(
  override: string | undefined,
  derive: () => Rgb,
): string {
  if (override?.trim()) {
    const parsed = parseCssColor(override.trim());
    if (parsed) return rgbToTriplet(parsed);
  }
  return rgbToTriplet(derive());
}

function parseTriplet(triplet: string): Rgb {
  const [r, g, b] = triplet.split(",").map((v) => Number(v.trim()));
  return { r: r ?? 0, g: g ?? 0, b: b ?? 0 };
}

function solidColorOverride(value: string | undefined): string | undefined {
  const raw = value?.trim();
  if (!raw || /gradient/i.test(raw)) return undefined;
  return raw;
}

export function isMessageGradient(settings: ThemeSettings): boolean {
  return /gradient/i.test(settings.messageBackground ?? "");
}
