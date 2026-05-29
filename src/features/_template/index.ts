/**
 * Шаблон новой фичи — скопируйте папку и зарегистрируйте в src/content/index.ts:
 *
 *   import "@/features/my-feature";
 */
import { registerFeature } from "@/core/feature-registry";
import type { FeatureContext } from "@/core/types";

const myFeature = {
  id: "my-feature",
  name: "Название фичи",

  init(_ctx: FeatureContext) {
    // логика
  },
};

registerFeature(myFeature);

export { myFeature };
