import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { pathToFileURL } from "node:url";

const DIST_FILE = path.join("dist", "index.min.js");
const BADGE_DIR = path.join("assets", "badges");

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new Error(`Invalid byte value: ${bytes}`);
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KiB", "MiB", "GiB"];
  let value = bytes;
  let unit = units[0];

  for (let i = 0; i < units.length; i += 1) {
    value = bytes / Math.pow(1024, i + 1);
    unit = units[i];
    if (value < 1024 || i === units.length - 1) {
      break;
    }
  }

  return `${value.toFixed(1)} ${unit}`;
}

export function parseLcovCoverage(lcovContent) {
  const lines = String(lcovContent).split(/\r?\n/);
  let total = 0;
  let covered = 0;

  for (const line of lines) {
    if (!line.startsWith("DA:")) {
      continue;
    }

    const [, payload] = line.split(":");
    if (!payload) {
      continue;
    }

    const [, hitsRaw] = payload.split(",");
    const hits = Number(hitsRaw);

    if (!Number.isFinite(hits)) {
      continue;
    }

    total += 1;
    if (hits > 0) {
      covered += 1;
    }
  }

  if (total === 0) {
    return null;
  }

  return Number(((covered / total) * 100).toFixed(2));
}

export function pickCoverageColor(coverage) {
  if (coverage >= 90) {
    return "#4c1";
  }

  if (coverage >= 80) {
    return "#97ca00";
  }

  if (coverage >= 70) {
    return "#dfb317";
  }

  if (coverage >= 50) {
    return "#fe7d37";
  }

  return "#e05d44";
}

function textWidth(text) {
  return Math.max(30, Math.round(text.length * 6.8 + 20));
}

export function renderBadgeSvg({ label, value, color, labelColor = "#555" }) {
  const safeLabel = escapeXml(label);
  const safeValue = escapeXml(value);
  const leftWidth = textWidth(label);
  const rightWidth = textWidth(value);
  const fullWidth = leftWidth + rightWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${fullWidth}" height="20" role="img" aria-label="${safeLabel}: ${safeValue}"><title>${safeLabel}: ${safeValue}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${fullWidth}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${leftWidth}" height="20" fill="${labelColor}"/><rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${color}"/><rect width="${fullWidth}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110"><text x="${Math.round((leftWidth / 2) * 10)}" y="140" transform="scale(.1)">${safeLabel}</text><text x="${Math.round((leftWidth + rightWidth / 2) * 10)}" y="140" transform="scale(.1)">${safeValue}</text></g></svg>`;
}

function findCoveragePath(rootDir) {
  const candidates = [
    path.join(rootDir, "coverage", "lcov.info"),
    path.join(rootDir, "lcov.info")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function writeBadgeFile(rootDir, fileName, badge) {
  const badgePath = path.join(rootDir, BADGE_DIR, fileName);
  fs.writeFileSync(
    badgePath,
    renderBadgeSvg({ label: badge.label, value: badge.value, color: badge.color }),
    "utf8"
  );
  return badgePath;
}

export function generateBadges({ rootDir = process.cwd(), requireCoverage = false } = {}) {
  const distPath = path.join(rootDir, DIST_FILE);
  if (!fs.existsSync(distPath)) {
    throw new Error(`Missing build artifact: ${DIST_FILE}. Run \`bun run build:source\` first.`);
  }

  fs.mkdirSync(path.join(rootDir, BADGE_DIR), { recursive: true });

  const minifiedCode = fs.readFileSync(distPath);
  const gzip = zlib.gzipSync(minifiedCode);
  const brotli = zlib.brotliCompressSync(minifiedCode);

  const coveragePath = findCoveragePath(rootDir);
  if (requireCoverage && !coveragePath) {
    throw new Error("Coverage file not found. Run `bun test` first to generate lcov.info.");
  }

  let coverageValue = "pending";
  let coverageColor = "#9f9f9f";
  if (coveragePath) {
    const coverage = parseLcovCoverage(fs.readFileSync(coveragePath, "utf8"));
    if (coverage === null) {
      if (requireCoverage) {
        throw new Error(`No line coverage entries found in ${path.relative(rootDir, coveragePath)}.`);
      }
      coverageValue = "unavailable";
    } else {
      coverageValue = `${coverage.toFixed(2)}%`;
      coverageColor = pickCoverageColor(coverage);
    }
  }

  const badges = [
    {
      file: "size-min.svg",
      label: "minified",
      value: formatBytes(minifiedCode.length),
      color: "#007ec6"
    },
    {
      file: "size-gzip.svg",
      label: "gzip",
      value: formatBytes(gzip.length),
      color: "#007ec6"
    },
    {
      file: "size-brotli.svg",
      label: "brotli",
      value: formatBytes(brotli.length),
      color: "#007ec6"
    },
    {
      file: "coverage.svg",
      label: "coverage",
      value: coverageValue,
      color: coverageColor
    }
  ];

  const writtenFiles = badges.map((badge) => writeBadgeFile(rootDir, badge.file, badge));

  return {
    sizes: {
      minified: minifiedCode.length,
      gzip: gzip.length,
      brotli: brotli.length
    },
    coverage: {
      value: coverageValue,
      source: coveragePath ? path.relative(rootDir, coveragePath) : null
    },
    files: writtenFiles.map((filePath) => path.relative(rootDir, filePath))
  };
}

function parseOptions(args) {
  return {
    requireCoverage: args.includes("--require-coverage")
  };
}

function runCli() {
  const options = parseOptions(process.argv.slice(2));
  const result = generateBadges(options);

  console.log("Generated badges:");
  for (const filePath of result.files) {
    console.log(`- ${filePath}`);
  }
  console.log(
    `Sizes: minified=${formatBytes(result.sizes.minified)}, gzip=${formatBytes(result.sizes.gzip)}, brotli=${formatBytes(result.sizes.brotli)}`
  );
  console.log(`Coverage: ${result.coverage.value}${result.coverage.source ? ` (${result.coverage.source})` : ""}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  runCli();
}
