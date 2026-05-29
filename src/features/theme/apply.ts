import type { ThemeSettings } from "./types";
import { getMessageBubbleLayers } from "./message-fill";
import { THEME_ROOT_ATTR } from "./selectors";
import {
  getModalHex,
  getTeamsTokenValues,
  listTeamsVarNames,
  PLUS_SURFACE_VARS,
} from "./teams-tokens";
import { getIconTokenValues, listIconVarNames } from "./icon-tokens";
import { getTextTokenValues, listTextVarNames } from "./text-tokens";
import {
  getVkuiTokenValues,
  listVkuiVarNames,
  PLUS_OVERRIDE_VARS,
} from "./vkui-tokens";
import themeCss from "./theme.css?inline";

const STYLE_ID = "vkt-plus-theme-styles";
const INCOMING_GRADIENT_ATTR = "data-vkt-plus-incoming-gradient";
const OUTGOING_GRADIENT_ATTR = "data-vkt-plus-outgoing-gradient";
const LATE_APPLY_DELAYS_MS = [300, 1500, 4000, 8000] as const;

let styleElement: HTMLStyleElement | null = null;
let activeSettings: ThemeSettings | null = null;
let lateApplyGeneration = 0;
let themeObserver: MutationObserver | null = null;
let reapplyTimer: number | undefined;

function collectTokenValues(settings: ThemeSettings): Record<string, string> {
  return {
    ...getVkuiTokenValues(settings),
    ...getTeamsTokenValues(settings),
    ...getTextTokenValues(settings),
    ...getIconTokenValues(settings),
    "--vkt-plus-surface-modal-hex": getModalHex(settings),
  };
}

function allVarNames(): readonly string[] {
  return [
    ...listVkuiVarNames(),
    ...listTeamsVarNames(),
    ...listTextVarNames(),
    ...listIconVarNames(),
  ];
}

function themeRootSelector(): string {
  return [
    `html[${THEME_ROOT_ATTR}="on"]`,
    `html[${THEME_ROOT_ATTR}="on"] body`,
    `html[${THEME_ROOT_ATTR}="on"] body[class*="im-theme"]`,
    `html[${THEME_ROOT_ATTR}="on"] [class*="im-theme-dark"]`,
    `html[${THEME_ROOT_ATTR}="on"] [class*="im-theme-light"]`,
    `html[${THEME_ROOT_ATTR}="on"] .vkui--paradigmBase--dark`,
    `html[${THEME_ROOT_ATTR}="on"] .vkui--paradigmBase--light`,
  ].join(",\n");
}

function buildDynamicCss(settings: ThemeSettings): string {
  const lines: string[] = [];

  const add = (name: string, value: string | undefined): void => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    lines.push(`  ${name}: ${trimmed} !important;`);
  };

  add(PLUS_OVERRIDE_VARS.background, settings.background);
  add(PLUS_OVERRIDE_VARS.accent, settings.accent);

  for (const [name, value] of Object.entries(collectTokenValues(settings))) {
    add(name, value);
  }

  const blocks: string[] = [];
  if (lines.length > 0) {
    blocks.push(`\n${themeRootSelector()} {\n${lines.join("\n")}\n}\n`);
  }
  blocks.push(buildMessageBubbleOverrideCss(settings));
  return blocks.join("");
}

function buildMessageBubbleOverrideCss(settings: ThemeSettings): string {
  const layers = getMessageBubbleLayers(settings);
  const blocks: string[] = [];

  if (layers.incomingGradientCss) {
    blocks.push(buildBubbleBlock(INCOMING_GRADIENT_ATTR, "incoming", layers.incomingGradientCss));
  }
  if (layers.outgoingGradientCss) {
    blocks.push(buildBubbleBlock(OUTGOING_GRADIENT_ATTR, "outgoing", layers.outgoingGradientCss));
  }

  return blocks.join("\n");
}

function buildBubbleBlock(
  attr: string,
  kind: "incoming" | "outgoing",
  gradient: string,
): string {
  const varName =
    kind === "incoming"
      ? PLUS_SURFACE_VARS.incomingBubbleBg
      : PLUS_SURFACE_VARS.outgoingBubbleBg;
  const selectors = bubbleSelectors(attr, kind).join(",\n");

  return `
html[${attr}="on"] {
  ${varName}: ${gradient};
}
${selectors} {
  background: var(${varName}) !important;
  background-color: transparent !important;
  background-image: var(${varName}) !important;
}
`;
}

