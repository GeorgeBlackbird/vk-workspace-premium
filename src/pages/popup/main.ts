import { MessageType, sendToBackground } from "@/core/messaging";
import { getAppSettings, setFeatureSettings } from "@/core/storage";
import { mergeColorSettings } from "@/features/theme/settings-utils";
import { getPresetById, listPresets } from "@/features/theme/theme-library";
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
} from "@/features/theme/types";

const versionEl = document.getElementById("version")!;
const statusEl = document.getElementById("status")!;
const openOptions = document.getElementById("open-options")!;
const presetSelect = document.getElementById(
  "preset-select",
) as HTMLSelectElement;

versionEl.textContent = `v${chrome.runtime.getManifest().version}`;

openOptions.addEventListener("click", () => {
  void chrome.runtime.openOptionsPage();
});

async function notifyTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      void chrome.tabs
        .sendMessage(tab.id, { type: "SETTINGS_CHANGED" })
        .catch(() => undefined);
    }
  }
}

async function loadPresets(): Promise<void> {
  const app = await getAppSettings();
  const theme = {
    ...DEFAULT_THEME_SETTINGS,
    ...(app.features.theme as Partial<ThemeSettings>),
  };

  const presets = await listPresets();
  presetSelect.replaceChildren();

  for (const preset of presets) {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  }

  if (
    theme.activePresetId &&
    presets.some((p) => p.id === theme.activePresetId)
  ) {
    presetSelect.value = theme.activePresetId;
  } else if (presets[0]) {
    presetSelect.value = presets[0].id;
  }
}

presetSelect.addEventListener("change", () => {
  void (async () => {
    const preset = await getPresetById(presetSelect.value);
    if (!preset) return;

    const app = await getAppSettings();
    const current = {
      ...DEFAULT_THEME_SETTINGS,
      ...(app.features.theme as Partial<ThemeSettings>),
    };

    const next: ThemeSettings = mergeColorSettings(
      { ...current, enabled: true, activePresetId: preset.id },
      preset.settings,
    );

    await setFeatureSettings("theme", next);
    await notifyTabs();
    statusEl.textContent = `Тема: ${preset.name}`;
  })();
});

void (async () => {
  try {
    const res = await sendToBackground<{ type: string }, { ok: boolean }>({
      type: MessageType.PING,
    });
    statusEl.textContent = res?.ok ? "Фоновый скрипт активен" : "Нет ответа";
  } catch {
    statusEl.textContent = "Ошибка связи с расширением";
  }
  await loadPresets();
})();
