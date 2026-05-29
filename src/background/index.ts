import { MessageType } from "@/core/messaging";
import { getAppSettings } from "@/core/storage";

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.info("[VK Teams Plus] Installed");
    void chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === MessageType.GET_SETTINGS) {
    void getAppSettings().then((settings) => sendResponse({ settings }));
    return true;
  }

  if (message?.type === MessageType.PING) {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return true;
  }

  return false;
});
