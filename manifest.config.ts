import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

/** Оболочка VK WorkSpace */
const WORKSPACE_HOST_PATTERNS = [
  "https://app.workspace.vk.ru/*",
  "https://*.workspace.vk.ru/*",
] as const;

/** Мессенджер во iframe */
const MESSENGER_HOST_PATTERNS = [
  "https://myteam.mail.ru/*",
  "https://*.myteam.mail.ru/*",
] as const;

const ALL_HOST_PATTERNS = [
  ...WORKSPACE_HOST_PATTERNS,
  ...MESSENGER_HOST_PATTERNS,
] as const;

export default defineManifest({
  manifest_version: 3,
  name: "VK Teams Plus",
  description: pkg.description,
  version: pkg.version,
  icons: {
    "16": "public/icons/icon-16.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png",
  },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_title: "VK Teams Plus",
  },
  options_ui: {
    page: "src/pages/options/index.html",
    open_in_tab: true,
  },
  permissions: ["storage"],
  host_permissions: [...ALL_HOST_PATTERNS],
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: [...ALL_HOST_PATTERNS],
      js: ["src/content/index.ts"],
      run_at: "document_start",
      all_frames: true,
    },
  ],
  web_accessible_resources: [
    {
      resources: ["assets/*"],
      matches: [...ALL_HOST_PATTERNS],
    },
  ],
});
