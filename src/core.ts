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
