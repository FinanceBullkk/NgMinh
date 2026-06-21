import { describe, expect, it } from "vitest";
import { isHexColor, normalizeHex } from "@/lib/utils/hex-color";

describe("hex colors", () => {
  it("accepts and normalizes a six-digit color", () => {
    expect(isHexColor("  #3F8F6B ")).toBe(true);
    expect(normalizeHex("  #3F8F6B ")).toBe("#3f8f6b");
  });

  it.each(["#fff", "3f8f6b", "#zzzzzz", "#1234567", ""])(
    "rejects invalid color %j",
    (color) => expect(isHexColor(color)).toBe(false),
  );
});
