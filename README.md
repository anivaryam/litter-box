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
