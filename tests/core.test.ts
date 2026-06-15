import { describe, it, expect, beforeEach } from "vitest";
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
