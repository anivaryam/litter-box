import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { CSSProperties } from "react";
import { LitterBox as Engine, type PoopOptions } from "./core";

export interface LitterBoxHandle {
  poop(html: string, opts?: PoopOptions): string | null;
  scoop(id: string): boolean;
  scoopAll(): void;
  list(): string[];
}

export interface LitterBoxProps {
  max?: number;
  className?: string;
  style?: CSSProperties;
  onPoop?: (id: string) => void;
  onScoop?: (id: string) => void;
  onFull?: () => void;
}

export const LitterBox = forwardRef<LitterBoxHandle, LitterBoxProps>(
  function LitterBox({ max = 4, className, style, onPoop, onScoop, onFull }, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const engineRef = useRef<Engine | null>(null);
    const cbs = useRef({ onPoop, onScoop, onFull });
    cbs.current = { onPoop, onScoop, onFull };

    useEffect(() => {
      const host = hostRef.current!;
      const engine = new Engine(host, { max });
      engineRef.current = engine;

      const onP = (e: Event) => cbs.current.onPoop?.((e as CustomEvent).detail.id);
      const onS = (e: Event) => cbs.current.onScoop?.((e as CustomEvent).detail.id);
      const onF = () => cbs.current.onFull?.();
      host.addEventListener("litter:poop", onP);
      host.addEventListener("litter:scoop", onS);
      host.addEventListener("litter:full", onF);

      return () => {
        host.removeEventListener("litter:poop", onP);
        host.removeEventListener("litter:scoop", onS);
        host.removeEventListener("litter:full", onF);
        engine.destroy();
        engineRef.current = null;
      };
    }, [max]);

    useImperativeHandle(ref, (): LitterBoxHandle => ({
      poop: (html, opts) => engineRef.current?.poop(html, opts) ?? null,
      scoop: (id) => engineRef.current?.scoop(id) ?? false,
      scoopAll: () => engineRef.current?.scoopAll(),
      list: () => engineRef.current?.list() ?? [],
    }));

    return <div ref={hostRef} className={className} style={style} />;
  },
);
