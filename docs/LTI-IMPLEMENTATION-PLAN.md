# Pulse LTI Advantage 1.3 — Implementation Plan

> **Status:** Draft  
> **Scope:** Pulse (`the-teacher-tool/`) as the LTI 1.3 pilot tool  
> **Target:** 1EdTech LTI Advantage certification (Core + AGS + NRPS + Deep Linking)  
> **Audience:** Future AI agents / developers continuing this work  

**Context:** This document assumes familiarity with the existing Pulse codebase. Pulse is a React 18 SPA (Vite) with Supabase backend (Postgres + Auth + Edge Functions). It currently uses a custom SSO system: the central Edufied hub mints one-time tokens, which Pulse validates via Edge Functions (`teacher-sso`, `student-sso`) and exchanges for local Supabase sessions via magic-link OTP.

---

## 0. Current Architecture Snapshot

| Layer | Key Files |
|---|---|
| **Router** | `src/App.tsx` (react-router-dom v6) |
| **Teacher Auth** | `src/hooks/useAuth.tsx` — Supabase Auth session, localStorage persistence |
| **Student Auth** | `src/hooks/useStudentSession.tsx` — localStorage metadata + Supabase Auth magic link |
| **Inbound SSO** | `src/pages/TeacherSSO.tsx`, `src/pages/StudentSSO.tsx` |
| **SSO Edge Functions** | `supabase/functions/teacher-sso/index.ts`, `supabase/functions/student-sso/index.ts` |
| **Local DB** | `profiles`, `users`/`teacher_profiles`, `students`, `enrolments`, `classes`, `tasks`, `questions`, `results`, `question_results` |
| **Central DB** | `teachers`, `students`, `sso_tokens` (read via Edge Functions) |

**Important constraint:** Pulse is a **React SPA** hosted on Netlify. All LTI server-side endpoints **must** be Supabase Edge Functions (Deno runtime) or Netlify Functions. POST-based launches cannot be handled inside React Router.

---

## 1. LTI 1.3 Specification Requirements (Reference)

### 1.1 Core 1.3 — OIDC Login Flow
1. Tool exposes **Login Initiation URL** (`/lti/login`).
2. Platform sends `iss`, `login_hint`, `target_link_uri`, `client_id`, `lti_message_hint`, `lti_deployment_id`.
3. Tool validates that `(iss, client_id, deployment_id)` is registered.
4. Tool generates `state` (128-bit random, base64url) and `nonce` (128-bit random, base64url).
5. Tool stores `(state, nonce, target_link_uri, platform_id, deployment_id)` with a **5-minute TTL**.
6. Tool redirects browser to Platform's `authorization_endpoint` with:
   - `scope=openid`
   - `response_type=id_token`
   - `prompt=none`
   - `login_hint`
   - `state`, `nonce`
   - `redirect_uri=<tool>/lti/launch`
   - `client_id`
   - `lti_message_hint` (if provided)
7. Platform authenticates user and POSTs `id_token` + `state` to Tool's `redirect_uri`.

### 1.2 Core 1.3 — Launch (`id_token` Validation)
1. Receive POST `application/x-www-form-urlencoded` with `id_token` and `state`.
2. Validate `state` exists and is not expired / consumed. Delete/mark consumed immediately.
3. Decode `id_token` header without verifying signature to extract `kid`.
4. Fetch Platform JWKS. Cache respecting `Cache-Control`.
5. Verify signature with correct `alg` (RS256). **Reject `alg=none`.**
6. Verify claims:
   - `iss` matches registered platform issuer.
   - `aud` contains Tool's `client_id`.
   - `exp` is in the future (allow 60s clock skew).
   - `iat` is not unreasonably old.
   - `nonce` matches stored value.
7. Verify LTI claims:
   - `https://purl.imsglobal.org/spec/lti/claim/message_type` = `LtiResourceLinkRequest`
   - `https://purl.imsglobal.org/spec/lti/claim/version` = `1.3.0`
   - `https://purl.imsglobal.org/spec/lti/claim/resource_link` is present.
