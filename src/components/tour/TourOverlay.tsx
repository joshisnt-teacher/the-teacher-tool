import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useTourRuntime } from "./TourContext";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 6;
const TOOLTIP_W = 340;
const TOOLTIP_OFFSET = 14;

function getTargetRect(targetId: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tutorial="${targetId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

function isInViewport(r: Rect): boolean {
  return (
    r.top + r.height > 0 &&
    r.left + r.width > 0 &&
    r.top < window.innerHeight &&
    r.left < window.innerWidth
  );
}

export function TourOverlay() {
  const rt = useTourRuntime();
  const { steps, state, next, prev, dismiss } = rt;
  const step = steps[state.stepIndex];
  const isComplete = state.done || state.stepIndex >= steps.length;
  const hidden = state.hidden;

  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScrolledFor = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (isComplete || hidden || !step) return;
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      const r = getTargetRect(step.target);
      setRect((prev) => {
        if (!r && !prev) return prev;
        if (!r || !prev) return r;
        if (
          Math.abs(prev.top - r.top) < 0.5 &&
          Math.abs(prev.left - r.left) < 0.5 &&
          Math.abs(prev.width - r.width) < 0.5 &&
          Math.abs(prev.height - r.height) < 0.5
        ) {
          return prev;
        }
        return r;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [step, isComplete, hidden]);

  useEffect(() => {
    if (isComplete || hidden || !step) return;
    if (lastScrolledFor.current === step.id) return;
    const el = document.querySelector<HTMLElement>(`[data-tutorial="${step.target}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const visible =
      r.top >= 0 &&
      r.left >= 0 &&
      r.bottom <= window.innerHeight &&
      r.right <= window.innerWidth;
    if (!visible) el.scrollIntoView({ block: "center", behavior: "smooth" });
    lastScrolledFor.current = step.id;
  }, [step, isComplete, hidden]);

  if (isComplete || hidden || !step) return null;
  if (typeof document === "undefined") return null;

  const canGoBack = state.stepIndex > 0;
  const targetVisible = !!rect && isInViewport(rect);

  let tooltipStyle: React.CSSProperties;
  if (rect && targetVisible) {
    switch (step.position) {
      case "right":
        tooltipStyle = { top: rect.top, left: rect.left + rect.width + TOOLTIP_OFFSET, width: TOOLTIP_W };
        break;
      case "left":
        tooltipStyle = { top: rect.top, left: rect.left - TOOLTIP_W - TOOLTIP_OFFSET, width: TOOLTIP_W };
        break;
      case "top":
        tooltipStyle = { top: rect.top - TOOLTIP_OFFSET, left: rect.left, width: TOOLTIP_W, transform: "translateY(-100%)" };
        break;
      case "bottom":
      default:
        tooltipStyle = { top: rect.top + rect.height + TOOLTIP_OFFSET, left: rect.left, width: TOOLTIP_W };
        break;
    }
    if (typeof tooltipStyle.left === "number") {
      tooltipStyle.left = Math.max(8, Math.min(tooltipStyle.left, window.innerWidth - TOOLTIP_W - 8));
    }
    if (typeof tooltipStyle.top === "number") {
      tooltipStyle.top = Math.max(8, Math.min(tooltipStyle.top, window.innerHeight - 220));
    }
  } else {
    tooltipStyle = { bottom: 88, right: 16, width: TOOLTIP_W };
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-40">
      <div
        className={cn(
          "pointer-events-auto absolute z-[60] rounded-xl border border-primary/30 bg-popover p-4 text-popover-foreground shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-150"
        )}
        style={{ ...tooltipStyle, borderTop: "3px solid hsl(var(--primary))" }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            Step {state.stepIndex + 1} of {steps.length}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            {step.mode}
          </span>
          <button
            onClick={dismiss}
            aria-label="Hide tour"
            className="ml-auto -mr-1 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {step.title && <h4 className="mb-1 text-sm font-semibold">{step.title}</h4>}
        <p className="text-sm leading-relaxed">{step.body}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <Button size="sm" variant="ghost" onClick={prev} disabled={!canGoBack}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          {step.mode === "directed" && (
            <p className="flex-1 text-center text-xs italic text-muted-foreground">
              {targetVisible
                ? "Complete the highlighted action to continue."
                : "Find the highlighted area to continue."}
            </p>
          )}
          <Button size="sm" onClick={next}>
            {state.stepIndex === steps.length - 1 ? "Finish" : "Next"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
