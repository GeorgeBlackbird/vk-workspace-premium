# VK Teams Plus

An unofficial browser extension for customising the web version of VK Workspace and its VK Teams messenger. Built with TypeScript for Chromium-based browsers.

My colleagues and I used it to experiment with the interface and share custom themes. Keeping it working meant chasing changes in VK's page structure and internal styles. Updates repeatedly broke the overrides, and I am no longer maintaining the extension. I am keeping the source for history and do not plan to return to it.

The repository is named `vk-workspace-premium`; the extension appears in the browser as **VK Teams Plus**.

## What is included

- Custom background and accent colours, with overrides for text, icons, message bubbles, menus and other surfaces.
- Named theme presets, including built-in light and dark examples.
- JSON import and export for sharing individual themes or a collection.
- A popup for switching presets and an options page for editing them.

The content script applies styles to the Workspace shell and the messenger inside its frames. Settings and presets are stored using `chrome.storage.local`; the settings code also migrates older values from `chrome.storage.sync`.

## Compatibility and maintenance

This extension relies on internal VKUI and messenger CSS variables, class names and DOM selectors. These are not a stable extension API. The implementation includes delayed reapplication and a `MutationObserver` to handle changes within the page, but those mechanisms cannot keep selectors or tokens compatible with a redesigned interface.

Compatibility with the current VK Workspace has not been verified. Treat the code as a historical experiment rather than a supported customisation tool. No fixes or further releases are planned.

## Build and load locally

Use Node.js compatible with the locked Vite dependencies and npm.

```sh
git clone https://github.com/GeorgeBlackbird/vk-workspace-premium.git
cd vk-workspace-premium
npm ci
npm run build
```

To load the built extension in Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this repository's `dist/` directory.
4. Open the extension's popup or options page to inspect the theme controls.

Other Chromium-based browsers have their own extension-management page. The manifest targets the hosted VK domains listed below; self-hosted installations on other domains require manifest changes.

For a watch build:

```sh
npm run dev
```

After rebuilding, reload the extension from the browser's extension-management page and reload the VK Workspace tab.

Icons are included in [`public/icons`](public/icons). The existing `npm run icons` script regenerates them.

## Permissions and target pages

The Manifest V3 configuration requests the `storage` permission for settings and presets, plus access to these host patterns:

```text
https://app.workspace.vk.ru/*
https://*.workspace.vk.ru/*
https://myteam.mail.ru/*
https://*.myteam.mail.ru/*
```

The content script runs at `document_start` in matching frames, including the messenger iframe. See [`manifest.config.ts`](manifest.config.ts) for the actual configuration.

## Source layout

| Path | Purpose |
| --- | --- |
| [`src/content`](src/content) | Content-script startup and settings-change listeners |
| [`src/background`](src/background) | Extension service worker |
| [`src/core`](src/core) | Settings, messaging and feature registration |
| [`src/features/theme`](src/features/theme) | Theme application, tokens, selectors and presets |
| [`src/pages/options`](src/pages/options) | Theme editor and preset import/export |
| [`src/pages/popup`](src/pages/popup) | Preset switching and extension status |

The feature registry separates the shared extension setup from the theme implementation. [`src/features/_template`](src/features/_template) is the original starting point for adding a feature; no new features are planned.

## Checks

```sh
npm run typecheck
npm run build
```

The build also runs the TypeScript check. There is no configured lint command or automated test suite. A successful build does not establish that the theme overrides still work against VK's current interface.