8. Extract identity: `sub`, `email`, `given_name`, `family_name`, `name`.
9. Extract roles: `https://purl.imsglobal.org/spec/lti/claim/roles` (array of URNs).
10. Extract context: `https://purl.imsglobal.org/spec/lti/claim/context` (`id`, `label`, `title`, `type`).
11. Extract AGS info: `https://purl.imsglobal.org/spec/lti-ags/claim/endpoint` (`lineitems`, `lineitem`, `scope`).
12. Extract Deep Linking info (if applicable): `https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings`.
13. Extract custom params: `https://purl.imsglobal.org/spec/lti/claim/custom`.

### 1.3 AGS (Assignment & Grade Services)
- **Scope:** `https://purl.imsglobal.org/spec/lti-ags/scope/score`, `.../scope/lineitem`, `.../scope/result.readonly`
- **Score format:**
  ```json
  {
    "scoreGiven": 85.0,
    "scoreMaximum": 100.0,
    "activityProgress": "Completed",
    "gradingProgress": "FullyGraded",
    "timestamp": "2026-05-23T09:00:00.000Z",
    "userId": "<lti-sub>"
  }
  ```
- `activityProgress`: `Initialized`, `Started`, `InProgress`, `Submitted`, `Completed`
- `gradingProgress`: `NotReady`, `Failed`, `Pending`, `PendingManual`, `FullyGraded`

### 1.4 NRPS (Names & Role Provisioning Services)
- **Scope:** `https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly`
- **Endpoint:** `https://platform.example.com/api/lti/nrps/v2/context/<context-id>/memberships`
- **Pagination:** `limit`, `offset` query params; `nextPage` link in response body or `Link` header.
- **Response shape:**
  ```json
  {
    "id": "...",
    "context": { "id": "...", "label": "...", "title": "..." },
    "members": [
      {
        "status": "Active",
        "name": "Jane Doe",
        "picture": "...",
        "given_name": "Jane",
        "family_name": "Doe",
        "email": "jane@example.com",
        "user_id": "<sub>",
        "roles": ["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"]
      }
    ]
  }
  ```

### 1.5 Deep Linking 2.0
- Tool receives `message_type` = `LtiDeepLinkingRequest`.
- Tool renders content selection UI.
- Tool POSTs signed JWT back to `deep_link_return_url` with claim:
  ```json
  "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": [
    {
      "type": "ltiResourceLink",
      "title": "Assessment 1",
      "url": "https://pulse.edufied.com.au/lti/launch",
      "custom": { "assessment_id": "uuid-here" }
    }
  ]
  ```

---

## 2. Database Schema

Add these migrations to `the-teacher-tool/supabase/migrations/`.

### Migration 1: Platform & Deployment Registration

```sql
-- Platforms (one per LMS instance)
CREATE TABLE public.lti_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer text NOT NULL,
  client_id text NOT NULL,
  auth_endpoint text NOT NULL,
  token_endpoint text NOT NULL,
  jwks_uri text NOT NULL,
  created_by_teacher_id uuid REFERENCES public.teacher_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, client_id)
);

-- Deployments (a platform may have multiple deployments, e.g. different schools)
CREATE TABLE public.lti_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id uuid NOT NULL REFERENCES public.lti_platforms(id) ON DELETE CASCADE,
  deployment_id text NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform_id, deployment_id)
);

-- OIDC State / Nonce storage (5-minute TTL, single-use)
CREATE TABLE public.lti_oidc_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL UNIQUE,
  nonce text NOT NULL,
  target_link_uri text NOT NULL,
  platform_id uuid NOT NULL REFERENCES public.lti_platforms(id) ON DELETE CASCADE,
  deployment_id uuid REFERENCES public.lti_deployments(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- LTI Launch Context (persisted per user-session to support AGS/NRPS)
CREATE TABLE public.lti_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deployment_id uuid NOT NULL REFERENCES public.lti_deployments(id) ON DELETE CASCADE,
  resource_link_id text NOT NULL,
  context_id text,
  context_label text,
  context_title text,
  context_type text,
  line_item_url text,
  line_items_url text,
  lis_result_sourcedid text,
  roles text[] NOT NULL DEFAULT '{}',
  custom_claims jsonb NOT NULL DEFAULT '{}',
  target_link_uri text,
  is_deep_linking boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, deployment_id, resource_link_id)
);

-- OAuth2 Access Token cache (for AGS/NRPS service calls)
CREATE TABLE public.lti_platform_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id uuid NOT NULL REFERENCES public.lti_platforms(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  token_type text NOT NULL DEFAULT 'Bearer',
  scope text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_lti_oidc_states_state ON public.lti_oidc_states(state);
CREATE INDEX idx_lti_oidc_states_expires ON public.lti_oidc_states(expires_at);
CREATE INDEX idx_lti_contexts_user_id ON public.lti_contexts(user_id);
CREATE INDEX idx_lti_platform_tokens_platform ON public.lti_platform_tokens(platform_id);

-- RLS: Teachers can manage their own platform registrations
ALTER TABLE public.lti_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lti_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lti_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own LTI platforms"
  ON public.lti_platforms
  FOR ALL
  TO authenticated
  USING (created_by_teacher_id = auth.uid());

CREATE POLICY "Teachers manage own deployments"
  ON public.lti_deployments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lti_platforms p
      WHERE p.id = lti_deployments.platform_id
        AND p.created_by_teacher_id = auth.uid()
    )
  );

CREATE POLICY "Users read own LTI contexts"
  ON public.lti_contexts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Cleanup cron job for expired OIDC states (optional but recommended)
-- Run via pg_cron or edge function scheduler every 5 minutes
```

