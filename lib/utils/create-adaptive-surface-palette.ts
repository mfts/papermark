type Rgb = { r: number; g: number; b: number };

export type AdaptiveSurfacePalette = {
  backgroundColor?: string;
  rgb: Rgb;
  usesLightText: boolean;
  isDefaultLightSurface: boolean;
  textColor: string;
  mutedTextColor: string;
  subtleTextColor: string;
  inverseTextColor: string;
  panelBgColor: string;
  panelHoverBgColor: string;
  panelActiveBgColor: string;
  panelBorderColor: string;
  panelBorderHoverColor: string;
  controlBgColor: string;
  controlBorderColor: string;
  controlBorderStrongColor: string;
  controlIconColor: string;
  controlPlaceholderColor: string;
  ctaBgColor: string;
  ctaTextColor: string;
};

const LIGHT_TEXT: Rgb = { r: 248, g: 250, b: 252 };
const DARK_TEXT: Rgb = { r: 15, g: 23, b: 42 };
const FALLBACK_BG: Rgb = { r: 3, g: 7, b: 18 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): Rgb | null {
  if (!hex.startsWith("#")) return null;
  const compact = hex.trim();

  if (compact.length === 4) {
    const r = parseInt(compact[1] + compact[1], 16);
    const g = parseInt(compact[2] + compact[2], 16);
    const b = parseInt(compact[3] + compact[3], 16);
    return { r, g, b };
  }

  if (compact.length === 7) {
    const r = parseInt(compact.slice(1, 3), 16);
    const g = parseInt(compact.slice(3, 5), 16);
    const b = parseInt(compact.slice(5, 7), 16);
    return { r, g, b };
  }

  return null;
}

function rgbStringToRgb(input: string): Rgb | null {
  const match = input
    .trim()
    .match(/^rgba?\(\s*([0-9.]+)[,\s]+([0-9.]+)[,\s]+([0-9.]+)/i);
  if (!match) return null;

  return {
    r: clamp(Math.round(Number(match[1])), 0, 255),
    g: clamp(Math.round(Number(match[2])), 0, 255),
    b: clamp(Math.round(Number(match[3])), 0, 255),
  };
}

function parseToRgb(color: string | null | undefined): Rgb {
  if (!color) return FALLBACK_BG;
  return hexToRgb(color) || rgbStringToRgb(color) || FALLBACK_BG;
}

function toCssRgb(rgb: Rgb) {
  return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
}

function mixRgb(background: Rgb, foreground: Rgb, amount: number): Rgb {
  const weight = clamp(amount, 0, 1);
  return {
    r: Math.round(background.r + (foreground.r - background.r) * weight),
    g: Math.round(background.g + (foreground.g - background.g) * weight),
    b: Math.round(background.b + (foreground.b - background.b) * weight),
  };
}

function toLinearChannel(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: Rgb) {
  return (
    0.2126 * toLinearChannel(rgb.r) +
    0.7152 * toLinearChannel(rgb.g) +
    0.0722 * toLinearChannel(rgb.b)
  );
}

function contrastRatio(a: Rgb, b: Rgb) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function saturation(rgb: Rgb) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const lightness = (max + min) / 2;
  const delta = max - min;
  return delta / (1 - Math.abs(2 * lightness - 1));
}

export function createAdaptiveSurfacePalette(
  backgroundColor: string | null | undefined,
): AdaptiveSurfacePalette {
  const rgb = parseToRgb(backgroundColor);
  const bgLuminance = luminance(rgb);
  const lightContrast = contrastRatio(rgb, LIGHT_TEXT);
  const darkContrast = contrastRatio(rgb, DARK_TEXT);
  const usesLightText = lightContrast >= darkContrast;
  const isDefaultLightSurface =
    bgLuminance >= 0.97 &&
    saturation(rgb) <= 0.08 &&
    (!backgroundColor || backgroundColor.toLowerCase() !== "black");

  const textRgb = usesLightText ? LIGHT_TEXT : DARK_TEXT;
  const inverseTextRgb = usesLightText ? DARK_TEXT : LIGHT_TEXT;
  const sat = saturation(rgb);
  const saturationNormalizer = clamp(1 - sat * 0.35, 0.65, 1);

  const mix = (value: number) => clamp(value * saturationNormalizer, 0, 0.95);
  const panelBase = usesLightText ? 0.13 : 0.08;

  return {
    backgroundColor: backgroundColor || undefined,
    rgb,
    usesLightText,
    isDefaultLightSurface,
    textColor: toCssRgb(textRgb),
    mutedTextColor: toCssRgb(mixRgb(rgb, textRgb, usesLightText ? 0.7 : 0.62)),
    subtleTextColor: toCssRgb(mixRgb(rgb, textRgb, usesLightText ? 0.58 : 0.5)),
    inverseTextColor: toCssRgb(inverseTextRgb),
    panelBgColor: isDefaultLightSurface
      ? "transparent"
      : toCssRgb(mixRgb(rgb, textRgb, mix(panelBase))),
    panelHoverBgColor: isDefaultLightSurface
      ? "rgb(248 250 252)"
      : toCssRgb(
          mixRgb(rgb, textRgb, mix(panelBase + (usesLightText ? 0.06 : 0.04))),
        ),
    panelActiveBgColor: isDefaultLightSurface
      ? "rgb(241 245 249)"
      : toCssRgb(
          mixRgb(rgb, textRgb, mix(panelBase + (usesLightText ? 0.1 : 0.07))),
        ),
    panelBorderColor: isDefaultLightSurface
      ? "rgb(226 232 240)"
      : toCssRgb(mixRgb(rgb, textRgb, mix(usesLightText ? 0.25 : 0.17))),
    panelBorderHoverColor: isDefaultLightSurface
      ? "rgb(203 213 225)"
      : toCssRgb(mixRgb(rgb, textRgb, mix(usesLightText ? 0.34 : 0.24))),
    controlBgColor: toCssRgb(
      mixRgb(
        rgb,
        usesLightText ? textRgb : LIGHT_TEXT,
        mix(usesLightText ? 0.1 : 0.16),
      ),
    ),
    controlBorderColor: toCssRgb(
      mixRgb(rgb, textRgb, mix(usesLightText ? 0.24 : 0.15)),
    ),
    controlBorderStrongColor: toCssRgb(
      mixRgb(rgb, textRgb, mix(usesLightText ? 0.34 : 0.23)),
    ),
    controlIconColor: toCssRgb(
      mixRgb(rgb, textRgb, usesLightText ? 0.64 : 0.58),
    ),
    controlPlaceholderColor: toCssRgb(
      mixRgb(rgb, textRgb, usesLightText ? 0.56 : 0.68),
    ),
    ctaBgColor: toCssRgb(textRgb),
    ctaTextColor: toCssRgb(rgb),
  };
}
