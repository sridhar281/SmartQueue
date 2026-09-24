import { describe, expect, it } from "vitest";
import { formatMinutes } from "@/lib/utils";

describe("formatMinutes", () => {
  it("shows 'Next up' when there is no wait", () => {
    expect(formatMinutes(0)).toBe("Next up");
  });

  it("shows plain minutes under an hour", () => {
    expect(formatMinutes(38)).toBe("38 min");
  });

  it("splits hours and minutes above an hour", () => {
    expect(formatMinutes(95)).toBe("1 h 35 min");
    expect(formatMinutes(120)).toBe("2 h");
  });
});
