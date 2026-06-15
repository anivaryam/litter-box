import { describe, it, expect, beforeEach } from "vitest";
import "../src/element";

beforeEach(() => { document.body.innerHTML = ""; });

describe("<litter-box> custom element", () => {
  it("is registered", () => {
    expect(customElements.get("litter-box")).toBeTruthy();
  });

  it("poop/scoop/list work through the DOM node", () => {
    const el = document.createElement("litter-box") as any;
    el.setAttribute("max", "4");
    document.body.appendChild(el); // connectedCallback runs
    const id = el.poop("<p>x</p>");
    expect(id).toMatch(/^shit-/);
    expect(el.list()).toEqual([id]);
    expect(el.shadowRoot.querySelectorAll("iframe").length).toBe(1);
    expect(el.scoop(id)).toBe(true);
    expect(el.list()).toEqual([]);
  });

  it("re-dispatches litter:poop on the element", () => {
    const el = document.createElement("litter-box") as any;
    document.body.appendChild(el);
    let got = "";
    el.addEventListener("litter:poop", (e: CustomEvent) => { got = e.detail.id; });
    const id = el.poop("<p>y</p>");
    expect(got).toBe(id);
  });
});
