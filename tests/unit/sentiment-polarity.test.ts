import { describe, expect, it } from "vitest";
import { isSelfEvidentLabel, selfEvidentPolarity } from "@/lib/utils/sentiment-polarity";

describe("selfEvidentPolarity", () => {
  it("maps the English default labels to their polarity", () => {
    expect(selfEvidentPolarity("Positive")).toBe(1);
    expect(selfEvidentPolarity("Neutral")).toBe(0);
    expect(selfEvidentPolarity("Negative")).toBe(-1);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(selfEvidentPolarity("  positive ")).toBe(1);
    expect(selfEvidentPolarity("NEGATIVE")).toBe(-1);
  });

  it("recognizes legacy Vietnamese defaults (pre-English-seed accounts)", () => {
    expect(selfEvidentPolarity("Tích cực")).toBe(1);
    expect(selfEvidentPolarity("Trung tính")).toBe(0);
    expect(selfEvidentPolarity("Tiêu cực")).toBe(-1);
  });

  it("returns null for custom labels", () => {
    expect(selfEvidentPolarity("Frustrated")).toBeNull();
    expect(selfEvidentPolarity("On fire")).toBeNull();
  });

  it("isSelfEvidentLabel reflects the same", () => {
    expect(isSelfEvidentLabel("Positive")).toBe(true);
    expect(isSelfEvidentLabel("Frustrated")).toBe(false);
  });
});