### Migration 2: Student LTI Subject Mapping

```sql
-- Store the LMS subject identifier so NRPS roster sync can deterministically merge
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS lti_sub text UNIQUE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS lti_email text;
```

---

## 3. Phase Breakdown

---

### Phase 1 — Foundation (Weeks 1–2)

**Goal:** Shared LTI core library + database schema deployed.

#### 3.1.1 Tasks
1. Create `supabase/migrations/2026xxxxxx_add_lti_tables.sql` (schema above).
2. Create shared Edge Function module: `supabase/functions/_shared/lti.ts`.
3. Install `jose` as a vendored dependency for Edge Functions (Deno-compatible).
4. Create teacher-facing registration UI page (minimal): `src/pages/SettingsLti.tsx`.
5. Add navigation link in `src/pages/Settings.tsx`.

#### 3.1.2 Shared Module Contract (`supabase/functions/_shared/lti.ts`)

```typescript
// Types
export interface LtiPlatform {
  id: string;
  issuer: string;
  client_id: string;
  auth_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
}

export interface LtiDeployment {
  id: string;
  platform_id: string;
  deployment_id: string;
  class_id?: string;
}

export interface LtiIdTokenClaims {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  'https://purl.imsglobal.org/spec/lti/claim/message_type': string;
  'https://purl.imsglobal.org/spec/lti/claim/version': string;
  'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
    id: string;
    description?: string;
    title?: string;
  };
  'https://purl.imsglobal.org/spec/lti/claim/roles': string[];
  'https://purl.imsglobal.org/spec/lti/claim/context'?: {
    id: string;
    label?: string;
    title?: string;
    type?: string[];
  };
  'https://purl.imsglobal.org/spec/lti/claim/custom'?: Record<string, string>;
  'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'?: {
    scope?: string[];
    lineitems?: string;
    lineitem?: string;
  };
  'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings'?: {
    deep_link_return_url: string;
    accept_types: string[];
    accept_media_types?: string;
    accept_presentation_document_targets?: string[];
    auto_create?: boolean;
    accept_multiple?: boolean;
    accept_lineitem?: boolean;
    title?: string;
    text?: string;
  };
}

// Functions to implement
export async function fetchPlatformByIssuerClientId(
  supabase: SupabaseClient,
  issuer: string,
  clientId: string,
  deploymentId: string
): Promise<{ platform: LtiPlatform; deployment: LtiDeployment } | null>;

export async function generateStateAndNonce(): Promise<{ state: string; nonce: string }>;

export async function storeOidcState(
  supabase: SupabaseClient,
  params: { state: string; nonce: string; target_link_uri: string; platform_id: string; deployment_id?: string }
): Promise<void>;

export async function consumeOidcState(
  supabase: SupabaseClient,
  state: string
): Promise<{ nonce: string; target_link_uri: string; platform_id: string; deployment_id?: string } | null>;

export async function validateIdToken(
  idToken: string,
  platform: LtiPlatform,
  expectedNonce: string,
  expectedClientId: string
): Promise<LtiIdTokenClaims>;

export async function getPlatformAccessToken(
  supabase: SupabaseClient,
  platform: LtiPlatform,
  scopes: string[]
): Promise<string>;
```

