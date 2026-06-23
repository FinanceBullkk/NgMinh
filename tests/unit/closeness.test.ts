import { describe, expect, it } from "vitest";
import { clampCloseness, closenessLabel } from "@/lib/utils/closeness";

describe("closeness", () => {
  it.each([
    ["0", 1],
    ["2.6", 3],
    ["9", 5],
    ["invalid", 3],
    [null, 1],
  ])("clamps %j to %i", (raw, expected) => {
    expect(clampCloseness(raw)).toBe(expected);
  });

  it("maps rounded values to manager-facing labels", () => {
    expect(closenessLabel(null)).toBe("—");
    expect(closenessLabel(0)).toBe("—");
    expect(closenessLabel(2.6)).toBe("Moderate");
    expect(closenessLabel(99)).toBe("Very close");
  });
});
