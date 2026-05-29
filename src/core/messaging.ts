/** Сообщения между content script, popup и service worker */
export const MessageType = {
  GET_SETTINGS: "GET_SETTINGS",
  SETTINGS_CHANGED: "SETTINGS_CHANGED",
  PING: "PING",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload?: T;
}

export function sendToBackground<TPayload, TResponse = unknown>(
  message: ExtensionMessage<TPayload>,
): Promise<TResponse> {
  return chrome.runtime.sendMessage(message);
}