#### 3.1.3 Registration UI
- Route: `/settings/lti` (add to teacher settings area).
- Form fields: Issuer, Client ID, Auth Endpoint, Token Endpoint, JWKS URI, Deployment ID.
- On save: insert into `lti_platforms` and `lti_deployments`.

#### 3.1.4 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `jose` fails in Supabase Edge Functions | Test `jwtVerify` and `createRemoteJWKSet` in a scratch Edge Function before writing launch logic. |
| Migration conflicts with existing 30+ migrations | Use a future-dated timestamp prefix (e.g., `20260701000000_`) and run `supabase db push` to a staging project first. |
| No vendored dependency support in Edge Functions | Use `import { jwtVerify, createRemoteJWKSet } from 'https://esm.sh/jose@5.x'` or vendor the JS files into `supabase/functions/_shared/vendor/jose/`. |

#### 3.1.5 Acceptance Criteria
- [ ] Migrations apply cleanly to staging.
- [ ] `_shared/lti.ts` compiles in Deno (`supabase functions serve`).
- [ ] Teacher can register one Canvas test platform via UI.

---

### Phase 2 — Core LTI 1.3 Endpoints (Weeks 3–4)

**Goal:** A working OIDC login + launch flow that creates a local Supabase session.

#### 3.2.1 Files to Create

| File | Purpose |
|---|---|
| `supabase/functions/lti-login/index.ts` | OIDC Login Initiation handler |
| `supabase/functions/lti-launch/index.ts` | `id_token` receiver + user provisioning |
| `src/pages/LtiCallback.tsx` | React page that exchanges magic-link hash for session |
| `src/App.tsx` | Add `/lti/callback` route |

#### 3.2.2 `lti-login` Edge Function

**Method:** `POST` (or `GET` — 1EdTech accepts both)  
**Verify JWT:** `false` (caller is unauthenticated)

Input (form data or JSON):
- `iss`, `login_hint`, `target_link_uri`, `client_id`, `lti_message_hint`, `lti_deployment_id`

Logic:
1. Look up `lti_platforms` + `lti_deployments` by `(iss, client_id, deployment_id)`.
2. If not found → `403 Forbidden`.
3. Generate `state` and `nonce`.
4. Store in `lti_oidc_states` with `expires_at = now() + interval '5 minutes'`.
5. Build redirect URL to `platform.auth_endpoint` with query params.
6. Return `302 Redirect`.

#### 3.2.3 `lti-launch` Edge Function

**Method:** `POST`  
**Content-Type:** `application/x-www-form-urlencoded`  
**Verify JWT:** `false`

Input:
- `id_token`, `state`

Logic:
1. `consumeOidcState(state)`. If null or expired → `400 Bad Request`.
2. `validateIdToken(id_token, platform, nonce, platform.client_id)`.
3. Extract claims → `sub`, `email`, `name`, `roles`, `resource_link`, `context`, `ags_endpoint`, `custom`.
4. **Determine role:**
   - If `roles` includes `Instructor` / `Admin` → treat as teacher.
   - If `roles` includes `Learner` / `Student` → treat as student.
5. **Find or create local auth user** (reuse logic from `teacher-sso` / `student-sso`):
   - Teacher: search `auth.users` by `email`. If missing, create via `local.auth.admin.createUser({ email, email_confirm: true, user_metadata: { ... } })`. Upsert `teacher_profiles`.
   - Student: search `students` by `lti_sub`. If missing, create `auth.users` with fake email `student-{uuid}@pulse.internal`, create `students` row with `lti_sub = sub`.
6. **Generate magic-link hash** for the newly found/created user (`local.auth.admin.generateLink({ type: 'magiclink', email })`).
7. Insert `lti_contexts` row with user_id, deployment_id, resource_link_id, context info, line_item_url, roles, custom_claims.
8. Redirect to `https://pulse.edufied.com.au/lti/callback?token_hash=<hash>&type=magiclink&target=<target_link_uri>`.

