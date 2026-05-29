import type { ThemeColorSettings, ThemePreset } from "./types";

const LIBRARY_KEY = "vktPlusThemeLibrary";

export interface ThemeLibrary {
  presets: ThemePreset[];
}

export const BUILTIN_PRESETS: ThemePreset[] = [
  {
    id: "builtin-dark",
    name: "Тёмная (VK Teams)",
    settings: {
      background: "#232324",
      accent: "#0077ff",
    },
  },
  {
    id: "builtin-light",
    name: "Светлая (пример)",
    settings: {
      background: "#f0f2f5",
      accent: "#0077ff",
      surfacePinned: "#e8eaed",
      surfaceMessage: "#ffffff",
      surfaceMenu: "#ffffff",
      surfaceModal: "#ffffff",
      textPrimary: "#222222",
      textSecondary: "#818c99",
    },
  },
];

export async function getThemeLibrary(): Promise<ThemeLibrary> {
  const result = await chrome.storage.local.get(LIBRARY_KEY);
  const raw = result[LIBRARY_KEY] as ThemeLibrary | undefined;
  if (!raw?.presets?.length) {
    const initial = { presets: [...BUILTIN_PRESETS] };
    await chrome.storage.local.set({ [LIBRARY_KEY]: initial });
    return initial;
  }
  return raw;
}

export async function saveThemeLibrary(library: ThemeLibrary): Promise<void> {
  await chrome.storage.local.set({ [LIBRARY_KEY]: library });
}

export async function listPresets(): Promise<ThemePreset[]> {
  const lib = await getThemeLibrary();
  return lib.presets;
}

export async function upsertPreset(preset: ThemePreset): Promise<void> {
  const lib = await getThemeLibrary();
  const index = lib.presets.findIndex((p) => p.id === preset.id);
  if (index >= 0) {
    lib.presets[index] = preset;
  } else {
    lib.presets.push(preset);
  }
  await saveThemeLibrary(lib);
}

export async function deletePreset(id: string): Promise<void> {
  const lib = await getThemeLibrary();
  lib.presets = lib.presets.filter((p) => p.id !== id);
  await saveThemeLibrary(lib);
}

export async function getPresetById(id: string): Promise<ThemePreset | null> {
  const lib = await getThemeLibrary();
  return lib.presets.find((p) => p.id === id) ?? null;
}

export function createPresetId(): string {
  return `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function presetFromColors(
  name: string,
  settings: ThemeColorSettings,
): ThemePreset {
  return {
    id: createPresetId(),
    name,
    settings: { ...settings },
  };
}
