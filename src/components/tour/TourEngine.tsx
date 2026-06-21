import { useEffect, useRef } from "react";
import { useTourRuntime } from "./TourContext";

export function TourEngine() {
  const { steps, state, next } = useTourRuntime();
  const step = steps[state.stepIndex];
  const isComplete = state.done || state.stepIndex >= steps.length;

  const maxReachedRef = useRef(state.stepIndex);
  useEffect(() => {
    if (state.stepIndex > maxReachedRef.current) {
      maxReachedRef.current = state.stepIndex;
    }
  }, [state.stepIndex]);

  const isBackNav = state.stepIndex < maxReachedRef.current;

  useEffect(() => {
    if (isComplete || !step || step.mode !== "directed" || !step.advanceWhen) return;
    if (isBackNav) return;
    if (step.advanceWhen(state)) {
      const nextStep = steps[state.stepIndex + 1];
      if (nextStep) next();
    }
  }, [isComplete, step, state, isBackNav, next, steps]);

  useEffect(() => {
    if (isComplete || !step || !step.advanceOn) return;
    const { event, predicate } = step.advanceOn;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      const ok = predicate ? predicate(detail, state) : true;
      if (ok) {
        const nextStep = steps[state.stepIndex + 1];
        if (nextStep) next();
      }
    };
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [isComplete, step, state, next, steps]);

  return null;
}
