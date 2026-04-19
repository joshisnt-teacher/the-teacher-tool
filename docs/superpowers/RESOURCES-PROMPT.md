# Prompt: Implement Resources Backend + Classroom Launch Feature

## Context

I am a teacher building a tool to manage my classroom. I already have a **Resources** page where I can store links to websites, videos, maps, primary sources, Kahoots, Blookets — anything I use in lessons. Right now it only uses local sample data and edits don't persist.

I want you to **wire this page to Supabase** so my resources are saved properly, and then let me **assign resources to a class and launch them from the Classroom page** — just like I already do with exit tickets.

## Where to Start

1. **Read the implementation guide first:**
   ```
   docs/superpowers/RESOURCES-IMPLEMENTATION.md
   ```
   This has the full database schema, hook patterns, and architecture. Read it completely before writing any code.

2. **Study the existing patterns:**
   - `src/hooks/useExitTickets.ts` — this is the exact pattern to copy for `useResources.ts`
   - `src/pages/ExitTickets.tsx` — see how exit tickets are fetched, filtered, edited, deleted, and launched
   - `src/pages/Classroom.tsx` — see how exit tickets appear in the classroom and get activated
   - `src/pages/Resources.tsx` — the page you are wiring up (currently local state only)
   - `src/components/AppSidebar.tsx` — nav is already done

## What I Need You to Do

### Phase 1: Persist Resources to Supabase

- Create the `resources` table in Supabase (SQL migration or direct query)
- Add RLS policies so teachers only see resources from their school
- Create `src/hooks/useResources.ts` with `useResources`, `useCreateResource`, `useUpdateResource`, `useDeleteResource`
- Update `src/pages/Resources.tsx` to use these hooks instead of local state
- Add a "Create Resource" button + form (a Sheet from the side, like creating exit tickets, or a dialog — your choice)
- Keep the inline edit and delete working, but now they hit Supabase
- Show loading skeletons while fetching
- Show toast notifications on success/error

### Phase 2: Assign Resources to a Class

- Create the `class_resources` join table in Supabase
- Create `src/hooks/useClassResources.ts` with `useClassResources` and `useAssignResource`
- On the Resources page, add an "Assign to class" dropdown inside each expanded card (or as an action button on the card)
- Use `useClasses()` to populate the dropdown with my classes
- When I assign a resource, it should appear for that class on the Classroom page

### Phase 3: Launch from Classroom

- Update the Classroom page (or `ClassroomModules` / `ClassroomActivities` component) to show assigned resources alongside exit tickets
- Each assigned resource should have a **"Launch"** button
- Clicking Launch opens the resource URL in a new tab
- Optional but nice: auto-launch via query param (`?activateResource=...`) just like exit tickets do

## Constraints

- **Follow existing code patterns exactly.** Use the same hooks structure, Supabase client, shadcn/ui components, Tailwind classes, and lucide-react icons that the rest of the app uses.
- **Minimal changes.** Don't refactor unrelated code. Don't change the visual design of the Resources page unless necessary.
- **Mobile-friendly.** The grid is already responsive (2 columns desktop, 1 column mobile). Keep it that way.
- **No breaking changes.** The existing exit ticket system should work exactly the same.

## Success Criteria

- [ ] I can create a new resource and it saves to Supabase
- [ ] I can edit a resource inline and changes persist
- [ ] I can delete a resource and it disappears
- [ ] I can search/filter resources and results come from Supabase
- [ ] I can assign a resource to a class from the Resources page
- [ ] On the Classroom page, I see my assigned resources with a Launch button
- [ ] Clicking Launch opens the resource URL
- [ ] Everything works with proper loading states and error handling

## If You Have Questions

- Check `RESOURCES-IMPLEMENTATION.md` — it has SQL, hook examples, and architecture diagrams
- Check `ExitTickets.tsx` and `useExitTickets.ts` — they are the canonical reference
- If still unsure, ask me before making architectural decisions
