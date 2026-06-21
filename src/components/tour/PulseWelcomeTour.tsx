import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TourProvider } from "./TourProvider";
import { TourEngine } from "./TourEngine";
import { TourOverlay } from "./TourOverlay";
import { PULSE_TOUR_STEPS } from "./pulse-tour-steps";
import { useMarkToolWelcomeSeen } from "@/hooks/useMarkToolWelcomeSeen";

const APP_SLUG = "pulse";

export function PulseWelcomeTour() {
  const [searchParams, setSearchParams] = useSearchParams();
  const welcome = searchParams.get("welcome") === "1";
  const [started, setStarted] = useState(false);
  const markSeen = useMarkToolWelcomeSeen();

  useEffect(() => {
    if (welcome) {
      // Remove the flag from the URL so a refresh doesn't restart the tour.
      const next = new URLSearchParams(searchParams);
      next.delete("welcome");
      setSearchParams(next, { replace: true });
      setStarted(true);
    }
  }, [welcome, searchParams, setSearchParams]);

  const handleDone = () => {
    markSeen.mutate(APP_SLUG);
  };

  if (!started) return null;

  return (
    <TourProvider
      steps={PULSE_TOUR_STEPS}
      onComplete={handleDone}
      onDismiss={handleDone}
    >
      <TourEngine />
      <TourOverlay />
    </TourProvider>
  );
}
