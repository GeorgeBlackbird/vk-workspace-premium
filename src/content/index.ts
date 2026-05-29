import { bootstrapFeatures, destroyFeatures } from "@/core/feature-registry";
import { getAppSettings } from "@/core/storage";
import type { AppSettings, FeatureContext } from "@/core/types";

// Подключаем фичи через side-effect import
import "@/features/theme";

const SETTINGS_LISTENER_KEY = "__vktPlusSettingsListeners";

type SettingsListener = (settings: AppSettings) => void;

function getSettingsListeners(): SettingsListener[] {
  const w = window as unknown as Record<string, SettingsListener[]>;
  if (!w[SETTINGS_LISTENER_KEY]) {
    w[SETTINGS_LISTENER_KEY] = [];
  }
  return w[SETTINGS_LISTENER_KEY];
}

function notifySettingsListeners(settings: AppSettings): void {
  for (const listener of getSettingsListeners()) {
    listener(settings);
  }
}

function createMountRoot(): HTMLElement {
  const id = "vkt-plus-root";
  let root = document.getElementById(id);
  if (!root) {
    root = document.createElement("div");
    root.id = id;
    root.setAttribute("data-vkt-plus", "mount");
    Object.assign(root.style, {
      position: "fixed",
      zIndex: "2147483646",
      pointerEvents: "none",
      inset: "0",
    });
    (document.body ?? document.documentElement).appendChild(root);
  }
  return root;
}

function buildFeatureContext(): FeatureContext {
  return {
    mountRoot: createMountRoot(),
    getSettings: getAppSettings,
    onSettingsChanged(listener) {
      const listeners = getSettingsListeners();
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
  };
}

async function main(): Promise<void> {
  if (import.meta.env.DEV) {
    console.info("[VK Teams Plus] content script", location.href);
  }
  const ctx = buildFeatureContext();
  await bootstrapFeatures(ctx);
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes.appSettings) return;
  const next = changes.appSettings.newValue as AppSettings | undefined;
  if (next) notifySettingsListeners(next);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SETTINGS_CHANGED") {
    void getAppSettings().then(notifySettingsListeners);
    sendResponse({ ok: true });
    return true;
  }
  return false;
});

void main();

window.addEventListener("pagehide", () => {
  destroyFeatures();
});
