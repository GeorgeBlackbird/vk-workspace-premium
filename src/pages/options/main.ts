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
import {
  extractColorSettings,
  migrateThemeColors,
} from "@/features/theme/settings-utils";
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
const saveStatus = document.getElementById("save-status")!;
const openTeams = document.getElementById("open-teams")!;

interface ColorFieldBinding {
  text: HTMLInputElement;
  picker: HTMLInputElement;
  fallback: string;
}

const colorFields: ColorFieldBinding[] = [
  {
    text: getInput("theme-background"),
    picker: getInput("theme-background-picker"),
    fallback: DEFAULT_THEME_SETTINGS.background,
  },
  {
    text: getInput("theme-accent"),
    picker: getInput("theme-accent-picker"),
    fallback: DEFAULT_THEME_SETTINGS.accent,
  },
  {
    text: getInput("theme-surface-environment"),
    picker: getInput("theme-surface-environment-picker"),
    fallback: "",
  },
  {
    text: getInput("theme-surface-pinned"),
    picker: getInput("theme-surface-pinned-picker"),
    fallback: "",
  },
  {
    text: getInput("theme-surface-hover"),
    picker: getInput("theme-surface-hover-picker"),
    fallback: "",
  },
  {
    text: getInput("theme-surface-reactions"),
    picker: getInput("theme-surface-reactions-picker"),
    fallback: "",
  },
  {
    text: getInput("theme-surface-menu"),
    picker: getInput("theme-surface-menu-picker"),
    fallback: "",
  },
  {
    text: getInput("theme-surface-modal"),
    picker: getInput("theme-surface-modal-picker"),
    fallback: "",
  },
  {
    text: getInput("theme-text-primary"),
    picker: getInput("theme-text-primary-picker"),
    fallback: "",
  },
  {
    text: getInput("theme-text-secondary"),
    picker: getInput("theme-text-secondary-picker"),
    fallback: "",
  },
  {
    text: getInput("theme-icon-primary"),
    picker: getInput("theme-icon-primary-picker"),
    fallback: "",
  },
];

const themeSurfaceMessage = getInput("theme-surface-message");
const themeSurfaceOutgoing = getInput("theme-surface-outgoing");

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let persistTimer: ReturnType<typeof setTimeout> | undefined;
let activePresetId: string | null = null;
let suppressPresetSelect = false;

function getInput(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

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

function normalizeHex(color: string, fallback: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{6}$/i.test(fallback)) return fallback;
  return "#232324";
}

function syncPickerFromText(binding: ColorFieldBinding): void {
  const raw = binding.text.value.trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) {
    binding.picker.value = raw;
    return;
  }
  if (!raw && !binding.fallback) return;
  if (binding.fallback) {
    binding.picker.value = normalizeHex(binding.fallback, binding.fallback);
  }
}

function syncTextFromPicker(binding: ColorFieldBinding): void {
  binding.text.value = binding.picker.value;
}

function fillColorField(binding: ColorFieldBinding, value: string | undefined): void {
  binding.text.value = value ?? "";
  syncPickerFromText(binding);
}

function readColorsFromForm(): ThemeColorSettings {
  return {
    background:
      getInput("theme-background").value.trim() ||
      DEFAULT_THEME_SETTINGS.background,
    accent:
      getInput("theme-accent").value.trim() || DEFAULT_THEME_SETTINGS.accent,
    surfaceEnvironment: optionalField(getInput("theme-surface-environment").value),
    surfacePinned: optionalField(getInput("theme-surface-pinned").value),
    surfaceHover: optionalField(getInput("theme-surface-hover").value),
    surfaceReactions: optionalField(getInput("theme-surface-reactions").value),
    surfaceMessage: optionalField(themeSurfaceMessage.value),
    surfaceOutgoing: optionalField(themeSurfaceOutgoing.value),
    surfaceMenu: optionalField(getInput("theme-surface-menu").value),
    surfaceModal: optionalField(getInput("theme-surface-modal").value),
    textPrimary: optionalField(getInput("theme-text-primary").value),
    textSecondary: optionalField(getInput("theme-text-secondary").value),
    iconPrimary: optionalField(getInput("theme-icon-primary").value),
  };
}

function readThemeFromForm(): ThemeSettings {
  return {
    enabled: themeEnabled.checked,
    activePresetId,
    ...migrateThemeColors(readColorsFromForm()),
  };
}

function fillFormFromColors(colors: ThemeColorSettings): void {
  fillColorField(colorFields[0]!, colors.background);
  fillColorField(colorFields[1]!, colors.accent);
  fillColorField(colorFields[2]!, colors.surfaceEnvironment);
  fillColorField(colorFields[3]!, colors.surfacePinned);
  fillColorField(colorFields[4]!, colors.surfaceHover);
  fillColorField(colorFields[5]!, colors.surfaceReactions);
  themeSurfaceMessage.value = colors.surfaceMessage ?? "";
  themeSurfaceOutgoing.value = colors.surfaceOutgoing ?? "";
  fillColorField(colorFields[6]!, colors.surfaceMenu);
  fillColorField(colorFields[7]!, colors.surfaceModal);
  fillColorField(colorFields[8]!, colors.textPrimary);
  fillColorField(colorFields[9]!, colors.textSecondary);
  fillColorField(colorFields[10]!, colors.iconPrimary);
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

async function persistNow(): Promise<void> {
  await setAppSettings({ enabled: globalEnabled.checked });
  await setFeatureSettings("theme", readThemeFromForm());
  await notifyTabs();
  showStatus("Сохранено");
}

function schedulePersist(): void {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void persistNow();
  }, 400);
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
        : (activePresetId ?? "");
  suppressPresetSelect = false;

  return presets;
}

async function applyPreset(preset: ThemePreset): Promise<void> {
  activePresetId = preset.id;
  fillFormFromColors(preset.settings);
  themeEnabled.checked = true;
  await persistNow();
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

function bindColorField(binding: ColorFieldBinding): void {
  binding.picker.addEventListener("input", () => {
    syncTextFromPicker(binding);
    schedulePersist();
  });
  binding.text.addEventListener("input", () => {
    syncPickerFromText(binding);
    schedulePersist();
  });
  binding.text.addEventListener("change", () => void persistNow());
}

function bindAutoSave(element: HTMLElement): void {
  element.addEventListener("change", () => void persistNow());
}

openTeams.addEventListener("click", (e) => {
  e.preventDefault();
  void chrome.tabs.create({ url: "https://app.workspace.vk.ru/messenger" });
});

presetSelect.addEventListener("change", () => {
  if (suppressPresetSelect) return;
  const id = presetSelect.value;
  if (!id) {
    activePresetId = null;
    void persistNow();
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
    await persistNow();
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
    await persistNow();
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
    await persistNow();
    await refreshPresetSelect();
    showStatus("Тема удалена");
  });
});

presetExportOne.addEventListener("click", () => {
  const id = presetSelect.value || activePresetId;
  if (id) {
    void getPresetById(id).then((preset) => {
      if (!preset) return;
      downloadJson(`${slugify(preset.name)}.json`, exportPresetFile(preset));
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

for (const binding of colorFields) {
  bindColorField(binding);
}

bindAutoSave(globalEnabled);
bindAutoSave(themeEnabled);
function bindTextField(element: HTMLInputElement): void {
  element.addEventListener("input", () => schedulePersist());
  element.addEventListener("change", () => void persistNow());
}

bindTextField(themeSurfaceMessage);
bindTextField(themeSurfaceOutgoing);

void load();
