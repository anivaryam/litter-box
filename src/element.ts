import { LitterBox, type PoopOptions } from "./core";

export class LitterBoxElement extends HTMLElement {
  private engine?: LitterBox;

  connectedCallback(): void {
    if (this.engine) return;
    const max = Number(this.getAttribute("max") ?? 4) || 4;
    const sandbox = this.getAttribute("sandbox") ?? undefined;
    this.engine = new LitterBox(this, { max, sandbox });
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
