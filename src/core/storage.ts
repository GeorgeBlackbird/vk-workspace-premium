import { DEFAULT_APP_SETTINGS, type AppSettings } from "./types";

const STORAGE_KEY = "appSettings";

export async function getAppSettings(): Promise<AppSettings> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const raw = result[STORAGE_KEY] as Partial<AppSettings> | undefined;
  return mergeSettings(DEFAULT_APP_SETTINGS, raw);
}

export async function setAppSettings(
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await getAppSettings();
  const next = mergeSettings(current, patch);
  await chrome.storage.sync.set({ [STORAGE_KEY]: next });
  return next;
}

export async function getFeatureSettings<T extends object>(
  featureId: string,
  defaults: T,
): Promise<T> {
  const app = await getAppSettings();
  const raw = app.features[featureId] as Partial<T> | undefined;
  return { ...defaults, ...raw } as T;
}

export async function setFeatureSettings<T extends object>(
  featureId: string,
  patch: Partial<T>,
): Promise<AppSettings> {
  const app = await getAppSettings();
  const current = (app.features[featureId] ?? {}) as T;
  return setAppSettings({
    features: {
      ...app.features,
      [featureId]: { ...current, ...patch },
    },
  });
}

function mergeSettings(
  base: AppSettings,
  patch?: Partial<AppSettings>,
): AppSettings {
  if (!patch) return { ...base };
  return {
    enabled: patch.enabled ?? base.enabled,
    features: { ...base.features, ...patch.features },
  };
}
