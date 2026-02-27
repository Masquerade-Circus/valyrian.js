#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";

function getOrderKey(fileName: string): number[] {
  const match = fileName.match(/^(\d+(?:\.\d+)*)-/);
  if (!match) {
    return [Number.POSITIVE_INFINITY];
  }

  return match[1].split(".").map((segment) => Number(segment));
}

function compareOrderKeys(a: number[], b: number[]): number {
  const maxLen = Math.max(a.length, b.length);

  for (let index = 0; index < maxLen; index += 1) {
    const left = a[index] ?? -1;
    const right = b[index] ?? -1;

    if (left !== right) {
      return left - right;
    }
  }

  return 0;
}

function sortDocs(a: string, b: string): number {
  if (a === "toc.md") {
    return -1;
  }

  if (b === "toc.md") {
    return 1;
  }

  const aKey = getOrderKey(a);
  const bKey = getOrderKey(b);
  const orderDiff = compareOrderKeys(aKey, bKey);

  if (orderDiff !== 0) {
    return orderDiff;
  }

  return a.localeCompare(b);
}

function generateLlmsFull(rootDir = process.cwd()): string {
  const docsDir = path.join(rootDir, "docs");
  const outputPath = path.join(rootDir, "llms-full.txt");

  if (!fs.existsSync(docsDir)) {
    throw new Error(`Missing docs directory at ${docsDir}`);
  }

  const files = fs.readdirSync(docsDir).filter((name) => name.endsWith(".md")).sort(sortDocs);
  const date = new Date().toISOString().slice(0, 10);

  const lines: string[] = [];
  lines.push("# Valyrian.js - llms-full.txt (Official Documentation)");
  lines.push("");
  lines.push("Purpose");
  lines.push("This file aggregates the official documentation sources from the `docs/` directory as a single reference for AI agents and tooling.");
  lines.push("");
  lines.push("Generated");
  lines.push(`- Date (UTC): ${date}`);
  lines.push("- Source root: `docs/`");
  lines.push(`- File count: ${files.length}`);
  lines.push("");
  lines.push("Source Files (in order)");

  files.forEach((name, index) => {
    lines.push(`${index + 1}. \`docs/${name}\``);
  });

  files.forEach((name) => {
    const relative = `docs/${name}`;
    const content = fs.readFileSync(path.join(docsDir, name), "utf8").replace(/\s+$/g, "");
    lines.push("");
    lines.push("");
    lines.push("____________________________________________");
    lines.push(`# Source: ${relative}`);
    lines.push("");
    lines.push(content);
  });

  lines.push("");

  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
  return outputPath;
}

const outputPath = generateLlmsFull();
const relativePath = path.relative(process.cwd(), outputPath) || "llms-full.txt";
console.log(`Generated ${relativePath} from docs.`);
