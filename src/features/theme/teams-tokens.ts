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
import { getMessageBubbleLayers, type MessageFill } from "./message-fill";

/** IM-токены (формат «R, G, B» для rgba(var(--theme-color-…))). */
export const TEAMS_THEME_VARS = {
  chatEnvironment: "--theme-color-chat_environment",
  baseGlobalwhite: "--theme-color-base_globalwhite",
  baseGlobalwhiteBrightInverse:
    "--theme-color-base_globalwhite_bright_inverse",
  baseBright: "--theme-color-base_bright",
  baseBrightInverse: "--theme-color-base_bright_inverse",
  baseBrightInverseHover: "--theme-color-base_bright_inverse_hover",
  baseBrightHover: "--theme-color-base_bright_hover",
  chatSecondary: "--theme-color-chat_secondary",
  primarySelected: "--theme-color-primary_selected",
  baseBrightActive: "--theme-color-base_bright_active",
  baseLight: "--theme-color-base_light",
  secondarySelected: "--theme-color-secondary_selected",
  chatPrimary: "--theme-color-chat_primary",
  chatPrimaryHover: "--theme-color-chat_primary_hover",
  chatPrimaryActive: "--theme-color-chat_primary_active",
} as const;

export const PLUS_SURFACE_VARS = {
  environment: "--vkt-plus-surface-environment",
  pinned: "--vkt-plus-surface-pinned",
  message: "--vkt-plus-surface-message",
  messageHover: "--vkt-plus-surface-message-hover",
  messageActive: "--vkt-plus-surface-message-active",
  incomingBubbleBg: "--vkt-plus-incoming-bg",
  outgoingBubbleBg: "--vkt-plus-outgoing-bg",
  menu: "--vkt-plus-surface-menu",
  menuHover: "--vkt-plus-surface-menu-hover",
  menuActive: "--vkt-plus-surface-menu-active",
  modal: "--vkt-plus-surface-modal",
  hover: "--vkt-plus-surface-hover",
  hoverSearch: "--vkt-plus-surface-hover-search",
  outgoing: "--vkt-plus-surface-outgoing",
  primarySelected: "--vkt-plus-surface-primary-selected",
  reactions: "--vkt-plus-surface-reactions",
} as const;

export interface ThemeSurfaces {
  environment: string;
  pinned: string;
  message: string;
  messageHover: string;
  messageActive: string;
  menu: string;
  menuHover: string;
  menuActive: string;
  modal: string;
  hover: string;
  hoverSearch: string;
  outgoing: string;
  primarySelected: string;
  reactions: string;
}

export function resolveThemeSurfaces(settings: ThemeSettings): ThemeSurfaces {
  const base = parseBackgroundColor(settings.background);
  const layers = getMessageBubbleLayers(settings);
  const incomingFill = layers.incoming;
  const outgoingFill = layers.outgoing;

  const environment = toTripletOrDerived(settings.surfaceEnvironment, () =>
    mixRgb(base, BLACK, 0.08),
  );
  const pinned = toTripletOrDerived(settings.surfacePinned, () =>
    mixRgb(base, BLACK, 0.06),
  );

  const message = tripletFromMessageFill(incomingFill, () =>
    mixRgb(base, WHITE, 0.14),
  );

  const menu = toTripletOrDerived(settings.surfaceMenu, () =>
    mixRgb(base, WHITE, 0.06),
  );
  const modal = settings.surfaceModal?.trim()
    ? (parseCssColor(settings.surfaceModal) ?? mixRgb(base, WHITE, 0.1))
    : mixRgb(base, WHITE, 0.1);
  const pinnedRgb = parseTriplet(pinned);
  const messageRgb = parseTriplet(message);
  const menuRgb = parseTriplet(menu);

  const hover = toTripletOrDerived(settings.surfaceHover, () =>
    mixRgb(pinnedRgb, WHITE, 0.22),
  );
  const hoverRgb = parseTriplet(hover);
  const accentRgb = parseAccentColor(settings.accent);
  const reactions = toTripletOrDerived(settings.surfaceReactions, () =>
    mixRgb(messageRgb, WHITE, 0.18),
  );

  const outgoing = tripletFromMessageFill(outgoingFill, () =>
    mixRgb(messageRgb, accentRgb, 0.38),
  );

  const primarySelected = rgbToTriplet(accentRgb);

  return {
    environment,
    pinned,
    message,
    messageHover: rgbToTriplet(mixRgb(messageRgb, WHITE, 0.08)),
    messageActive: rgbToTriplet(mixRgb(messageRgb, WHITE, 0.16)),
    menu,
    menuHover: rgbToTriplet(mixRgb(menuRgb, BLACK, 0.12)),
    menuActive: rgbToTriplet(mixRgb(menuRgb, BLACK, 0.2)),
    modal: rgbToTriplet(modal),
    hover,
    hoverSearch: rgbToTriplet(mixRgb(hoverRgb, WHITE, 0.14)),
    outgoing,
    primarySelected,
    reactions,
  };
}

