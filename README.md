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
| `poop(html, { title?, sandbox? })` | `id` or `null` | `null` + `litter:full` event when already 4 |
| `scoop(id)` | `boolean` | removes one shit |
| `scoopAll()` | `void` | clears all |
| `list()` | `string[]` | current shit ids |

Constructor / element / React all accept `max` (1–4) and `sandbox` (override the
iframe sandbox token string).

Events: `litter:poop`, `litter:scoop`, `litter:full` (React: `onPoop`, `onScoop`,
`onFull`). `scoopAll()` emits one `litter:scoop` per shit removed (no separate bulk event).

## Styling

The box's chrome lives in a shadow root and adapts to light/dark via
`prefers-color-scheme`. Override these CSS custom properties on the host to theme it:
`--litter-gap`, `--litter-radius`, `--litter-bg`, `--litter-surface`, `--litter-border`,
`--litter-ink`, `--litter-accent`, `--litter-danger`, `--litter-min-height`.

## Isolation

Each shit lives in an `iframe srcdoc`. The default sandbox is:

```
allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads
```

So a dropped page behaves like a real browser tab — its scripts run, forms submit,
dialogs and popups open, and it can trigger downloads (e.g. exporting an XLSX). What
it deliberately does **not** get is `allow-same-origin`: the frame stays an opaque
origin with no access to the parent page, its cookies, or its storage. The box's own
UI is rendered in a shadow root so host-page CSS can't bleed in either direction.

Need a stricter or looser policy? Pass `sandbox` (per shit via `poop(html, { sandbox })`,
or for all shits via the constructor / `<litter-box>` / React `sandbox` prop). Adding
`allow-same-origin` re-couples the frame to your origin — only do that for content you
trust.

## Drag & paste

Drop a `.html` file anywhere on the box, click the **+** (or the empty box) to pick a
file, or focus the box and paste HTML (Ctrl/Cmd+V).

## Develop

```bash
npm install
npm test          # vitest unit tests
npm run build     # tsup -> dist
npm run test:e2e  # Playwright isolation tests (needs a build first)
```
