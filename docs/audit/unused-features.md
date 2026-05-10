# Pulse — Unused / Orphaned Code Audit

> **Date:** 2026-04-30  
> **Scope:** `src/pages/`, `src/components/`, `src/hooks/`  
> **Goal:** Identify coded features that have no navigation buttons, no parent imports, or no render paths.

---

## 🔴 Orphaned Pages (routed but no navigation links)

| Feature | File | Route | Notes |
|---------|------|-------|-------|
| **Spinner** | `src/pages/Spinner.tsx` | `/spinner` | Receives student data via URL query params and renders `StudentSpinner`. Zero buttons, menus, or links point to it. Only reachable by typing the URL directly. |

---

## 🔴 Orphaned Components (never rendered)

| Feature | File | Size | What it is | Why it's dead |
|---------|------|------|-----------|---------------|
| **EnhancedPerformanceExplorer** | `src/components/class-dashboard/EnhancedPerformanceExplorer.tsx` | ~501 lines | A full analytics view with performance timelines, question heatmaps, difficulty analysis, scatter charts, area charts, student filtering, and timeline controls. | **Never imported by any file.** This is the biggest piece of dead code — a fully-built analytics UI that is completely unreachable. |
| **ProgressGraphsSection** | `src/components/class-dashboard/ProgressGraphsSection.tsx` | ~63 lines | Wraps `KPIBar` + `CohortGrowthAnalysis` with filter state. | **Imported in `ClassDashboard.tsx` (line 10) but NEVER used in JSX.** The analytics tab now renders `KPIBar`, `EnhancedTimelineSection`, and `CohortGrowthAnalysis` directly instead. |
| **TimelineSection** | `src/components/class-dashboard/TimelineSection.tsx` | — | Older timeline view. | **Never imported.** Superseded by `EnhancedTimelineSection`. |
| **StudentGrowthChart** | `src/components/class-dashboard/StudentGrowthChart.tsx` | — | Student growth analytics chart. | **Never imported.** |
| **DistributionOverTimeChart** | `src/components/class-dashboard/DistributionOverTimeChart.tsx` | — | Distribution analytics over time. | **Never imported.** |
| **StudentDetailModal** | `src/components/class-dashboard/StudentDetailModal.tsx` | ~190 lines | Modal showing student task history, criteria performance, etc. | **Never imported.** Still contains mock data — was never wired to real data or rendered. |
| **TermProgress** | `src/components/student-profile/TermProgress.tsx` | ~182 lines | Line chart showing weekly term progress for a student. | **Never imported.** Not used in `StudentReport` or `ParentReportView`. |
| **CurriculumInsightsCard** | `src/components/assessment/CurriculumInsightsCard.tsx` | ~185 lines | Bloom's taxonomy distribution, content descriptor coverage, key skills analysis for an assessment. | **Never imported.** Not wired into `AssessmentDetail`. |

---

## 🟡 Partially Orphaned / At-Risk

| Feature | Files | Status |
|---------|-------|--------|
| **Custom Dashboard / Widget System** | `CustomDashboard.tsx`, `DashboardGrid.tsx`, `AddWidgetDialog.tsx`, `KPIWidget.tsx`, `LineChartWidget.tsx`, `BarChartWidget.tsx`, `PieChartWidget.tsx`, `HeatmapWidget.tsx`, `MarkdownWidget.tsx` | **Rendered** in the "Custom" tab of `ClassDashboard`, but depends on Supabase tables `dashboard_layouts` and `dashboard_widgets`. If those tables aren't populated, it shows empty states. The tables exist in schema but may not be used in practice. |
| **TimelineControlPanel** | `src/components/class-dashboard/TimelineControlPanel.tsx` | Only used by `EnhancedTimelineSection` (active). Would become orphaned if the timeline section is ever replaced. |

---

## 🔴 Orphaned Hooks

| Hook | File | Status |
|------|------|--------|
| `useProgressAnalytics` | `src/hooks/useProgressAnalytics.tsx` | **Never imported by anything.** |
| `useTimelineData` | `src/hooks/useTimelineData.tsx` | Only imported by `TimelineSection.tsx` (which is itself orphaned). |

---

## 🟡 Hooks Used Only by Orphaned Components

These hooks are technically "active" but only serve components that are never rendered. If the orphaned components are removed, these hooks can also be removed.

| Hook | File | Used By |
|------|------|---------|
| `useStudentGrowthAnalytics` | `src/hooks/useEnhancedProgressAnalytics.tsx` | `DistributionOverTimeChart.tsx`, `StudentGrowthChart.tsx`, `CohortGrowthAnalysis.tsx` |
| `useDistributionOverTime` | `src/hooks/useEnhancedProgressAnalytics.tsx` | `DistributionOverTimeChart.tsx`, `CohortGrowthAnalysis.tsx` |
| `useQuestionDifficulty` | `src/hooks/useComprehensiveAnalytics.tsx` | `EnhancedPerformanceExplorer.tsx` |
| `useStudentTermProgress` | `src/hooks/useStudentAssessmentResults.tsx` | `TermProgress.tsx` |

---

## Summary: What Could Be Safely Removed

If you want to clean house, the following files have **zero impact** on the running app:

### Pages
- `src/pages/Spinner.tsx`

### Components
- `src/components/class-dashboard/EnhancedPerformanceExplorer.tsx`
- `src/components/class-dashboard/ProgressGraphsSection.tsx`
- `src/components/class-dashboard/TimelineSection.tsx`
- `src/components/class-dashboard/StudentGrowthChart.tsx`
- `src/components/class-dashboard/DistributionOverTimeChart.tsx`
- `src/components/class-dashboard/StudentDetailModal.tsx`
- `src/components/student-profile/TermProgress.tsx`
- `src/components/assessment/CurriculumInsightsCard.tsx`

### Hooks
- `src/hooks/useProgressAnalytics.tsx`
- `src/hooks/useTimelineData.tsx`

> **Note:** Before deleting, consider whether any of these are **intended for a future release** (e.g. the EnhancedPerformanceExplorer is a sophisticated analytics view that may just need a navigation link). The `Spinner` page may have been designed for a specific classroom workflow that was never completed.
