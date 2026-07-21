# Classroom Page Declutter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Declutter the Pulse Classroom live-lesson dashboard (`/classroom/:classId`) so it reads as a calm single-screen view during a lesson, without removing any existing capability.

**Architecture:** Five largely independent file-level changes: (1) a new routed teacher presenter page that replaces the fragile popup-window presentation mechanism, (2) `LessonPresenter` becomes a collapsible summary card that launches the new page, (3) `Classroom.tsx` loses its Theme Settings / Resources / live Session Notes cards (theme moves to a header popover, notes move into the End Lesson dialog), (4) `StudentGrid` tiles collapse from 4 live buttons to badges + one unified tabbed action dialog (Note / Strike / Commend / Leave Room, replacing the toilet-specific flow), (5) the three sidebar tool cards (Timer, Name Picker, Group Assigner) get tighter padding/sizing so all three fit without a long scroll.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui (Card, Dialog, Tabs, Popover, Badge, Button), TanStack React Query, React Router v6, Supabase (Postgres + Realtime broadcast).

## Global Constraints

- No test runner is configured in this repo (per `CLAUDE.md`) — every task's verification step is a manual check in the running dev server (`npm run dev`, port 8080), not an automated test.
- Follow existing patterns exactly: hooks in `src/hooks/`, one page per route in `src/pages/`, shadcn/ui primitives from `src/components/ui/`, feature components under `src/components/classroom/`.
- Every new/changed teacher-facing route must stay behind `ProtectedRoute` (existing component, unchanged).
- New leave-room notes must be saved with `category: "Left Room"` exactly. Existing historical notes with `category: "Toilet"` are left untouched — nothing else in the codebase reads that string, confirmed via repo-wide search.
- Run `npm run lint` after each task and fix any new warnings/errors it reports (unused imports especially — several edits remove the only usage of an icon import).

---

## Task 1: Presenter page — new route

**Files:**
- Create: `src/pages/ClassroomPresenter.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: route `/classroom/:classId/present/:sessionId`, rendering full-bleed (no `AppSidebar` chrome), protected by `ProtectedRoute`. Later tasks (Task 2) link to this route via `window.open`.
- Consumes: `useLessonTemplateContent(lessonTemplateId)` from `src/hooks/useLessonTemplateContent.ts` (returns `{ title, slides: LessonSlide[], ... }`), `useUpdateCurrentSlide()` and its mutate shape `{ sessionId: string; slideIndex: number; classId: string }` from `src/hooks/useClassSessions.tsx`, `useClassSessionRealtime(sessionId)` returning `{ sendSlideChange(index), onSlideChange(handler) }` from `src/hooks/useClassSessionRealtime.ts`, `SlideViewer` from `src/components/lesson/SlideViewer.tsx` (`{ slide: LessonSlide }`), `supabase` client from `src/integrations/supabase/client`.

### What to build

A teacher-facing page, modeled on the existing student-facing `src/pages/StudentLesson.tsx` (which already proves this "fetch session + subscribe to realtime + render current slide" pattern works for `/lesson/:sessionId`). Differences from `StudentLesson.tsx`: no student-session auth check (this route already sits behind `ProtectedRoute`), and it can *write* the current slide index (Prev/Next/keyboard), not just follow it.

- [ ] **Step 1: Create the presenter page**

Create `src/pages/ClassroomPresenter.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLessonTemplateContent } from "@/hooks/useLessonTemplateContent";
import { useUpdateCurrentSlide } from "@/hooks/useClassSessions";
import { useClassSessionRealtime } from "@/hooks/useClassSessionRealtime";
import { SlideViewer } from "@/components/lesson/SlideViewer";

