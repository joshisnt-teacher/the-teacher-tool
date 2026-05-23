# UI Simplification — Classroom Panel & Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce button overload in the classroom exit ticket panel and declutter the main teacher dashboard.

**Architecture:** Two independent file changes. ClassroomActivities collapses secondary per-ticket actions into a `DropdownMenu` overflow menu, keeping only the primary action (Activate/Close/Reactivate) visible. Dashboard removes the redundant Quick Actions sidebar card and widens the classes grid to fill the space.

**Tech Stack:** React 18 + TypeScript, shadcn/ui (DropdownMenu, Button, Badge, Card), lucide-react, React Router v6.

---

## Task 1: Classroom panel — overflow menu

**Files:**
- Modify: `src/components/classroom/ClassroomActivities.tsx`

### What to change

Each exit ticket row currently renders up to 5 buttons side by side. The goal is:
- **One visible primary button** — Activate / Close / Reactivate (already exists, keep it)
- **One `•••` icon button** that opens a `DropdownMenu` with all secondary actions:
  - Edit template (only when `exit_ticket_template_id` is set)
  - Set as homework (only when `status === 'draft'` and not completed)
  - Cancel homework (only when `is_homework && status === 'active'`)
  - Reset to draft (only when `is_completed || status === 'closed'`)
  - *(separator)*
  - Delete from class (always, destructive style)

- [ ] **Step 1: Add DropdownMenu imports**

In `src/components/classroom/ClassroomActivities.tsx`, add to the existing shadcn imports (after the `AlertDialog` import block):

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

- [ ] **Step 2: Add MoreHorizontal icon**

Update the lucide-react import line (line 5) to include `MoreHorizontal`:

```tsx
import { Ticket, AlertCircle, Loader2, Play, RotateCcw, Library, RefreshCw, BookOpen, X, ExternalLink, Eye, EyeOff, Trash2, Check, MoreHorizontal } from "lucide-react";
```

- [ ] **Step 3: Replace the per-ticket button row**

Find the button area inside the ticket map (the `<div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">` block, lines 511–588) and replace it entirely with:

