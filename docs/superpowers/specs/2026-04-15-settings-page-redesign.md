# Settings Page Redesign

**Date:** 2026-04-15  
**Status:** Approved

---

## Overview

Redesign the existing Settings page (`src/pages/Settings.tsx`) into a polished, app-like standalone page. The page keeps its own header (back button + title + sign out) and renders outside the sidebar layout. The main change is a shift from a 2-column card grid to a single-column scrollable layout with a sticky anchor nav.

---

## Layout

### Header
No changes. Existing header with back-to-dashboard button, page title, and sign out button stays as-is.

### Sticky Anchor Nav
- Positioned just below the header; becomes sticky (`position: sticky; top: 0`) when scrolled past
- Five pill-style buttons: **Profile · Security · School · AI Settings · Appearance**
- Active pill highlights when its corresponding section is visible using `IntersectionObserver`
- Clicking a pill smooth-scrolls to the target section

### Content Area
- Single column, `max-w-2xl`, centered with `mx-auto`
- Each section is a shadcn/ui `<Card>` with consistent vertical spacing between cards
- Each card has: icon + title in `<CardHeader>`, description line, form content in `<CardContent>`

---

## Sections

### 1. Profile
- **Avatar row:** Initials-based circle avatar (no upload) + Display Name field side by side at the top for visual weight
- **Editable fields:** Display Name
- **Read-only fields:** Email (greyed, `bg-muted`), Role (greyed, `bg-muted`) — each with helper text explaining they cannot be changed
- **Save button:** Disabled until the name value actually differs from the saved value

### 2. Security
- **Content:** Single "Send Password Reset Email" button
- **Behaviour:** Calls `supabase.auth.resetPasswordForEmail(currentUser.email)` on click
- **Success state:** Button disables, green confirmation message appears inline: "Reset email sent — check your inbox"
- **Helper text:** One line below the button explaining what will happen (e.g. "We'll send a link to your email address to set a new password")
- No current-password field required

### 3. School
- Same logic as existing: shows current school info + logo upload (admin only), or school selection/creation form if no school is linked
- Restyled to match the single-column card pattern (no layout changes to the logic)

### 4. AI Settings
- Same logic as existing: OpenAI API key status, save key form, remove key button
- Restyled to match the single-column card pattern

### 5. Appearance
- **Control:** Segmented 3-button toggle: **Light · Dark · System**
- **Behaviour:** Applies immediately by toggling `dark` class on `document.documentElement`
- **System** option: reads `window.matchMedia('(prefers-color-scheme: dark)')` and applies accordingly, also sets up a listener to follow OS changes
- **Persistence:** Saves preference to `localStorage` under key `theme`; reads on page load (this logic can live in a small `useTheme` hook or inline in the component)
- No backend storage required — purely client-side

---

## Implementation Notes

- All changes are confined to `src/pages/Settings.tsx`
- No new routes, hooks (except optionally a `useTheme` inline hook), or database changes needed
- `IntersectionObserver` for active nav pill: observe each section ref, update active state when section crosses the viewport threshold (~10% visible)
- The `useTheme` logic (read from localStorage, apply class, listen for system changes) can be self-contained inside the Settings component or extracted to a small hook if preferred
- Supabase password reset: `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })` — no extra Supabase config needed beyond what is already set up

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Full rewrite — new layout, anchor nav, 5 sections |

No migrations, no new hooks required (theme logic is inline).
