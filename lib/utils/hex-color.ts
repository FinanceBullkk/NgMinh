// 6-digit hex color validation/normalization (matches the DB CHECK on sentiment color).
const HEX = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim());
}

export function normalizeHex(value: string): string {
  return value.trim().toLowerCase();
}
