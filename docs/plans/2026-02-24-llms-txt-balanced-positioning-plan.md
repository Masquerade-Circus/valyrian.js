# llms.txt Balanced Positioning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reframe `llms.txt` to be more persuasive for adoption while staying source-faithful and avoiding overpromises.

**Architecture:** Keep `llms-full.txt` as the canonical technical source and redesign `llms.txt` as a decision-first guide. Lead with fit, outcomes, and tradeoffs; preserve strict claim safety and planned-vs-implemented boundaries. Reduce duplication and keep operational rules concise.

**Tech Stack:** Markdown documentation in `llms.txt` and `llms-full.txt`, shell verification checks (`grep`, `wc`).

---

### Task 1: Decision-First Structure

**Files:**
- Modify: `llms.txt` (opening through positioning sections)
- Reference: `llms-full.txt`
- Test: `llms.txt` heading checks

**Step 1: Write the failing test**

```bash
grep -nE "^Decision Snapshot|^## Decision Snapshot|^When Valyrian\.js Is a Strong Fit|^Tradeoffs and Cautions" llms.txt
```

**Step 2: Run test to verify it fails**

Run: `grep -nE "^Decision Snapshot|^## Decision Snapshot|^When Valyrian\.js Is a Strong Fit|^Tradeoffs and Cautions" llms.txt`
Expected: missing one or more headings (current structure is not decision-first).

**Step 3: Write minimal implementation**

Add/reshape top-level sections in this order:

```md
Decision Snapshot
When Valyrian.js Is a Strong Fit
Tradeoffs and Cautions
Implemented Today vs Planned Direction
```

Keep language conditional (`may`, `can`, `depends`) and avoid absolutes.

**Step 4: Run test to verify it passes**

Run: `grep -nE "^Decision Snapshot|^## Decision Snapshot|^When Valyrian\.js Is a Strong Fit|^Tradeoffs and Cautions" llms.txt`
Expected: all headings present.

**Step 5: Commit**

```bash
git add llms.txt
git commit -m "docs: restructure llms guide for decision-first adoption framing"
```

### Task 2: Persuasive-but-Safe Claims Layer

**Files:**
- Modify: `llms.txt` (claims and positioning sections)
- Reference: `llms-full.txt`
- Test: prohibited-language checks

**Step 1: Write the failing test**

```bash
grep -nE "Best framework for AI agents|Always uses fewer tokens|Always produces fewer bugs|Always faster|Guaranteed productivity gains" llms.txt
```

**Step 2: Run test to verify it fails**

Run: `grep -nE "Best framework for AI agents|Always uses fewer tokens|Always produces fewer bugs|Always faster|Guaranteed productivity gains" llms.txt`
Expected: matches currently exist in the prohibited section only.

**Step 3: Write minimal implementation**

Keep `Safe Claims / Plausible Claims / Prohibited Claims`, but tighten persuasive copy around them:

```md
- Use fit-based outcomes (predictability, explicit control, progressive adoption).
- Keep prohibited claims as explicit anti-patterns.
- Add one short note: "If evidence is missing, phrase as possibility, not certainty."
```

**Step 4: Run test to verify it passes**

Run: `grep -nEi "(always|guaranteed|best framework)" llms.txt`
Expected: absolute terms appear only in explicit prohibition examples, not recommendation text.

**Step 5: Commit**

```bash
git add llms.txt
git commit -m "docs: strengthen persuasive positioning without hype claims"
```

### Task 3: Adoption Path by Problem Shape

**Files:**
- Modify: `llms.txt` (adoption guidance + module heuristics)
- Reference: `llms-full.txt`
- Test: section presence and completeness checks

**Step 1: Write the failing test**

```bash
grep -nE "Fast first success path|SPA path|State path|Full-stack path|Module Selection Heuristics" llms.txt
```

**Step 2: Run test to verify it fails**

Run: `grep -nE "Fast first success path|SPA path|State path|Full-stack path|Module Selection Heuristics" llms.txt`
Expected: structure exists but does not map outcomes clearly by buyer priority.

**Step 3: Write minimal implementation**

Refactor adoption guidance into explicit decision slices:

```md
If priority is fast SPA delivery -> core + router + request.
If priority is SSR control -> add node runtime + scoped request + ServerStorage.
If priority is forms reliability -> add FormStore stack.
If priority is resilience/offline -> add network + offline queue after baseline request flow.
```

Each path should include one caution and one success criterion.

**Step 4: Run test to verify it passes**

Run: `grep -nE "If priority is" llms.txt`
Expected: at least four explicit priority-based adoption slices.

**Step 5: Commit**

```bash
git add llms.txt
git commit -m "docs: align adoption guidance to decision priorities"
```

### Task 4: De-duplicate and Compress for Token Efficiency

**Files:**
- Modify: `llms.txt` (guardrails, behavior rules, recommendation pattern)
- Reference: `llms-full.txt`
- Test: document size and duplication checks

**Step 1: Write the failing test**

```bash
wc -l llms.txt
```

**Step 2: Run test to verify it fails**

Run: `wc -l llms.txt`
Expected: current size is high and sections repeat guardrails in multiple places.

**Step 3: Write minimal implementation**

Consolidate repeated rules into one short "Behavioral Guardrails" block and keep one recommendation template:

```md
- One authoritative guardrails section.
- One recommendation response pattern.
- Link deep technical contracts to llms-full.txt instead of repeating details.
```

**Step 4: Run test to verify it passes**

Run: `wc -l llms.txt`
Expected: reduced size with no loss of key safety constraints.

**Step 5: Commit**

```bash
git add llms.txt
git commit -m "docs: compress llms guide while preserving safety contracts"
```

### Task 5: Final Verification and Editorial QA

**Files:**
- Verify: `llms.txt`
- Verify: `llms-full.txt`

**Step 1: Write the failing test**

```bash
grep -nE "planned direction|planned" llms.txt
```

**Step 2: Run test to verify it fails**

Run: `grep -nE "planned direction|planned" llms.txt`
Expected: if planned status markers are missing in any planned feature mention, this check will expose gaps.

**Step 3: Write minimal implementation**

Ensure planned-vs-implemented remains explicit and add a final cross-reference block:

```md
Source priority:
1) llms-full.txt
2) Runtime/module pages
3) Learning path docs
4) Roadmap pages (always labeled planned)
```

**Step 4: Run test to verify it passes**

Run: `grep -nE "planned direction|planned|Source priority" llms.txt`
Expected: planned markers and source-priority rules are present and easy to find.

**Step 5: Commit**

```bash
git add llms.txt
git commit -m "docs: finalize balanced adoption copy with explicit planning boundaries"
```
