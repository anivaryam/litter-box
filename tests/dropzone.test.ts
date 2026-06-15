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
