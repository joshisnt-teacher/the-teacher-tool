# Teacher Tool UI/UX Audit Report

**Date:** April 2026  
**Focus:** Navigation, visual design, cognitive load, and teacher-facing workflows  
**Methodology:** Codebase review of 18 routes, navigation components, design system, and key user flows.

---

## Executive Summary

Your app is **feature-rich and functionally well-organized**, but it currently looks and feels like a generic admin dashboard rather than a tool designed specifically for teachers. The good news: the shadcn/ui foundation is solid, and the user flows (Dashboard → Class → Assessment → Grade) are logical. The main issues are **visual fatigue from repetitive page designs**, **navigation friction**, **inconsistent feedback systems**, and **information overload** on high-frequency screens like the Classroom and Grading pages.

**The biggest risk:** A teacher using this during a busy school day will experience cognitive overload on the screens they use most often.

---

## 1. Navigation & Wayfinding

### The Sidebar: Functional but Fragile

The `AppSidebar` (`src/components/AppSidebar.tsx`) is the primary way teachers move around the app. It works, but it has some real friction points:

#### Active State Bug
```tsx
const isActive = (path: string) => {
  if (path === "/dashboard") {
    return currentPath === path;
  }
  return currentPath.startsWith(path);
};
```

Because this uses `startsWith`, visiting `/classroom/7A-science` will **also** incorrectly highlight the **Classes** menu item (since `/classroom` starts with `/class`). Teachers will see two items lit up at once, which erodes trust in the navigation.

**Fix:** Match by exact path or by route segment (`/classroom/*` should only match Classroom).

#### Missing Breadcrumbs
Only the **Curriculum Browser** has breadcrumbs. On deep pages like:
- Dashboard → Class → Assessment → Question Detail
- Dashboard → Student Report

...there is no way to see where you are in the hierarchy or jump back one level without using the browser back button. Teachers often context-switch between classes and assessments; breadcrumbs would significantly reduce navigational effort.

**Recommendation:** Add a consistent breadcrumb bar (or at least a "parent page" link) to `ClassDashboard`, `AssessmentDetail`, `StudentReport`, and `SessionDetails`.

#### Redundant Back Buttons
Almost every page has a "Back to Dashboard" or "Back to Class" ghost button in the page header. This is fine occasionally, but when **combined** with the sidebar, browser back, and missing breadcrumbs, it creates a scattered wayfinding experience. Replace most of these with breadcrumbs and reserve prominent back buttons for wizard flows (like Create Assessment).

---

## 2. Visual Design & Brand

### The "Gradient Everywhere" Problem

The background gradient `bg-gradient-to-br from-primary/5 via-background to-secondary/10` appears **36 times across 15 files**. Every teacher-facing page looks identical. While consistency is good, this level of repetition creates visual fatigue. Nothing signals "you are in a different mode" when moving from grading to lesson planning to reporting.

**Recommendation:** Abstract the page shell into a single `PageShell` component, and use subtle visual cues to differentiate contexts:
- **Classroom / live teaching:** Clean white or very light background (reduce distraction)
- **Grading / Assessment:** Slightly warmer tint or distinct header color
- **Reporting:** Neutral, print-friendly palette

### No Visual Identity

The app uses the default shadcn/ui slate/blue color palette without customization. It looks like a stock template. For a teacher tool, a small amount of brand warmth (a custom primary color, a friendly font, or a hand-drawn icon style) goes a long way toward making the app feel trustworthy and approachable.

**Quick win:** Pick one custom primary HSL color and one rounded-friendly font (e.g., Inter + a rounded display font for headers).

### Overuse of Backdrop Blur & Shadows

Blur headers and hover shadows are applied on virtually every card. In a tool used for hours at a time, these effects add visual noise. Consider simplifying:
- Remove `backdrop-blur-sm` from static page headers
- Reserve shadows for interactive states (hover, focus, drag) rather than every card

---

## 3. Core Teacher Workflows

These are the screens teachers will use most. They need to feel fast, predictable, and low-stress.

### A. The Classroom Page (`/classroom/:classId`)

This is arguably the highest-stress screen — used during actual lessons with 25+ students watching.

**Current state:** A dense 2-column layout with a student grid on the left and modules (Timer, Name Picker, Group Assigner) on the right. Each student card contains:
- A checkbox
- A "toilet" button
- An avatar
- Name + ID
- Strike / commendation counters

That's **4 interactive elements in a very small card**. On a tablet or phone, mis-taps are inevitable.

