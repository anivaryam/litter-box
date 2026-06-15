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
