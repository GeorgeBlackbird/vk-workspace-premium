import type { ThemeSettings } from "./types";
import { parseBackgroundColor, rgbToHex } from "./color-utils";
import { resolveIconColors } from "./icon-tokens";
import { getModalHex } from "./teams-tokens";
import { resolveTextColors } from "./text-tokens";

/**
 * VKUI-токены VK Teams / VK WorkSpace (paradigmBaseDark).
 */
export const VKUI_THEME_VARS = {
  background: "--vkui--color_background",
  backgroundContent: "--vkui--color_background_content",
  backgroundSecondary: "--vkui--color_background_secondary",
  backgroundTertiary: "--vkui--color_background_tertiary",
  fieldBackground: "--vkui--color_field_background",
  headerBackground: "--vkui--color_header_background",
  writeBarInputBackground: "--vkui--color_write_bar_input_background",
  sidebarBg: "--vkui-sidebar-bg-color",

  backgroundAccent: "--vkui--color_background_accent",
  textAccent: "--vkui--color_text_accent",
  iconAccent: "--vkui--color_icon_accent",
  strokeAccent: "--vkui--color_stroke_accent",
  writeBarIcon: "--vkui--color_write_bar_icon",
  link: "--vkui--color_text_link",
} as const;

export const PLUS_OVERRIDE_VARS = {
  background: "--vkt-plus-bg",
  accent: "--vkt-plus-accent",
} as const;

const VKUI_VAR_NAMES = Object.values(VKUI_THEME_VARS);

const VKUI_TEXT_VARS = [
  "--vkui--color_text_primary",
  "--vkui--color_text_contrast",
  "--vkui--color_text_secondary",
  "--vkui--color_text_subhead",
  "--vkui--color_icon_primary",
  "--vkui--color_icon_secondary",
  "--vkui--color_icon_medium",
] as const;

export function getVkuiTokenValues(settings: ThemeSettings): Record<string, string> {
  const { accent } = settings;
  const bg = rgbToHex(parseBackgroundColor(settings.background));
  const modal = getModalHex(settings);
  const text = resolveTextColors(settings);
  const icon = resolveIconColors(settings);

  return {
    [VKUI_THEME_VARS.background]: bg,
    [VKUI_THEME_VARS.backgroundContent]: bg,
    [VKUI_THEME_VARS.backgroundSecondary]: bg,
    [VKUI_THEME_VARS.backgroundTertiary]: bg,
    [VKUI_THEME_VARS.fieldBackground]: bg,
    [VKUI_THEME_VARS.headerBackground]: bg,
    [VKUI_THEME_VARS.writeBarInputBackground]: bg,
    [VKUI_THEME_VARS.sidebarBg]: bg,
    "--vkui--color_background_modal": modal,
    "--vkui--color_background_modal--hover": modal,
    "--vkui--color_background_modal--active": modal,

    "--vkui--color_text_primary": text.primaryHex,
    "--vkui--color_text_contrast": text.primaryHex,
    "--vkui--color_text_secondary": text.secondaryHex,
    "--vkui--color_text_subhead": text.secondaryHex,
    "--vkui--color_icon_primary": icon.hex,
    "--vkui--color_icon_secondary": text.secondaryHex,
    "--vkui--color_icon_medium": text.secondaryHex,

    [VKUI_THEME_VARS.backgroundAccent]: accent,
    [VKUI_THEME_VARS.textAccent]: accent,
    [VKUI_THEME_VARS.iconAccent]: accent,
    [VKUI_THEME_VARS.strokeAccent]: accent,
    [VKUI_THEME_VARS.writeBarIcon]: accent,
    [VKUI_THEME_VARS.link]: accent,
  };
}

export function listVkuiVarNames(): readonly string[] {
  return [
    ...VKUI_VAR_NAMES,
    "--vkui--color_background_modal",
    "--vkui--color_background_modal--hover",
    "--vkui--color_background_modal--active",
    ...VKUI_TEXT_VARS,
  ];
}
