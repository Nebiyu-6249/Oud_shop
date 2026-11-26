import { describe, expect, it } from "vitest";
import { joinList } from "./text";

describe("joinList", () => {
  it("uses the Arabic comma in Arabic", () => {
    expect(joinList(["أ", "ب"], "ar")).toBe("أ، ب");
    expect(joinList(["a", false, "b"], "en")).toBe("a, b");
  });
});
