import { CHROME_CSS } from "./styles";

export interface LitterBoxOptions {
  max?: number;
  /** Override the iframe sandbox token string for every shit. */
  sandbox?: string;
}

export interface PoopOptions {
  title?: string;
  /** Override the iframe sandbox token string for this one shit. */
  sandbox?: string;
}

interface Slot {
  id: string;
  iframe: HTMLIFrameElement;
  cell: HTMLDivElement;
}

const MAX_CAP = 4;

/**
 * Default iframe sandbox. Deliberately omits `allow-same-origin` so each shit
 * stays an opaque origin that cannot reach the parent page, its cookies, or its
 * storage. The other tokens let normal apps actually work — submit forms, open
 * dialogs/popups, and trigger downloads (e.g. an XLSX export) — "like opening
 * the file in a real browser tab".
 */
export const DEFAULT_SANDBOX =
  "allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads";

export class LitterBox {
  readonly host: HTMLElement;
  readonly max: number;
  readonly sandbox: string;
  private root: ShadowRoot;
  private box: HTMLDivElement;
  private grid: HTMLDivElement;
  private empty: HTMLDivElement;
  private addBtn: HTMLButtonElement;
  private fileInput: HTMLInputElement;
  private slots: Slot[] = [];
  private seq = 0;
  private dragDepth = 0;

  constructor(host: HTMLElement, options: LitterBoxOptions = {}) {
    this.host = host;
    this.max = Math.min(options.max ?? MAX_CAP, MAX_CAP);
    this.sandbox = options.sandbox ?? DEFAULT_SANDBOX;
    this.root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    this.root.innerHTML =
      `<style>${CHROME_CSS}</style>` +
      `<div class="box" tabindex="0">` +
        `<div class="grid" part="grid"></div>` +
        `<div class="empty" tabindex="0" role="button" aria-label="Add HTML">` +
          `<div class="empty-art"></div>` +
          `<p class="empty-title">Drop HTML here</p>` +
          `<p class="empty-sub">drag a .html file · paste · or click to browse</p>` +
        `</div>` +
        `<button class="add" type="button" part="add" aria-label="Add HTML" title="Add HTML">+</button>` +
        `<div class="overlay"><span>Drop to poop</span></div>` +
        `<input class="file" type="file" accept=".html,.htm,text/html" hidden />` +
      `</div>`;
    this.box = this.root.querySelector(".box")!;
    this.grid = this.root.querySelector(".grid")!;
    this.empty = this.root.querySelector(".empty")!;
    this.addBtn = this.root.querySelector(".add")!;
    this.fileInput = this.root.querySelector(".file")!;
    this.wireInput();
    this.wireDragAndPaste();
    this.render();
  }

  list(): string[] {
    return this.slots.map((s) => s.id);
  }

  poop(html: string, opts: PoopOptions = {}): string | null {
    if (this.slots.length >= this.max) {
      this.emit("litter:full", {});
      return null;
    }
    const id = `shit-${++this.seq}`;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", opts.sandbox ?? this.sandbox);
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
    this.grid.appendChild(cell);
    this.render();
    this.emit("litter:poop", { id });
    return id;
  }

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

  destroy(): void {
    this.root.innerHTML = "";
    this.slots = [];
  }

  private render(): void {
    const n = this.slots.length;
    const full = n >= this.max;
    // Grid lays out shits ONLY, so a single shit fills the whole box and the
    // layout reflows (1 → full, 2 → side-by-side, 3-4 → 2x2) as more arrive.
    this.grid.dataset.count = String(n);
    this.empty.hidden = n !== 0; // full-box prompt only when truly empty
    this.addBtn.hidden = full || n === 0; // floating "+" only when partially full
  }

  private wireInput(): void {
    const open = (): void => {
      if (this.slots.length < this.max) this.fileInput.click();
    };
    this.addBtn.addEventListener("click", open);
    this.empty.addEventListener("click", open);
    this.empty.addEventListener("keydown", (e) => {
      const key = (e as KeyboardEvent).key;
      if (key === "Enter" || key === " ") {
        e.preventDefault();
        open();
      }
    });
    this.fileInput.addEventListener("change", () => {
      const file = this.fileInput.files?.[0];
      this.fileInput.value = ""; // allow re-picking the same file
      if (file) void file.text().then((html) => this.poop(html));
    });
  }

  private wireDragAndPaste(): void {
    // Whole-box drag handling. dragenter/leave are reference-counted because
    // they also fire when crossing child boundaries. While dragging, a full-box
    // overlay is shown that covers any child iframes — without it, a drag over a
    // sandboxed iframe is swallowed by that frame and never reaches us.
    const hide = (): void => {
      this.dragDepth = 0;
      this.box.classList.remove("dragging");
    };
    this.box.addEventListener("dragenter", (e) => {
      e.preventDefault();
      this.dragDepth++;
      if (this.slots.length < this.max) this.box.classList.add("dragging");
    });
    this.box.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dt = (e as DragEvent).dataTransfer;
      if (dt) dt.dropEffect = "copy";
    });
    this.box.addEventListener("dragleave", () => {
      if (--this.dragDepth <= 0) hide();
    });
    this.box.addEventListener("drop", (e) => {
      e.preventDefault();
      hide();
      void readDropped((e as DragEvent).dataTransfer).then((html) => {
        if (html != null) this.poop(html);
      });
    });
    this.box.addEventListener("paste", (e) => {
      const html = readPasted((e as ClipboardEvent).clipboardData);
      if (html != null) this.poop(html);
    });
  }

  private emit(type: string, detail: Record<string, unknown>): void {
    this.host.dispatchEvent(
      new CustomEvent(type, { detail, bubbles: true, composed: true }),
    );
  }
}

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
