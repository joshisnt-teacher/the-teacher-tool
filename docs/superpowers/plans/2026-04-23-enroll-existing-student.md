# Enroll Existing Student Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Existing Student" tab to the Add Student card in ClassStudentsTab so teachers can enroll students from other classes in a few clicks.

**Architecture:** All changes are contained to a single file (`ClassStudentsTab.tsx`). Two always-on hooks (`useStudents()` and `useClasses()`) provide the data pool; a third call to `useStudents(selectedSourceClassId)` handles the class-filtered view. All filtering is client-side. The enroll action upserts into the existing `enrolments` table.

**Tech Stack:** React 18, TypeScript, TanStack React Query, Supabase JS, shadcn/ui (Tabs, Select, Checkbox), Tailwind CSS.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx` | Modify | Add tab switcher, new "Existing Student" panel, enroll handler |

No new files. No schema changes. No new hooks.

---

## Task 1: Add tab switcher — wrap existing form in "New Student" tab

**Files:**
- Modify: `src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx`

- [ ] **Step 1: Add new imports at the top of the file**

Replace the existing import block at the top of `ClassStudentsTab.tsx` with the following (adds `Tabs`, `Select`, `Checkbox`, `Search`, `useClasses`):

```tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserPlus, Trash2, Upload, FileText, Search } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useStudents } from '@/hooks/useStudents';
import { useClasses, Class } from '@/hooks/useClasses';
```

- [ ] **Step 2: Add tab state inside the component**

Inside `ClassStudentsTabProps`, just after the existing state declarations (`newStudent`, `isAddingStudent`, etc.), add:

```tsx
const [activeAddTab, setActiveAddTab] = useState<'new' | 'existing'>('new');
const [selectedSourceClassId, setSelectedSourceClassId] = useState<string>('');
const [nameSearch, setNameSearch] = useState('');
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [isEnrolling, setIsEnrolling] = useState(false);
```

- [ ] **Step 3: Add two new hook calls after the existing `useStudents` call**

After the line:
```tsx
const { data: students = [], isLoading: studentsLoading } = useStudents(classData.id);
```

Add:
```tsx
const { data: classes = [] } = useClasses();
const { data: allStudents = [] } = useStudents();
const { data: classFilteredStudents = [] } = useStudents(selectedSourceClassId || undefined);
```

- [ ] **Step 4: Add computed values before the return statement**

Just before the `return (` line, add:

```tsx
const enrolledIdSet = new Set(students.map(s => s.id));
const otherClasses = classes.filter(c => c.id !== classData.id);
const candidatePool = selectedSourceClassId ? classFilteredStudents : allStudents;
const filteredCandidates = candidatePool
  .filter(s => !enrolledIdSet.has(s.id))
  .filter(s => {
    if (!nameSearch.trim()) return true;
    const full = `${s.first_name} ${s.last_name}`.toLowerCase();
    return full.includes(nameSearch.toLowerCase());
  });
const allFilteredSelected =
  filteredCandidates.length > 0 && filteredCandidates.every(s => selectedIds.has(s.id));
```

- [ ] **Step 5: Wrap the Add Student card content in tabs**

Inside the first `<Card>` (the "Add New Student" card), replace:
```tsx
<CardHeader>
  <CardTitle className="flex items-center gap-2">
    <UserPlus className="w-5 h-5" />
    Add New Student
  </CardTitle>
  <CardDescription>
    Add a student to this class by entering their details below
  </CardDescription>
</CardHeader>
<CardContent>
  {/* ... existing form content ... */}
</CardContent>
```

With:
```tsx
<CardHeader>
  <CardTitle className="flex items-center gap-2">
    <UserPlus className="w-5 h-5" />
    Add Student
  </CardTitle>
  <CardDescription>
    Add a new student or enroll an existing student from another class
  </CardDescription>
</CardHeader>
<CardContent>
  <Tabs value={activeAddTab} onValueChange={(v) => setActiveAddTab(v as 'new' | 'existing')}>
    <TabsList className="mb-4">
      <TabsTrigger value="new">New Student</TabsTrigger>
      <TabsTrigger value="existing">Existing Student</TabsTrigger>
    </TabsList>

    <TabsContent value="new">
      {/*
        Move the entire existing CardContent body here verbatim — starting from
        <div className="grid grid-cols-3 gap-4">
        and ending with the closing </div> of the flex justify-between block
        that contains the CSV upload and Add Student button.
        Do not modify any of this code.
      */}
    </TabsContent>

    <TabsContent value="existing">
      {/* Task 2 will fill this in */}
    </TabsContent>
  </Tabs>
</CardContent>
```

- [ ] **Step 6: Verify manually**

Run `npm run dev`. Open a class → Adjust Class Data → Students tab.
Expected:
- The card now shows "Add Student" as the title
- Two tabs appear: "New Student" and "Existing Student"
- "New Student" tab shows the existing form exactly as before; it still works
- "Existing Student" tab is empty (placeholder for Task 2)

- [ ] **Step 7: Commit**

```bash
git add src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx
git commit -m "feat: add tab switcher skeleton to Add Student card"
```

---

## Task 2: Build the "Existing Student" panel

**Files:**
- Modify: `src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx`

- [ ] **Step 1: Add helper handlers before the return statement**

After the computed values from Task 1, add:

```tsx
const toggleStudent = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

const toggleAll = () => {
  if (allFilteredSelected) {
    setSelectedIds(new Set());
  } else {
    setSelectedIds(new Set(filteredCandidates.map(s => s.id)));
  }
};
```

- [ ] **Step 2: Fill in the "Existing Student" TabsContent**

Replace the `{/* Task 2 will fill this in */}` placeholder with:

```tsx
<TabsContent value="existing">
  {otherClasses.length === 0 ? (
    <div className="text-center py-8 text-muted-foreground">
      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">You don't have any other classes to enroll students from yet.</p>
    </div>
  ) : (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex gap-3">
        <Select value={selectedSourceClassId} onValueChange={setSelectedSourceClassId}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All classes</SelectItem>
            {otherClasses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name..."
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Candidate list */}
      {filteredCandidates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">All your students are already enrolled in this class.</p>
        </div>
      ) : (
        <>
          {/* Select-all row */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <Checkbox
              id="select-all-existing"
              checked={allFilteredSelected}
              onCheckedChange={toggleAll}
            />
            <label
              htmlFor="select-all-existing"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              {allFilteredSelected
                ? 'Deselect all'
                : `Select all (${filteredCandidates.length})`}
            </label>
          </div>

          {/* Scrollable student list */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {filteredCandidates.map(student => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => toggleStudent(student.id)}
              >
                <Checkbox
                  checked={selectedIds.has(student.id)}
                  onCheckedChange={() => toggleStudent(student.id)}
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-tight">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">ID: {student.student_id}</p>
                </div>
                {selectedSourceClassId && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {otherClasses.find(c => c.id === selectedSourceClassId)?.class_name}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Enroll button — Task 3 will wire this up */}
          <div className="flex justify-end pt-2">
            <Button disabled={selectedIds.size === 0}>
              <UserPlus className="w-4 h-4 mr-2" />
              {selectedIds.size > 0 ? `Enroll ${selectedIds.size} Selected` : 'Enroll Selected'}
            </Button>
          </div>
        </>
      )}
    </div>
  )}
</TabsContent>
```

- [ ] **Step 3: Verify manually**

Run `npm run dev`. Open a class with students → Adjust Class Data → Students tab → Existing Student tab.
Expected:
- Class filter dropdown shows all the teacher's other classes
- Name search box filters the list as you type
- Students not already in this class appear with a checkbox
- When a source class is selected, a badge shows the class name on each row
- Checkboxes toggle individual rows; clicking anywhere on a row also toggles it
- "Select all" header checkbox selects/deselects all visible candidates
- "Enroll X Selected" button shows the count but is disabled (Task 3 will wire it up)
- If no other classes exist, the empty state message shows
- If all students are already enrolled, the "All your students are already enrolled" message shows

- [ ] **Step 4: Commit**

```bash
git add src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx
git commit -m "feat: add Existing Student panel with class filter, search, and checklist"
```

---

## Task 3: Wire up the enroll handler + final polish

**Files:**
- Modify: `src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx`

- [ ] **Step 1: Add the enroll handler**

After `toggleAll`, add:

```tsx
const handleEnrollSelected = async () => {
  if (selectedIds.size === 0) return;
  const count = selectedIds.size;
  setIsEnrolling(true);
  try {
    const { error } = await supabase
      .from('enrolments')
      .upsert(
        [...selectedIds].map(id => ({ class_id: classData.id, student_id: id })),
        { ignoreDuplicates: true }
      );
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ['students', classData.id] });
    setSelectedIds(new Set());
    toast({
      title: 'Students Enrolled',
      description: `${count} student${count !== 1 ? 's' : ''} added to this class.`,
    });
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to enroll students.',
      variant: 'destructive',
    });
  } finally {
    setIsEnrolling(false);
  }
};
```

- [ ] **Step 2: Wire the enroll button to the handler**

Replace the placeholder Enroll button (the disabled one from Task 2 Step 2):

```tsx
<Button disabled={selectedIds.size === 0}>
  <UserPlus className="w-4 h-4 mr-2" />
  {selectedIds.size > 0 ? `Enroll ${selectedIds.size} Selected` : 'Enroll Selected'}