#### 3.2.4 `LtiCallback.tsx`

```tsx
// src/pages/LtiCallback.tsx
export default function LtiCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenHash = searchParams.get('token_hash');
  const target = searchParams.get('target') || '/dashboard';

  useEffect(() => {
    async function handle() {
      if (!tokenHash) { /* error */ return; }
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'magiclink',
      });
      if (error) { /* error */ return; }
      navigate(target, { replace: true });
    }
    handle();
  }, [tokenHash, target, navigate]);

  return <Spinner fullScreen text="Launching Pulse…" />;
}
```

#### 3.2.5 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **POST to static SPA hosting** | Route `/lti/launch` through Supabase Edge Function. Return a `302 Redirect` to the SPA callback route. Never try to handle POST in React Router. |
| **Magic-link expiry race** | Set magic-link TTL to **10 minutes** for LTI (longer than the default 5 min). |
| **Student/teacher role misrouting** | After `verifyOtp`, check `supabase.auth.getUser()` → read `user_metadata.role`. If role is student but `target` is a teacher route, redirect to `/student/dashboard`. |
| **State replay** | Mark `lti_oidc_states.consumed_at = now()` **before** JWT validation. If validation fails, the state is still burned. |
| **JWKS cache stale after LMS key rotation** | Use `createRemoteJWKSet` with `cacheMaxAge` of 5 minutes and catch `JWKS.NoMatchingKey` to force a fresh fetch. |

#### 3.2.6 Acceptance Criteria
- [ ] Canvas (or IMS reference platform) can launch into Pulse without errors.
- [ ] Launch creates a valid Supabase session.
- [ ] Teacher launch lands on `/dashboard`.
- [ ] Student launch lands on `/student/dashboard`.
- [ ] `lti_contexts` row is created with correct `resource_link_id`.

---

### Phase 3 — LTI Session Bridge (Week 5)

**Goal:** Pulse UI components can detect an LTI launch and read context (roles, resource link, custom params).

#### 3.3.1 Tasks
1. Extend `src/hooks/useAuth.tsx` to expose `ltiContext`.
2. Extend `src/hooks/useStudentSession.tsx` to expose `ltiContext`.
3. Update `src/components/ProtectedRoute.tsx` to respect LTI roles.
4. Create `src/hooks/useLtiContext.ts` (isolated hook that queries `lti_contexts`).

#### 3.3.2 Auth Hook Extension

```tsx
// In useAuth.tsx context value
interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  ltiContext: LtiContext | null; // NEW
  signOut: () => Promise<void>;
}

// Fetch lti_context after session is established
useEffect(() => {
  if (user) {
    supabase.from('lti_contexts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setLtiContext(data));
  }
}, [user]);
```

#### 3.3.3 ProtectedRoute Logic

```tsx
// src/components/ProtectedRoute.tsx
const { user, ltiContext, loading } = useAuth();

// If launched via LTI as Learner, force student routing regardless of auth.users metadata
const isLtiStudent = ltiContext?.roles.some(r => r.includes('Learner') || r.includes('Student'));
if (isLtiStudent) {
  return <Navigate to="/student/dashboard" replace />;
}
```

#### 3.3.4 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **LTI context leaks into non-LTI sessions** | On every non-LTI login (email/PW, SSO), clear `lti_contexts` for that user or set `ltiContext = null` in the hook. |
| **Multiple LTI contexts** | A user may launch into two different LMS courses. Use `created_at DESC` + `limit 1` for the "active" context, but consider scoping by `resource_link_id` if the UI needs it. |
| **Iframe localStorage works but feels fragile** | Test in Safari (strictest ITP). If localStorage is blocked in iframe, switch to `supabase.auth.signInWithOtp` flow or use `cookie`-based sessions. However, magic-link OTP + localStorage is generally safer than cookies in iframes. |

#### 3.3.5 Acceptance Criteria
- [ ] `useAuth().ltiContext` returns the correct `resource_link_id` after an LTI launch.
- [ ] `useAuth().ltiContext` is `null` after a normal email login.
- [ ] Student LTI launch cannot access teacher routes.

---

### Phase 4 — LTI Advantage Services (Weeks 6–10)

