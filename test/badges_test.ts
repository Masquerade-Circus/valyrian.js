import { describe, expect, test as it } from "bun:test";

import {
  formatBytes,
  parseLcovCoverage,
  pickCoverageColor,
  renderBadgeSvg
} from "../scripts/generate-badges.mjs";

describe("Badge generator helpers", () => {
  it("formats bytes into human-readable units", () => {
    expect(formatBytes(9727)).toBe("9.5 KiB");
    expect(formatBytes(0)).toBe("0 B");
  });

  it("parses lcov content into coverage percentage", () => {
    const lcov = [
      "TN:",
      "SF:lib/example.ts",
      "DA:1,1",
      "DA:2,0",
      "DA:3,3",
      "end_of_record"
    ].join("\n");

    expect(parseLcovCoverage(lcov)).toBe(66.67);
  });

  it("picks the expected color by coverage range", () => {
    expect(pickCoverageColor(92)).toBe("#4c1");
    expect(pickCoverageColor(82)).toBe("#97ca00");
    expect(pickCoverageColor(71)).toBe("#dfb317");
    expect(pickCoverageColor(55)).toBe("#fe7d37");
    expect(pickCoverageColor(30)).toBe("#e05d44");
  });

  it("renders svg badge text payload", () => {
    const svg = renderBadgeSvg({ label: "coverage", value: "88.21%", color: "#97ca00" });

    expect(svg).toContain('aria-label="coverage: 88.21%"');
    expect(svg).toContain(">coverage<");
    expect(svg).toContain(">88.21%<");
    expect(svg).toContain("#97ca00");
  });
});
