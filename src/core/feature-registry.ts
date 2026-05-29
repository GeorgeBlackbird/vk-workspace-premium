import type { FeatureContext, FeatureModule } from "./types";

const features: FeatureModule[] = [];

/** Регистрация фичи (вызывается при импорте модуля фичи) */
export function registerFeature(feature: FeatureModule): void {
  if (features.some((f) => f.id === feature.id)) {
    console.warn(`[VK Teams Plus] Feature "${feature.id}" already registered`);
    return;
  }
  features.push(feature);
}

export function getRegisteredFeatures(): readonly FeatureModule[] {
  return features;
}

export async function bootstrapFeatures(ctx: FeatureContext): Promise<void> {
  const settings = await ctx.getSettings();
  if (!settings.enabled) {
    console.info("[VK Teams Plus] Disabled globally");
    return;
  }

  for (const feature of features) {
    try {
      await feature.init(ctx);
      console.info(`[VK Teams Plus] Feature loaded: ${feature.id}`);
    } catch (error) {
      console.error(`[VK Teams Plus] Feature failed: ${feature.id}`, error);
    }
  }
}

export function destroyFeatures(): void {
  for (const feature of features) {
    feature.destroy?.();
  }
}
