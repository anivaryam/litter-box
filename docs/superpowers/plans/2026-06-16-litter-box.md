# litter box Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an embeddable, framework-agnostic component that renders dropped HTML in a sealed sandbox — poop HTML in, scoop it out, up to 4 at once.

**Architecture:** One TypeScript core class (`LitterBox`) owns all logic: it attaches a shadow root to a host element for its own chrome, and renders each "shit" into a sandboxed `iframe srcdoc`. Two thin skins wrap the core — a `<litter-box>` custom element and a React `<LitterBox>` component. tsup builds ESM/CJS/IIFE; vitest covers engine logic, Playwright proves real-browser isolation.

**Tech Stack:** TypeScript, tsup, vitest + happy-dom, @playwright/test, React (peer dep).

**Spec:** `docs/superpowers/specs/2026-06-16-litter-box-design.md`

**Working directory for all paths below:** the `litter-box/` project root (already a git repo with the spec committed).

---

## File Structure

```
src/
  styles.ts     # CHROME_CSS string injected into the shadow root
  core.ts       # LitterBox engine — poop/scoop/scoopAll/list, render, dropzone
  element.ts    # <litter-box> custom element, self-registers
  react.tsx     # <LitterBox> React wrapper (forwardRef + imperative handle)
  index.ts      # barrel: re-exports core + element, triggers registration
demo/
  index.html    # plain-HTML script-tag playground (also drives Playwright)
tests/
  core.test.ts      # vitest: engine logic
  dropzone.test.ts  # vitest: drag/paste handlers
  element.test.ts   # vitest: custom element
  react.test.tsx    # vitest: React wrapper
  isolation.spec.ts # playwright: real-browser isolation
package.json · tsconfig.json · tsup.config.ts · vitest.config.ts · playwright.config.ts · README.md
```

---

## Task 0: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `tsup.config.ts`, `.gitignore`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "litter-box",
  "version": "0.1.0",
  "description": "Isolated HTML sandbox component. Poop HTML in, scoop it out.",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./react": {
      "types": "./dist/react.d.ts",
      "import": "./dist/react.js",
      "require": "./dist/react.cjs"
    },
    "./global": "./dist/litter-box.global.js"
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": { "react": ">=18" },
  "peerDependenciesMeta": { "react": { "optional": true } },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "happy-dom": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tsup": "^8.3.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "noEmit": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
```

- [ ] **Step 4: Write `tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts", react: "src/react.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    external: ["react", "react-dom"],
  },
  {
    entry: { "litter-box.global": "src/index.ts" },
    format: ["iife"],
    globalName: "LitterBoxLib",
    minify: true,
  },
]);
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules/
dist/
test-results/
playwright-report/
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: completes, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts tsup.config.ts .gitignore package-lock.json
git commit -m "chore: scaffold litter-box project"
```

---

## Task 1: Core skeleton — shadow root, grid, dropzone tile

**Files:**
- Create: `src/styles.ts`, `src/core.ts`, `tests/core.test.ts`

- [ ] **Step 1: Write the failing test** — `tests/core.test.ts`

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { LitterBox } from "../src/core";

beforeEach(() => { document.body.innerHTML = ""; });

function mount(max = 4) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return new LitterBox(host, { max });
}

describe("LitterBox skeleton", () => {
  it("attaches an open shadow root containing a grid and a dropzone", () => {
    const box = mount();
    const root = box.host.shadowRoot!;
    expect(root).not.toBeNull();
    expect(root.querySelector(".grid")).not.toBeNull();
    expect(root.querySelector(".dropzone")).not.toBeNull();
  });

  it("starts with an empty list and grid data-count of 1 (dropzone tile)", () => {
    const box = mount();
    const grid = box.host.shadowRoot!.querySelector(".grid") as HTMLElement;
    expect(box.list()).toEqual([]);
    expect(grid.dataset.count).toBe("1");
  });

  it("caps max at 4 even if a larger max is requested", () => {
    const box = mount(99);
    expect(box.max).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/core.test.ts`
Expected: FAIL — cannot resolve `../src/core`.

- [ ] **Step 3: Write `src/styles.ts`**

