import type { ThemeSettings } from "./types";
import { THEME_ROOT_ATTR } from "./selectors";
import {
  getModalHex,
  getTeamsTokenValues,
  isMessageGradient,
  listTeamsVarNames,
  PLUS_SURFACE_VARS,
} from "./teams-tokens";
import { getTextTokenValues, listTextVarNames } from "./text-tokens";
import {
  getVkuiTokenValues,
  listVkuiVarNames,
  PLUS_OVERRIDE_VARS,
} from "./vkui-tokens";
import themeCss from "./theme.css?inline";

const STYLE_ID = "vkt-plus-theme-styles";
const MESSAGE_GRADIENT_ATTR = "data-vkt-plus-message-gradient";

let styleElement: HTMLStyleElement | null = null;
let activeSettings: ThemeSettings | null = null;
let lateApplyDone = false;

function collectTokenValues(settings: ThemeSettings): Record<string, string> {
  return {
    ...getVkuiTokenValues(settings),
    ...getTeamsTokenValues(settings),
    ...getTextTokenValues(settings),
    [PLUS_SURFACE_VARS.messageBg]: settings.messageBackground?.trim() ?? "",
    "--vkt-plus-surface-modal-hex": getModalHex(settings),
  };
}

function allVarNames(): readonly string[] {
  return [...listVkuiVarNames(), ...listTeamsVarNames(), ...listTextVarNames()];
}

function applyVarsToElement(
  element: HTMLElement,
  settings: ThemeSettings,
): void {
  element.style.setProperty(
    PLUS_OVERRIDE_VARS.background,
    settings.background,
    "important",
  );
  element.style.setProperty(
    PLUS_OVERRIDE_VARS.accent,
    settings.accent,
    "important",
  );

  for (const [name, value] of Object.entries(collectTokenValues(settings))) {
    if (!value) continue;
    element.style.setProperty(name, value, "important");
  }
}

function clearVarsFromElement(element: HTMLElement): void {
  element.style.removeProperty(PLUS_OVERRIDE_VARS.background);
  element.style.removeProperty(PLUS_OVERRIDE_VARS.accent);
  element.style.removeProperty("--vkt-plus-surface-modal-hex");

  for (const name of allVarNames()) {
    element.style.removeProperty(name);
  }
}

export function ensureThemeStylesheet(): void {
  if (styleElement?.isConnected) return;

  styleElement = document.createElement("style");
  styleElement.id = STYLE_ID;
  styleElement.setAttribute("data-vkt-plus", "theme");
  styleElement.textContent = themeCss;
  (document.head || document.documentElement).appendChild(styleElement);
}

function applyToDocument(settings: ThemeSettings): void {
  const root = document.documentElement;
  root.setAttribute(THEME_ROOT_ATTR, "on");

  if (isMessageGradient(settings)) {
    root.setAttribute(MESSAGE_GRADIENT_ATTR, "on");
  } else {
    root.removeAttribute(MESSAGE_GRADIENT_ATTR);
  }

  ensureThemeStylesheet();
  applyVarsToElement(root, settings);

  if (document.body) {
    applyVarsToElement(document.body, settings);
  }
}

function scheduleLateApply(): void {
  if (lateApplyDone || !activeSettings?.enabled) return;

  const run = () => {
    if (activeSettings?.enabled) applyToDocument(activeSettings);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  }

  window.addEventListener("load", run, { once: true });

  for (const delay of [300, 1500]) {
    window.setTimeout(run, delay);
  }

  lateApplyDone = true;
}

export function applyTheme(settings: ThemeSettings): void {
  const root = document.documentElement;

  if (!settings.enabled) {
    activeSettings = null;
    lateApplyDone = false;
    root.removeAttribute(THEME_ROOT_ATTR);
    root.removeAttribute(MESSAGE_GRADIENT_ATTR);
    clearVarsFromElement(root);
    if (document.body) clearVarsFromElement(document.body);
    return;
  }

  activeSettings = settings;
  lateApplyDone = false;
  applyToDocument(settings);
  scheduleLateApply();
}

export function removeTheme(): void {
  applyTheme({ enabled: false, background: "", accent: "" });
}
