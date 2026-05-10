# Pulse Data Model — Markbook & Scoring

> **Date:** 2026-04-30  
> **Scope:** How student results, marks, and progress data are stored, mutated, and displayed.  
> **Core Tables:** `results` (task-level), `question_results` (question-level)

---

## 1. Database Schema

### `results` — Task-level scores

One row per student per task (assessment or exit ticket).

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `task_id` | UUID | FK → `tasks` |
| `student_id` | UUID | FK → `students` |
| `raw_score` | number | Total points earned |
| `percent_score` | number | Percentage (0–100) |
| `normalised_percent` | number | Normalised percentage |
| `feedback` | text | Teacher-written feedback |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### `question_results` — Question-level scores

One row per student per question.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `question_id` | UUID | FK → `questions` |
| `student_id` | UUID | FK → `students` |
| `raw_score` | number | Points earned on this question |
| `percent_score` | number | Percentage on this question |
| `response_data` | JSONB | `{selected_option_id}` or `{text}` |
| `ai_feedback` | text | AI-generated feedback |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

## 2. How Markbook Data Is Created

### Creation Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useResultMutations` | `src/hooks/useResultMutations.tsx` | Create / update / delete task-level `results` |
| `useQuestionResultMutations` | `src/hooks/useQuestionResultMutations.tsx` | Create / update / delete `question_results` |
| `useSubmitExitTicket` | `src/hooks/useSubmitExitTicket.ts` | Auto-creates both on student submission |
| `useAssessmentImport` | `src/hooks/useAssessmentImport.tsx` | Bulk creates both from CSV / Excel import |

### Import Formats Supported

| Format | Description | Parser |
|--------|-------------|--------|
| Standard CSV | Per-question scores | `src/utils/csvAssessmentParser.ts` |
| Single Mark CSV | Just total score / percentage | `src/utils/csvAssessmentParser.ts` |
| Kahoot! Excel | Kahoot export with name matching | `src/utils/csvAssessmentParser.ts` |

---

## 3. Markbook Display Flow

### Assessment Detail (`src/pages/AssessmentDetail.tsx`)
- **Route:** `/assessment/:assessmentId`
- **Purpose:** Main markbook view for a single assessment
- **Features:**
  - Editable results table (raw scores / percentages)
  - Add/remove students
  - Export to CSV
  - Grade bands: **E** (80%+), **P** (65%+), **D** (50%+), **X** (<50%)

### Student Report (`src/pages/StudentReport.tsx`)
- **Route:** `/student/:studentId/class/:classId`
- **Views:** Parent, Teacher, Student
- **Teacher view components:**
  - `OverallSummary` — grade, trend, strengths, focus areas
  - `AssessmentProgress` — line / bar chart over time
  - `AssessmentBreakdown` — grouped by assessment type
  - `CurriculumContentItems` — curriculum coverage analysis
  - `GeneralCapabilities` — capability tracking
  - `RecentTeacherNotes` — session notes

### Class Dashboard (`src/components/class-dashboard/AssessmentsSection.tsx`)
- Lists previous vs upcoming assessments
- Status indicators (completed / not started)

---

## 4. Markbook Hooks & Interfaces

### Student Assessment Results

**Hook:** `src/hooks/useStudentAssessmentResults.tsx`

```ts
export interface StudentAssessmentResult {
  id: string;
  student_id: string;
  task_id: string;
  raw_score: number | null;
  percent_score: number | null;
  normalised_percent: number | null;
  feedback: string | null;
  task: {
    id: string;
    name: string;
    assessment_format: string | null;
    task_type: string | null;
    due_date: string | null;
    max_score: number | null;
    weight_percent: number | null;
    created_at: string;
  };
}
```

**Usage:**
```ts
const { data: results } = useStudentAssessmentResults(studentId, classId);
```

---

### Student Assessment Progress

**Hook:** `src/hooks/useStudentAssessmentProgress.tsx`

```ts
export interface AssessmentProgressData {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  percentScore: number;
  date: string;
  assessmentType: string;
  taskType: string;
}
```

**Usage:**
```ts
const { data: progress } = useStudentAssessmentProgress(studentId, classId);
```

---

### Student Summary

**Hook:** `src/hooks/useStudentSummary.tsx`

```ts
export interface StudentSummary {
  currentGrade: string;
  currentPercentage: number;
  trend: 'improving' | 'steady' | 'declining';
  strengths: string[];
  focusAreas: string[];
  engagement: string;
  totalAssessments: number;
  averageScore: number;
  lastAssessmentDate: string | null;
}
```

