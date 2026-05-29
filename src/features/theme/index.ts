import { registerFeature } from "@/core/feature-registry";
import { getFeatureSettings } from "@/core/storage";
import type { FeatureContext } from "@/core/types";
import { applyTheme } from "./apply";
import { DEFAULT_THEME_SETTINGS, type ThemeSettings } from "./types";

async function loadThemeSettings(): Promise<ThemeSettings> {
  return getFeatureSettings("theme", DEFAULT_THEME_SETTINGS);
}

const themeFeature = {
  id: "theme",
  name: "Тема",
  description: "Кастомный фон и акцентный цвет",

  async init(ctx: FeatureContext) {
    const apply = async () => {
      const [app, theme] = await Promise.all([
        ctx.getSettings(),
        loadThemeSettings(),
      ]);
      if (!app.enabled || !theme.enabled) {
        applyTheme({ ...theme, enabled: false });
        return;
      }
      applyTheme(theme);
    };

    await apply();
    ctx.onSettingsChanged(() => {
      void apply();
    });
  },

  destroy() {
    applyTheme({ ...DEFAULT_THEME_SETTINGS, enabled: false });
  },
};

registerFeature(themeFeature);

export { themeFeature };
