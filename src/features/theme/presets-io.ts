import type { ThemeColorSettings, ThemePreset } from "./types";

export const THEME_EXPORT_VERSION = 1;
export const THEME_EXPORT_TYPE = "vk-teams-plus-theme";

export interface ThemeExportFile {
  version: number;
  type: typeof THEME_EXPORT_TYPE | "vk-teams-plus-themes";
  name?: string;
  settings?: ThemeColorSettings;
  presets?: ThemePreset[];
}

export function exportPresetFile(preset: ThemePreset): string {
  const payload: ThemeExportFile = {
    version: THEME_EXPORT_VERSION,
    type: THEME_EXPORT_TYPE,
    name: preset.name,
    settings: preset.settings,
  };
  return JSON.stringify(payload, null, 2);
}

export function exportLibraryFile(presets: ThemePreset[]): string {
  const payload: ThemeExportFile = {
    version: THEME_EXPORT_VERSION,
    type: "vk-teams-plus-themes",
    presets,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseImportFile(json: string): ThemePreset[] {
  const data = JSON.parse(json) as ThemeExportFile;
  if (!data || typeof data !== "object") {
    throw new Error("Некорректный JSON");
  }
  if (data.version > THEME_EXPORT_VERSION) {
    throw new Error("Версия файла новее, чем поддерживает дополнение");
  }

  if (data.type === THEME_EXPORT_TYPE && data.settings) {
    return [
      {
        id: `import-${Date.now().toString(36)}`,
        name: data.name?.trim() || "Импортированная тема",
        settings: data.settings,
      },
    ];
  }

  if (data.type === "vk-teams-plus-themes" && Array.isArray(data.presets)) {
    return data.presets
      .filter((p) => p?.settings?.background && p?.settings?.accent)
      .map((p) => ({
        id: `import-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        name: p.name?.trim() || "Импорт",
        settings: p.settings,
      }));
  }

  throw new Error("Неизвестный формат файла темы");
}

export function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
