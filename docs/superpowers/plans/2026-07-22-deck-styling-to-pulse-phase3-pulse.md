# Deck Styling → Pulse, Phase 3 (Pulse side) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Atlas-sourced lessons in Pulse render through Atlas's own styled slide renderer (via the `/embed/lesson/:lessonId` iframe from the Atlas-side plan) instead of Pulse's plain generic slide viewer, with zero change for manually-created (non-Atlas) lessons.

**Architecture:** One new component (`AtlasDeckEmbed`) wraps the iframe + postMessage navigation + error/retry handling. `useLessonTemplateContent` exposes the already-existing `atlas_lesson_id` column. The three places that currently render `<SlideViewer>` each get a one-line conditional: Atlas lesson → `AtlasDeckEmbed`, manual lesson → unchanged `SlideViewer`.

**Tech Stack:** React 18 + TypeScript, TanStack React Query, Vite env vars.

## Global Constraints

- **Depends on the Atlas-side plan** (`docs/superpowers/plans/2026-07-22-deck-styling-to-pulse-phase3-atlas.md` in the Atlas repo) being deployed — `AtlasDeckEmbed` points at `/embed/lesson/:lessonId` and `/api/embed-lesson-deck`, which don't exist until that plan ships. This plan's code can be written and type-checked independently, but end-to-end verification needs the Atlas side live.
- `postMessage` calls (both directions) must check `event.origin` against the configured Atlas origin before trusting `event.data`.
- No database or edge-function changes in this plan — `atlas_lesson_id` is already a column on `lesson_templates` (added long before this project) and `atlas-import` already populates it on every sync.
- Manually-created (non-Atlas) lessons have no `atlas_lesson_id` and must keep rendering through today's `SlideViewer`/`ContentBlockRenderer` path, completely unchanged.

---

## Task 1: `AtlasDeckEmbed` component

**Files:**
- Create: `src/components/lesson/AtlasDeckEmbed.tsx`
- Modify: `env.example`

**Interfaces:**
- Produces: `AtlasDeckEmbed({ atlasLessonId, slideIndex }: { atlasLessonId: string; slideIndex: number })` — a drop-in replacement for `<SlideViewer slide={...} />` wherever the lesson is Atlas-sourced. Same `aspect-video w-full` sizing convention as `SlideViewer` so callers don't need extra wrapper styling.

- [ ] **Step 1: Create the component**

Create `src/components/lesson/AtlasDeckEmbed.tsx`:

```tsx
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
```

- [ ] **Step 2: Document the env var**

In `env.example`, add:

```
# Atlas origin, used to embed styled Atlas-sourced lesson slides via iframe
VITE_ATLAS_ORIGIN=https://atlas.edufied.com.au
```

- [ ] **Step 3: Verify**

Run `npx tsc --noEmit -p tsconfig.app.json` and confirm no errors in `src/components/lesson/AtlasDeckEmbed.tsx`.

Full behavioral verification (does it actually load, does postMessage navigation work, does the timeout/retry work) needs the Atlas-side plan deployed — defer to Task 2's end-to-end verification once both sides are live.

- [ ] **Step 4: Commit**

```bash
git add src/components/lesson/AtlasDeckEmbed.tsx env.example
git commit -m "feat: add AtlasDeckEmbed component for iframe-embedding Atlas's styled slide renderer"
```

---

## Task 2: Wire it into the three slide-render sites

**Files:**
- Modify: `src/hooks/useLessonTemplateContent.ts`
- Modify: `src/components/classroom/LessonPresenter.tsx`
- Modify: `src/pages/ClassroomPresenter.tsx`
- Modify: `src/pages/StudentLesson.tsx`

**Interfaces:**
- Consumes: `AtlasDeckEmbed` (Task 1).
- Produces: `LessonTemplateContent` gains `atlasLessonId: string | null`.

- [ ] **Step 1: Expose `atlasLessonId` from the hook**

In `src/hooks/useLessonTemplateContent.ts`, find:

```ts
export interface LessonTemplateContent {
  title: string;
  description: string | null;
  learningIntentions: string[];
  successCriteria: string[];
  slides: LessonSlide[];
  resources: LessonResource[];
}
```

Replace with:

```ts
export interface LessonTemplateContent {
  title: string;
  description: string | null;
  learningIntentions: string[];
  successCriteria: string[];
  slides: LessonSlide[];
  resources: LessonResource[];
  atlasLessonId: string | null;
}
```

Find:

```ts
        (supabase.from("lesson_templates") as any)
          .select("title, description, learning_intentions, success_criteria, resources")
          .eq("id", lessonTemplateId)
          .maybeSingle(),
```

Replace with:

```ts
        (supabase.from("lesson_templates") as any)
          .select("title, description, learning_intentions, success_criteria, resources, atlas_lesson_id")
          .eq("id", lessonTemplateId)
          .maybeSingle(),
```

Find:

```ts
      return {
        title: templateResult.data?.title ?? "",
        description: templateResult.data?.description ?? null,
        learningIntentions: ((templateResult.data?.learning_intentions as unknown) as string[]) ?? [],
        successCriteria: ((templateResult.data?.success_criteria as unknown) as string[]) ?? [],
        slides,
        resources,
      };
```

