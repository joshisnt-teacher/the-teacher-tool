# Settings Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `src/pages/Settings.tsx` into a polished single-column scrollable page with a sticky anchor nav and five sections: Profile, Security, School, AI Settings, and Appearance.

**Architecture:** All changes are confined to `src/pages/Settings.tsx` — a full rewrite of the single file. New state variables handle theme, password reset, and active anchor section. An `IntersectionObserver` drives the active nav pill. Theme is client-side only (localStorage + `document.documentElement` class).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth, TanStack React Query, lucide-react

---

## File Map

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Full rewrite — new layout, anchor nav, 5 sections |

No new files. No migrations. No new hooks.

---

### Task 1: Page skeleton — imports, state, handlers, sticky anchor nav

**Files:**
- Modify: `src/pages/Settings.tsx` (replace entire file)

- [ ] **Step 1: Replace the entire file with the new skeleton**

This establishes all imports, state, handlers, the page header, the sticky anchor nav, and five empty section slots. Section card content is filled in Tasks 2–6.

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { useSchools, useCreateSchool, useUpdateUserSchool } from '@/hooks/useSchools';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, User, School, Plus, Bot,
  Eye, EyeOff, Lock, Palette, Sun, Moon, Monitor,
} from 'lucide-react';
import { useOpenAIKeyStatus, useSaveOpenAIKey, useRemoveOpenAIKey } from '@/hooks/useAISettings';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

type Theme = 'light' | 'dark' | 'system';

const getInitials = (name: string | null, email: string): string => {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return email[0]?.toUpperCase() ?? '?';
};

const NAV_SECTIONS = [
  { id: 'profile',    label: 'Profile' },
  { id: 'security',   label: 'Security' },
  { id: 'school',     label: 'School' },
  { id: 'ai',         label: 'AI Settings' },
  { id: 'appearance', label: 'Appearance' },
];