export function getTeamsTokenValues(settings: ThemeSettings): Record<string, string> {
  const surfaces = resolveThemeSurfaces(settings);
  const layers = getMessageBubbleLayers(settings);

  const values: Record<string, string> = {
    [PLUS_SURFACE_VARS.environment]: surfaces.environment,
    [PLUS_SURFACE_VARS.pinned]: surfaces.pinned,
    [PLUS_SURFACE_VARS.message]: surfaces.message,
    [PLUS_SURFACE_VARS.messageHover]: surfaces.messageHover,
    [PLUS_SURFACE_VARS.messageActive]: surfaces.messageActive,
    [PLUS_SURFACE_VARS.menu]: surfaces.menu,
    [PLUS_SURFACE_VARS.menuHover]: surfaces.menuHover,
    [PLUS_SURFACE_VARS.menuActive]: surfaces.menuActive,
    [PLUS_SURFACE_VARS.modal]: surfaces.modal,
    [PLUS_SURFACE_VARS.hover]: surfaces.hover,
    [PLUS_SURFACE_VARS.hoverSearch]: surfaces.hoverSearch,
    [PLUS_SURFACE_VARS.outgoing]: surfaces.outgoing,
    [PLUS_SURFACE_VARS.primarySelected]: surfaces.primarySelected,
    [PLUS_SURFACE_VARS.reactions]: surfaces.reactions,

    [TEAMS_THEME_VARS.chatEnvironment]: surfaces.environment,
    [TEAMS_THEME_VARS.chatSecondary]: surfaces.outgoing,
    [TEAMS_THEME_VARS.baseGlobalwhite]: surfaces.pinned,
    [TEAMS_THEME_VARS.baseGlobalwhiteBrightInverse]: surfaces.hover,
    [TEAMS_THEME_VARS.baseBright]: surfaces.message,
    [TEAMS_THEME_VARS.baseBrightInverse]: surfaces.hover,
    [TEAMS_THEME_VARS.baseBrightInverseHover]: surfaces.hoverSearch,
    [TEAMS_THEME_VARS.baseBrightHover]: surfaces.messageHover,
    [TEAMS_THEME_VARS.baseBrightActive]: surfaces.messageActive,
    [TEAMS_THEME_VARS.baseLight]: surfaces.reactions,
    [TEAMS_THEME_VARS.secondarySelected]: surfaces.hover,
    [TEAMS_THEME_VARS.primarySelected]: surfaces.primarySelected,
    [TEAMS_THEME_VARS.chatPrimary]: surfaces.menu,
    [TEAMS_THEME_VARS.chatPrimaryHover]: surfaces.menuHover,
    [TEAMS_THEME_VARS.chatPrimaryActive]: surfaces.menuActive,
  };

  if (layers.incomingGradientCss) {
    values[PLUS_SURFACE_VARS.incomingBubbleBg] = layers.incomingGradientCss;
  }
  if (layers.outgoingGradientCss) {
    values[PLUS_SURFACE_VARS.outgoingBubbleBg] = layers.outgoingGradientCss;
  }

  return values;
}

export function getModalHex(settings: ThemeSettings): string {
  const surfaces = resolveThemeSurfaces(settings);
  return rgbToHex(parseTriplet(surfaces.modal));
}

export function listTeamsVarNames(): readonly string[] {
  return [...Object.values(PLUS_SURFACE_VARS), ...Object.values(TEAMS_THEME_VARS)];
}

function tripletFromMessageFill(fill: MessageFill, derive: () => Rgb): string {
  if (fill.kind === "solid") {
    return toTripletOrDerived(fill.value, derive);
  }
  if (fill.kind === "gradient") {
    return rgbToTriplet(parseBackgroundColor(fill.value));
  }
  return rgbToTriplet(derive());
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

function parseAccentColor(accent: string): Rgb {
  return parseCssColor(accent.trim()) ?? { r: 0, g: 119, b: 255 };
}
