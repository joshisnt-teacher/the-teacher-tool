# Resources Page — Implementation Guide for AI Agents

## Overview

A **Resources** page has been built at `/resources` that lets teachers store, search, filter, and manage online teaching resources (websites, videos, maps, primary sources, Kahoots, Blookets, etc.).

This document describes:
1. What currently exists
2. How to wire it to Supabase
3. How to implement "assign resource to class → launch from classroom" (like exit tickets)

---

## 1. What Currently Exists

### Files Created/Modified

| File | Change |
|------|--------|
| `src/pages/Resources.tsx` | **New** — Full Resources page with search, filters, grid layout, inline edit/delete |
| `src/App.tsx` | Added `/resources` route (protected) |
| `src/components/AppSidebar.tsx` | Added "Resources" nav item with `Library` icon |

### Current Features

- **2-column responsive card grid** (1 col on mobile, 2 on desktop)
- **Search** — filters by title, description, or tag
- **Category filter** — dropdown of distinct categories
- **Tag filter** — dropdown of all tags
- **Expand/collapse cards** — chevron arrow toggles detail view
- **Inline edit** — click "Edit" inside expanded card to modify title, URL, description, access notes, how-to-use
- **Inline delete** — click "Delete" to remove from local state
- **Open Resource** button — opens URL in new tab

### Current Data Model (local state only)

```typescript
interface Resource {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  lesson?: string;        // currently hidden from UI, kept for future use
  accessNotes?: string;
  howToUse?: string;
  tags: string[];
}
```

Data lives in a `sampleResources` array inside `Resources.tsx`. All CRUD operations modify local React state via `useState`.

---

## 2. How to Wire to Supabase

### 2.1 Database Schema

Create a new table `resources`:

```sql
create table resources (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  category text not null,
  access_notes text,
  how_to_use text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index idx_resources_school_id on resources(school_id);
create index idx_resources_teacher_id on resources(teacher_id);

-- RLS policies
alter table resources enable row level security;

create policy "Teachers can view resources in their school"
  on resources for select
  using (school_id in (
    select school_id from profiles where id = auth.uid()
  ));

create policy "Teachers can create resources"
  on resources for insert
  with check (teacher_id = auth.uid());

create policy "Teachers can update their own resources"
  on resources for update
  using (teacher_id = auth.uid());

create policy "Teachers can delete their own resources"
  on resources for delete
  using (teacher_id = auth.uid());
```

Also add a trigger to auto-update `updated_at`:

```sql
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger resources_updated_at
  before update on resources
  for each row
  execute function update_updated_at_column();
```

### 2.2 Create a `useResources` Hook

Follow the pattern of `src/hooks/useExitTickets.ts`. Create `src/hooks/useResources.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Resource {
  id: string;
  school_id: string;
  teacher_id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  access_notes: string | null;
  how_to_use: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function useResources(schoolId?: string) {
  return useQuery({
    queryKey: ['resources', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Resource[];
    },
    enabled: !!schoolId,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('resources').insert(resource).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['resources', vars.school_id] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Resource> & { id: string }) => {
      const { data, error } = await supabase.from('resources').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources', data.school_id] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolId }: { id: string; schoolId: string }) => {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      return { id, schoolId };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['resources', vars.schoolId] });
    },
  });
}
```

### 2.3 Update `Resources.tsx`

1. Replace local `sampleResources` / `useState` with `useResources(currentUser?.school_id)`
2. Replace inline `saveEdit` with `useUpdateResource()` mutation
3. Replace inline `deleteResource` with `useDeleteResource()` mutation
4. Add a "Create Resource" button + form (can be a Sheet like exit tickets, or inline)
5. Use `useCreateResource()` for new resources

**Key pattern to follow:** Look at `src/pages/ExitTickets.tsx` — it uses `useExitTickets`, `useCurrentUser`, `useClasses`, and Supabase directly for deletes. Mirror that exactly.

### 2.4 TypeScript Types

