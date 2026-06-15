export const CHROME_CSS = `
:host {
  display: block; box-sizing: border-box; width: 100%; height: 100%;
  --litter-gap: 10px;
  --litter-radius: 14px;
  --litter-bg: #f6f6f7;
  --litter-surface: #ffffff;
  --litter-border: rgba(15, 23, 42, 0.10);
  --litter-ink: #475569;
  --litter-accent: #22c55e;
  --litter-accent-ink: #04140a;
  --litter-danger: #ef4444;
  --litter-shadow: 0 1px 2px rgba(15,23,42,.06), 0 8px 24px -12px rgba(15,23,42,.18);
  --litter-tray: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 3v9'/%3E%3Cpath d='m8 10 4 4 4-4'/%3E%3Crect x='4' y='17' width='16' height='3' rx='1'/%3E%3C/svg%3E");
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :host {
    --litter-bg: #0b1220;
    --litter-surface: #0f172a;
    --litter-border: rgba(148, 163, 184, 0.18);
    --litter-ink: #94a3b8;
    --litter-shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 30px -14px rgba(0,0,0,.6);
  }
}
*, *::before, *::after { box-sizing: border-box; }
.box {
  position: relative;
  width: 100%; height: 100%;
  min-height: var(--litter-min-height, 240px);
  padding: var(--litter-gap);
  background: var(--litter-bg);
  border-radius: var(--litter-radius);
  outline: none;
}
.box:focus-visible { box-shadow: 0 0 0 2px var(--litter-accent) inset; }
.grid { display: grid; gap: var(--litter-gap); width: 100%; height: 100%; }
.grid[data-count="0"] { grid-template-columns: 1fr; grid-template-rows: 1fr; }
.grid[data-count="1"] { grid-template-columns: 1fr; grid-template-rows: 1fr; }
.grid[data-count="2"] { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; }
.grid[data-count="3"], .grid[data-count="4"] { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.cell {
  position: relative; min-height: 0;
  background: var(--litter-surface);
  border: 1px solid var(--litter-border);
  border-radius: calc(var(--litter-radius) - 2px);
  overflow: hidden;
  box-shadow: var(--litter-shadow);
  animation: litter-in 220ms cubic-bezier(.2,.7,.2,1) both;
}
.cell iframe { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
.scoop {
  position: absolute; top: 8px; right: 8px; z-index: 2;
  width: 28px; height: 28px; display: grid; place-items: center;
  border: 0; border-radius: 999px; cursor: pointer;
  background: rgba(15, 23, 42, .55); color: #fff;
  font: 600 16px/1 ui-sans-serif, system-ui, sans-serif;
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  transition: background 160ms ease, transform 160ms ease;
}
.scoop:hover { background: var(--litter-danger); transform: scale(1.06); }
.scoop:active { transform: scale(.94); }
.scoop:focus-visible { outline: 2px solid var(--litter-accent); outline-offset: 2px; }
.empty {
  position: absolute; inset: var(--litter-gap);
  display: grid; place-content: center; justify-items: center; gap: 8px;
  border: 1.5px dashed var(--litter-border);
  border-radius: calc(var(--litter-radius) - 2px);
  color: var(--litter-ink); text-align: center; cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
}
.empty:hover { border-color: var(--litter-accent); color: color-mix(in srgb, var(--litter-accent) 70%, var(--litter-ink)); }
.empty:focus-visible { outline: 2px solid var(--litter-accent); outline-offset: 2px; }
.empty[hidden] { display: none; }
.empty-art {
  width: 30px; height: 30px; background: currentColor;
  -webkit-mask: var(--litter-tray) center / contain no-repeat;
          mask: var(--litter-tray) center / contain no-repeat;
  opacity: .7;
}
.empty-title { margin: 0; font-size: 14px; font-weight: 700; }
.empty-sub { margin: 0; font-size: 12px; opacity: .75; }
.add {
  position: absolute; right: 14px; bottom: 14px; z-index: 3;
  width: 40px; height: 40px; border-radius: 999px; border: 0; cursor: pointer;
  background: var(--litter-accent); color: var(--litter-accent-ink);
  font: 600 22px/1 ui-sans-serif, system-ui, sans-serif;
  box-shadow: 0 6px 16px -4px rgba(0,0,0,.35);
  transition: transform 160ms ease, filter 160ms ease;
}
.add:hover { transform: translateY(-1px) scale(1.04); }
.add:active { transform: scale(.95); }
.add:focus-visible { outline: 2px solid var(--litter-accent); outline-offset: 3px; }
.add[hidden] { display: none; }
.overlay {
  position: absolute; inset: 0; z-index: 4; display: none; place-items: center;
  border-radius: var(--litter-radius);
  background: color-mix(in srgb, var(--litter-accent) 14%, rgba(15,23,42,.55));
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  border: 2px dashed var(--litter-accent);
  color: #fff; font-weight: 700; pointer-events: none;
}
.box.dragging .overlay { display: grid; pointer-events: auto; }
.overlay span { background: rgba(0,0,0,.35); padding: 8px 14px; border-radius: 999px; }
@keyframes litter-in {
  from { opacity: 0; transform: translateY(6px) scale(.985); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .cell { animation: none; }
  .scoop, .add, .empty { transition: none; }
}
`;
