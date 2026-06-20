import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, Activity, BookOpen, Briefcase, GraduationCap, BarChart2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAIUsage } from "@/hooks/useAIUsage";

const HUB_URL = import.meta.env.VITE_CENTRAL_HUB_URL || "https://edufied.com.au";

// Fallback icon mapping based on app slug
const ICON_MAP: Record<string, React.ElementType> = {
  pulse: Activity,
  analytics: BarChart2,
  circuit: BookOpen,
  venture: Briefcase,
};

interface App {
  slug: string;
  name: string;
  base_url: string;
  icon_url: string | null;
}

interface ToolSwitcherProps {
  currentSlug: string;
}

async function fetchTeacherApps(): Promise<App[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (!session) {
    return [];
  }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-teacher-apps`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch teacher apps:", await res.text());
    return [];
  }

  const data = await res.json();
  return data.apps ?? [];
}

async function mintSsoAndRedirect(appSlug: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (!session) {
    window.location.href = `${HUB_URL}/login`;
    return;
  }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mint-teacher-sso`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ app_slug: appSlug }),
    }
  );

  if (!res.ok) {
    console.error("Failed to mint SSO token:", await res.text());
    return;
  }

  const data = await res.json();
  if (data.redirect_url) {
    window.location.href = data.redirect_url;
  }
}

function AIUsageMeter() {
  const { data, isLoading } = useAIUsage();
  if (isLoading || !data) return null;

  return (
    <div className="hidden md:flex items-center gap-1.5 px-2 text-xs opacity-70">
      <span>AI</span>
      <span className="tabular-nums">{data.used}/{data.cap}</span>
    </div>
  );
}

export default function ToolSwitcher({ currentSlug }: ToolSwitcherProps) {
  const { data: apps } = useQuery({
    queryKey: ["teacher-apps"],
    queryFn: fetchTeacherApps,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!apps || apps.length === 0) {
    return null;
  }

  // Always show toolbar — home button + assigned tools
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-sidebar-border bg-sidebar px-2 py-2 shadow-2xl shadow-black/70 ring-1 ring-white/10">
        {/* Home button */}
        <a
          href={`${HUB_URL}/account/overview`}
          title="Back to Edufied"
          className="flex flex-col items-center gap-1 rounded-xl px-5 py-2 transition-all duration-200 text-sidebar-foreground/90 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Home</span>
        </a>

        {/* Tool buttons */}
        {apps.map((app) => {
          const isCurrent = app.slug === currentSlug;
          const Icon = ICON_MAP[app.slug] ?? GraduationCap;

          return (
            <button
              key={app.slug}
              onClick={() => {
                if (!isCurrent) mintSsoAndRedirect(app.slug);
              }}
              disabled={isCurrent}
              title={app.name}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-5 py-2 transition-all duration-200",
                isCurrent
                  ? "bg-primary/10 text-primary cursor-default"
                  : "text-sidebar-foreground/90 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{app.name}</span>
            </button>
          );
        })}

        {/* AI usage meter — teacher-facing, desktop only */}
        <AIUsageMeter />
      </nav>
    </div>
  );
}
