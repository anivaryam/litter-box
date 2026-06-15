import { describe, it, expect, beforeEach, vi } from "vitest";
import { LitterBox } from "../src/core";

beforeEach(() => { document.body.innerHTML = ""; });

function mount(max = 4) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return new LitterBox(host, { max });
}

describe("LitterBox skeleton", () => {
  it("attaches an open shadow root containing a grid and a dropzone", () => {
    const box = mount();
    const root = box.host.shadowRoot!;
    expect(root).not.toBeNull();
    expect(root.querySelector(".grid")).not.toBeNull();
    expect(root.querySelector(".dropzone")).not.toBeNull();
  });

  it("starts with an empty list and grid data-count of 1 (dropzone tile)", () => {
    const box = mount();
    const grid = box.host.shadowRoot!.querySelector(".grid") as HTMLElement;
    expect(box.list()).toEqual([]);
    expect(grid.dataset.count).toBe("1");
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

  it("sandboxes the iframe with allow-scripts and sets srcdoc", () => {
    const box = mount();
    box.poop("<p>hello</p>");
    const f = box.host.shadowRoot!.querySelector("iframe")!;
    expect(f.getAttribute("sandbox")).toBe("allow-scripts");
    expect(f.getAttribute("srcdoc")).toContain("<p>hello</p>");
  });

  it("renders a scoop button per cell", () => {
    const box = mount();
    box.poop("<p>x</p>");
    expect(box.host.shadowRoot!.querySelectorAll(".cell .scoop").length).toBe(1);
  });

  it("grows grid data-count as shits are added", () => {
    const box = mount();
    const grid = box.host.shadowRoot!.querySelector(".grid") as HTMLElement;
    box.poop("a");
    expect(grid.dataset.count).toBe("2"); // 1 shit + dropzone tile
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

  it("hides the dropzone when full and shows it again after a scoop", () => {
    const box = mount();
    let id = "";
    for (let i = 0; i < 4; i++) id = box.poop("x")!;
    expect(box.host.shadowRoot!.querySelector(".dropzone")).toBeNull();
    box.scoop(id);
    expect(box.host.shadowRoot!.querySelector(".dropzone")).not.toBeNull();
  });
});