#### 4.1 AGS — Assignment & Grade Services (Weeks 6–7)

**Goal:** When a teacher saves a result in Pulse, the score is posted back to the LMS gradebook.

##### 4.1.1 Files to Create
- `supabase/functions/lti-ags-post-score/index.ts`
- `src/server/ags.functions.ts` (or inline trigger logic)

##### 4.1.2 `lti-ags-post-score` Edge Function

Input: `result_id` (UUID of a Pulse `results` row)

Logic:
1. Look up `results` → get `student_id`, `task_id`, `raw_score`, `percent_score`, `normalised_percent`.
2. Look up `students` → get `lti_sub`.
3. Look up `lti_contexts` for that student + deployment → get `line_item_url`.
4. If no `line_item_url` → return early (not an LTI session).
5. Call `getPlatformAccessToken(platform, ['https://purl.imsglobal.org/spec/lti-ags/scope/score'])`.
6. POST score to `${line_item_url}/scores`:
   ```json
   {
     "scoreGiven": results.normalised_percent ?? results.percent_score ?? results.raw_score,
     "scoreMaximum": 100,
     "activityProgress": "Completed",
     "gradingProgress": "FullyGraded",
     "timestamp": new Date().toISOString(),
     "userId": student.lti_sub
   }
   ```
7. If `404` from LMS → mark `lti_contexts.line_item_valid = false`.

##### 4.1.3 Trigger Strategy
Option A (recommended): **Database Function + Edge Function invocation**
```sql
CREATE OR REPLACE FUNCTION public.handle_result_for_ags()
RETURNS TRIGGER AS $$
BEGIN
  -- Use pg_net or supabase Edge Function invocation via HTTP
  PERFORM net.http_post(
    url := '<edge-function-url>/lti-ags-post-score',
    headers := '{"Authorization": "Bearer <service-role>", "Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('result_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
> Note: `pg_net` must be enabled in Supabase. Alternatively, call the Edge Function from the client after saving results.

Option B: Client-side call from `AssessmentDetail.tsx` after mutation success.

##### 4.1.4 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **OAuth token expiry during bulk save** | Cache token in `lti_platform_tokens` table. Check expiry before use. Refresh if within 60s of expiry. |
| **LMS line item deleted** | Handle `404` gracefully. Log warning. Do not retry. |
| **Score format rejected** | Always send `scoreMaximum` > 0. Use `normalised_percent` (0–100) as the canonical score. |
| **Duplicate score posts** | AGS is idempotent by `(userId, timestamp)`. Use a deterministic timestamp (e.g., truncate to seconds) or include a `comment` field. |

#### 4.2 NRPS — Names & Role Provisioning (Weeks 8–9)

**Goal:** Sync LMS roster into Pulse `students` + `enrolments`.

##### 4.2.1 Files to Create
- `supabase/functions/lti-nrps-sync/index.ts`
- `src/components/SyncRosterButton.tsx` (optional UI)

##### 4.2.2 `lti-nrps-sync` Edge Function

Input: `class_id`, `deployment_id`

Logic:
1. Look up `lti_contexts` for the class/deployment → get `context_id`.
2. Look up `lti_deployments` → get `platform_id`.
3. Call `getPlatformAccessToken(platform, ['https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly'])`.
4. GET `${platform.base_nrps_url}/${context_id}/memberships?limit=100`.
5. Paginate via `nextPage`.
6. For each member:
   - If `status !== 'Active'` → skip.
   - Upsert `students` by `lti_sub`:
     - `lti_sub = member.user_id`
     - `first_name = member.given_name`
     - `last_name = member.family_name` (or initial)
     - `email = member.email`
   - Upsert `enrolments` (class_id, student_id).
7. Return summary `{ added: N, updated: M, removed: K }`.

##### 4.2.3 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Name privacy (last initial only)** | Truncate `family_name` to first character during upsert to match existing Pulse privacy model. Document this in teacher onboarding. |
| **Existing students with `central_id`** | If a student already exists via Edufied central hub, update `lti_sub` on the existing row rather than creating a duplicate. Match by email first, then by `central_id`. |
| **Pagination differences between LMSs** | Canvas uses `?limit=&offset=`. Moodle may use `?page=`. Implement `nextPage` URL following from response body as the primary method; use `limit`/`offset` as fallback. |

#### 4.3 Deep Linking 2.0 (Week 10)

**Goal:** Teacher can select Pulse content in LMS and embed it.

##### 4.3.1 Files to Create
- `supabase/functions/lti-deep-link/index.ts` (JWT signing)
- `src/pages/LtiDeepLink.tsx`
- `src/App.tsx` — add `/lti/deep_link` route

##### 4.3.2 `lti-deep-link` Edge Function

Input: `deployment_id`, `content_items` (array of selected resources)

Logic:
1. Look up `lti_deployments` + `lti_platforms`.
2. Sign a JWT with the Tool's private key (RS256).
3. Claims:
   ```json
   {
     "iss": platform.client_id,
     "aud": platform.issuer,
     "iat": <now>,
     "exp": <now + 5min>,
     "nonce": <from deep_linking_settings>,
     "https://purl.imsglobal.org/spec/lti/claim/deployment_id": deployment.deployment_id,
     "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": [
       {
         "type": "ltiResourceLink",
         "title": "Task title",
         "url": "https://pulse.edufied.com.au/lti/launch",
         "custom": { "task_id": "uuid" }
       }
     ],
     "https://purl.imsglobal.org/spec/lti-dl/claim/message": "Pulse content selected."
   }
   ```
4. Return the signed JWT to the frontend.

##### 4.3.3 `LtiDeepLink.tsx`

- Renders a picker: list of `tasks` or `exit_ticket_templates` for the teacher.
- On select: call `lti-deep-link` Edge Function, receive JWT.
- Auto-submit a form to `deep_link_return_url`:
  ```html
  <form method="POST" action={deepLinkReturnUrl}>
    <input type="hidden" name="JWT" value={signedJwt} />
    <button type="submit">Confirm</button>
  </form>
  ```

##### 4.3.4 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Private key management** | Generate an RSA key pair. Store private key in Supabase Vault or as an environment variable (`LTI_PRIVATE_KEY_JWK`). Never commit keys. |
| **Iframe UI cramped** | Use a compact list view (not the full dashboard). Max height 600px. |
| **X-Frame-Options blocking** | Configure Netlify headers to allow framing for `/lti/deep_link` only: `Content-Security-Policy: frame-ancestors 'self' https://*.instructure.com https://*.moodle.com;` |

