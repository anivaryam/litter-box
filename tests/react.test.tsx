import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { createRef } from "react";
import { LitterBox, type LitterBoxHandle } from "../src/react";

describe("React <LitterBox>", () => {
  it("exposes poop/scoop via ref and fires onPoop", () => {
    const ref = createRef<LitterBoxHandle>();
    const onPoop = vi.fn();
    render(<LitterBox ref={ref} onPoop={onPoop} />);

    let id: string | null = null;
    act(() => { id = ref.current!.poop("<p>hi</p>"); });
    expect(id).toMatch(/^shit-/);
    expect(onPoop).toHaveBeenCalledWith(id);
    expect(ref.current!.list()).toEqual([id]);

    act(() => { ref.current!.scoop(id!); });
    expect(ref.current!.list()).toEqual([]);
  });

  it("tears the engine down on unmount", () => {
    const ref = createRef<LitterBoxHandle>();
    const { unmount } = render(<LitterBox ref={ref} />);
    act(() => { ref.current!.poop("x"); });
    unmount();
    expect(ref.current).toBeNull();
  });
});
