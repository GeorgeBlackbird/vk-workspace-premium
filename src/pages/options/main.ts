import {
  getAppSettings,
  setAppSettings,
  setFeatureSettings,
} from "@/core/storage";
import {
  downloadJson,
  exportLibraryFile,
  exportPresetFile,
  parseImportFile,
} from "@/features/theme/presets-io";
import { extractColorSettings } from "@/features/theme/settings-utils";
import {
  createPresetId,
  deletePreset,
  getPresetById,
  listPresets,
  presetFromColors,
  upsertPreset,
} from "@/features/theme/theme-library";
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeColorSettings,
  type ThemePreset,
  type ThemeSettings,
} from "@/features/theme/types";

const globalEnabled = document.getElementById(
  "global-enabled",
) as HTMLInputElement;
const presetSelect = document.getElementById("preset-select") as HTMLSelectElement;
const presetSave = document.getElementById("preset-save") as HTMLButtonElement;
const presetUpdate = document.getElementById("preset-update") as HTMLButtonElement;
const presetDelete = document.getElementById("preset-delete") as HTMLButtonElement;
const presetExportOne = document.getElementById(
  "preset-export-one",
) as HTMLButtonElement;
const presetExportAll = document.getElementById(
  "preset-export-all",
) as HTMLButtonElement;
const presetImport = document.getElementById("preset-import") as HTMLButtonElement;
const presetImportFile = document.getElementById(
  "preset-import-file",
) as HTMLInputElement;

const themeEnabled = document.getElementById(
  "theme-enabled",
) as HTMLInputElement;
const themeBackground = document.getElementById(
  "theme-background",
) as HTMLInputElement;
const themeAccent = document.getElementById("theme-accent") as HTMLInputElement;
const themeAccentPicker = document.getElementById(
  "theme-accent-picker",
) as HTMLInputElement;
const themeTextPrimary = document.getElementById(
  "theme-text-primary",
) as HTMLInputElement;
const themeTextSecondary = document.getElementById(
  "theme-text-secondary",
) as HTMLInputElement;
const themeSurfacePinned = document.getElementById(
  "theme-surface-pinned",
) as HTMLInputElement;
const themeSurfaceMessage = document.getElementById(
  "theme-surface-message",
) as HTMLInputElement;
const themeMessageBackground = document.getElementById(
  "theme-message-background",
) as HTMLInputElement;
const themeSurfaceMenu = document.getElementById(
  "theme-surface-menu",
) as HTMLInputElement;
const themeSurfaceModal = document.getElementById(
  "theme-surface-modal",
) as HTMLInputElement;
const saveStatus = document.getElementById("save-status")!;
const openTeams = document.getElementById("open-teams")!;

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let activePresetId: string | null = null;
let suppressPresetSelect = false;

function showStatus(text: string): void {
  saveStatus.textContent = text;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveStatus.textContent = "";
  }, 2500);
}

function optionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readColorsFromForm(): ThemeColorSettings {
  return {
    background:
      themeBackground.value.trim() || DEFAULT_THEME_SETTINGS.background,
    accent: themeAccent.value.trim() || DEFAULT_THEME_SETTINGS.accent,
    textPrimary: optionalField(themeTextPrimary.value),
    textSecondary: optionalField(themeTextSecondary.value),
    surfacePinned: optionalField(themeSurfacePinned.value),
    surfaceMessage: optionalField(themeSurfaceMessage.value),
    messageBackground: optionalField(themeMessageBackground.value),
    surfaceMenu: optionalField(themeSurfaceMenu.value),
    surfaceModal: optionalField(themeSurfaceModal.value),
  };
}

function readThemeFromForm(): ThemeSettings {
  return {
    enabled: themeEnabled.checked,
    activePresetId,
    ...readColorsFromForm(),
  };
}

function fillFormFromColors(colors: ThemeColorSettings): void {
  themeBackground.value = colors.background;
  themeAccent.value = colors.accent;
  themeAccentPicker.value = normalizeHex(colors.accent);
  themeTextPrimary.value = colors.textPrimary ?? "";
  themeTextSecondary.value = colors.textSecondary ?? "";
  themeSurfacePinned.value = colors.surfacePinned ?? "";
  themeSurfaceMessage.value = colors.surfaceMessage ?? "";
  themeMessageBackground.value = colors.messageBackground ?? "";
  themeSurfaceMenu.value = colors.surfaceMenu ?? "";
  themeSurfaceModal.value = colors.surfaceModal ?? "";
}

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

async function persist(): Promise<void> {
  await setAppSettings({ enabled: globalEnabled.checked });
  await setFeatureSettings("theme", readThemeFromForm());
  await notifyTabs();
  showStatus("Сохранено");
}

async function refreshPresetSelect(): Promise<ThemePreset[]> {
  const presets = await listPresets();
  const current = presetSelect.value;

  presetSelect.replaceChildren();
  const customOption = document.createElement("option");
  customOption.value = "";
  customOption.textContent = "— Текущая (без пресета) —";
  presetSelect.appendChild(customOption);

  for (const preset of presets) {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  }

  suppressPresetSelect = true;
  presetSelect.value =
    activePresetId && presets.some((p) => p.id === activePresetId)
      ? activePresetId
      : current && presets.some((p) => p.id === current)
        ? current
        : activePresetId ?? "";
  suppressPresetSelect = false;

  return presets;
}