const Settings = () => {
  const { data: currentUser, isLoading } = useCurrentUser();
  const { signOut } = useAuth();
  const { data: schools } = useSchools();
  const createSchoolMutation = useCreateSchool();
  const updateUserSchoolMutation = useUpdateUserSchool();
  const queryClient = useQueryClient();
  const { data: keyStatus } = useOpenAIKeyStatus();
  const saveKeyMutation = useSaveOpenAIKey();
  const removeKeyMutation = useRemoveOpenAIKey();

  // Profile
  const [name, setName] = useState('');
  const [updating, setUpdating] = useState(false);

  // School
  const [uploading, setUploading] = useState(false);
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolDomain, setSchoolDomain] = useState('');

  // AI key
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Security
  const [resetSent, setResetSent] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  // Theme
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'system'
  );

  // Anchor nav
  const [activeSection, setActiveSection] = useState('profile');
  const profileRef    = useRef<HTMLDivElement>(null);
  const securityRef   = useRef<HTMLDivElement>(null);
  const schoolRef     = useRef<HTMLDivElement>(null);
  const aiRef         = useRef<HTMLDivElement>(null);
  const appearanceRef = useRef<HTMLDivElement>(null);

  const sectionRefs = { profile: profileRef, security: securityRef, school: schoolRef, ai: aiRef, appearance: appearanceRef };

  // Sync name field when user data loads
  useEffect(() => {
    if (currentUser?.name) setName(currentUser.name);
  }, [currentUser]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // IntersectionObserver for active nav pill
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3, rootMargin: '-60px 0px 0px 0px' }
    );
    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
  }, []);

  // Handlers
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !name.trim()) return;
    setUpdating(true);
    const { error } = await supabase.from('users').update({ name: name.trim() }).eq('id', currentUser.id);
    if (error) toast.error('Failed to update profile');
    else {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
    setUpdating(false);
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    setResetSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
      redirectTo: window.location.origin,
    });
    if (error) toast.error('Failed to send reset email');
    else setResetSent(true);
    setResetSending(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.school_id) return;
    if (!['ADMIN', 'HOLA'].includes(currentUser.role)) {
      toast.error('Only administrators can update the school logo');
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `school-logo-${currentUser.school_id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('school-logos').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('school-logos').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('schools').update({ logo_url: publicUrl }).eq('id', currentUser.school_id);
      if (updateError) throw updateError;
      toast.success('School logo updated');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    }
    setUploading(false);
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) return;
    createSchoolMutation.mutate({ name: schoolName, domain: schoolDomain || undefined }, {
      onSuccess: (newSchool) => {
        if (currentUser) updateUserSchoolMutation.mutate({ userId: currentUser.id, schoolId: newSchool.id });
        setSchoolName(''); setSchoolDomain(''); setShowCreateSchool(false);
      },
    });
  };

  const handleSelectSchool = (schoolId: string) => {
    if (!currentUser) return;
    updateUserSchoolMutation.mutate({ userId: currentUser.id, schoolId });
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    await saveKeyMutation.mutateAsync(apiKeyInput.trim());
    setApiKeyInput('');
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Page Header */}
      <header className="bg-card border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Sticky Anchor Nav */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {NAV_SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* PROFILE — filled in Task 2 */}
        <div id="profile" ref={profileRef} className="scroll-mt-16">
          {/* placeholder */}
        </div>

        {/* SECURITY — filled in Task 3 */}
        <div id="security" ref={securityRef} className="scroll-mt-16">
          {/* placeholder */}
        </div>

        {/* SCHOOL — filled in Task 4 */}
        <div id="school" ref={schoolRef} className="scroll-mt-16">
          {/* placeholder */}
        </div>

        {/* AI SETTINGS — filled in Task 5 */}
        <div id="ai" ref={aiRef} className="scroll-mt-16">
          {/* placeholder */}
        </div>

        {/* APPEARANCE — filled in Task 6 */}
        <div id="appearance" ref={appearanceRef} className="scroll-mt-16">
          {/* placeholder */}
        </div>

      </main>
    </div>
  );
};

export default Settings;
```

- [ ] **Step 2: Run dev server and verify the page loads**

```bash
npm run dev
```

Open `http://localhost:8080` → navigate to Settings. Expected: page renders with header, sticky nav pills visible, no errors in console. All nav pills are present but sections are empty.

- [ ] **Step 3: Commit skeleton**

```bash
git add src/pages/Settings.tsx
git commit -m "refactor: settings page skeleton — sticky nav, new state, handlers"
```

---

### Task 2: Profile section card

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Replace the Profile placeholder div content**

Find this block in `Settings.tsx`:
```tsx
        {/* PROFILE — filled in Task 2 */}
        <div id="profile" ref={profileRef} className="scroll-mt-16">
          {/* placeholder */}
        </div>
```

Replace with:
```tsx
        {/* PROFILE */}
        <div id="profile" ref={profileRef} className="scroll-mt-16">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar + name summary row */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {getInitials(currentUser?.name ?? null, currentUser?.email ?? '')}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{currentUser?.name || 'No name set'}</p>
                  <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your display name"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={currentUser?.email || ''} disabled className="h-11 bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={currentUser?.role || ''} disabled className="h-11 bg-muted" />
                  <p className="text-xs text-muted-foreground">Role is assigned by your administrator</p>
                </div>

                <Button
                  type="submit"
                  disabled={updating || !name.trim() || name.trim() === (currentUser?.name ?? '')}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
```

- [ ] **Step 2: Verify in browser**

Navigate to Settings. Expected: Profile card visible with avatar circle (initials), name/email summary row, editable name field, disabled email/role fields, Save Changes button (disabled until name is changed).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: settings profile section with avatar initials"
```

---

### Task 3: Security section card

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Replace the Security placeholder div content**

Find:
```tsx
        {/* SECURITY — filled in Task 3 */}
        <div id="security" ref={securityRef} className="scroll-mt-16">
          {/* placeholder */}
        </div>
```

Replace with:
```tsx
        {/* SECURITY */}
        <div id="security" ref={securityRef} className="scroll-mt-16">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  We'll send a reset link to <strong>{currentUser?.email}</strong> so you can set a new password.
                </p>
              </div>
              {resetSent ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  <span>✓</span>
                  <span>Reset email sent — check your inbox</span>
                </div>
              ) : (
                <Button variant="outline" onClick={handlePasswordReset} disabled={resetSending}>
                  {resetSending ? 'Sending...' : 'Send Password Reset Email'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
```

- [ ] **Step 2: Verify in browser**

Navigate to Settings → scroll to or click Security pill. Expected: card visible, email shown in helper text, button present. Click button — expected: button changes to "Sending..." then success message appears. Check email for reset link.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: settings security section with password reset email"
```

---

### Task 4: School section card

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Replace the School placeholder div content**

Find:
```tsx
        {/* SCHOOL — filled in Task 4 */}
        <div id="school" ref={schoolRef} className="scroll-mt-16">
          {/* placeholder */}
        </div>
```

Replace with:
```tsx
        {/* SCHOOL */}
        <div id="school" ref={schoolRef} className="scroll-mt-16">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5" />
                School Information
              </CardTitle>
              <CardDescription>
                {currentUser?.school
                  ? "View and manage your school's profile"
                  : 'Select or create a school to get started'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUser?.school ? (
                <>
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    {currentUser.school.logo_url ? (
                      <img
                        src={currentUser.school.logo_url}
                        alt="School logo"
                        className="w-12 h-12 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center border">
                        <School className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{currentUser.school.name}</p>
                      <p className="text-sm text-muted-foreground">Current school</p>
                    </div>
                  </div>

                  {['ADMIN', 'HOLA'].includes(currentUser?.role || '') ? (
                    <div className="space-y-2">
                      <Label>Update School Logo</Label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Label htmlFor="logo-upload">
                        <Button variant="outline" asChild disabled={uploading}>
                          <span className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload Logo'}
                          </span>
                        </Button>
                      </Label>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Only administrators can update the school logo
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Existing School</Label>
                    {schools && schools.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {schools.map((school) => (
                          <div
                            key={school.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleSelectSchool(school.id)}
                          >
                            <p className="font-medium">{school.name}</p>
                            {school.domain && (
                              <p className="text-sm text-muted-foreground">{school.domain}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No schools found</p>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Create New School</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateSchool(!showCreateSchool)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {showCreateSchool ? 'Cancel' : 'Create School'}
                      </Button>
                    </div>

                    {showCreateSchool && (
                      <form onSubmit={handleCreateSchool} className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="school-name">School Name *</Label>
                          <Input
                            id="school-name"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="Enter school name"
                            className="h-10"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="school-domain">School Domain (Optional)</Label>
                          <Input
                            id="school-domain"
                            value={schoolDomain}
                            onChange={(e) => setSchoolDomain(e.target.value)}
                            placeholder="e.g., school.edu.au"
                            className="h-10"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { setShowCreateSchool(false); setSchoolName(''); setSchoolDomain(''); }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={createSchoolMutation.isPending || !schoolName.trim()}
                          >
                            {createSchoolMutation.isPending ? 'Creating...' : 'Create & Join School'}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
```

- [ ] **Step 2: Verify in browser**

Navigate to Settings → scroll to School. Expected: if user has a school, shows school name + logo placeholder + upload button (admin only). Logic is identical to the previous implementation — just restyled.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: settings school section restyled to match new layout"
```

---

### Task 5: AI Settings section card

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Replace the AI Settings placeholder div content**

Find:
```tsx
        {/* AI SETTINGS — filled in Task 5 */}
        <div id="ai" ref={aiRef} className="scroll-mt-16">
          {/* placeholder */}
        </div>
```

Replace with:
```tsx
        {/* AI SETTINGS */}
        <div id="ai" ref={aiRef} className="scroll-mt-16">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Marking
              </CardTitle>
              <CardDescription>
                Add your OpenAI API key to enable AI-powered marking of student text responses.
                Your key is encrypted and never stored in plain text.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {keyStatus?.hasKey ? (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Key saved</span>
                ) : (
                  <span className="text-sm text-muted-foreground">No key set</span>
                )}
              </div>

              <form onSubmit={handleSaveKey} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <div className="relative">
                    <Input
                      id="openai-key"
                      type={showKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="sk-..."
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses <strong>gpt-4o-mini</strong> — fractions of a cent per response.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saveKeyMutation.isPending || !apiKeyInput.trim()}>
                    {saveKeyMutation.isPending ? 'Saving...' : keyStatus?.hasKey ? 'Update Key' : 'Save Key'}
                  </Button>
                  {keyStatus?.hasKey && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeKeyMutation.mutate()}
                      disabled={removeKeyMutation.isPending}
                    >
                      {removeKeyMutation.isPending ? 'Removing...' : 'Remove Key'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
```

- [ ] **Step 2: Verify in browser**

Navigate to Settings → scroll to AI Settings. Expected: key status shown, input field with show/hide toggle, save/remove buttons functional. Behaviour identical to previous implementation.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: settings AI section restyled to match new layout"
```

---

### Task 6: Appearance section card

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Replace the Appearance placeholder div content**

Find:
```tsx
        {/* APPEARANCE — filled in Task 6 */}
        <div id="appearance" ref={appearanceRef} className="scroll-mt-16">
          {/* placeholder */}
        </div>
```

Replace with:
```tsx
        {/* APPEARANCE */}
        <div id="appearance" ref={appearanceRef} className="scroll-mt-16">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>Choose how the app looks on your device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  {([
                    { value: 'light',  label: 'Light',  Icon: Sun },
                    { value: 'dark',   label: 'Dark',   Icon: Moon },
                    { value: 'system', label: 'System', Icon: Monitor },
                  ] as const).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        theme === value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  System follows your device's theme preference automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
```

- [ ] **Step 2: Verify theme switching in browser**

Navigate to Settings → scroll to Appearance. Expected:
- Three buttons: Light, Dark, System. Active button is highlighted with primary colour.
- Clicking Light: page switches to light mode immediately.
- Clicking Dark: page switches to dark mode immediately.
- Clicking System: follows OS preference.
- Refresh the page — the selected theme should persist (loaded from `localStorage`).

- [ ] **Step 3: Final commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: settings appearance section with light/dark/system theme toggle"
```

---

## Done

All five sections are now implemented. The Settings page is a polished single-column scrollable page with a sticky anchor nav, avatar initials, email-based password reset, restyled school and AI sections, and a persistent theme toggle.