#### 4.4 Acceptance Criteria (Phase 4)
- [ ] Saving a result in Pulse posts a score visible in Canvas gradebook.
- [ ] "Sync roster" button pulls LMS members into Pulse class.
- [ ] Teacher can embed a specific Pulse task into a Canvas module via Deep Linking.

---

### Phase 5 — Certification Testing & Fixes (Weeks 11–13)

**Goal:** Pass the 1EdTech conformance suite.

#### 3.5.1 Testing Setup
1. **Canvas Free-for-Teachers** account: https://canvas.instructure.com
2. **IMS Reference Platform** (optional but recommended): https://www.imsglobal.org/lti-advantage
3. **1EdTech Certification Suite**: https://build.1edtech.org

#### 3.5.2 Test Checklist
- [ ] **OIDC Login** — State generation, nonce validation, redirect URI correctness.
- [ ] **Launch** — JWT signature validation, claim extraction, role mapping.
- [ ] **Security** — `alg=none` rejected, expired tokens rejected, state replay blocked.
- [ ] **AGS** — LineItem read, Score POST with correct `scoreMaximum`, Result readback.
- [ ] **NRPS** — Membership read, pagination, role filtering.
- [ ] **Deep Linking** — Content item selection, JWT response format, return URL submission.
- [ ] **Regression** — Existing custom SSO (edufied.com.au → teacher-sso) still works.
- [ ] **Regression** — Direct student login (username + PIN via `student-login` edge function) still works.

#### 3.5.3 Common Certification Failures to Watch

