import type { TourStep } from "./types";

export const PULSE_TOUR_STEPS: TourStep[] = [
  {
    id: "create-class",
    target: "dashboard-create-class",
    title: "Create your first class",
    body:
      "Every class in Pulse keeps its own students, lessons, exit tickets and results. Start by creating a class.",
    position: "bottom",
    mode: "directed",
    route: "/dashboard",
    advanceOn: { event: "pulse:class-created" },
  },
  {
    id: "run-exit-ticket",
    target: "nav-exit-tickets",
    title: "Run an exit ticket",
    body:
      "Exit tickets take 30 seconds to launch and show you who understood the lesson. Head to Exit Tickets to build one.",
    position: "right",
    mode: "directed",
    route: "/exit-tickets",
    advanceOn: { event: "pulse:exit-ticket-deployed" },
  },
  {
    id: "view-results",
    target: "exit-tickets-results-link",
    title: "View the results",
    body:
      "Once students respond, open Results to see class averages, hardest questions and individual responses.",
    position: "bottom",
    mode: "reflective",
    route: "/exit-tickets",
  },
];