**Issues:**
1. **Toilet timer toast spam:** The timer fires a toast every 10 seconds for every student at the toilet. If 4 students are out, that's 24 toasts per minute.
2. **No select-all / deselect-all** for the student checkboxes.
3. **Strike system resets on page reload** (session-only), which is surprising because notes are persistent.
4. **Touch targets are too small** on mobile (2-column grid on phones).

**Recommendations:**
- **Simplify the student card:** Make the whole card tappable to open the note dialog. Move strikes/commendations and the toilet button into that dialog, or add a small, clearly separated toolbar below the name.
- **Replace toast spam** with a quiet visual indicator on the card itself (e.g., a small timer badge that turns red when overdue).
- **Add a "Select All"** checkbox in the grid header.
- **Persist strikes** or clearly mark them as "Session Only" so teachers aren't surprised when they reload.
- **Mobile grid:** Use 1 column on phones, 3–4 on tablets, and keep buttons large enough for thumb-tapping.

### B. Grading / Assessment Detail (`/assessment/:assessmentId`)

**Current state:** A tabbed interface (Results | Question Heatmap | Questions | Insights). The Results tab shows a plain HTML table with inline editing.

**Issues:**
1. **No data visualization in the Results tab.** Teachers have to mentally parse a table of numbers to understand class performance.
2. **No sticky headers** on the grading table. For a class of 30+, scrolling loses context.
3. **No bulk actions.** A teacher can't "Mark All Present", "Mark All Absent", or "Clear All Scores".
4. **No keyboard navigation.** Tabbing between score inputs would dramatically speed up grading.
5. **No "unsaved changes" guard.** If a teacher edits scores and accidentally clicks Back or a sidebar link, the work is lost silently.
6. **Band badges use hardcoded colors** (`bg-blue-100`, etc.) that don't adapt to dark mode.

**Recommendations:**
- **Add a mini chart** at the top of Results: a simple bar chart showing score distribution or band spread.
- **Make the table header sticky** (`sticky top-0`).
- **Add bulk action buttons:** "Mark All Present / Absent" and "Import from CSV" (even a simple paste-from-spreadsheet feature would help).
- **Enable Tab navigation** through score inputs.
- **Add a `beforeunload` + navigation blocker** when edits are unsaved.
- **Use theme tokens** for band colors.

### C. Create Assessment Wizard (`/create-assessment/:classId`)

**Current state:** A 4-step linear wizard.

**Issues:**
1. **Step 1 teases unavailable features.** "Summative" assessment type is shown but disabled with a "Coming Soon" badge. This is frustrating — if it's not available, don't show it as a primary option.
2. **Steps 3 and 4 feel redundant.** Only "Confidence Check" format is supported, so the Format step doesn't actually offer a choice.
3. **No "Save as Draft"**. Teachers often get interrupted mid-task and need to resume later.

**Recommendations:**
- Hide "Summative" entirely or move it to a "Learn more" link at the bottom.
- If only Confidence Check is supported, collapse Steps 3 and 4 into one step or skip the Format step entirely.
- Add "Save as Draft" functionality, even if it just saves to local state for now.

### D. Student Report (`/student/:studentId/class/:classId`)

**Current state:** Three tabs (Parent | Teacher | Student).

**Issue:** The **Student view** is literally a "Coming Soon" placeholder card. If a teacher accidentally clicks this in front of a student or parent, it looks unprofessional.

**Recommendation:** Hide the Student tab until it's ready, or replace it with a gentle "Student view is in beta" message rather than a full-page placeholder.

---

## 4. Feedback & System Status

### Dual Toast Systems

Your app uses **two different toast libraries simultaneously**:
1. `useToast()` — Radix-based toasts (`src/components/ui/toaster.tsx`)
2. `sonner` — Sonner toasts (`src/components/ui/sonner.tsx`)

`Login.tsx` and `Settings.tsx` use Sonner. Most other pages use the Radix toast. This means a teacher could see two visually different toast styles stacked on top of each other.

**Recommendation:** Standardize on **one** toast system. Sonner is generally better for stacking and action buttons. Migrate all `useToast()` calls to Sonner.

### Inconsistent Confirmation Patterns

- Deleting an assessment: `AlertDialog` (good)
- Deleting a session: `window.confirm()` (bad — inaccessible, ugly, inconsistent)
- Deleting an exit ticket: `AlertDialog` (good)

**Recommendation:** Audit all destructive actions and replace any `confirm()` calls with `AlertDialog`.

### Loading States

Some pages show a full-page spinner (`Dashboard`, `ClassDashboard`), while others show inline skeletons (`AssessmentDetail`). This inconsistency makes the app feel unpredictable.

