export interface TourStep {
  id: string;
  target: string;
  title?: string;
  body: string;
  position: "top" | "bottom" | "left" | "right";
  mode: "directed" | "reflective";
  route?: string;
  advanceWhen?: (state: TourState) => boolean;
  advanceOn?: {
    event: string;
    predicate?: (detail: Record<string, unknown>, state: TourState) => boolean;
  };
}

export interface TourState {
  stepIndex: number;
  hidden: boolean;
  done: boolean;
  context: Record<string, unknown>;
}
