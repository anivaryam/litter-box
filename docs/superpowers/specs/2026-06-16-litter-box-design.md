# litter box — design

**Date:** 2026-06-16
**Status:** Approved (brainstorm)

## Summary

An embeddable, framework-agnostic component that renders arbitrary dropped HTML
inside a sealed sandbox — like opening that HTML in a fresh browser tab. Dropped
content ("shits") cannot affect, or be affected by, the host page's styles,
scripts, or functionality. Two operations only: **poop** (add + render) and
**scoop** (remove). Up to **4** shits at once.

## Goals

- Drop any HTML into the box; it renders in full isolation.
- Usable across React, Next, Vue, Svelte, Angular, and plain HTML.
- Two operations: poop (add) and scoop (remove). Max 4 concurrent shits.
- "Loads like a real browser": dropped scripts run, but fully sandboxed.

## Non-goals (YAGNI)

- No persistence across reloads.
- No more than 4 slots.
- No server, no network proxying of dropped content.
- No editing of a shit after it's pooped (scoop + re-poop instead).

## Architecture — one engine, two skins

```
LitterBox (core class, TS, zero runtime deps)   ← all logic
   ├── <litter-box>  custom element              ← plain HTML, Vue, Svelte, Angular
   └── <LitterBox>   React wrapper                ← React / Next
```

The core class mounts into a host element and attaches a **shadow root** for its
own chrome (grid, drop zone, scoop buttons). The box's own UI therefore looks
identical on any host page — host-page CSS cannot bleed in. Theming is exposed
deliberately via CSS custom properties (`--litter-gap`, `--litter-radius`, …) and
`::part()` hooks.

### Two isolation layers

1. **Shadow DOM** — isolates the box's own chrome from the host page.
2. **iframe `srcdoc` + `sandbox="allow-scripts"`** — isolates each shit. The
   iframe is an *opaque origin*: scripts execute, but have zero reach to the
   parent page, cookies, storage, or the host app. This is the
   "load like a real browser, sealed" behavior.

> Security note: `allow-scripts` is used **without** `allow-same-origin`.
> Combining the two would collapse the sandbox and is explicitly disallowed.

## Core API

```ts
const box = new LitterBox(hostEl, { max: 4 })

box.poop(html, opts?) // -> id | null  (add + render; null + 'full' event if already 4)
box.scoop(id)         // -> boolean    (remove one)
box.scoopAll()        // -> void       (clear all)
box.list()            // -> string[]   (current shit ids)
```

- `poop(html, opts?)` renders `html` into the next free slot via an iframe
  `srcdoc`. Returns a generated `id`. Returns `null` and emits `litter:full`
  when the box already holds 4.
- `opts` (optional, per-shit): currently `{ title?: string }` for iframe a11y
  title. Reserved for future sandbox tuning; default sandbox is fixed at
  `allow-scripts`.
- Accepts both full documents (`<html>…`) and fragments — the browser wraps
  fragments inside `srcdoc`.

### Events

Dispatched on the host element (custom element re-dispatches on the node):

- `litter:poop`  — `detail: { id }`
- `litter:scoop` — `detail: { id }`
- `litter:full`  — emitted when a poop is rejected because the box is full

## Skins

### Custom element `<litter-box>`

- `class LitterBoxElement extends HTMLElement`.
- `connectedCallback` instantiates `LitterBox` against itself.
- Reflects attribute `max` (default 4, hard-capped at 4).
- Exposes `poop` / `scoop` / `scoopAll` / `list` as methods on the DOM node, so
  `document.querySelector('litter-box').poop(html)` works.
- Re-dispatches the three `litter:*` events.
- Registered via `customElements.define('litter-box', LitterBoxElement)`.

### React wrapper `<LitterBox>`

- `forwardRef` + `useImperativeHandle` exposing `poop` / `scoop` / `scoopAll` /
  `list`.
- Mounts the engine into a ref'd `<div>` in `useEffect`; tears down on unmount.
- Props: `max`, `className`, `onPoop`, `onScoop`, `onFull`.

## Interaction — drag / paste UI

- Empty or partially-full box shows a **drop zone**: drag a `.html` file (read via
  `FileReader.text()`) **or** paste HTML (Ctrl/Cmd+V; reads clipboard `text/html`
  then falls back to `text/plain`) → renders into the next free slot.
- Each shit cell carries a **× scoop** button (`aria-label`).
- At 4 shits: drop zone is hidden and further poops are rejected with a
  `litter:full` event.

## Layout — responsive grid

Grid switches on a `data-count` attribute on the grid container:

- 1 shit → fills the box.
- 2 → side-by-side.
- 3–4 → 2×2.

Reflows automatically on poop / scoop.

## Packaging / build

- **tsup** build outputs:
  - IIFE bundle (`<script src>`; auto-registers `<litter-box>`) for plain HTML.
  - ESM + CJS + `.d.ts` for bundler imports.
  - React wrapper on the `litter-box/react` subpath.
- No runtime dependencies. React is a **peer dependency** of the wrapper only.

## Testing

- **Vitest** (happy-dom): engine logic — poop adds a slot, scoop removes, cap at 4,
  `list()` accuracy, `full` event on overflow.
- **Playwright** (real browser): isolation guarantees —
  - drop HTML whose script tries to touch `window.parent` / `document.cookie` →
    confirm blocked.
  - confirm style no-leak in both directions (host ↔ shit, shit ↔ shit).
  - confirm scoop removes the iframe from the DOM.
- `demo/index.html`: plain-HTML playground; Playwright drives it.

## File structure

```
litter-box/
  src/
    core.ts          # LitterBox engine
    element.ts       # <litter-box> custom element (registers)
    react.tsx        # React wrapper
    styles.ts        # box chrome CSS (injected into shadow root)
    index.ts         # re-exports core + element
  demo/
    index.html       # plain-HTML demo (script tag)
  tests/
    core.test.ts     # vitest unit
    isolation.spec.ts# playwright e2e
  package.json
  tsup.config.ts
  README.md
```

## Edge cases

- 5th poop while full → return `null`, emit `litter:full`, drop zone hidden.
- Empty box → drop-zone placeholder ("drop HTML here / paste").
- Fragment vs full-document HTML → both handled by `srcdoc`.
- iframes get a `title`; scoop buttons get `aria-label`.
- Window/container resize handled purely by CSS grid.
