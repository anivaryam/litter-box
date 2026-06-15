import { describe, it, expect, beforeEach, vi } from "vitest";
import { LitterBox } from "../src/core";

beforeEach(() => { document.body.innerHTML = ""; });

function mount(max = 4) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return new LitterBox(host, { max });
}

describe("LitterBox skeleton", () => {
  it("attaches an open shadow root containing a grid and an empty-state", () => {
    const box = mount();
    const root = box.host.shadowRoot!;
    expect(root).not.toBeNull();
    expect(root.querySelector(".grid")).not.toBeNull();
    expect(root.querySelector(".empty")).not.toBeNull();
  });

  it("starts empty: list [], grid data-count 0, empty-state shown, add hidden", () => {
    const box = mount();
    const root = box.host.shadowRoot!;
    const grid = root.querySelector(".grid") as HTMLElement;
    expect(box.list()).toEqual([]);
    expect(grid.dataset.count).toBe("0");
    expect((root.querySelector(".empty") as HTMLElement).hidden).toBe(false);
    expect((root.querySelector(".add") as HTMLElement).hidden).toBe(true);
  });

  it("caps max at 4 even if a larger max is requested", () => {
    const box = mount(99);
    expect(box.max).toBe(4);
  });
});

describe("poop", () => {
  it("adds an iframe, returns an id, and updates the list", () => {
    const box = mount();
    const id = box.poop("<p>x</p>");
    expect(id).toMatch(/^shit-/);
    expect(box.list()).toEqual([id]);
    expect(box.host.shadowRoot!.querySelectorAll("iframe").length).toBe(1);
  });

  it("sandboxes the iframe so scripts run but it can't reach the parent, and sets srcdoc", () => {
    const box = mount();
    box.poop("<p>hello</p>");
    const f = box.host.shadowRoot!.querySelector("iframe")!;
    const sandbox = f.getAttribute("sandbox")!;
    // scripts run, downloads/forms/popups allowed (real apps work)...
    expect(sandbox).toContain("allow-scripts");
    expect(sandbox).toContain("allow-downloads");
    // ...but never same-origin, so the frame stays an opaque origin (isolated).
    expect(sandbox).not.toContain("allow-same-origin");
    expect(f.getAttribute("srcdoc")).toContain("<p>hello</p>");
  });

  it("honours a per-shit sandbox override", () => {
    const box = mount();
    box.poop("<p>x</p>", { sandbox: "allow-scripts" });
    const f = box.host.shadowRoot!.querySelector("iframe")!;
    expect(f.getAttribute("sandbox")).toBe("allow-scripts");
  });

  it("renders a scoop button per cell", () => {
    const box = mount();
    box.poop("<p>x</p>");
    expect(box.host.shadowRoot!.querySelectorAll(".cell .scoop").length).toBe(1);
  });

  it("grid data-count equals the shit count, so one shit fills the box", () => {
    const box = mount();
    const grid = box.host.shadowRoot!.querySelector(".grid") as HTMLElement;
    box.poop("a");
    expect(grid.dataset.count).toBe("1");
    box.poop("b");
    expect(grid.dataset.count).toBe("2");
  });
});

describe("scoop", () => {
  it("removes the matching shit and its iframe", () => {
    const box = mount();
    const id = box.poop("<p>x</p>")!;
    expect(box.scoop(id)).toBe(true);
    expect(box.list()).toEqual([]);
    expect(box.host.shadowRoot!.querySelectorAll("iframe").length).toBe(0);
  });

  it("returns false for an unknown id", () => {
    const box = mount();
    expect(box.scoop("nope")).toBe(false);
  });

  it("scoopAll clears every shit", () => {
    const box = mount();
    box.poop("a");
    box.poop("b");
    box.scoopAll();
    expect(box.list()).toEqual([]);
  });
});

describe("capacity", () => {
  it("rejects the 5th poop and emits litter:full", () => {
    const box = mount();
    const full = vi.fn();
    box.host.addEventListener("litter:full", full);
    for (let i = 0; i < 4; i++) expect(box.poop("<p>x</p>")).not.toBeNull();
    expect(box.poop("<p>x</p>")).toBeNull();
    expect(full).toHaveBeenCalledTimes(1);
    expect(box.list().length).toBe(4);
  });

  it("shows the add button only when partially full, hides it at 0 and at max", () => {
    const box = mount();
    const add = box.host.shadowRoot!.querySelector(".add") as HTMLElement;
    expect(add.hidden).toBe(true); // 0 shits → empty-state instead
    let id = box.poop("x")!;
    expect(add.hidden).toBe(false); // 1..3 shits → floating add
    for (let i = 0; i < 3; i++) id = box.poop("x")!;
    expect(add.hidden).toBe(true); // 4 shits → full
    box.scoop(id);
    expect(add.hidden).toBe(false); // back to 3 → add returns
  });

  it("shows the empty-state only when there are no shits", () => {
    const box = mount();
    const empty = box.host.shadowRoot!.querySelector(".empty") as HTMLElement;
    expect(empty.hidden).toBe(false);
    const id = box.poop("x")!;
    expect(empty.hidden).toBe(true);
    box.scoop(id);
    expect(empty.hidden).toBe(false);
  });
});

describe("events", () => {
  it("emits litter:poop and litter:scoop with the id in detail", () => {
    const box = mount();
    const onP = vi.fn();
    const onS = vi.fn();
    box.host.addEventListener("litter:poop", onP);
    box.host.addEventListener("litter:scoop", onS);
    const id = box.poop("x")!;
    box.scoop(id);
    expect((onP.mock.calls[0][0] as CustomEvent).detail.id).toBe(id);
    expect((onS.mock.calls[0][0] as CustomEvent).detail.id).toBe(id);
  });
});
