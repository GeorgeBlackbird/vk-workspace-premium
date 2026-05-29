export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const DEFAULT_RGB: Rgb = { r: 35, g: 35, b: 36 };

/** Парсит #rgb / #rrggbb. Для gradient и прочего — fallback. */
export function parseCssColor(input: string): Rgb | null {
  const value = input.trim();
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let raw = hex[1]!;
    if (raw.length === 3) {
      raw = raw
        .split("")
        .map((c) => c + c)
        .join("");
    }
    return {
      r: Number.parseInt(raw.slice(0, 2), 16),
      g: Number.parseInt(raw.slice(2, 4), 16),
      b: Number.parseInt(raw.slice(4, 6), 16),
    };
  }

  const rgb = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i,
  );
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
    };
  }

  return null;
}

export function parseBackgroundColor(background: string): Rgb {
  const solid = background.match(/#[0-9a-f]{3,8}/i)?.[0] ?? background;
  return parseCssColor(solid) ?? DEFAULT_RGB;
}

export function rgbToTriplet({ r, g, b }: Rgb): string {
  return `${clamp(r)}, ${clamp(g)}, ${clamp(b)}`;
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function mixRgb(a: Rgb, b: Rgb, amount: number): Rgb {
  const t = Math.min(1, Math.max(0, amount));
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isLightBackground(background: string): boolean {
  return relativeLuminance(parseBackgroundColor(background)) > 0.45;
}

export const BLACK: Rgb = { r: 0, g: 0, b: 0 };
export const WHITE: Rgb = { r: 255, g: 255, b: 255 };

function clamp(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function toHex(n: number): string {
  return clamp(n).toString(16).padStart(2, "0");
}
