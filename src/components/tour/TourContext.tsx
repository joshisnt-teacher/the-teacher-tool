import { createContext, useContext } from "react";
import type { TourStep, TourState } from "./types";

export interface TourRuntimeValue {
  steps: readonly TourStep[];
  state: TourState;
  advanceToStep: (id: string) => void;
  next: () => void;
  prev: () => void;
  dismiss: () => void;
  resume: () => void;
  updateContext: (patch: Record<string, unknown>) => void;
}

const TourContext = createContext<TourRuntimeValue | null>(null);

export function useTourRuntime(): TourRuntimeValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTourRuntime must be inside <TourProvider>");
  return ctx;
}

export { TourContext };