```ts
export const CHROME_CSS = `
:host { display: block; box-sizing: border-box; width: 100%; height: 100%; }
*, *::before, *::after { box-sizing: border-box; }
.box {
  width: 100%; height: 100%;
  min-height: var(--litter-min-height, 240px);
  padding: var(--litter-gap, 8px);
  background: var(--litter-bg, #f4f4f5);
  border-radius: var(--litter-radius, 12px);
}
.grid { display: grid; gap: var(--litter-gap, 8px); width: 100%; height: 100%; }
.grid[data-count="1"] { grid-template-columns: 1fr; grid-template-rows: 1fr; }
.grid[data-count="2"] { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; }
.grid[data-count="3"], .grid[data-count="4"] { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.cell { position: relative; background: #fff; border-radius: var(--litter-radius, 12px); overflow: hidden; border: 1px solid rgba(0,0,0,.08); }
.cell iframe { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
.scoop {
  position: absolute; top: 6px; right: 6px; z-index: 2;
  width: 24px; height: 24px; border: 0; border-radius: 50%;
  background: rgba(0,0,0,.55); color: #fff; cursor: pointer;
  font: 14px/1 system-ui, sans-serif;
}
.scoop:hover { background: rgba(0,0,0,.8); }
.dropzone {
  display: grid; place-items: center; text-align: center;
  border: 2px dashed rgba(0,0,0,.25); border-radius: var(--litter-radius, 12px);
  color: rgba(0,0,0,.55); font: 14px system-ui, sans-serif; cursor: copy;
  padding: 16px; min-height: 80px;
}
.dropzone.dragover { border-color: #6366f1; background: rgba(99,102,241,.06); color: #4f46e5; }
`;
```

- [ ] **Step 4: Write `src/core.ts`** (skeleton only — poop/scoop come in later tasks)

```ts
import { CHROME_CSS } from "./styles";

export interface LitterBoxOptions {
  max?: number;
}

export interface PoopOptions {
  title?: string;
}

interface Slot {
  id: string;
  iframe: HTMLIFrameElement;
  cell: HTMLDivElement;
}

const MAX_CAP = 4;

export class LitterBox {
  readonly host: HTMLElement;
  readonly max: number;
  private root: ShadowRoot;
  private grid: HTMLDivElement;
  private dropzone: HTMLDivElement;
  private slots: Slot[] = [];
  private seq = 0;

  constructor(host: HTMLElement, options: LitterBoxOptions = {}) {
    this.host = host;
    this.max = Math.min(options.max ?? MAX_CAP, MAX_CAP);
    this.root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    this.root.innerHTML =
      `<style>${CHROME_CSS}</style><div class="box"><div class="grid" part="grid"></div></div>`;
    this.grid = this.root.querySelector(".grid")!;
    this.dropzone = this.buildDropzone();
    this.render();
  }

  list(): string[] {
    return this.slots.map((s) => s.id);
  }

  destroy(): void {
    this.root.innerHTML = "";
    this.slots = [];
  }

  private render(): void {
    const full = this.slots.length >= this.max;
    const tiles = full ? this.slots.length : this.slots.length + 1;
    this.grid.dataset.count = String(Math.max(tiles, 1));
    this.slots.forEach((s) => this.grid.appendChild(s.cell));
    if (full) {
      this.dropzone.remove();
    } else {
      this.grid.appendChild(this.dropzone);
    }
  }

  private buildDropzone(): HTMLDivElement {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.textContent = "Drop .html here or paste HTML";
    dz.tabIndex = 0;
    return dz;
  }

  private emit(type: string, detail: Record<string, unknown>): void {
    this.host.dispatchEvent(
      new CustomEvent(type, { detail, bubbles: true, composed: true }),
    );
  }
}
```

> Note: `emit` is unused in this task — later tasks call it. TypeScript with `strict` does not error on unused private methods, so this compiles.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/core.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/styles.ts src/core.ts tests/core.test.ts
git commit -m "feat: core LitterBox skeleton with shadow root and grid"
```

---

## Task 2: poop() — add + render a sandboxed shit

**Files:**
- Modify: `src/core.ts`
- Modify: `tests/core.test.ts`

- [ ] **Step 1: Add the failing tests** — append to `tests/core.test.ts`

```ts
describe("poop", () => {
  it("adds an iframe, returns an id, and updates the list", () => {
    const box = mount();
    const id = box.poop("<p>x</p>");
    expect(id).toMatch(/^shit-/);
    expect(box.list()).toEqual([id]);
    expect(box.host.shadowRoot!.querySelectorAll("iframe").length).toBe(1);
  });

  it("sandboxes the iframe with allow-scripts and sets srcdoc", () => {
    const box = mount();
    box.poop("<p>hello</p>");
    const f = box.host.shadowRoot!.querySelector("iframe")!;
    expect(f.getAttribute("sandbox")).toBe("allow-scripts");
    expect(f.getAttribute("srcdoc")).toContain("<p>hello</p>");
  });

  it("renders a scoop button per cell", () => {
    const box = mount();
    box.poop("<p>x</p>");
    expect(box.host.shadowRoot!.querySelectorAll(".cell .scoop").length).toBe(1);
  });

  it("grows grid data-count as shits are added", () => {
    const box = mount();
    const grid = box.host.shadowRoot!.querySelector(".grid") as HTMLElement;
    box.poop("a");
    expect(grid.dataset.count).toBe("2"); // 1 shit + dropzone tile
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/core.test.ts`
Expected: FAIL — `box.poop is not a function`.

- [ ] **Step 3: Add `poop` to `src/core.ts`** (insert as a public method after `list()`)

```ts
  poop(html: string, opts: PoopOptions = {}): string | null {
    if (this.slots.length >= this.max) {
      this.emit("litter:full", {});
      return null;
    }
    const id = `shit-${++this.seq}`;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("title", opts.title ?? id);
    iframe.srcdoc = html;

    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.id = id;

    const scoop = document.createElement("button");
    scoop.className = "scoop";
    scoop.type = "button";
    scoop.setAttribute("aria-label", `Scoop ${opts.title ?? id}`);
    scoop.textContent = "×";
    scoop.addEventListener("click", () => this.scoop(id));

    cell.append(scoop, iframe);
    this.slots.push({ id, iframe, cell });
    this.render();
    this.emit("litter:poop", { id });
    return id;
  }
```

> The `scoop` click handler references `this.scoop`, added in Task 3. It compiles now (method resolved at call time); the button does nothing until Task 3 lands, which is fine — tests in this task do not click it.

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- tests/core.test.ts`
Expected: PASS (all core tests).

- [ ] **Step 5: Commit**

```bash
git add src/core.ts tests/core.test.ts
git commit -m "feat: poop() renders sandboxed iframe shits"
```

---

## Task 3: scoop() and scoopAll()

**Files:**
- Modify: `src/core.ts`
- Modify: `tests/core.test.ts`

- [ ] **Step 1: Add failing tests** — append to `tests/core.test.ts`

```ts
describe("scoop", () => {
  it("removes the matching shit and its iframe", () => {
    const box = mount();
    const id = box.poop("<p>x</p>")!;
    expect(box.scoop(id)).toBe(true);
    expect(box.list()).toEqual([]);
    expect(box.host.shadowRoot!.querySelectorAll("iframe").length).toBe(0);
  });

  it("returns false for an unknown id", () => {
    const box = mount();
    expect(box.scoop("nope")).toBe(false);
  });

  it("scoopAll clears every shit", () => {
    const box = mount();
    box.poop("a");
    box.poop("b");
    box.scoopAll();
    expect(box.list()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/core.test.ts`
Expected: FAIL — `box.scoop is not a function`.

- [ ] **Step 3: Add `scoop` and `scoopAll` to `src/core.ts`** (after `poop`)

```ts
  scoop(id: string): boolean {
    const i = this.slots.findIndex((s) => s.id === id);
    if (i === -1) return false;
    this.slots[i].cell.remove();
    this.slots.splice(i, 1);
    this.render();
    this.emit("litter:scoop", { id });
    return true;
  }

  scoopAll(): void {
    [...this.slots].forEach((s) => this.scoop(s.id));
  }
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- tests/core.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core.ts tests/core.test.ts
git commit -m "feat: scoop() and scoopAll() remove shits"
```

---

## Task 4: 4-shit cap, litter:full, dropzone hidden when full

**Files:**
- Modify: `tests/core.test.ts`

(The cap and `litter:full` logic already live in `poop`/`render` from Tasks 1–2; this task locks the behavior with tests.)

- [ ] **Step 1: Add failing/locking tests** — append to `tests/core.test.ts`

```ts
describe("capacity", () => {
  it("rejects the 5th poop and emits litter:full", () => {
    const box = mount();
    const full = vi.fn();
    box.host.addEventListener("litter:full", full);
    for (let i = 0; i < 4; i++) expect(box.poop("<p>x</p>")).not.toBeNull();
    expect(box.poop("<p>x</p>")).toBeNull();
    expect(full).toHaveBeenCalledTimes(1);
    expect(box.list().length).toBe(4);
  });

  it("hides the dropzone when full and shows it again after a scoop", () => {
    const box = mount();
    let id = "";
    for (let i = 0; i < 4; i++) id = box.poop("x")!;
    expect(box.host.shadowRoot!.querySelector(".dropzone")).toBeNull();
    box.scoop(id);
    expect(box.host.shadowRoot!.querySelector(".dropzone")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Add the `vi` import** — update the first import line of `tests/core.test.ts`

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
```

- [ ] **Step 3: Run tests**

Run: `npm test -- tests/core.test.ts`
Expected: PASS (no code change needed — behavior already implemented).

- [ ] **Step 4: Commit**

```bash
git add tests/core.test.ts
git commit -m "test: lock 4-shit cap and full-event behavior"
```

---

## Task 5: Event payloads

**Files:**
- Modify: `tests/core.test.ts`

- [ ] **Step 1: Add failing/locking tests** — append to `tests/core.test.ts`

```ts
describe("events", () => {
  it("emits litter:poop and litter:scoop with the id in detail", () => {
    const box = mount();
    const onP = vi.fn();
    const onS = vi.fn();
    box.host.addEventListener("litter:poop", onP);
    box.host.addEventListener("litter:scoop", onS);
    const id = box.poop("x")!;
    box.scoop(id);
    expect((onP.mock.calls[0][0] as CustomEvent).detail.id).toBe(id);
    expect((onS.mock.calls[0][0] as CustomEvent).detail.id).toBe(id);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test -- tests/core.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/core.test.ts
git commit -m "test: lock event payloads"
```

---

## Task 6: Drag / paste handlers on the dropzone

**Files:**
- Modify: `src/core.ts`
- Create: `tests/dropzone.test.ts`

- [ ] **Step 1: Write the failing test** — `tests/dropzone.test.ts`

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { LitterBox } from "../src/core";

beforeEach(() => { document.body.innerHTML = ""; });

function mount() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return new LitterBox(host);
}

describe("dropzone", () => {
  it("poops the contents of a dropped .html file", async () => {
    const box = mount();
    const dz = box.host.shadowRoot!.querySelector(".dropzone") as HTMLElement;
    const file = new File(["<h1>dropped</h1>"], "x.html", { type: "text/html" });
    const ev = new Event("drop", { bubbles: true }) as any;
    ev.dataTransfer = { files: [file], getData: () => "" };
    ev.preventDefault = () => {};
    dz.dispatchEvent(ev);
    await new Promise((r) => setTimeout(r, 0)); // file.text() is async
    expect(box.list().length).toBe(1);
    expect(box.host.shadowRoot!.querySelector("iframe")!.getAttribute("srcdoc"))
      .toContain("dropped");
  });

  it("poops pasted HTML", () => {
    const box = mount();
    const dz = box.host.shadowRoot!.querySelector(".dropzone") as HTMLElement;
    const ev = new Event("paste", { bubbles: true }) as any;
    ev.clipboardData = { getData: (t: string) => (t === "text/html" ? "<p>pasted</p>" : "") };
    dz.dispatchEvent(ev);
    expect(box.list().length).toBe(1);
    expect(box.host.shadowRoot!.querySelector("iframe")!.getAttribute("srcdoc"))
      .toContain("pasted");
  });

  it("toggles the dragover class on dragover/dragleave", () => {
    const box = mount();
    const dz = box.host.shadowRoot!.querySelector(".dropzone") as HTMLElement;
    const over = new Event("dragover", { bubbles: true }) as any;
    over.preventDefault = () => {};
    dz.dispatchEvent(over);
    expect(dz.classList.contains("dragover")).toBe(true);
    dz.dispatchEvent(new Event("dragleave", { bubbles: true }));
    expect(dz.classList.contains("dragover")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/dropzone.test.ts`
Expected: FAIL — dropped file is ignored, `list()` stays empty.

- [ ] **Step 3: Replace `buildDropzone` in `src/core.ts` and add helpers**

Replace the existing `buildDropzone` method with:

```ts
  private buildDropzone(): HTMLDivElement {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.textContent = "Drop .html here or paste HTML";
    dz.tabIndex = 0;

    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.classList.add("dragover");
    });
    dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("dragover");
      void readDropped((e as DragEvent).dataTransfer).then((html) => {
        if (html != null) this.poop(html);
      });
    });
    dz.addEventListener("paste", (e) => {
      const html = readPasted((e as ClipboardEvent).clipboardData);
      if (html != null) this.poop(html);
    });
    return dz;
  }
```

Add these module-level helpers at the bottom of `src/core.ts`:

```ts
async function readDropped(dt: DataTransfer | null): Promise<string | null> {
  if (!dt) return null;
  const file = dt.files?.[0];
  if (file) return await file.text();
  const txt = dt.getData("text/html") || dt.getData("text/plain");
  return txt || null;
}

function readPasted(cd: DataTransfer | null): string | null {
  if (!cd) return null;
  const txt = cd.getData("text/html") || cd.getData("text/plain");
  return txt || null;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- tests/dropzone.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full vitest suite**

Run: `npm test`
Expected: PASS (core + dropzone).

- [ ] **Step 6: Commit**

```bash
git add src/core.ts tests/dropzone.test.ts
git commit -m "feat: drag-and-paste HTML into the dropzone"
```

---

## Task 7: `<litter-box>` custom element

**Files:**
- Create: `src/element.ts`, `tests/element.test.ts`

- [ ] **Step 1: Write the failing test** — `tests/element.test.ts`

```ts
import { describe, it, expect, beforeEach } from "vitest";
import "../src/element";

beforeEach(() => { document.body.innerHTML = ""; });

describe("<litter-box> custom element", () => {
  it("is registered", () => {
    expect(customElements.get("litter-box")).toBeTruthy();
  });

  it("poop/scoop/list work through the DOM node", () => {
    const el = document.createElement("litter-box") as any;
    el.setAttribute("max", "4");
    document.body.appendChild(el); // connectedCallback runs
    const id = el.poop("<p>x</p>");
    expect(id).toMatch(/^shit-/);
    expect(el.list()).toEqual([id]);
    expect(el.shadowRoot.querySelectorAll("iframe").length).toBe(1);
    expect(el.scoop(id)).toBe(true);
    expect(el.list()).toEqual([]);
  });

  it("re-dispatches litter:poop on the element", () => {
    const el = document.createElement("litter-box") as any;
    document.body.appendChild(el);
    let got = "";
    el.addEventListener("litter:poop", (e: CustomEvent) => { got = e.detail.id; });
    const id = el.poop("<p>y</p>");
    expect(got).toBe(id);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/element.test.ts`
Expected: FAIL — cannot resolve `../src/element`.

- [ ] **Step 3: Write `src/element.ts`**

```ts
import { LitterBox, type PoopOptions } from "./core";

export class LitterBoxElement extends HTMLElement {
  private engine?: LitterBox;

  connectedCallback(): void {
    if (this.engine) return;
    const max = Number(this.getAttribute("max") ?? 4) || 4;
    this.engine = new LitterBox(this, { max });
  }

  disconnectedCallback(): void {
    this.engine?.destroy();
    this.engine = undefined;
  }

  poop(html: string, opts?: PoopOptions): string | null {
    return this.engine?.poop(html, opts) ?? null;
  }
  scoop(id: string): boolean {
    return this.engine?.scoop(id) ?? false;
  }
  scoopAll(): void {
    this.engine?.scoopAll();
  }
  list(): string[] {
    return this.engine?.list() ?? [];
  }
}

if (typeof customElements !== "undefined" && !customElements.get("litter-box")) {
  customElements.define("litter-box", LitterBoxElement);
}
```

> The core already dispatches `litter:*` events on its host, which IS the element here — so events surface on the node without extra re-dispatch code.

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- tests/element.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/element.ts tests/element.test.ts
git commit -m "feat: <litter-box> custom element"
```

---

## Task 8: React `<LitterBox>` wrapper

**Files:**
- Create: `src/react.tsx`, `tests/react.test.tsx`

- [ ] **Step 1: Write the failing test** — `tests/react.test.tsx`

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { createRef } from "react";
import { LitterBox, type LitterBoxHandle } from "../src/react";

describe("React <LitterBox>", () => {
  it("exposes poop/scoop via ref and fires onPoop", () => {
    const ref = createRef<LitterBoxHandle>();
    const onPoop = vi.fn();
    render(<LitterBox ref={ref} onPoop={onPoop} />);

    let id: string | null = null;
    act(() => { id = ref.current!.poop("<p>hi</p>"); });
    expect(id).toMatch(/^shit-/);
    expect(onPoop).toHaveBeenCalledWith(id);
    expect(ref.current!.list()).toEqual([id]);

    act(() => { ref.current!.scoop(id!); });
    expect(ref.current!.list()).toEqual([]);
  });

  it("tears the engine down on unmount", () => {
    const ref = createRef<LitterBoxHandle>();
    const { unmount } = render(<LitterBox ref={ref} />);
    act(() => { ref.current!.poop("x"); });
    unmount();
    expect(ref.current).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/react.test.tsx`
Expected: FAIL — cannot resolve `../src/react`.

- [ ] **Step 3: Write `src/react.tsx`**

```tsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { CSSProperties } from "react";
import { LitterBox as Engine, type PoopOptions } from "./core";

export interface LitterBoxHandle {
  poop(html: string, opts?: PoopOptions): string | null;
  scoop(id: string): boolean;
  scoopAll(): void;
  list(): string[];
}

export interface LitterBoxProps {
  max?: number;
  className?: string;
  style?: CSSProperties;
  onPoop?: (id: string) => void;
  onScoop?: (id: string) => void;
  onFull?: () => void;
}

export const LitterBox = forwardRef<LitterBoxHandle, LitterBoxProps>(
  function LitterBox({ max = 4, className, style, onPoop, onScoop, onFull }, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const engineRef = useRef<Engine | null>(null);
    const cbs = useRef({ onPoop, onScoop, onFull });
    cbs.current = { onPoop, onScoop, onFull };

    useEffect(() => {
      const host = hostRef.current!;
      const engine = new Engine(host, { max });
      engineRef.current = engine;

      const onP = (e: Event) => cbs.current.onPoop?.((e as CustomEvent).detail.id);
      const onS = (e: Event) => cbs.current.onScoop?.((e as CustomEvent).detail.id);
      const onF = () => cbs.current.onFull?.();
      host.addEventListener("litter:poop", onP);
      host.addEventListener("litter:scoop", onS);
      host.addEventListener("litter:full", onF);

      return () => {
        host.removeEventListener("litter:poop", onP);
        host.removeEventListener("litter:scoop", onS);
        host.removeEventListener("litter:full", onF);
        engine.destroy();
        engineRef.current = null;
      };
    }, [max]);

    useImperativeHandle(ref, (): LitterBoxHandle => ({
      poop: (html, opts) => engineRef.current?.poop(html, opts) ?? null,
      scoop: (id) => engineRef.current?.scoop(id) ?? false,
      scoopAll: () => engineRef.current?.scoopAll(),
      list: () => engineRef.current?.list() ?? [],
    }));

    return <div ref={hostRef} className={className} style={style} />;
  },
);
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- tests/react.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/react.tsx tests/react.test.tsx
git commit -m "feat: React <LitterBox> wrapper"
```

---

## Task 9: Barrel export + build + typecheck

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Write `src/index.ts`**

```ts
import "./element"; // side effect: registers <litter-box>

export { LitterBox } from "./core";
export type { LitterBoxOptions, PoopOptions } from "./core";
export { LitterBoxElement } from "./element";
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors, exit 0.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exit 0; `dist/` now contains `index.js`, `index.cjs`, `index.d.ts`, `react.js`, `react.cjs`, `react.d.ts`, `litter-box.global.js`.

- [ ] **Step 4: Verify dist outputs exist**

Run: `ls dist`
Expected output includes: `index.js  index.cjs  index.d.ts  react.js  react.cjs  react.d.ts  litter-box.global.js`

- [ ] **Step 5: Run the full unit suite once more**

Run: `npm test`
Expected: PASS (core + dropzone + element + react).

- [ ] **Step 6: Commit**

```bash
git add src/index.ts
git commit -m "feat: barrel entry, ESM/CJS/IIFE build"
```

---

## Task 10: Plain-HTML demo page

**Files:**
- Create: `demo/index.html`

- [ ] **Step 1: Write `demo/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>litter box demo</title>
  <style>
    body { font: 16px system-ui, sans-serif; margin: 24px; color: #18181b; }
    litter-box { display: block; height: 70vh; }
    .controls { margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    button { font: inherit; padding: 6px 12px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>litter box</h1>
  <div class="controls">
    <button id="poop">poop sample</button>
    <button id="poop-evil">poop escape-attempt</button>
    <button id="scoop-all">scoop all</button>
    <span id="count">0 shits</span>
  </div>
  <litter-box id="box" max="4"></litter-box>

  <script src="/dist/litter-box.global.js"></script>
  <script>
    const box = document.getElementById('box');
    const count = document.getElementById('count');

    const sample = `<!doctype html><html><body style="font-family:sans-serif;padding:16px;background:#eef2ff">
      <h2>hello from inside</h2>
      <button onclick="document.body.style.background='#fee2e2'">click me</button>
    </body></html>`;

    const evil = `<!doctype html><html><body>escape attempt<script>
      try { parent.document.body.style.background = 'red'; } catch (e) {}
      document.body.setAttribute('data-ran', '1');
    <\/script></body></html>`;

    const refresh = () => { count.textContent = box.list().length + ' shits'; };

    document.getElementById('poop').onclick = () => box.poop(sample);
    document.getElementById('poop-evil').onclick = () => box.poop(evil);
    document.getElementById('scoop-all').onclick = () => box.scoopAll();

    box.addEventListener('litter:poop', refresh);
    box.addEventListener('litter:scoop', refresh);
    box.addEventListener('litter:full', () => alert('box full — scoop one first'));
  </script>
</body>
</html>
```

- [ ] **Step 2: Manual smoke check (optional but recommended)**

Run: `npx -y serve -l 5173 .` then open `http://localhost:5173/demo/index.html`.
Expected: clicking "poop sample" renders an isolated page; clicking inside the sample's button changes only the inner background; "poop escape-attempt" does NOT turn the outer page red. Ctrl+C to stop the server.

- [ ] **Step 3: Commit**

```bash
git add demo/index.html
git commit -m "feat: plain-HTML demo playground"
```

---

## Task 11: Playwright isolation e2e

**Files:**
- Create: `playwright.config.ts`, `tests/isolation.spec.ts`

**Prerequisite:** `dist/litter-box.global.js` must exist (run `npm run build` from Task 9 if not).

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.ts",
  use: { baseURL: "http://localhost:5173" },
  webServer: {
    command: "npx -y serve -l 5173 .",
    url: "http://localhost:5173/demo/index.html",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
```

- [ ] **Step 2: Install the Playwright browser**

Run: `npx playwright install chromium`
Expected: downloads Chromium.

- [ ] **Step 3: Write `tests/isolation.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/demo/index.html");
});

test("scripts execute inside the shit but cannot touch the parent", async ({ page }) => {
  await page.click("#poop-evil");
  const frame = page.frameLocator("litter-box >>> iframe").first();
  // proof the inner script ran
  await expect(frame.locator("body")).toHaveAttribute("data-ran", "1");
  // proof the parent was NOT mutated
  await expect(page.locator("body")).not.toHaveCSS("background-color", "rgb(255, 0, 0)");
});

test("inner styles do not leak out to the host page", async ({ page }) => {
  await page.click("#poop");
  const hostBg = await page
    .locator("h1")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(hostBg).toBe("rgba(0, 0, 0, 0)");
});

test("scoop removes the iframe", async ({ page }) => {
  await page.click("#poop");
  await expect(page.locator("litter-box >>> iframe")).toHaveCount(1);
  await page.click("litter-box >>> .scoop");
  await expect(page.locator("litter-box >>> iframe")).toHaveCount(0);
});

test("caps at 4 shits", async ({ page }) => {
  page.on("dialog", (d) => d.dismiss()); // dismiss the 'box full' alert
  for (let i = 0; i < 5; i++) await page.click("#poop");
  await expect(page.locator("litter-box >>> iframe")).toHaveCount(4);
});
```

- [ ] **Step 4: Run the e2e suite**

Run: `npm run test:e2e`
Expected: PASS (4 tests). Playwright auto-starts the static server.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/isolation.spec.ts
git commit -m "test: Playwright proves real-browser isolation"
```

---

## Task 12: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

````markdown
# litter box 🐱

Drop any HTML into a box and it renders in a sealed sandbox — like opening it in a
fresh browser tab. The dropped HTML cannot touch your page's styles, scripts, or
state, and your page cannot touch it. Two operations: **poop** (add) and **scoop**
(remove). Up to **4** at once.

## Install

```bash
npm install litter-box
```

## Plain HTML

```html
<litter-box id="box" max="4"></litter-box>
<script src="https://unpkg.com/litter-box/dist/litter-box.global.js"></script>
<script>
  const box = document.getElementById('box');
  const id = box.poop('<h1>hello</h1><script>alert(1)<\/script>');
  // later: box.scoop(id);
</script>
```

## React / Next

```tsx
import { useRef } from "react";
import { LitterBox, type LitterBoxHandle } from "litter-box/react";

export function Demo() {
  const ref = useRef<LitterBoxHandle>(null);
  return (
    <>
      <button onClick={() => ref.current?.poop("<h1>hi</h1>")}>poop</button>
      <LitterBox ref={ref} max={4} style={{ height: "70vh" }} onFull={() => alert("full")} />
    </>
  );
}
```

## Programmatic core (any framework)

```ts
import { LitterBox } from "litter-box";
const box = new LitterBox(document.getElementById("host")!, { max: 4 });
box.poop("<p>x</p>");
```

## API

| Method | Returns | Notes |
| --- | --- | --- |
| `poop(html, { title? })` | `id` or `null` | `null` + `litter:full` event when already 4 |
| `scoop(id)` | `boolean` | removes one shit |
| `scoopAll()` | `void` | clears all |
| `list()` | `string[]` | current shit ids |

Events: `litter:poop`, `litter:scoop`, `litter:full` (React: `onPoop`, `onScoop`,
`onFull`).

## Isolation

Each shit lives in an `iframe srcdoc` with `sandbox="allow-scripts"` — scripts run
but the frame is an opaque origin with no access to the parent page, cookies, or
storage. The box's own UI is rendered in a shadow root so host-page CSS can't bleed in.

## Drag & paste

Drop a `.html` file onto the box, or focus it and paste HTML (Ctrl/Cmd+V).

## Develop

```bash
npm install
npm test          # vitest unit tests
npm run build     # tsup -> dist
npm run test:e2e  # Playwright isolation tests (needs a build first)
```
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with usage and API"
```

---

## Self-Review Notes (verified against spec)

- **Distribution (core + custom element + React wrapper):** Tasks 1–3, 7, 8, 9. ✓
- **poop/scoop/scoopAll/list API + null-on-full:** Tasks 2–4. ✓
- **iframe srcdoc + sandbox=allow-scripts (no allow-same-origin):** Task 2; proven in Task 11. ✓
- **Shadow-DOM chrome:** Task 1. ✓
- **Drag/paste UI:** Task 6. ✓
- **Responsive grid (data-count 1–4):** styles in Task 1, behavior asserted in Tasks 1–2, 4. ✓
- **4-shit cap + litter:full:** Task 4. ✓
- **Events litter:poop/scoop/full:** Tasks 5, 8. ✓
- **tsup ESM/CJS/IIFE + react subpath:** Tasks 0, 9. ✓
- **vitest + Playwright tests:** Tasks 1–8 (vitest), 11 (Playwright). ✓
- **demo/index.html:** Task 10. ✓
- **Naming consistency:** `poop/scoop/scoopAll/list/destroy`, events `litter:poop|scoop|full`, exports `LitterBox` (core), `LitterBoxElement`, `LitterBox` (react, aliased `Engine` internally) — consistent across all tasks. ✓