export default function ClassroomPresenter() {
  const { sessionId } = useParams<{ classId: string; sessionId: string }>();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["presenter-session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("id, class_id, lesson_template_id, current_slide_index, ended_at")
        .eq("id", sessionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: content, isLoading: contentLoading } = useLessonTemplateContent(
    session?.lesson_template_id ?? null
  );
  const slides = content?.slides ?? [];

  const [slideIndex, setSlideIndex] = useState<number | null>(null);

  useEffect(() => {
    if (session && slideIndex === null) {
      setSlideIndex(session.current_slide_index ?? 0);
    }
  }, [session, slideIndex]);

  const realtime = useClassSessionRealtime(sessionId ?? "");
  useEffect(() => {
    return realtime.onSlideChange((index) => setSlideIndex(index));
  }, [realtime]);

  const updateSlide = useUpdateCurrentSlide();

  const goToSlide = useCallback(
    (index: number) => {
      if (!session || index < 0 || index >= slides.length) return;
      setSlideIndex(index);
      updateSlide.mutate({ sessionId: session.id, slideIndex: index, classId: session.class_id });
      realtime.sendSlideChange(index);
    },
    [session, slides.length, updateSlide, realtime]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slideIndex === null) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToSlide(slideIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSlide(slideIndex - 1);
      } else if (e.key === "Escape") {
        window.close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slideIndex, goToSlide]);

  if (sessionLoading || contentLoading || slideIndex === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading presentation…
      </div>
    );
  }

  if (!session || session.ended_at) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 text-center px-4 bg-background">
        <p className="text-lg font-medium">This lesson isn't active anymore.</p>
        <Button onClick={() => window.close()}>Close Window</Button>
      </div>
    );
  }

  const currentSlide = slides[slideIndex];

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-sm text-muted-foreground truncate">{content?.title}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.close()}
          title="Close presentation"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 p-8 flex items-center justify-center overflow-y-auto">
        {currentSlide ? (
          <div className="w-full max-w-6xl">
            <SlideViewer slide={currentSlide} />
          </div>
        ) : (
          <p className="text-muted-foreground">No slides in this lesson.</p>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t">
        <Button variant="outline" onClick={() => goToSlide(slideIndex - 1)} disabled={slideIndex === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          {slideIndex + 1} / {slides.length}
        </span>
        <Button
          variant="outline"
          onClick={() => goToSlide(slideIndex + 1)}
          disabled={slideIndex >= slides.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Import the page and add the route in `App.tsx`**

In `src/App.tsx`, add the import next to the other page imports (after `import StudentLesson from "./pages/StudentLesson";`):

```tsx
import StudentLesson from "./pages/StudentLesson";
import ClassroomPresenter from "./pages/ClassroomPresenter";
import Lessons from "./pages/Lessons";
```

Add a `PAGE_TITLES` entry (in the array starting at line 46), right after the `/classroom/:classId` entry:

```tsx
  { path: "/classroom/:classId", title: "Classroom" },
  { path: "/classroom/:classId/present/:sessionId", title: "Presenting" },
  { path: "/classroom", title: "Classroom" },
```

- [ ] **Step 3: Render it without the app sidebar**

In `AppLayout` (`src/App.tsx`), the page renders full-bleed (no `AppSidebar`/header chrome) like the student-facing pages. Find:

```tsx
  // Public student pages (no sidebar)
  const isStudentPage =
    currentPath === "/join" ||
    currentPath.startsWith("/exit-ticket/") ||
    currentPath.startsWith("/auth/sso") ||
    currentPath.startsWith("/student/") ||
    currentPath.startsWith("/lesson/");

  if (isAuthPage || isSpinnerPage || isStudentPage) {
    return <><PageTitle />{children}</>;
  }
```

Replace with:

```tsx
  // Public student pages (no sidebar)
  const isStudentPage =
    currentPath === "/join" ||
    currentPath.startsWith("/exit-ticket/") ||
    currentPath.startsWith("/auth/sso") ||
    currentPath.startsWith("/student/") ||
    currentPath.startsWith("/lesson/");

  // Presenter page pops out into its own window — full-bleed, no sidebar,
  // but still behind ProtectedRoute below (unlike the public student pages above)
  const isPresenterPage = currentPath.includes("/present/");

  if (isAuthPage || isSpinnerPage || isStudentPage || isPresenterPage) {
    return <><PageTitle />{children}</>;
  }
```

- [ ] **Step 4: Add the `<Route>`**

In `src/App.tsx`, find the existing `/classroom/:classId` route:

```tsx
              <Route 
                path="/classroom/:classId" 
                element={
                  <ProtectedRoute>
                    <Classroom />
                  </ProtectedRoute>
                } 
              />
```

Add a new route immediately after it:

```tsx
              <Route 
                path="/classroom/:classId" 
                element={
                  <ProtectedRoute>
                    <Classroom />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/classroom/:classId/present/:sessionId" 
                element={
                  <ProtectedRoute>
                    <ClassroomPresenter />
                  </ProtectedRoute>
                } 
              />
```

- [ ] **Step 5: Verify in the browser**

Run `npm run dev`, log in as a teacher, start a structured lesson (one sourced from an Atlas lesson template with slides) on a class, then manually navigate the browser to `/classroom/<that classId>/present/<the session id from the Classroom page URL or network tab>`. Confirm:
- Page renders full-bleed, no app sidebar, showing the first slide.
- Prev/Next buttons work; disabled at the first/last slide.
- Left/Right arrow keys and spacebar also navigate.
- Going to `/classroom/<classId>` in another tab shows the slide-position dot strip (still driven by the old `LessonPresenter` at this point — Task 2 rewires it) updating to match if you advance slides from the presenter tab, confirming the realtime broadcast + DB write both work.

- [ ] **Step 6: Commit**

```bash
git add src/pages/ClassroomPresenter.tsx src/App.tsx
git commit -m "feat: add dedicated classroom presenter route"
```

---

## Task 2: Slide deck card — collapse + launch the presenter route

**Files:**
- Modify: `src/components/classroom/LessonPresenter.tsx`
- Delete: `src/components/classroom/PresentationWindow.tsx`

**Interfaces:**
- Consumes: route from Task 1 (`/classroom/:classId/present/:sessionId`).
- No change to `LessonPresenter`'s own props (`{ session: { id, class_id, lesson_template_id, current_slide_index } }`) — `Classroom.tsx` keeps calling it exactly as today.

### What to change

Replace the `isPresenting` + `PresentationWindow` portal mechanism with a collapsed/expanded summary card whose "Launch Presentation" button opens the new routed page in a real new browser window (draggable to a projector, independently fullscreen-able).

- [ ] **Step 1: Rewrite `LessonPresenter.tsx`**

Replace the entire contents of `src/components/classroom/LessonPresenter.tsx` with:

```tsx
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SlideViewer } from "@/components/lesson/SlideViewer";
import { LessonResourcesList } from "@/components/lesson/LessonResourcesList";
import { useLessonTemplateContent } from "@/hooks/useLessonTemplateContent";
import { useUpdateCurrentSlide } from "@/hooks/useClassSessions";
import { useClassSessionRealtime } from "@/hooks/useClassSessionRealtime";

interface Props {
  session: {
    id: string;
    class_id: string;
    lesson_template_id: string;
    current_slide_index: number | null;
  };
}

export function LessonPresenter({ session }: Props) {
  const { data, isLoading } = useLessonTemplateContent(session.lesson_template_id);
  const updateSlide = useUpdateCurrentSlide();
  const realtime = useClassSessionRealtime(session.id);
  const [isExpanded, setIsExpanded] = useState(false);

  const slides = data?.slides ?? [];
  const resources = data?.resources ?? [];
  const currentIndex = Math.min(session.current_slide_index ?? 0, Math.max(slides.length - 1, 0));
  const currentSlide = slides[currentIndex];

  const goToSlide = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    updateSlide.mutate({ sessionId: session.id, slideIndex: index, classId: session.class_id });
    realtime.sendSlideChange(index);
  };

  const launchPresentation = () => {
    const url = `/classroom/${session.class_id}/present/${session.id}`;
    const width = window.screen.availWidth;
    const height = window.screen.availHeight;
    window.open(url, "lesson-presentation", `width=${width},height=${height},left=0,top=0`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading lesson…</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {slides.length > 0 && (
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setIsExpanded((v) => !v)}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5" />
                  {data?.title || "Slides"}
                </CardTitle>
                <CardDescription>{slides.length} slides</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    launchPresentation();
                  }}
                >
                  <Monitor className="w-4 h-4 mr-1.5" />
                  Launch Presentation
                </Button>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>

          {isExpanded && (
            <CardContent className="space-y-3">
              <div className="flex gap-1.5 flex-wrap">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`w-7 h-7 text-xs rounded border flex items-center justify-center transition-colors ${
                      i === currentIndex
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {currentSlide && <SlideViewer slide={currentSlide} />}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => goToSlide(currentIndex - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === slides.length - 1}
                  onClick={() => goToSlide(currentIndex + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {resources.length > 0 && <LessonResourcesList resources={resources} />}
    </div>
  );
}
```

- [ ] **Step 2: Delete the now-unused popup mechanism**

```bash
git rm src/components/classroom/PresentationWindow.tsx
```

- [ ] **Step 3: Verify in the browser**

Run `npm run dev`, start a structured lesson with slides active. Confirm:
- The slide deck card shows collapsed by default: title, slide count, chevron, and a "Launch Presentation" button — no dot strip or slide preview visible yet.
- Clicking the card header (outside the button) expands it to show the dot strip + current slide + Prev/Next; clicking again collapses it.
- Clicking a dot number while expanded still jumps to that slide.
- Clicking "Launch Presentation" opens a real new browser window (has its own URL bar showing `/classroom/.../present/...`) sized to the screen, showing the current slide, with working Prev/Next inside that window (from Task 1).
- Advancing slides from inside the presenter window updates the dot strip on the main dashboard tab (open both side by side to check) via realtime.
- `npm run lint` passes with no new unused-import warnings.

- [ ] **Step 4: Commit**

```bash
git add src/components/classroom/LessonPresenter.tsx src/components/classroom/PresentationWindow.tsx
git commit -m "feat: collapse slide deck card and launch presenter route instead of popup portal"
```

---

## Task 3: Classroom.tsx — header theme popover, remove duplicate/low-value cards

**Files:**
- Modify: `src/pages/Classroom.tsx`

**Interfaces:**
- No change to `Classroom.tsx`'s own exports/props (it's a route page, no props).
- Continues to consume `colorThemes`, `selectedTheme`, `setSelectedTheme` from `useClassroomTheme()` (`src/contexts/ClassroomThemeContext.tsx`, unchanged) — just renders them in a popover instead of a full card.

### What to change

Move the 5-swatch theme picker into a small popover off a header icon button. Delete the Theme Settings card, the duplicate Resources card (slide titles already shown in the Task 2 slide deck card), and the live Session Notes card — its content moves into the End Lesson dialog instead.

- [ ] **Step 1: Update imports**

Find (line 17):

```tsx
import { Play, Square, Users, Clock, Shuffle, Users2, Settings, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
```

Replace with (drops the now-unused `Settings` icon, adds `Palette` for the new header button):

```tsx
import { Play, Square, Users, Clock, Shuffle, Users2, BookOpen, ChevronDown, ChevronUp, Palette } from "lucide-react";
```

Find (line 16):

```tsx
import { Textarea } from "@/components/ui/textarea";
```

Replace with:

```tsx
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
```

- [ ] **Step 2: Add the theme popover to the header**

Find the header block:

```tsx
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classroom</h1>
          <p className="text-gray-600">{currentClass.class_name} • {currentClass.subject}</p>
        </div>
        
        {/* Lesson Control */}
        <div className="flex items-center gap-4">
          {isLessonActive ? (
```

Replace with:

```tsx
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classroom</h1>
          <p className="text-gray-600">{currentClass.class_name} • {currentClass.subject}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title="Classroom theme">
                <Palette className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <p className="text-sm font-medium mb-3">Theme</p>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(colorThemes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTheme(key)}
                    className={cn(
                      "relative h-10 rounded-lg transition-all duration-200",
                      "bg-gradient-to-br shadow-sm border-2",
                      theme.preview,
                      selectedTheme === key
                        ? "ring-2 ring-offset-2 ring-rose-500 scale-105 border-white"
                        : "border-transparent hover:scale-105 opacity-80 hover:opacity-100"
                    )}
                    title={theme.name}
                  >
                    {selectedTheme === key && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">{colorThemes[selectedTheme]?.name}</p>
            </PopoverContent>
          </Popover>

          {/* Lesson Control */}
          {isLessonActive ? (
```

The rest of the ternary (the `isLessonActive ? (...) : (...)`) and its two closing `</div>` tags stay exactly as they are today — only the opening wrapper `<div className="flex items-center gap-4">` became `<div className="flex items-center gap-3">` with the Popover inserted before the ternary, so no further edits needed there.

- [ ] **Step 3: Remove the Theme Settings card**

Find and delete this entire block (it's now redundant with the header popover from Step 2):

```tsx
          {/* Global Theme Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                Theme Settings
              </CardTitle>
              <CardDescription>
                Choose a color theme for all classroom tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(colorThemes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTheme(key)}
                    className={cn(
                      "relative h-12 rounded-lg transition-all duration-200",
                      "bg-gradient-to-br shadow-sm border-2",
                      theme.preview,
                      selectedTheme === key
                        ? "ring-2 ring-offset-2 ring-rose-500 scale-105 border-white"
                        : "border-transparent hover:scale-105 opacity-80 hover:opacity-100"
                    )}
                    title={theme.name}
                  >
                    {selectedTheme === key && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-rose-500" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-3 text-center">
                {colorThemes[selectedTheme]?.name} theme selected
              </p>
            </CardContent>
          </Card>

          {/* Resources from Atlas Lesson */}
          {lessonTemplateContent && lessonTemplateContent.slides.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5" />
                  Resources
                </CardTitle>
                <CardDescription>
                  Slides from Atlas ({lessonTemplateContent.slides.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1">
                  {lessonTemplateContent.slides.map((slide, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-xs font-mono text-muted-foreground/60 w-5 shrink-0 text-right">
                        {i + 1}.
                      </span>
                      <span className="truncate">{slide.title || 'Untitled slide'}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          <ClassroomModules
```

Replace with just:

```tsx
          <ClassroomModules
```

(This removes both the Theme Settings card and the duplicate Resources card in one go, leaving `ClassroomModules` as the sole remaining child of the sidebar's `<div className="space-y-6">` wrapper.)

- [ ] **Step 4: Remove the live Session Notes card**

Find and delete this entire block:

```tsx
      {/* Session Notes Summary */}
      {isLessonActive && sessionNotes && sessionNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Notes ({sessionNotes.length})</CardTitle>
            <CardDescription>
              Notes taken during this lesson
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessionNotes.map((note) => (
                <div key={note.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {note.students.first_name} {note.students.last_name}
                    </span>
                    <Badge 
                      variant={note.rating >= 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {note.rating > 0 ? "+" : ""}{note.rating}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{note.note}</p>
                  <Badge variant="outline" className="text-xs">
                    {note.category}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* End Lesson Dialog */}
```

Replace with just:

```tsx
      {/* End Lesson Dialog */}
```

- [ ] **Step 5: Move notes into the End Lesson dialog**

Find:

```tsx
      <Dialog open={showEndLessonDialog} onOpenChange={setShowEndLessonDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Lesson</DialogTitle>
            <DialogDescription>
              You are about to end the lesson. Please add a title and description to save this lesson.
              <br />
              <br />
              <strong>Lesson Duration:</strong> {formatDuration(lessonDuration)}
              <br />
              <strong>Notes Taken:</strong> {sessionNotes?.length || 0}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
```

Replace with:

```tsx
      <Dialog open={showEndLessonDialog} onOpenChange={setShowEndLessonDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>End Lesson</DialogTitle>
            <DialogDescription>
              You are about to end the lesson. Please add a title and description to save this lesson.
              <br />
              <br />
              <strong>Lesson Duration:</strong> {formatDuration(lessonDuration)}
              <br />
              <strong>Notes Taken:</strong> {sessionNotes?.length || 0}
            </DialogDescription>
          </DialogHeader>

          {sessionNotes && sessionNotes.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border rounded-lg p-3 bg-muted/30">
              {sessionNotes.map((note) => (
                <div key={note.id} className="text-sm border-b last:border-b-0 pb-2 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {note.students.first_name} {note.students.last_name}
                    </span>
                    <Badge variant={note.rating >= 0 ? "default" : "destructive"} className="text-xs">
                      {note.rating > 0 ? "+" : ""}{note.rating}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{note.note}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
```

- [ ] **Step 6: Verify in the browser**

Run `npm run dev`, open a class's Classroom page. Confirm:
- No standalone Theme Settings or Resources card in the sidebar; sidebar shows just the tool cards below the (now-collapsed) slide deck card.
- Header shows a palette icon button; clicking it opens a popover with the 5 theme swatches, and picking one still re-themes the Timer/Name Picker/Group Assigner popup windows as before.
- No live Session Notes card appears on the page even after adding a few notes during an active lesson.
- Clicking "End Lesson" shows the notes you took in a scrollable list inside the dialog, above the title/description fields, before saving.
- `npm run lint` passes with no new unused-import warnings.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Classroom.tsx
git commit -m "feat: move theme picker to header popover, remove duplicate resources card, move session notes into end-lesson dialog"
```

---

## Task 4: Student tiles — badges + unified action dialog, Leave Room replaces Toilet

**Files:**
- Modify: `src/components/classroom/StudentGrid.tsx`

**Interfaces:**
- No change to `StudentGrid`'s props (`{ students, classSessionId, isLessonActive, selectedStudents, onSelectionChange }`) — `Classroom.tsx` keeps calling it unchanged.
- Consumes `useCreateStudentNote()` from `src/hooks/useStudentNotes.tsx` (unchanged mutation shape: `{ student_id, class_session_id, note, rating, category }`).

### What to change

This is a full-file rewrite of `StudentGrid.tsx`. Behavior preserved 1:1 except: the 4 per-tile buttons (checkbox aside) become badges, a single click opens one dialog with 4 tabs, and the toilet flow is renamed "Leave Room" with a door icon and `category: "Left Room"`.

- [ ] **Step 1: Replace the entire file**

Replace all of `src/components/classroom/StudentGrid.tsx` with:

```tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Plus, Star, DoorOpen, ThumbsUp, AlertTriangle, Settings, Trash2 } from "lucide-react";
import { useCreateStudentNote } from "@/hooks/useStudentNotes";
import { useToast } from "@/hooks/use-toast";

// --- Quick notes ---
type QuickNote = { text: string; rating: number; category: "Academic" | "Pastoral" | "Other" };

const DEFAULT_QUICK_NOTES: QuickNote[] = [
  { text: "Student correctly answered a check for understanding question.", rating: 2, category: "Academic" },
  { text: "Student was encouraging towards one of their peers.", rating: 3, category: "Pastoral" },
  { text: "Student had to move because they were disrupting peers around them.", rating: -2, category: "Pastoral" },
];

const QUICK_NOTES_KEY = "classroom_quick_notes";

function loadQuickNotes(): QuickNote[] {
  try {
    const stored = localStorage.getItem(QUICK_NOTES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_QUICK_NOTES;
}

function formatElapsed(startedAt: number): string {
  const minutes = Math.floor((Date.now() - startedAt) / 60000);
  return minutes < 1 ? "just now" : `${minutes} min`;
}

// --- Types ---
interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  email?: string | null;
}

type ActionTab = "note" | "strike" | "commend" | "leave-room";

interface StudentGridProps {
  students: Student[];
  classSessionId?: string;
  isLessonActive: boolean;
  selectedStudents: Set<string>;
  onSelectionChange: (selectedStudents: Set<string>) => void;
}

export function StudentGrid({ students, classSessionId, isLessonActive, selectedStudents, onSelectionChange }: StudentGridProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Unified action dialog
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActionTab>("note");

  // Note tab
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<"Academic" | "Pastoral" | "Other">("Academic");

  // Quick notes
  const [quickNoteOptions, setQuickNoteOptions] = useState<QuickNote[]>(loadQuickNotes);
  const [isManagingQuickNotes, setIsManagingQuickNotes] = useState(false);
  const [newQuickNoteText, setNewQuickNoteText] = useState("");
  const [newQuickNoteRating, setNewQuickNoteRating] = useState(0);
  const [newQuickNoteCategory, setNewQuickNoteCategory] = useState<"Academic" | "Pastoral" | "Other">("Academic");

  // Strike tab (per session, resets on page reload)
  const [studentStrikes, setStudentStrikes] = useState<Map<string, number>>(new Map());
  const [strikeReason, setStrikeReason] = useState("");

  // Commend tab
  const [studentCommendations, setStudentCommendations] = useState<Map<string, number>>(new Map());
  const [commendationReason, setCommendationReason] = useState("");

  // Leave Room tab
  const [studentsAway, setStudentsAway] = useState<Map<string, number>>(new Map());
  const [shownWarnings, setShownWarnings] = useState<Map<string, Set<string>>>(new Map());
  const [, forceTick] = useState(0);

  const createNoteMutation = useCreateStudentNote();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Persist quick notes to localStorage
  useEffect(() => {
    localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify(quickNoteOptions));
  }, [quickNoteOptions]);

  // Leave-room warning interval — also forces a re-render so elapsed-time
  // badges/labels stay roughly current without a separate ticking timer.
  useEffect(() => {
    if (!isLessonActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      forceTick((t) => t + 1);
      const now = Date.now();
      const twoMinutes = 2 * 60 * 1000;
      const fiveMinutes = 5 * 60 * 1000;

      studentsAway.forEach((timestamp, studentId) => {
        const elapsed = now - timestamp;
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        if (elapsed >= twoMinutes && elapsed < twoMinutes + 10000) {
          const warnings = shownWarnings.get(studentId) || new Set();
          if (!warnings.has('2min')) {
            toast({
              title: "Left Room Reminder",
              description: `${student.first_name} ${student.last_name} has been out of the room for 2 minutes.`,
              duration: 5000,
            });
            setShownWarnings(prev => {
              const newMap = new Map(prev);
              const newSet = new Set(newMap.get(studentId) || []);
              newSet.add('2min');
              newMap.set(studentId, newSet);
              return newMap;
            });
          }
        }

        if (elapsed >= fiveMinutes && elapsed < fiveMinutes + 10000) {
          const warnings = shownWarnings.get(studentId) || new Set();
          if (!warnings.has('5min')) {
            toast({
              title: "Left Room Reminder",
              description: `${student.first_name} ${student.last_name} has been out of the room for 5 minutes.`,
              duration: 5000,
            });
            setShownWarnings(prev => {
              const newMap = new Map(prev);
              const newSet = new Set(newMap.get(studentId) || []);
              newSet.add('5min');
              newMap.set(studentId, newSet);
              return newMap;
            });
          }
        }
      });
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLessonActive, studentsAway, shownWarnings, students, toast]);

  // --- Handlers ---

  const handleTileClick = (student: Student, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('[role="checkbox"]')) return;

    if (!isLessonActive || !classSessionId) {
      toast({ title: "No Active Lesson", description: "Please start a lesson before logging anything for a student.", variant: "destructive" });
      return;
    }

    setSelectedStudent(student);
    setActiveTab(studentsAway.has(student.id) ? "leave-room" : "note");
    setNote("");
    setRating(0);
    setCategory("Academic");
    setStrikeReason("");
    setCommendationReason("");
    setIsActionDialogOpen(true);
  };

  const handleActionDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedStudent(null);
      setNote("");
      setRating(0);
      setCategory("Academic");
      setStrikeReason("");
      setCommendationReason("");
    }
    setIsActionDialogOpen(open);
  };

  const handleMarkLeftRoom = () => {
    if (!selectedStudent) return;
    const newMap = new Map(studentsAway);
    newMap.set(selectedStudent.id, Date.now());
    setStudentsAway(newMap);
    setShownWarnings(prev => { const m = new Map(prev); m.delete(selectedStudent.id); return m; });
    toast({ title: "Student Left Room", description: `${selectedStudent.first_name} ${selectedStudent.last_name} has been marked as out of the room.` });
    setIsActionDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleConfirmReturn = async () => {
    if (!selectedStudent || !classSessionId) return;
    const startedAt = studentsAway.get(selectedStudent.id);
    if (!startedAt) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const duration = formatElapsed(startedAt);
    const noteText = `${selectedStudent.first_name} ${selectedStudent.last_name} left the room at ${timeString}, returned after ${duration}.`;

    try {
      await createNoteMutation.mutateAsync({
        student_id: selectedStudent.id,
        class_session_id: classSessionId,
        note: noteText,
        rating: 0,
        category: "Left Room",
      });

      const newMap = new Map(studentsAway);
      newMap.delete(selectedStudent.id);
      setStudentsAway(newMap);
      setShownWarnings(prev => { const m = new Map(prev); m.delete(selectedStudent.id); return m; });

      toast({ title: "Student Returned", description: `${selectedStudent.first_name} ${selectedStudent.last_name} has returned.` });
      setIsActionDialogOpen(false);
      setSelectedStudent(null);
    } catch {
      toast({ title: "Error", description: "Failed to save leave-room note.", variant: "destructive" });
    }
  };

  const handleConfirmStrike = async () => {
    if (!selectedStudent || !classSessionId || !strikeReason.trim()) return;
    const newCount = (studentStrikes.get(selectedStudent.id) || 0) + 1;

    try {
      await createNoteMutation.mutateAsync({
        student_id: selectedStudent.id,
        class_session_id: classSessionId,
        note: `Strike ${newCount}/3: ${strikeReason.trim()}`,
        rating: -3,
        category: "Strike",
      });

      setStudentStrikes(prev => { const m = new Map(prev); m.set(selectedStudent.id, newCount); return m; });
      toast({ title: `Strike ${newCount}/3 Added`, description: `${selectedStudent.first_name} ${selectedStudent.last_name}` });
      setIsActionDialogOpen(false);
      setSelectedStudent(null);
      setStrikeReason("");
    } catch {
      toast({ title: "Error", description: "Failed to save strike.", variant: "destructive" });
    }
  };

  const handleConfirmCommendation = async () => {
    if (!selectedStudent || !classSessionId || !commendationReason.trim()) return;

    try {
      await createNoteMutation.mutateAsync({
        student_id: selectedStudent.id,
        class_session_id: classSessionId,
        note: `Commendation: ${commendationReason.trim()}`,
        rating: 3,
        category: "Commendation",
      });

      setStudentCommendations(prev => { const m = new Map(prev); m.set(selectedStudent.id, (prev.get(selectedStudent.id) || 0) + 1); return m; });
      toast({ title: "Commendation Given", description: `${selectedStudent.first_name} ${selectedStudent.last_name} has been commended.` });
      setIsActionDialogOpen(false);
      setSelectedStudent(null);
      setCommendationReason("");
    } catch {
      toast({ title: "Error", description: "Failed to save commendation.", variant: "destructive" });
    }
  };

  const handleQuickNoteClick = (qn: QuickNote) => {
    setNote(qn.text);
    setRating(qn.rating);
    setCategory(qn.category);
  };

  const handleAddQuickNote = () => {
    if (!newQuickNoteText.trim()) return;
    setQuickNoteOptions(prev => [...prev, { text: newQuickNoteText.trim(), rating: newQuickNoteRating, category: newQuickNoteCategory }]);
    setNewQuickNoteText("");
    setNewQuickNoteRating(0);
    setNewQuickNoteCategory("Academic");
  };

  const handleRemoveQuickNote = (index: number) => {
    setQuickNoteOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckboxChange = (studentId: string, checked: boolean) => {
    const next = new Set(selectedStudents);
    if (checked) next.add(studentId); else next.delete(studentId);
    onSelectionChange(next);
  };

  const handleSaveNote = async () => {
    if (!selectedStudent || !classSessionId || !note.trim()) {
      toast({ title: "Invalid Note", description: "Please enter a note before saving.", variant: "destructive" });
      return;
    }

    try {
      await createNoteMutation.mutateAsync({
        student_id: selectedStudent.id,
        class_session_id: classSessionId,
        note: note.trim(),
        rating,
        category,
      });

      toast({ title: "Note Saved", description: `Note saved for ${selectedStudent.first_name} ${selectedStudent.last_name}.` });
      setIsActionDialogOpen(false);
      setSelectedStudent(null);
      setNote("");
      setRating(0);
      setCategory("Academic");
    } catch {
      toast({ title: "Error", description: "Failed to save note.", variant: "destructive" });
    }
  };

  const getRatingColor = (r: number) => r > 0 ? "text-green-600" : r < 0 ? "text-red-600" : "text-gray-600";

  const getRatingStars = (r: number) => {
    const abs = Math.abs(r);
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < abs ? "fill-current" : ""} ${getRatingColor(r)}`} />
    ));
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No students found in this class.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {students.map((student) => {
          const isAway = studentsAway.has(student.id);
          const strikes = studentStrikes.get(student.id) || 0;
          const commendations = studentCommendations.get(student.id) || 0;
          const atMaxStrikes = strikes >= 3;
          const awaySince = studentsAway.get(student.id);

          return (
            <Card
              key={student.id}
              className={`cursor-pointer hover:shadow-md transition-all relative ${
                isAway ? "opacity-50 bg-gray-200" :
                atMaxStrikes ? "border-red-400 bg-red-50" : ""
              }`}
              onClick={(e) => handleTileClick(student, e)}
            >
              <CardContent className="p-4 text-center">
                {/* Checkbox */}
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={(checked) => handleCheckboxChange(student.id, checked as boolean)}
                    className="bg-white/90"
                  />
                </div>

                {/* Strike / commendation badges */}
                {isLessonActive && !isAway && (strikes > 0 || commendations > 0) && (
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    {strikes > 0 && (
                      <Badge variant="destructive" className="text-xs h-5 px-1.5 gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {strikes}/3
                      </Badge>
                    )}
                    {commendations > 0 && (
                      <Badge className="text-xs h-5 px-1.5 gap-1 bg-yellow-500 hover:bg-yellow-500">
                        <ThumbsUp className="w-3 h-3" />
                        {commendations}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 mt-2 ${
                  isAway ? "bg-gray-300" : atMaxStrikes ? "bg-red-100" : "bg-gray-100"
                }`}>
                  <User className={`w-6 h-6 ${isAway ? "text-gray-500" : atMaxStrikes ? "text-red-600" : "text-gray-600"}`} />
                </div>

                <h3 className={`font-medium text-sm truncate ${isAway ? "text-gray-500" : ""}`}>
                  {student.first_name} {student.last_name}
                </h3>
                <p className={`text-xs truncate ${isAway ? "text-gray-400" : "text-gray-500"}`}>
                  {student.student_id}
                </p>

                {isAway && awaySince && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs gap-1">
                      <DoorOpen className="w-3 h-3" />
                      Left Room · {formatElapsed(awaySince)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Unified Action Dialog ── */}
      <Dialog open={isActionDialogOpen} onOpenChange={handleActionDialogClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.first_name} {selectedStudent?.last_name}</DialogTitle>
            <DialogDescription>Log a note, strike, commendation, or leave-room event for this student.</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActionTab)}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="note">Note</TabsTrigger>
              <TabsTrigger value="strike" disabled={(studentStrikes.get(selectedStudent?.id || "") || 0) >= 3}>Strike</TabsTrigger>
              <TabsTrigger value="commend">Commend</TabsTrigger>
              <TabsTrigger value="leave-room">Leave Room</TabsTrigger>
            </TabsList>

            {/* Note tab */}
            <TabsContent value="note" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Quick Notes</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1 text-xs text-gray-500"
                    onClick={() => setIsManagingQuickNotes(true)}
                  >
                    <Settings className="w-3 h-3" />
                    Manage
                  </Button>
                </div>
                <div className="space-y-2">
                  {quickNoteOptions.map((qn, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="outline"
                      className="w-full text-left justify-start h-auto py-2 px-3 text-sm whitespace-normal"
                      onClick={() => handleQuickNoteClick(qn)}
                    >
                      {qn.text}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  placeholder="Enter your note about this student..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rating (-5 to +5)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setRating(Math.max(-5, rating - 1))} disabled={rating <= -5}>-</Button>
                    <div className="flex items-center gap-1 min-w-[100px] justify-center">{getRatingStars(rating)}</div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setRating(Math.min(5, rating + 1))} disabled={rating >= 5}>+</Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{rating > 0 ? "Positive" : rating < 0 ? "Negative" : "Neutral"}</p>
                </div>

                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v: "Academic" | "Pastoral" | "Other") => setCategory(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Pastoral">Pastoral</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveNote} disabled={!note.trim() || createNoteMutation.isPending}>
                  {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Strike tab */}
            <TabsContent value="strike" className="space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-medium">
                <AlertTriangle className="w-5 h-5" />
                Strike {(studentStrikes.get(selectedStudent?.id || "") || 0) + 1}/3
              </div>
              <div>
                <Label htmlFor="strikeReason">Reason</Label>
                <Textarea
                  id="strikeReason"
                  placeholder="e.g. Repeatedly talking while teacher was explaining..."
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleConfirmStrike} disabled={!strikeReason.trim() || createNoteMutation.isPending}>
                  Add Strike
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Commend tab */}
            <TabsContent value="commend" className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-600 font-medium">
                <ThumbsUp className="w-5 h-5" />
                Give a commendation
              </div>
              <div>
                <Label htmlFor="commendationReason">Reason</Label>
                <Textarea
                  id="commendationReason"
                  placeholder="e.g. Showed excellent initiative and helped a classmate..."
                  value={commendationReason}
                  onChange={(e) => setCommendationReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                <Button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={handleConfirmCommendation}
                  disabled={!commendationReason.trim() || createNoteMutation.isPending}
                >
                  Give Commendation
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Leave Room tab */}
            <TabsContent value="leave-room" className="space-y-4">
              {selectedStudent && studentsAway.has(selectedStudent.id) ? (
                <>
                  <div className="flex items-center gap-2 text-gray-700">
                    <DoorOpen className="w-5 h-5" />
                    Out of the room for {formatElapsed(studentsAway.get(selectedStudent.id)!)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Confirm that {selectedStudent.first_name} {selectedStudent.last_name} has returned.
                  </p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmReturn} disabled={createNoteMutation.isPending}>
                      Confirm Return
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Mark {selectedStudent?.first_name} {selectedStudent?.last_name} as having left the room (toilet, office, locker, etc).
                    You'll get a reminder toast at 2 and 5 minutes.
                  </p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleMarkLeftRoom}>
                      <DoorOpen className="w-4 h-4 mr-1.5" />
                      Mark as Left Room
                    </Button>
                  </DialogFooter>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Manage Quick Notes Dialog ── */}
      <Dialog open={isManagingQuickNotes} onOpenChange={setIsManagingQuickNotes}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Quick Notes</DialogTitle>
            <DialogDescription>Add or remove quick note templates that appear in the note dialog.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {quickNoteOptions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No quick notes. Add one below.</p>
            )}
            {quickNoteOptions.map((qn, i) => (
              <div key={i} className="flex items-start gap-2 p-2 border rounded-lg bg-gray-50">
                <div className="flex-1 text-sm">{qn.text}</div>
                <Badge variant="outline" className="text-xs shrink-0">{qn.category}</Badge>
                <span className={`text-xs shrink-0 font-medium ${qn.rating > 0 ? "text-green-600" : qn.rating < 0 ? "text-red-600" : "text-gray-400"}`}>
                  {qn.rating > 0 ? "+" : ""}{qn.rating}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-600 shrink-0"
                  onClick={() => handleRemoveQuickNote(i)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <Label className="font-semibold text-sm">Add New Quick Note</Label>
            <Textarea
              placeholder="Quick note text..."
              value={newQuickNoteText}
              onChange={(e) => setNewQuickNoteText(e.target.value)}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={newQuickNoteCategory} onValueChange={(v: "Academic" | "Pastoral" | "Other") => setNewQuickNoteCategory(v)}>
                  <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Pastoral">Pastoral</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Rating ({newQuickNoteRating > 0 ? "+" : ""}{newQuickNoteRating})</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setNewQuickNoteRating(Math.max(-5, newQuickNoteRating - 1))}>-</Button>
                  <span className={`flex-1 text-center text-sm font-medium ${getRatingColor(newQuickNoteRating)}`}>
                    {newQuickNoteRating > 0 ? "+" : ""}{newQuickNoteRating}
                  </span>
                  <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setNewQuickNoteRating(Math.min(5, newQuickNoteRating + 1))}>+</Button>
                </div>
              </div>
            </div>
            <Button onClick={handleAddQuickNote} disabled={!newQuickNoteText.trim()} className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Add Quick Note
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsManagingQuickNotes(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Verify in the browser**

Run `npm run dev`, start a lesson, and for one student:
- Confirm the tile shows only avatar/name/ID/checkbox with no strike/commendation badge (both zero).
- Click the tile (not the checkbox) → dialog opens on the Note tab. Save a note; confirm the toast and that the dialog closes.
- Click the tile again, switch to the Strike tab, add a strike with a reason. Confirm the tile now shows a red "1/3" badge with no click needed to see it.
- Repeat to reach 3 strikes; confirm the Strike tab becomes disabled and the tile shows the red border/background treatment.
- Click the tile, switch to Commend tab, give a commendation with a reason. Confirm a yellow badge with count appears on the tile.
- Click the tile, switch to Leave Room tab, click "Mark as Left Room". Confirm: dialog closes, tile dims and shows a "Left Room · just now" badge with a door icon.
- Click the dimmed tile again — dialog should open directly on the Leave Room tab showing "Confirm Return" (not default to Note tab). Confirm return; confirm a note is created and the tile returns to normal.
- Wait ~2 minutes with a student marked away (or temporarily lower the interval while testing) and confirm the "Left Room Reminder" toast still fires.
- Confirm the checkbox still toggles Name Picker/Group Assigner eligibility without opening the dialog.
- Confirm "Manage" inside the Note tab still opens the quick-notes management dialog and add/remove still works.
- `npm run lint` passes with no unused-import warnings (in particular, `Toilet` import is gone, replaced by `DoorOpen`).

- [ ] **Step 3: Commit**

```bash
git add src/components/classroom/StudentGrid.tsx
git commit -m "feat: collapse student tile controls into badges + one tabbed action dialog, rename toilet tracking to leave room"
```

---

## Task 5: Compact sizing for Timer / Name Picker / Group Assigner cards

**Files:**
- Modify: `src/components/classroom/EnhancedTimer.tsx`
- Modify: `src/components/classroom/EnhancedNamePicker.tsx`
- Modify: `src/components/classroom/EnhancedGroupAssigner.tsx`

**Interfaces:**
- No prop or behavior changes to any of the three components — visual sizing only (padding, font sizes, button heights). The popup-window HTML each component generates via `window.open` + `document.write` is untouched.

### What to change

Tighten padding, font sizes, and button heights in the inline sidebar card for each of the three components so all three fit together in the sidebar without a long scroll.

- [ ] **Step 1: Compact `EnhancedTimer.tsx`**

Find the component's `return` statement (from `return (` through the closing `);` right before the final `}` of the file) and replace it with:

```tsx
  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-xl", className)}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-rose-100" />

      {/* Frosted Glass Effect Card */}
      <div className="relative backdrop-blur-sm bg-white/40 p-3 rounded-xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-600" />
            <h3 className="font-semibold text-sm text-gray-800">Timer</h3>
          </div>
        </div>

        {!isWindowOpen ? (
          <>
            {/* Timer Display */}
            <div className="relative mb-2">
              <div className="relative flex items-center justify-center py-4">
                <div className="text-4xl font-bold tracking-tight text-gray-800">
                  {formatTime(timerTime)}
                </div>
              </div>
            </div>

            {/* Quick Time Adjustments */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/60 hover:bg-white/80 shadow-sm"
                onClick={() => adjustTime(-60)}
                disabled={timerTime === 0}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-xs font-medium text-gray-600 w-14 text-center">
                1 min
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/60 hover:bg-white/80 shadow-sm"
                onClick={() => adjustTime(60)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              {presets.map((preset) => (
                <Button
                  key={preset.seconds}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-lg font-medium transition-all duration-200 text-xs h-7",
                    "bg-white/60 hover:bg-white/80 shadow-sm",
                    timerTime === preset.seconds && "bg-rose-100 text-rose-700 hover:bg-rose-100"
                  )}
                  onClick={() => setPresetTime(preset.seconds)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Start Button */}
            <Button
              onClick={startTimerInWindow}
              disabled={timerTime === 0}
              className={cn(
                "w-full rounded-lg font-semibold shadow-lg transition-all duration-200 h-8",
                "bg-gradient-to-r from-green-500 to-emerald-500",
                "hover:from-green-600 hover:to-emerald-600",
                "text-white text-sm"
              )}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Timer
            </Button>

            {/* Status Text */}
            <div className="mt-1.5 text-center">
              <p className="text-xs font-medium text-gray-600">
                {timerTime === 0 ? "Set a time to begin" : "Ready to start"}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Timer is running in window */}
            <div className="py-4 text-center">
              <div className="mb-2">
                <ExternalLink className="w-10 h-10 mx-auto text-green-500 mb-2" />
              </div>
              <h4 className="text-base font-bold text-gray-800 mb-1">
                Timer Running
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Running in separate window
              </p>
              <div className="text-xl font-bold text-green-600 mb-3">
                {formatTime(timerTime)}
              </div>
              <Button
                onClick={() => {
                  if (timerWindow && !timerWindow.closed) {
                    timerWindow.focus();
                  }
                }}
                variant="outline"
                size="sm"
                className="rounded-lg bg-white/60 hover:bg-white/80 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                Focus Window
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Compact `EnhancedNamePicker.tsx`**

In `src/components/classroom/EnhancedNamePicker.tsx`, find the inline card block (from `return (` at the end of the file through its closing `);`):

```tsx
  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-xl", className)}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50" />
      
      {/* Frosted Glass Effect Card */}
      <div className="relative backdrop-blur-sm bg-white/40 p-6 rounded-xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-pink-600" />
            <h3 className="font-semibold text-lg text-gray-800">Name Picker</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/50"
              onClick={openWheelPicker}
              disabled={students.length === 0}
              title="Open Spinning Wheel"
            >
              <Circle className="w-4 h-4 text-purple-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/50"
              onClick={openFullscreen}
              title="Open Fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Student Display */}
        <div className="mb-6">
          <div className="relative flex items-center justify-center py-12 px-4 bg-white/60 rounded-2xl min-h-[160px]">
            {selectedStudent ? (
              <div className={cn(
                "text-center transition-all duration-300",
                isSpinning && "blur-sm"
              )}>
                <div className="flex items-center justify-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  ID: {selectedStudent.student_id}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Shuffle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <div className="text-lg font-medium">Click to pick a student</div>
              </div>
            )}
          </div>
        </div>

        {/* Control Button */}
        <Button
          onClick={pickRandomStudent}
          disabled={students.length === 0 || isSpinning}
          size="lg"
          className={cn(
            "w-full rounded-xl font-semibold shadow-lg transition-all duration-200",
            "bg-gradient-to-r from-pink-500 to-purple-500",
            "hover:from-pink-600 hover:to-purple-600",
            "text-white"
          )}
        >
          <Shuffle className="w-5 h-5 mr-2" />
          {isSpinning ? "Picking..." : "Pick Random Student"}
        </Button>

        {/* Student Count */}
        <div className="mt-3 text-center">
          <p className="text-xs font-medium text-gray-600">
            {students.length} {students.length === 1 ? "student" : "students"} selected
          </p>
        </div>
      </div>
    </Card>
  );
}
```

Replace with:

```tsx
  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-xl", className)}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50" />

      {/* Frosted Glass Effect Card */}
      <div className="relative backdrop-blur-sm bg-white/40 p-3 rounded-xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-pink-600" />
            <h3 className="font-semibold text-sm text-gray-800">Name Picker</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-white/50"
              onClick={openWheelPicker}
              disabled={students.length === 0}
              title="Open Spinning Wheel"
            >
              <Circle className="w-4 h-4 text-purple-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-white/50"
              onClick={openFullscreen}
              title="Open Fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Student Display */}
        <div className="mb-3">
          <div className="relative flex items-center justify-center py-6 px-4 bg-white/60 rounded-2xl min-h-[110px]">
            {selectedStudent ? (
              <div className={cn(
                "text-center transition-all duration-300",
                isSpinning && "blur-sm"
              )}>
                <div className="flex items-center justify-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ID: {selectedStudent.student_id}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Shuffle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <div className="text-sm font-medium">Click to pick a student</div>
              </div>
            )}
          </div>
        </div>

        {/* Control Button */}
        <Button
          onClick={pickRandomStudent}
          disabled={students.length === 0 || isSpinning}
          className={cn(
            "w-full rounded-xl font-semibold shadow-lg transition-all duration-200 h-9",
            "bg-gradient-to-r from-pink-500 to-purple-500",
            "hover:from-pink-600 hover:to-purple-600",
            "text-white"
          )}
        >
          <Shuffle className="w-4 h-4 mr-2" />
          {isSpinning ? "Picking..." : "Pick Random Student"}
        </Button>

        {/* Student Count */}
        <div className="mt-2 text-center">
          <p className="text-xs font-medium text-gray-600">
            {students.length} {students.length === 1 ? "student" : "students"} selected
          </p>
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Compact `EnhancedGroupAssigner.tsx`**

In `src/components/classroom/EnhancedGroupAssigner.tsx`, find the inline card block (from `return (` at the end of the file through its closing `);`):

```tsx
  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-xl", className)}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-rose-100" />
      
      {/* Frosted Glass Effect Card */}
      <div className="relative backdrop-blur-sm bg-white/40 p-6 rounded-xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold text-lg text-gray-800">Group Assigner</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-white/50"
            onClick={openFullscreen}
          >
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </Button>
        </div>

        {/* Settings */}
        <div className="mb-4">
          <Label htmlFor="numberOfGroups" className="text-gray-700 font-medium mb-2 block text-sm">
            Number of Groups
          </Label>
          <Select value={numberOfGroups.toString()} onValueChange={(value) => setNumberOfGroups(parseInt(value))}>
            <SelectTrigger className="bg-white/60 border-white/50 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 groups</SelectItem>
              <SelectItem value="3">3 groups</SelectItem>
              <SelectItem value="4">4 groups</SelectItem>
              <SelectItem value="5">5 groups</SelectItem>
              <SelectItem value="6">6 groups</SelectItem>
              <SelectItem value="7">7 groups</SelectItem>
              <SelectItem value="8">8 groups</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Groups Button */}
        <Button
          onClick={createRandomGroups}
          disabled={students.length === 0}
          size="lg"
          className={cn(
            "w-full mb-4 rounded-xl font-semibold shadow-lg transition-all duration-200",
            "bg-gradient-to-r from-rose-500 to-rose-400",
            "hover:from-rose-600 hover:to-rose-500",
            "text-white"
          )}
        >
          <Users2 className="w-5 h-5 mr-2" />
          Create Random Groups
        </Button>

        {/* Student Count */}
        <div className="mb-3 text-center">
          <p className="text-xs font-medium text-gray-600">
            {students.length} students selected
          </p>
        </div>
```

Replace with:

```tsx
  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-xl", className)}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-rose-100" />

      {/* Frosted Glass Effect Card */}
      <div className="relative backdrop-blur-sm bg-white/40 p-3 rounded-xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-rose-600" />
            <h3 className="font-semibold text-sm text-gray-800">Group Assigner</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-white/50"
            onClick={openFullscreen}
          >
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </Button>
        </div>

        {/* Settings */}
        <div className="mb-3">
          <Label htmlFor="numberOfGroups" className="text-gray-700 font-medium mb-1.5 block text-xs">
            Number of Groups
          </Label>
          <Select value={numberOfGroups.toString()} onValueChange={(value) => setNumberOfGroups(parseInt(value))}>
            <SelectTrigger className="bg-white/60 border-white/50 rounded-xl h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 groups</SelectItem>
              <SelectItem value="3">3 groups</SelectItem>
              <SelectItem value="4">4 groups</SelectItem>
              <SelectItem value="5">5 groups</SelectItem>
              <SelectItem value="6">6 groups</SelectItem>
              <SelectItem value="7">7 groups</SelectItem>
              <SelectItem value="8">8 groups</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Groups Button */}
        <Button
          onClick={createRandomGroups}
          disabled={students.length === 0}
          className={cn(
            "w-full mb-3 rounded-xl font-semibold shadow-lg transition-all duration-200 h-9",
            "bg-gradient-to-r from-rose-500 to-rose-400",
            "hover:from-rose-600 hover:to-rose-500",
            "text-white"
          )}
        >
          <Users2 className="w-4 h-4 mr-2" />
          Create Random Groups
        </Button>

        {/* Student Count */}
        <div className="mb-2 text-center">
          <p className="text-xs font-medium text-gray-600">
            {students.length} students selected
          </p>
        </div>
```

The rest of the file (Groups Display / Empty State blocks and closing tags) is unchanged — this edit only touches the header/settings/button padding above it.

- [ ] **Step 4: Verify in the browser**

Run `npm run dev`, open the Classroom page for a class with an active lesson and a decent student count. Confirm:
- All three cards (Timer, Name Picker, Group Assigner) are visibly more compact than before and, on a typical laptop screen (1366×768 or larger), all three are visible in the sidebar without scrolling past the fold when the slide deck card is collapsed.
- Every button in all three cards is still clickable and readable — nothing got so small it's hard to tap.
- Timer presets, quick +/-1 min, and Start Timer still work and open the popup window correctly.
- Name Picker's spin, wheel picker, and fullscreen buttons still work.
- Group Assigner's group count select, Create Random Groups, and fullscreen button still work, and the generated groups list still displays correctly below.

- [ ] **Step 5: Commit**

```bash
git add src/components/classroom/EnhancedTimer.tsx src/components/classroom/EnhancedNamePicker.tsx src/components/classroom/EnhancedGroupAssigner.tsx
git commit -m "style: tighten Timer/Name Picker/Group Assigner card sizing so all three fit in the sidebar"
```
