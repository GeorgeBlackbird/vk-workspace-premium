export const THEME_ROOT_ATTR = "data-vkt-plus-theme";

/** Контейнер ленты чата (messenger iframe) */
export const TEAMS_SELECTORS = {
  chatContent: ".imChatContent.app-content",
  appRoot: "#__WS_SA_ROOT__, #root",
  messengerFrame: "iframe#messenger[data-type='messenger']",
} as const;
