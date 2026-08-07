import nativeGenerated from "./generated/native.generated";

const toPixels = (value: string) => {
  if (value.endsWith("rem")) return Number.parseFloat(value) * 16;
  if (value.endsWith("px")) return Number.parseFloat(value);
  throw new Error(`Unsupported dimension: ${value}`);
};

const unwrap = (v: { value: number; unit?: string } | number) =>
  typeof v === "number" ? v : v.value;

type DimensionValue = number | { value: number; unit?: string };

const makeFlat = (raw: Record<string, unknown>) => ({
  fontFamily: raw.fontFamily as string | undefined,
  fontSize: unwrap(raw.fontSize as DimensionValue),
  fontWeight: raw.fontWeight as number,
  lineHeight: unwrap(raw.lineHeight as DimensionValue),
  letterSpacing: unwrap(raw.letterSpacing as DimensionValue),
  ...(raw.textTransform ? { textTransform: raw.textTransform as "uppercase" | "lowercase" | "capitalize" | "none" } : {}),
});

const generated = nativeGenerated as unknown as {
  text: Record<string, Record<string, unknown>>;
  space: Record<string, string>;
  "screen-margin": string;
  "component-size": Record<string, string>;
  "border-radius": Record<string, string>;
  "stream-item": Record<string, string>;
  "font-family": { primary: string; mono: string };
};

const primaryFont = generated["font-family"].primary;

const typographyEntries = Object.entries(generated.text).map(([key, raw]) => {
  const flat = makeFlat(raw);
  if (!flat.fontFamily) flat.fontFamily = primaryFont;
  return [key, flat] as const;
});

export const typography = Object.fromEntries(typographyEntries) as Record<
  string,
  {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
  }
>;

export type TypographyVariant = keyof typeof typography;

export const spacing = Object.fromEntries(
  Object.entries(generated.space).map(([key, value]) => [key, toPixels(value)]),
) as Record<keyof typeof generated.space, number>;

export type SpacingToken = keyof typeof spacing;

export const screenMargin = toPixels(generated["screen-margin"]);

export const componentSize = Object.fromEntries(
  Object.entries(generated["component-size"]).map(([key, value]) => [key, toPixels(value)]),
) as Record<keyof typeof generated["component-size"], number>;

export type ComponentSizeToken = keyof typeof componentSize;

export const borderRadius = Object.fromEntries(
  Object.entries(generated["border-radius"]).map(([key, value]) => [key, toPixels(value)]),
) as Record<keyof typeof generated["border-radius"], number>;

export type BorderRadiusToken = keyof typeof borderRadius;

const rawStreamItem = generated["stream-item"];
export const streamItem = {
  borderRadius: toPixels(rawStreamItem["border-radius"]),
  borderWidth: toPixels(rawStreamItem["border-width"]),
  gap: toPixels(rawStreamItem.gap),
  iconSize: toPixels(rawStreamItem["icon-size"]),
  minHeight: toPixels(rawStreamItem["min-height"]),
  paddingHorizontal: toPixels(rawStreamItem["padding-horizontal"]),
  paddingVertical: toPixels(rawStreamItem["padding-vertical"]),
};

export const fontFamily = generated["font-family"];
