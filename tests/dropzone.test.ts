import { describe, it, expect, beforeEach } from "vitest";
import { LitterBox } from "../src/core";

beforeEach(() => { document.body.innerHTML = ""; });

function mount() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return new LitterBox(host);
}

function box(b: LitterBox): HTMLElement {
  return b.host.shadowRoot!.querySelector(".box") as HTMLElement;
}

describe("drag & paste (whole box is the target)", () => {
  it("poops the contents of a .html file dropped anywhere on the box", async () => {
    const b = mount();
    const file = new File(["<h1>dropped</h1>"], "x.html", { type: "text/html" });
    const ev = new Event("drop", { bubbles: true }) as any;
    ev.dataTransfer = { files: [file], getData: () => "" };
    ev.preventDefault = () => {};
    box(b).dispatchEvent(ev);
    await new Promise((r) => setTimeout(r, 0)); // file.text() is async
    expect(b.list().length).toBe(1);
    expect(b.host.shadowRoot!.querySelector("iframe")!.getAttribute("srcdoc"))
      .toContain("dropped");
  });

  it("poops pasted HTML", () => {
    const b = mount();
    const ev = new Event("paste", { bubbles: true }) as any;
    ev.clipboardData = { getData: (t: string) => (t === "text/html" ? "<p>pasted</p>" : "") };
    box(b).dispatchEvent(ev);
    expect(b.list().length).toBe(1);
    expect(b.host.shadowRoot!.querySelector("iframe")!.getAttribute("srcdoc"))
      .toContain("pasted");
  });

  it("shows the drag overlay on dragenter and clears it on dragleave", () => {
    const b = mount();
    const el = box(b);
    const enter = new Event("dragenter", { bubbles: true }) as any;
    enter.preventDefault = () => {};
    el.dispatchEvent(enter);
    expect(el.classList.contains("dragging")).toBe(true);
    el.dispatchEvent(new Event("dragleave", { bubbles: true }));
    expect(el.classList.contains("dragging")).toBe(false);
  });

  it("clears the drag overlay after a drop", async () => {
    const b = mount();
    const el = box(b);
    const enter = new Event("dragenter", { bubbles: true }) as any;
    enter.preventDefault = () => {};
    el.dispatchEvent(enter);
    expect(el.classList.contains("dragging")).toBe(true);
    const drop = new Event("drop", { bubbles: true }) as any;
    drop.dataTransfer = { files: [], getData: (t: string) => (t === "text/html" ? "<p>d</p>" : "") };
    drop.preventDefault = () => {};
    el.dispatchEvent(drop);
    await new Promise((r) => setTimeout(r, 0));
    expect(el.classList.contains("dragging")).toBe(false);
    expect(b.list().length).toBe(1);
  });

  it("poops a file chosen via the hidden file input", async () => {
    const b = mount();
    const input = b.host.shadowRoot!.querySelector(".file") as HTMLInputElement;
    const file = new File(["<h2>picked</h2>"], "p.html", { type: "text/html" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect(b.list().length).toBe(1);
    expect(b.host.shadowRoot!.querySelector("iframe")!.getAttribute("srcdoc"))
      .toContain("picked");
  });
});