</Button>
```

With:

```tsx
<Button
  onClick={handleEnrollSelected}
  disabled={selectedIds.size === 0 || isEnrolling}
>
  <UserPlus className="w-4 h-4 mr-2" />
  {isEnrolling
    ? 'Enrolling...'
    : selectedIds.size > 0
      ? `Enroll ${selectedIds.size} Selected`
      : 'Enroll Selected'}
</Button>
```

- [ ] **Step 3: Verify manually — golden path**

Run `npm run dev`. Open a class that shares students with another class (e.g. Year 7 DigiTech and Year 7 HASS).
1. Go to Adjust Class Data → Students tab → Existing Student tab
2. Select "Year 7 HASS" from the class dropdown — students from that class who aren't already in this one should appear
3. Tick 2–3 students
4. Click "Enroll 3 Selected"
5. Expected: button shows "Enrolling...", then a success toast appears, the selected students disappear from the candidate list (because they're now enrolled), and the Students list below the card updates to include them

- [ ] **Step 4: Verify manually — edge cases**

1. **Retry on failure:** Temporarily break the Supabase URL in `.env`, enroll a student, confirm the destructive error toast appears and the checkboxes remain ticked
2. **All classes filter:** Set dropdown to "All classes", search for a student by partial name, enroll them — confirm it works without a source class selected
3. **Empty state:** If all students across all other classes are already in this class, confirm the "All your students are already enrolled" message shows

- [ ] **Step 5: Final commit**

```bash
git add src/components/class-dashboard/adjust-class/ClassStudentsTab.tsx
git commit -m "feat: wire enroll handler to Existing Student tab"
```
