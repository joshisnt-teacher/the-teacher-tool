import { useEffect, useRef, useState } from "react";

const ATLAS_ORIGIN = import.meta.env.VITE_ATLAS_ORIGIN ?? "https://atlas.edufied.com.au";
const READY_TIMEOUT_MS = 6000;

interface AtlasDeckEmbedProps {
  atlasLessonId: string;
  slideIndex: number;
}

export function AtlasDeckEmbed({ atlasLessonId, slideIndex }: AtlasDeckEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const lastSentIndexRef = useRef(slideIndex);

  useEffect(() => {
    setStatus("loading");
    const timeout = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s));
    }, READY_TIMEOUT_MS);

    const handler = (event: MessageEvent) => {
      if (event.origin !== ATLAS_ORIGIN) return;
      if (event.data?.type === "atlas-embed:ready") {
        clearTimeout(timeout);
        setStatus("ready");
      }
    };
    window.addEventListener("message", handler);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", handler);
    };
  }, [atlasLessonId, reloadKey]);

  useEffect(() => {
    if (status !== "ready") return;
    if (lastSentIndexRef.current === slideIndex) return;
    lastSentIndexRef.current = slideIndex;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "atlas-embed:goto-slide", index: slideIndex },
      ATLAS_ORIGIN
    );
  }, [slideIndex, status]);

  if (status === "error") {
    return (
      <div className="aspect-video w-full flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 text-center text-muted-foreground">
        <p className="text-sm">Couldn't load slides — check your connection.</p>
        <button
          type="button"
          className="text-sm underline"
          onClick={() => {
            lastSentIndexRef.current = slideIndex;
            setReloadKey((k) => k + 1);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <iframe
      key={reloadKey}
      ref={iframeRef}
      src={`${ATLAS_ORIGIN}/embed/lesson/${atlasLessonId}?slide=${slideIndex}`}
      title="Lesson slide"
      className="aspect-video w-full rounded-xl border-0"
    />
  );
}