**Usage:**
```ts
const { data: summary } = useStudentSummary(studentId, classId);
```

---

### Question Heatmap Data

**Hook:** `src/hooks/useQuestionHeatmapData.tsx`

Returns a matrix of students × questions with scores for the heatmap grid in `AssessmentDetail`.

---

### Task Question Results

**Hook:** `src/hooks/useTaskQuestionResults.tsx`

Fetches all `question_results` for a given task, used in the Results tab of `AssessmentDetail`.

---

### Assessment Breakdown

**Hook:** `src/hooks/useStudentAssessmentResults.tsx` (same file)

```ts
export interface AssessmentBreakdownData {
  type: string;
  score: number;
  maxScore: number;
  count: number;
  averageScore: number;
}
```

**Usage:**
```ts
const { data: breakdown } = useStudentAssessmentBreakdown(studentId, classId);
```

Groups results by `assessment_format` or `task_type` and computes averages.

---

### Term Progress

**Hook:** `src/hooks/useStudentAssessmentResults.tsx` (same file)

```ts
export interface TermProgressData {
  week: string;
  score: number;
  assessment: string;
  date: string;
  assessment_type: string;
}
```

**Usage:**
```ts
const { data: termProgress } = useStudentTermProgress(studentId, classId);
```

Groups results by week and averages scores. **Note:** The `TermProgress` component that consumes this hook is currently orphaned (not rendered anywhere).

---

## 5. Data Flow Diagrams

### Markbook Flow
```
AssessmentDetail.tsx / StudentReport.tsx
  → useStudentAssessmentResults.tsx
    → SELECT results JOIN tasks
  → useStudentAssessmentProgress.tsx
    → Time-series chart data
  → useStudentSummary.tsx
    → Aggregated grade, trend, strengths
  → useQuestionHeatmapData.tsx
    → Per-question per-student matrix
```

### Exit Ticket Auto-Scoring Flow
```
Student submits answers (TakeExitTicket.tsx)
  → useSubmitExitTicket.ts
    → MCQ: check question_options.is_correct
    → Text: autoMarkTextAnswer(marking_criteria)
    → Calculate total raw_score + percent_score
    → INSERT results (task-level)
    → INSERT question_results (per-question)
    → Fire ai-mark-response Edge Function (async)
      → Updates question_results.ai_feedback
```

### Import Flow
```
Teacher uploads CSV/Excel (ImportAssessmentDialog.tsx)
  → csvAssessmentParser.ts
    → Parse rows into student names + scores
    → Match names to students table
  → useAssessmentImport.tsx
    → Bulk INSERT results
    → Bulk INSERT question_results (if per-question data)
```

---

## 6. Grade Bands

| Band | Range | Description |
|------|-------|-------------|
| **E** | 80% – 100% | Excellent |
| **P** | 65% – 79% | Proficient |
| **D** | 50% – 64% | Developing |
| **X** | < 50% | Not yet achieved |

These bands are hard-coded in the UI (e.g. `AssessmentDetail.tsx`) and used for colour-coding results tables and summary cards.

---

## 7. Key File Paths

| Category | Path |
|----------|------|
| Assessment Detail (markbook view) | `src/pages/AssessmentDetail.tsx` |
| Student Report | `src/pages/StudentReport.tsx` |
| Result Mutations Hook | `src/hooks/useResultMutations.tsx` |
| Question Result Mutations Hook | `src/hooks/useQuestionResultMutations.tsx` |
| Student Assessment Results Hook | `src/hooks/useStudentAssessmentResults.tsx` |
| Student Assessment Progress Hook | `src/hooks/useStudentAssessmentProgress.tsx` |
| Student Summary Hook | `src/hooks/useStudentSummary.tsx` |
| Question Heatmap Data Hook | `src/hooks/useQuestionHeatmapData.tsx` |
| Task Question Results Hook | `src/hooks/useTaskQuestionResults.tsx` |
| Assessment Import Hook | `src/hooks/useAssessmentImport.tsx` |
| CSV Parser | `src/utils/csvAssessmentParser.ts` |
| Auto-marking Logic | `src/lib/autoMarkTextAnswer.ts` |
| Overall Summary Component | `src/components/student-profile/OverallSummary.tsx` |
| Assessment Progress Component | `src/components/student-profile/AssessmentProgress.tsx` |
| Assessment Breakdown Component | `src/components/student-profile/AssessmentBreakdown.tsx` |
| Recent Teacher Notes Component | `src/components/student-profile/RecentTeacherNotes.tsx` |
| Parent Report View | `src/components/student-profile/parent/ParentReportView.tsx` |