| Failure | Cause | Fix |
|---|---|---|
| `aud` claim mismatch | Tool validates `aud` as string; LMS sends array with one element. | Accept both `string` and `string[]`. Check inclusion, not equality. |
| `roles` is string not array | Some LMSs send a single string instead of array. | Always normalize to array before processing. |
| Missing `target_link_uri` | Launch handler ignores it and always redirects to `/dashboard`. | Preserve and redirect to stored `target_link_uri` from `lti_oidc_states`. |
| Score POST returns 400 | `scoreGiven` > `scoreMaximum` or missing `scoreMaximum`. | Always include `scoreMaximum`. Validate `scoreGiven <= scoreMaximum` before POST. |
| Deep Linking JWT missing `nonce` | Response JWT must include the `nonce` from `deep_linking_settings`. | Pass `nonce` through the content selection flow. |

#### 3.5.4 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Canvas vs Moodle behaviour gaps** | Run tests against both. Canvas is the priority for Australian schools. |
| **Time spent on edge-case claims** | Budget 1–2 weeks for fixes. The suite is strict about claim shapes. |
| **Cold-start latency fails timeouts** | Use Supabase Pro or ensure Edge Functions are warmed before test runs. |

---

## 4. Master File Inventory

### New Files

```
supabase/migrations/20260701000000_add_lti_tables.sql
supabase/migrations/20260701000001_add_student_lti_sub.sql
supabase/functions/_shared/lti.ts
supabase/functions/lti-login/index.ts
supabase/functions/lti-launch/index.ts
supabase/functions/lti-ags-post-score/index.ts
supabase/functions/lti-nrps-sync/index.ts
supabase/functions/lti-deep-link/index.ts
src/pages/LtiCallback.tsx
src/pages/LtiDeepLink.tsx
src/pages/SettingsLti.tsx
src/hooks/useLtiContext.ts
src/lib/lti.ts
```

### Modified Files

```
supabase/config.toml           (add new functions, verify_jwt rules)
src/App.tsx                    (add routes: /lti/callback, /lti/deep_link)
src/hooks/useAuth.tsx          (add ltiContext)
src/hooks/useStudentSession.tsx (add ltiContext for student launches)
src/components/ProtectedRoute.tsx (respect LTI roles)
src/pages/Settings.tsx         (add LTI registration link)
src/integrations/supabase/types.ts (regenerate after migrations)
```

---

## 5. Environment Variables

Add to `.env` and Netlify environment settings:

```bash
# Pulse local Supabase (existing)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Central Edufied (existing)
VITE_CENTRAL_SUPABASE_URL=
VITE_CENTRAL_SUPABASE_ANON_KEY=

# LTI Tool-specific (NEW)
LTI_PRIVATE_KEY_JWK=          # RSA private key as JWK JSON string for Deep Linking JWT signing
LTI_PUBLIC_KEY_JWK=           # RSA public key as JWK JSON string (published at /.well-known/jwks.json if needed)
```

> **Security:** `LTI_PRIVATE_KEY_JWK` must never be exposed to the browser. It is only used in Edge Functions (`Deno.env.get('LTI_PRIVATE_KEY_JWK')`).

---

## 6. Rollback Plan

If certification fails or priorities shift:

1. **Disable LTI endpoints** without code changes: remove `/lti/*` DNS routes or return `404` from Edge Functions.
2. **LTI does not break existing auth:** The existing `teacher-sso`, `student-sso`, `student-login`, and direct email/PW flows are untouched. LTI is purely additive.
3. **Database cleanup:** If abandoning LTI entirely, drop the four `lti_*` tables and remove `students.lti_sub`. No existing tables are modified (only `ALTER TABLE ... ADD COLUMN` on `students`).

---

## 7. Decision Log (for future agents)

| Decision | Rationale |
|---|---|
| **React SPA, not SSR, for launch** | Pulse is a React SPA. The launch endpoint is an Edge Function that redirects into the SPA. This mirrors the existing magic-link flow. |
| **Magic-link OTP for session establishment** | Reuses existing `teacher-sso` / `student-sso` pattern. Avoids iframe cookie issues. |
| **Shared module in Edge Functions** | `_shared/lti.ts` is vendored into every function. Keep it dependency-free except for `jose`. |
| **AGS triggered by DB change** | Prefer `pg_net` HTTP trigger or post-save client call. Do not refactor every save mutation. |
| **NRPS upserts by `lti_sub`** | `sub` from LTI is the canonical LMS identity. Store it in `students.lti_sub` for deterministic merges. |

---

*End of Implementation Plan*
