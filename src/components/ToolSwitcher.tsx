import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, Activity, FileCheck, BookOpen, Briefcase, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const HUB_URL = import.meta.env.VITE_CENTRAL_HUB_URL || "https://edufied.com.au";

// Fallback icon mapping based on app slug
const ICON_MAP: Record<string, React.ElementType> = {
  pulse: Activity,
  markmaster: FileCheck,
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
    <div className="fixed bottom-0 left-0 right-0 z-50 h-12 border-t border-border bg-sidebar flex items-center px-4 gap-1">
      {/* Home button */}
      <a
        href={`${HUB_URL}/account/overview`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        title="Back to Edufied"
      >
        <Home className="w-4 h-4" />
        <span className="text-xs font-medium hidden sm:inline">Home</span>
      </a>

      {/* Divider */}
      <div className="w-px h-5 bg-border mx-1" />

      {/* Tool buttons */}
      {apps.map((app) => {
        const isCurrent = app.slug === currentSlug;
        const Icon = ICON_MAP[app.slug] ?? GraduationCap;

        return (
          <button
            key={app.slug}
            onClick={() => {
              if (!isCurrent) {
                mintSsoAndRedirect(app.slug);
              }
            }}
            disabled={isCurrent}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${isCurrent
                ? "text-sidebar-foreground bg-sidebar-accent border-t-2 border-primary cursor-default"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:-translate-y-0.5"
              }
            `}
            title={app.name}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{app.name}</span>
          </button>
        );
      })}
    </div>
  );
}