Add the Supabase-generated types by running:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/integrations/supabase/types.ts
```

Then update `src/integrations/supabase/client.ts` to use the generated types if not already done.

---

## 3. Assign Resource to Class → Launch from Classroom

This is the **next major feature**. It should work exactly like exit tickets:

- From the Resources page, a teacher can **assign** a resource to a class
- That resource appears in the **Classroom page** as a launchable item
- Clicking it opens the resource URL (unlike exit tickets which start a voting session)

### 3.1 Database Schema

Add a join table `class_resources`:

```sql
create table class_resources (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'created' check (status in ('created', 'active', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(class_id, resource_id)
);

-- Index for fast lookups by class
create index idx_class_resources_class_id on class_resources(class_id);
create index idx_class_resources_resource_id on class_resources(resource_id);

-- RLS
alter table class_resources enable row level security;

create policy "Teachers can view class_resources for their classes"
  on class_resources for select
  using (class_id in (
    select id from classes where teacher_id = auth.uid()
  ));

create policy "Teachers can create class_resources"
  on class_resources for insert
  with check (teacher_id = auth.uid());

create policy "Teachers can update their own class_resources"
  on class_resources for update
  using (teacher_id = auth.uid());

create policy "Teachers can delete their own class_resources"
  on class_resources for delete
  using (teacher_id = auth.uid());
```

**Alternative simpler approach:** Add a `class_id` column directly to `resources` if a resource is only ever assigned to one class at a time. However, the join table is more flexible (same resource assigned to multiple classes).

### 3.2 UI Changes on Resources Page

Inside each expanded card (or via an "Assign" button on the card), add:

```tsx
<Select onValueChange={(classId) => assignToClass(resource.id, classId)}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Assign to class..." />
  </SelectTrigger>
  <SelectContent>
    {classes.map((c) => (
      <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

Create `src/hooks/useClassResources.ts` with queries/mutations for the join table.

### 3.3 UI Changes on Classroom Page

**File:** `src/pages/Classroom.tsx` (or `src/components/classroom/ClassroomActivities.tsx`)

Exit tickets appear in the Classroom page because:
1. The page fetches tasks for the current class
2. It renders them as launchable items
3. Clicking "Launch" navigates to `/classroom/:classId?activateTicket=:ticketId`

**For resources, mirror this pattern:**

1. **Fetch assigned resources** for the current class:
   ```tsx
   const { data: classResources } = useClassResources(classId);
   ```

2. **Display them** in the "Activities" or "Modules" section alongside exit tickets. Each resource card shows:
   - Title
   - Category badge
   - "Launch" button

3. **Launch behavior** — when clicked:
   - Set the resource status to `active` (optional, for tracking)
   - Open the resource URL in a new tab, OR
   - Show it in an iframe/modal within the classroom page
   - The simplest MVP: `window.open(resource.url, '_blank')`

4. **Add to `ClassroomModules` or `ClassroomActivities`** — look at how exit tickets are rendered in `src/components/classroom/ClassroomModules.tsx` or similar. Add a new section:

   ```tsx
   {assignedResources.length > 0 && (
     <div className="space-y-2">
       <h3 className="text-sm font-semibold">Resources</h3>
       {assignedResources.map((ar) => (
         <Card key={ar.id}>
           <CardContent className="py-3 flex items-center justify-between">
             <div>
               <p className="font-medium">{ar.resource.title}</p>
               <Badge variant="secondary">{ar.resource.category}</Badge>
             </div>
             <Button size="sm" onClick={() => launchResource(ar)}>
               <ExternalLink className="w-4 h-4 mr-2" />
               Launch
             </Button>
           </CardContent>
         </Card>
       ))}
     </div>
   )}
   ```

### 3.4 Query Parameter Activation (Optional)

Exit tickets use URL params like `?activateTicket=123` so the classroom page knows which one to auto-launch. You can do the same for resources:

- Assigning a resource navigates to `/classroom/:classId?activateResource=:resourceId`
- `Classroom.tsx` reads `activateResource` from `useSearchParams()`
- Auto-opens the resource URL when that param is present

### 3.5 Suggested Hook: `useClassResources.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClassResource {
  id: string;
  class_id: string;
  resource_id: string;
  teacher_id: string;
  status: 'created' | 'active' | 'closed';
  created_at: string;
  resource: {
    id: string;
    title: string;
    url: string;
    category: string;
  };
}

export function useClassResources(classId?: string) {
  return useQuery({
    queryKey: ['class-resources', classId],
    queryFn: async () => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from('class_resources')
        .select(`
          *,
          resource:resources(id, title, url, category)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClassResource[];
    },
    enabled: !!classId,
  });
}

export function useAssignResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { class_id: string; resource_id: string; teacher_id: string }) => {
      const { data, error } = await supabase.from('class_resources').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['class-resources', vars.class_id] });
    },
  });
}
```

---

## 4. Architecture Summary

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Resources Page │────▶│  resources   │◀────│  useResources   │
│  (/resources)   │     │   table      │     │     hook        │
└─────────────────┘     └──────────────┘     └─────────────────┘
         │
         │ assign
         ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Classroom Page │◀────│ class_resources│───│ useClassResources│
│ (/classroom/:id)│     │   table      │     │     hook        │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

---

## 5. MVP Implementation Order

1. **Supabase table + RLS** — `resources` table
2. **`useResources` hook** — fetch from Supabase
3. **Update `Resources.tsx`** — replace local state with hook, keep inline edit/delete
4. **Add "Create Resource" form** — button + sheet/dialog
5. **`class_resources` join table**
6. **`useClassResources` hook**
7. **"Assign to class" UI** on Resources page
8. **Display assigned resources** on Classroom page with Launch button

---

## 6. Notes for AI Agents

- **Follow existing patterns.** The exit ticket system (`ExitTickets.tsx`, `useExitTickets.ts`, `Classroom.tsx`) is the canonical example. Copy its structure exactly.
- **Use shadcn/ui components.** The project already has `Card`, `Badge`, `Button`, `Input`, `Select`, `Sheet`, `Dialog`, `AlertDialog`, etc. in `src/components/ui/`.
- **Use Tailwind for styling.** The project uses utility classes. Common page background: `bg-gradient-to-br from-primary/5 via-background to-secondary/10`.
- **Icons from lucide-react.** Common ones: `ExternalLink`, `Pencil`, `Trash2`, `Plus`, `Search`, `Filter`, `BookMarked`, `Library`.
- **Toast notifications.** Use `const { toast } = useToast()` for success/error feedback.
- **Auth context.** Use `useCurrentUser()` to get `school_id` and `teacher_id`.
- **Classes hook.** Use `useClasses()` to get the teacher's classes for the "assign to class" dropdown.
