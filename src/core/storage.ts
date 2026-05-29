import { DEFAULT_APP_SETTINGS, type AppSettings } from "./types";

export const STORAGE_KEY = "appSettings";

/**
 * local — без жёсткого лимита sync (~2 записи/сек), важно при автосохранении в редакторе.
 * При первом чтении переносим данные из sync, если local пуст.
 */
export async function getAppSettings(): Promise<AppSettings> {
  const localResult = await chrome.storage.local.get(STORAGE_KEY);
  const localRaw = localResult[STORAGE_KEY] as Partial<AppSettings> | undefined;
  if (localRaw) {
    return mergeSettings(DEFAULT_APP_SETTINGS, localRaw);
  }

  const syncResult = await chrome.storage.sync.get(STORAGE_KEY);
  const syncRaw = syncResult[STORAGE_KEY] as Partial<AppSettings> | undefined;
  if (syncRaw) {
    const migrated = mergeSettings(DEFAULT_APP_SETTINGS, syncRaw);
    await chrome.storage.local.set({ [STORAGE_KEY]: migrated });
    return migrated;
  }

  return { ...DEFAULT_APP_SETTINGS };
}

export async function setAppSettings(
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await getAppSettings();
  const next = mergeSettings(current, patch);
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
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
