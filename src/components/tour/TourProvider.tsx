import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { TourContext, type TourRuntimeValue } from "./TourContext";
import type { TourStep, TourState } from "./types";

interface TourProviderProps {
  steps: TourStep[];
  initialState?: Partial<TourState>;
  onComplete?: () => void;
  onDismiss?: () => void;
  children: ReactNode;
}

export function TourProvider({ steps, initialState, onComplete, onDismiss, children }: TourProviderProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<TourState>({
    stepIndex: 0,
    hidden: false,
    done: false,
    context: {},
    ...initialState,
  });

  const advanceToStep = useCallback(
    (id: string) => {
      const idx = steps.findIndex((s) => s.id === id);
      if (idx < 0) return;
      setState((prev) => ({ ...prev, stepIndex: idx, hidden: false }));
    },
    [steps]
  );

  const next = useCallback(() => {
    if (state.stepIndex >= steps.length - 1) {
      setState((prev) => ({ ...prev, done: true, hidden: true }));
      onComplete?.();
      return;
    }
    advanceToStep(steps[state.stepIndex + 1].id);
  }, [advanceToStep, onComplete, state.stepIndex, steps]);

  const prev = useCallback(() => {
    if (state.stepIndex <= 0) return;
    advanceToStep(steps[state.stepIndex - 1].id);
  }, [advanceToStep, state.stepIndex, steps]);

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, hidden: true }));
    onDismiss?.();
  }, [onDismiss]);

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, hidden: false }));
  }, []);

  const updateContext = useCallback((patch: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, context: { ...prev.context, ...patch } }));
  }, []);

  const lastRoutedStep = useRef<string | null>(null);
  const currentStep = steps[state.stepIndex];
  if (currentStep?.route && lastRoutedStep.current !== currentStep.id) {
    lastRoutedStep.current = currentStep.id;
    navigate(currentStep.route);
  }

  const value = useMemo<TourRuntimeValue>(
    () => ({
      steps,
      state,
      advanceToStep,
      next,
      prev,
      dismiss,
      resume,
      updateContext,
    }),
    [steps, state, advanceToStep, next, prev, dismiss, resume, updateContext]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