```tsx
<div className="flex items-center gap-2 shrink-0">
  {/* Primary action */}
  <Button
    variant={ticket.status === "active" ? "secondary" : "default"}
    size="sm"
    className="h-8 px-3 text-xs"
    disabled={togglingId === ticket.id}
    onClick={() =>
      handleToggleStatus(
        ticket.id,
        ticket.status,
        ticket.is_completed,
        ticket.class_session_id
      )
    }
  >
    {togglingId === ticket.id ? (
      <Loader2 className="w-3 h-3 animate-spin" />
    ) : ticket.status === "active" ? (
      "Close"
    ) : ticket.is_completed || ticket.status === "closed" ? (
      <><RotateCcw className="w-3 h-3 mr-1" />Reactivate</>
    ) : (
      <><Play className="w-3 h-3 mr-1" />Activate</>
    )}
  </Button>

  {/* Overflow menu */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <MoreHorizontal className="w-4 h-4" />
        <span className="sr-only">More options</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {ticket.exit_ticket_template_id && (
        <DropdownMenuItem
          onClick={() =>
            navigate(
              `/exit-tickets/create?templateId=${ticket.exit_ticket_template_id}`
            )
          }
        >
          Edit template
        </DropdownMenuItem>
      )}
      {ticket.status === "draft" && !ticket.is_completed && (
        <DropdownMenuItem
          onClick={() => {
            setHomeworkTicketId(ticket.id);
            setHomeworkDueDate("");
            setHomeworkDialogOpen(true);
          }}
        >
          Set as homework
        </DropdownMenuItem>
      )}
      {ticket.is_homework && ticket.status === "active" && (
        <DropdownMenuItem onClick={() => handleCancelHomework(ticket.id)}>
          Cancel homework
        </DropdownMenuItem>
      )}
      {(ticket.is_completed || ticket.status === "closed") && (
        <DropdownMenuItem
          onClick={() => {
            setClearResultsTicketId(ticket.id);
            setClearResultsDialogOpen(true);
          }}
        >
          Reset to draft
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={() =>
          setDeleteRunTicket({
            id: ticket.id,
            templateId: ticket.exit_ticket_template_id,
          })
        }
      >
        Delete from class
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

- [ ] **Step 4: Verify in the browser**

Run `npm run dev` and open a classroom page that has exit tickets. Confirm:
- Each ticket shows only the primary action button + the `•••` icon
- `•••` opens a menu with the correct options for each ticket state (draft, active, closed, homework)
- Delete still triggers its confirmation dialog
- Reset to draft still triggers its confirmation dialog
- Set as homework still opens the due date dialog

- [ ] **Step 5: Commit**

```bash
git add src/components/classroom/ClassroomActivities.tsx
git commit -m "feat: collapse exit ticket secondary actions into overflow menu"
```

---

## Task 2: Dashboard — remove Quick Actions, widen classes grid

**Files:**
- Modify: `src/pages/Dashboard.tsx`

### What to change

- Remove the entire **Quick Actions** `<Card>` block (it duplicates the nav sidebar)
- Remove associated imports no longer needed: `DropdownMenu*`, `Ticket`, `Monitor`, `FileText`, `ChevronDown` (check each is unused before removing)
- Change the grid from `xl:col-span-2` (classes) + `xl:col-span-1` (sidebar) to a **full-width classes grid** — classes take the full `xl:col-span-3`
- Keep the **Due Soon** card but move it **below** the classes grid as a full-width card
- Make each class card **fully clickable** by wrapping the whole `<Card>` in a `<Link>` to `/class/${classItem.id}`, and remove the inner "View" button (keep "Classroom" as a secondary action within the card)

- [ ] **Step 1: Widen the classes section and remove sidebar**

Find the outer grid div (line 136):
```tsx
<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
```

Change to:
```tsx
<div className="space-y-8">
```

Remove the `xl:col-span-2` wrapper div around the classes section and the `xl:col-span-1` sidebar div entirely. This makes both the classes grid and Due Soon card full-width in a vertical stack.

- [ ] **Step 2: Remove Quick Actions card**

Delete the entire Quick Actions `<Card>` block (the card with `<CardTitle>Quick Actions</CardTitle>`). This includes the four buttons inside it (Create New Class, Browse Curriculum, Create Assessment dropdown, Create Exit Ticket).

- [ ] **Step 3: Move Due Soon card below classes**

After the classes grid `</div>`, place the Due Soon card as a standalone full-width card. It already exists — just ensure it's outside any sidebar wrapper. The card itself doesn't need to change.

- [ ] **Step 4: Make class cards fully clickable**

Replace the inner `<Card>` for each class (inside `nonDemoClasses.map`) with a Link-wrapped card:

```tsx
<Link key={classItem.id} to={`/class/${classItem.id}`} className="block">
  <Card className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <div
          className={`shrink-0 w-12 h-12 rounded-xl ${iconConfig.bg} ${iconConfig.text} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold truncate">{classItem.class_name}</h4>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {classItem.subject} • {classItem.year_level}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {classItem.term} • {format(new Date(classItem.start_date), 'MMM yyyy')} –{' '}
            {format(new Date(classItem.end_date), 'MMM yyyy')}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoadingStudentCounts ? (
            <span className="inline-block w-16 h-4 bg-muted rounded animate-pulse" />
          ) : (
            <>
              <span className="font-medium text-foreground">{studentCount}</span> student
              {studentCount !== 1 ? 's' : ''}
            </>
          )}
        </div>
        <Link
          to={`/classroom/${classItem.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="ghost" className="h-8 px-2">
            <Monitor className="w-4 h-4 mr-1.5" />
            Classroom
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
</Link>
```

Note: the `onClick={(e) => e.stopPropagation()}` on the inner Classroom Link prevents the outer card Link from also firing.

- [ ] **Step 5: Clean up unused imports**

After removing Quick Actions, check and remove any now-unused imports from Dashboard.tsx:
- `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator` — remove if only used in Quick Actions
- `Ticket` — remove if only used in Quick Actions
- `FileText` — remove if only used in Quick Actions  
- `ChevronDown` — remove if only used in Quick Actions
- `ArrowRight` — remove if the "View" button is removed (check Demo Classes section still uses it)

- [ ] **Step 6: Verify in the browser**

Run `npm run dev` and open `/dashboard`. Confirm:
- No Quick Actions card
- Classes grid is full width
- Each class card is clickable and navigates to `/class/:id`
- "Classroom" button inside the card still works and doesn't double-navigate
- Due Soon card appears below the classes grid
- Demo Classes card still appears (it lives at the bottom of the old sidebar — move it below Due Soon if needed)
- No TypeScript errors

- [ ] **Step 7: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: remove Quick Actions card, widen classes grid, make class cards clickable"
```