async function applyPreset(preset: ThemePreset): Promise<void> {
  activePresetId = preset.id;
  fillFormFromColors(preset.settings);
  themeEnabled.checked = true;
  await persist();
  await refreshPresetSelect();
  showStatus(`Тема «${preset.name}» применена`);
}

async function load(): Promise<void> {
  const app = await getAppSettings();
  const theme = {
    ...DEFAULT_THEME_SETTINGS,
    ...(app.features.theme as Partial<ThemeSettings>),
  };

  globalEnabled.checked = app.enabled;
  themeEnabled.checked = theme.enabled;
  activePresetId = theme.activePresetId ?? null;
  fillFormFromColors(extractColorSettings(theme));
  await refreshPresetSelect();
}

function normalizeHex(color: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  return "#7aa2f7";
}

function bindAutoSave(element: HTMLElement): void {
  element.addEventListener("change", () => void persist());
  element.addEventListener("input", () => void persist());
}

openTeams.addEventListener("click", (e) => {
  e.preventDefault();
  void chrome.tabs.create({ url: "https://app.workspace.vk.ru/messenger" });
});

themeAccentPicker.addEventListener("input", () => {
  themeAccent.value = themeAccentPicker.value;
  void persist();
});

themeAccent.addEventListener("input", () => {
  if (/^#[0-9a-f]{6}$/i.test(themeAccent.value)) {
    themeAccentPicker.value = themeAccent.value;
  }
});

presetSelect.addEventListener("change", () => {
  if (suppressPresetSelect) return;
  const id = presetSelect.value;
  if (!id) {
    activePresetId = null;
    void persist();
    return;
  }
  void getPresetById(id).then((preset) => {
    if (preset) void applyPreset(preset);
  });
});

presetSave.addEventListener("click", () => {
  const name = window.prompt("Название темы:");
  if (!name?.trim()) return;
  const preset = presetFromColors(name.trim(), readColorsFromForm());
  void upsertPreset(preset).then(async () => {
    activePresetId = preset.id;
    await persist();
    await refreshPresetSelect();
    showStatus(`Тема «${preset.name}» сохранена`);
  });
});

presetUpdate.addEventListener("click", () => {
  const id = presetSelect.value || activePresetId;
  if (!id) {
    showStatus("Выберите тему в списке");
    return;
  }
  void getPresetById(id).then(async (existing) => {
    if (!existing) return;
    const updated: ThemePreset = {
      ...existing,
      settings: readColorsFromForm(),
    };
    await upsertPreset(updated);
    activePresetId = id;
    await persist();
    showStatus(`Тема «${existing.name}» обновлена`);
  });
});

presetDelete.addEventListener("click", () => {
  const id = presetSelect.value || activePresetId;
  if (!id) {
    showStatus("Выберите тему для удаления");
    return;
  }
  void getPresetById(id).then(async (preset) => {
    if (!preset) return;
    if (!window.confirm(`Удалить тему «${preset.name}»?`)) return;
    await deletePreset(id);
    if (activePresetId === id) activePresetId = null;
    await persist();
    await refreshPresetSelect();
    showStatus("Тема удалена");
  });
});

presetExportOne.addEventListener("click", () => {
  const id = presetSelect.value || activePresetId;
  if (id) {
    void getPresetById(id).then((preset) => {
      if (!preset) return;
      downloadJson(
        `${slugify(preset.name)}.json`,
        exportPresetFile(preset),
      );
      showStatus("Файл темы скачан");
    });
    return;
  }
  const snapshot = presetFromColors("Текущая тема", readColorsFromForm());
  downloadJson("theme.json", exportPresetFile(snapshot));
  showStatus("Текущие настройки экспортированы");
});

presetExportAll.addEventListener("click", () => {
  void listPresets().then((presets) => {
    downloadJson("vk-teams-plus-themes.json", exportLibraryFile(presets));
    showStatus(`Экспортировано тем: ${presets.length}`);
  });
});

presetImport.addEventListener("click", () => {
  presetImportFile.click();
});

presetImportFile.addEventListener("change", () => {
  const file = presetImportFile.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = parseImportFile(String(reader.result));
      void (async () => {
        for (const preset of imported) {
          await upsertPreset({ ...preset, id: createPresetId() });
        }
        await refreshPresetSelect();
        showStatus(`Импортировано тем: ${imported.length}`);
      })();
    } catch (error) {
      showStatus(
        error instanceof Error ? error.message : "Ошибка импорта",
      );
    }
    presetImportFile.value = "";
  };
  reader.readAsText(file);
});

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-|-$/g, "") || "theme"
  );
}

bindAutoSave(globalEnabled);
bindAutoSave(themeEnabled);
bindAutoSave(themeBackground);
bindAutoSave(themeAccent);
bindAutoSave(themeTextPrimary);
bindAutoSave(themeTextSecondary);
bindAutoSave(themeSurfacePinned);
bindAutoSave(themeSurfaceMessage);
bindAutoSave(themeMessageBackground);
bindAutoSave(themeSurfaceMenu);
bindAutoSave(themeSurfaceModal);

void load();