Replace with:

```ts
      return {
        title: templateResult.data?.title ?? "",
        description: templateResult.data?.description ?? null,
        learningIntentions: ((templateResult.data?.learning_intentions as unknown) as string[]) ?? [],
        successCriteria: ((templateResult.data?.success_criteria as unknown) as string[]) ?? [],
        slides,
        resources,
        atlasLessonId: templateResult.data?.atlas_lesson_id ?? null,
      };
```

- [ ] **Step 2: Wire into `LessonPresenter.tsx`**

In `src/components/classroom/LessonPresenter.tsx`, find:

```tsx
import { SlideViewer } from "@/components/lesson/SlideViewer";
import { LessonResourcesList } from "@/components/lesson/LessonResourcesList";
```

Replace with:

```tsx
import { SlideViewer } from "@/components/lesson/SlideViewer";
import { AtlasDeckEmbed } from "@/components/lesson/AtlasDeckEmbed";
import { LessonResourcesList } from "@/components/lesson/LessonResourcesList";
```

Find:

```tsx
              {currentSlide && <SlideViewer slide={currentSlide} />}
```

Replace with:

```tsx
              {currentSlide && (
                data?.atlasLessonId ? (
                  <AtlasDeckEmbed atlasLessonId={data.atlasLessonId} slideIndex={currentIndex} />
                ) : (
                  <SlideViewer slide={currentSlide} />
                )
              )}
```

- [ ] **Step 3: Wire into `ClassroomPresenter.tsx`**

In `src/pages/ClassroomPresenter.tsx`, find:

```tsx
import { SlideViewer } from "@/components/lesson/SlideViewer";
```

Replace with:

```tsx
import { SlideViewer } from "@/components/lesson/SlideViewer";
import { AtlasDeckEmbed } from "@/components/lesson/AtlasDeckEmbed";
```

Find:

```tsx
      <div className="flex-1 min-h-0 p-8 flex items-center justify-center overflow-y-auto">
        {currentSlide ? (
          <div className="w-full max-w-6xl">
            <SlideViewer slide={currentSlide} />
          </div>
        ) : (
          <p className="text-muted-foreground">No slides in this lesson.</p>
        )}
      </div>
```

Replace with:

```tsx
      <div className="flex-1 min-h-0 p-8 flex items-center justify-center overflow-y-auto">
        {currentSlide ? (
          <div className="w-full max-w-6xl">
            {content?.atlasLessonId ? (
              <AtlasDeckEmbed atlasLessonId={content.atlasLessonId} slideIndex={slideIndex} />
            ) : (
              <SlideViewer slide={currentSlide} />
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">No slides in this lesson.</p>
        )}
      </div>
```

- [ ] **Step 4: Wire into `StudentLesson.tsx`**

In `src/pages/StudentLesson.tsx`, find:

```tsx
import { SlideViewer } from "@/components/lesson/SlideViewer";
```

Replace with:

```tsx
import { SlideViewer } from "@/components/lesson/SlideViewer";
import { AtlasDeckEmbed } from "@/components/lesson/AtlasDeckEmbed";
```

Find:

```tsx
      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        {currentSlide ? (
          <SlideViewer slide={currentSlide} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Waiting for the teacher to start…
          </div>
        )}
      </div>
```

Replace with:

```tsx
      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        {currentSlide ? (
          content?.atlasLessonId ? (
            <AtlasDeckEmbed atlasLessonId={content.atlasLessonId} slideIndex={viewIndex ?? 0} />
          ) : (
            <SlideViewer slide={currentSlide} />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Waiting for the teacher to start…
          </div>
        )}
      </div>
```

- [ ] **Step 5: Verify**

Run `npm run build` (typecheck + Vite build) and confirm it passes clean.

Full behavioral verification needs the Atlas-side plan deployed:
- Open the Classroom page for an Atlas-sourced lesson with an active session; confirm the (expanded) slide deck card shows Atlas's styled rendering.
- Click through Prev/Next repeatedly; confirm each click updates the iframe's slide with no visible flash/reload.
- Open the presenter window (`/classroom/:classId/present/:sessionId`); confirm slides render styled there too, and arrow-key navigation still works (it drives `slideIndex` state exactly as before — only the rendering swapped).
- Open `/lesson/:sessionId` (student view) in a second browser/incognito window; confirm it renders styled and stays in sync as the teacher advances slides.
- Confirm a manually-created (non-Atlas) lesson still renders via the plain `SlideViewer` at all three sites, completely unaffected.
- Temporarily point `VITE_ATLAS_ORIGIN` at an unreachable URL (or block it in devtools) and confirm the error/retry state appears after ~6 seconds instead of a blank iframe forever.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useLessonTemplateContent.ts src/components/classroom/LessonPresenter.tsx src/pages/ClassroomPresenter.tsx src/pages/StudentLesson.tsx
git commit -m "feat: render Atlas-sourced lesson slides via AtlasDeckEmbed instead of the plain slide viewer"
```
