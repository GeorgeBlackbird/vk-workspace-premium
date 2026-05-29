import type { ThemeSettings } from "./types";
import { parseCssColor } from "./color-utils";

export type MessageFill =
  | { kind: "auto" }
  | { kind: "solid"; value: string }
  | { kind: "gradient"; value: string };

export interface MessageBubbleLayers {
  incoming: MessageFill;
  outgoing: MessageFill;
  incomingGradientCss: string | null;
  outgoingGradientCss: string | null;
}

export function isGradientCss(value: string | undefined): boolean {
  const raw = value?.trim() ?? "";
  return /gradient/i.test(raw);
}

export function parseMessageFill(value: string | undefined): MessageFill {
  const raw = value?.trim();
  if (!raw) return { kind: "auto" };
  if (isGradientCss(raw)) return { kind: "gradient", value: raw };
  if (parseCssColor(raw)) return { kind: "solid", value: raw };
  return { kind: "auto" };
}

export function solidColorFromFill(fill: MessageFill): string | undefined {
  if (fill.kind === "solid") return fill.value;
  return undefined;
}

export function getMessageBubbleLayers(settings: ThemeSettings): MessageBubbleLayers {
  const incoming = parseMessageFill(settings.surfaceMessage);
  const outgoing = parseMessageFill(
    settings.surfaceOutgoing ??
      (isGradientCss(settings.messageBackground)
        ? settings.messageBackground
        : undefined),
  );

  return {
    incoming,
    outgoing,
    incomingGradientCss:
      incoming.kind === "gradient" ? incoming.value : null,
    outgoingGradientCss:
      outgoing.kind === "gradient" ? outgoing.value : null,
  };
}