**Recommendation:** Define a standard:
- **Full-page loading:** For initial app load or route transitions
- **Inline skeletons:** For tab switches or partial data refreshes
- **Button spinners:** For form submissions

---

## 5. Mobile & Accessibility

### Mobile Issues

Teachers will absolutely use this on iPads and phones. The current experience is functional but fragile:

1. **Sidebar class names are truncated** (`max-w-[160px]`), and tooltips on collapsed icons don't work on touch.
2. **ClassDashboard header buttons overflow.** Four action buttons in a row with no `flex-wrap` will break on narrow screens.
3. **Grading table requires horizontal scrolling.** Acceptable, but sticky headers would help.
4. **Classroom student cards are too small** on phones (see above).
5. **Dialogs are often `max-w-3xl`**, which can be edge-to-edge or require awkward scrolling on mobile.

**Recommendation:** Do a pass with Chrome DevTools at 375px and 768px widths. Fix button wrapping, increase touch targets to at least 44×44px, and test all dialogs.

### Accessibility Quick Wins

- **Add `aria-label`s** to icon-only buttons (e.g., the toilet button, strike button, sidebar trigger).
- **Improve focus rings.** Make sure keyboard users can see where they are when tabbing through the grading table.
- **Color contrast:** The hardcoded `bg-blue-100 text-blue-800` style for band badges is fine, but check any yellow/green combinations for contrast compliance.

---

## 6. Prioritized Action Plan

### 🔴 High Priority (Fix This Week)

| Issue | Why It Matters | File(s) |
|-------|---------------|---------|
| **Fix sidebar active state bug** | Teachers see two nav items highlighted at once, causing confusion. | `AppSidebar.tsx` |
| **Remove/standardize dual toasts** | Two toast styles stacking looks unprofessional and buggy. | `Toaster`, `Sonner`, all page files |
| **Simplify Classroom student cards** | High mis-tap risk during live teaching; reduces stress. | `Classroom.tsx` |
| **Add unsaved-changes guard to grading** | Losing grading work because of a mis-click is deeply frustrating. | `AssessmentDetail.tsx` |
| **Replace `window.confirm()` with `AlertDialog`** | Inconsistent and inaccessible. | `SessionDetails.tsx`, others |

### 🟡 Medium Priority (Fix This Month)

| Issue | Why It Matters | File(s) |
|-------|---------------|---------|
| **Add breadcrumbs to deep pages** | Reduces cognitive load when switching contexts. | `ClassDashboard`, `AssessmentDetail`, `StudentReport` |
| **Abstract repetitive page shell** | Makes the app easier to maintain and less visually fatiguing. | All page files |
| **Add bulk actions to grading table** | Saves significant time for teachers with large classes. | `AssessmentDetail.tsx` |
| **Hide "Coming Soon" teases** | Showing disabled features erodes trust. | `CreateAssessment.tsx`, `StudentReport.tsx` |
| **Improve mobile button wrapping & touch targets** | Teachers use tablets and phones regularly. | `ClassDashboard.tsx`, `Classroom.tsx` |

### 🟢 Low Priority / Polish (Ongoing)

| Issue | Why It Matters | File(s) |
|-------|---------------|---------|
| **Introduce a custom brand color/font** | Makes the app feel intentional and teacher-friendly. | `index.css`, theme config |
| **Add drag-and-drop to exit ticket questions** | The `GripVertical` icon implies this already works. | `CreateExitTicket.tsx` |
| **Add print styles to Parent Report** | Likely needed for parent-teacher conferences. | `ParentReportView.tsx` |
| **Add a preview mode to exit tickets** | Teachers want to see what students will see before publishing. | `CreateExitTicket.tsx` |
| **Keyboard navigation in grading table** | Power-user feature that speeds up repetitive tasks. | `AssessmentDetail.tsx` |

---

## Closing Thoughts

The underlying architecture of your teacher tool is strong. The flows make sense, the component library is solid, and the feature set is comprehensive. The opportunity right now is to **shift from "generic dashboard" to "teacher-focused workspace."**

Teachers work in interrupt-driven, high-cognitive-load environments. Every unnecessary click, every ambiguous active state, every "Coming Soon" tease, and every overly-dense card adds friction to their day. The fixes above — especially the navigation, the Classroom simplification, and the grading safeguards — will make the app feel significantly more polished and professional.

If you want, I can start implementing any of these recommendations. I'd suggest beginning with the **High Priority** items, as they offer the biggest UX improvement for the least effort.