function bubbleSelectors(attr: string, kind: "incoming" | "outgoing"): string[] {
  const root = `html[${attr}="on"]`;
  const common = [
    `${root} [class*="MessageBubble"]`,
    `${root} [class*="messageBubble"]`,
    `${root} [class*="im-message"][class*="bubble"]`,
    `${root} [class*="ImMessage"][class*="bubble"]`,
    `${root} [class*="Message"][class*="bubble"]`,
  ];

  if (kind === "outgoing") {
    return [
      ...common.map(
        (s) =>
          `${s}[class*="outgoing"], ${s}[class*="Outgoing"], ${s}[class*="out"], ${s}[class*="my"], ${s}[class*="My"], ${s}[class*="own"], ${s}[class*="Own"], ${s}[class*="self"], ${s}[class*="Self"]`,
      ),
      `${root} [class*="message"][class*="out"]`,
      `${root} [class*="message"][class*="my"]`,
      `${root} [class*="message"][class*="own"]`,
      `${root} [class*="im-message"][class*="_my"]`,
      `${root} [class*="im-message"][class*="my"]`,
      `${root} [class*="ImMessage"][class*="own"]`,
      `${root} [class*="fromMe"]`,
      `${root} [class*="from-me"]`,
      `${root} [class*="is-outgoing"]`,
      `${root} [class*="isOutgoing"]`,
      `${root} [class*="MessageContent"][class*="out"]`,
      `${root} [class*="messageContent"][class*="my"]`,
      `${root} [class*="bubble"][class*="out"]`,
      `${root} [class*="bubble"][class*="my"]`,
      `${root} [class*="bubble"][class*="own"]`,
    ];
  }

  return [
    ...common.map(
      (s) =>
        `${s}:not([class*="outgoing"]):not([class*="Outgoing"]):not([class*="out"]):not([class*="my"]):not([class*="My"]):not([class*="own"]):not([class*="Own"]):not([class*="fromMe"])`,
    ),
    `${root} [class*="message"][class*="in"]`,
    `${root} [class*="im-message"]:not([class*="_my"]):not([class*="my"])`,
  ];
}

function updateThemeStylesheet(settings: ThemeSettings): void {
  ensureThemeStylesheet();
  styleElement!.textContent = `${themeCss}${buildDynamicCss(settings)}`;
}

function clearInlineThemeVars(element: HTMLElement): void {
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
  (document.head || document.documentElement).appendChild(styleElement);
}

function isThemePresentOnPage(): boolean {
  const root = document.documentElement;
  if (root.getAttribute(THEME_ROOT_ATTR) !== "on") return false;
  if (!styleElement?.isConnected) return false;
  return Boolean(styleElement.textContent?.includes(PLUS_OVERRIDE_VARS.background));
}

function scheduleReapplyIfMissing(): void {
  if (!activeSettings?.enabled) return;
  if (isThemePresentOnPage()) return;

  clearTimeout(reapplyTimer);
  reapplyTimer = window.setTimeout(() => {
    if (activeSettings?.enabled) applyToDocument(activeSettings);
  }, 50);
}

function startThemeObserver(): void {
  if (themeObserver) return;

  themeObserver = new MutationObserver(() => {
    scheduleReapplyIfMissing();
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", THEME_ROOT_ATTR],
    subtree: false,
  });

  const head = document.head;
  if (head) {
    themeObserver.observe(head, {
      childList: true,
      subtree: false,
    });
  }
}

function stopThemeObserver(): void {
  themeObserver?.disconnect();
  themeObserver = null;
  clearTimeout(reapplyTimer);
}

function applyMessageBubbleAttrs(settings: ThemeSettings, root: HTMLElement): void {
  const layers = getMessageBubbleLayers(settings);

  if (layers.incomingGradientCss) {
    root.setAttribute(INCOMING_GRADIENT_ATTR, "on");
  } else {
    root.removeAttribute(INCOMING_GRADIENT_ATTR);
  }

  if (layers.outgoingGradientCss) {
    root.setAttribute(OUTGOING_GRADIENT_ATTR, "on");
  } else {
    root.removeAttribute(OUTGOING_GRADIENT_ATTR);
  }
}

function applyToDocument(settings: ThemeSettings): void {
  const root = document.documentElement;
  root.setAttribute(THEME_ROOT_ATTR, "on");
  applyMessageBubbleAttrs(settings, root);

  clearInlineThemeVars(root);
  if (document.body) clearInlineThemeVars(document.body);

  updateThemeStylesheet(settings);
  startThemeObserver();
}

function scheduleLateApply(): void {
  if (!activeSettings?.enabled) return;

  const generation = ++lateApplyGeneration;

  const run = () => {
    if (!activeSettings?.enabled || generation !== lateApplyGeneration) return;
    applyToDocument(activeSettings);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  }

  window.addEventListener("load", run, { once: true });

  for (const delay of LATE_APPLY_DELAYS_MS) {
    window.setTimeout(run, delay);
  }
}

export function applyTheme(settings: ThemeSettings): void {
  const root = document.documentElement;

  if (!settings.enabled) {
    activeSettings = null;
    lateApplyGeneration += 1;
    stopThemeObserver();
    root.removeAttribute(THEME_ROOT_ATTR);
    root.removeAttribute(INCOMING_GRADIENT_ATTR);
    root.removeAttribute(OUTGOING_GRADIENT_ATTR);
    clearInlineThemeVars(root);
    if (document.body) clearInlineThemeVars(document.body);
    if (styleElement) styleElement.textContent = themeCss;
    return;
  }

  activeSettings = settings;
  lateApplyGeneration += 1;
  applyToDocument(settings);
  scheduleLateApply();
}

export function removeTheme(): void {
  applyTheme({ enabled: false, background: "", accent: "" });
}
