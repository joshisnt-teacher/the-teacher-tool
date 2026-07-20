import { useState } from "react";
import {
  ClipboardList,
  Link2,
  FileText,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { LessonResource } from "@/types/lesson";

const ROLE_LABELS: Record<string, string> = {
  main: "Main",
  extension: "Extension",
  differentiation: "Differentiation",
  reference: "Reference",
  assessment: "Assessment",
};

function ResourceRow({ resource }: { resource: LessonResource }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  const handleOpen = async () => {
    if (resource.kind === "link" && resource.url) {
      window.open(resource.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (resource.kind === "text") {
      setExpanded((v) => !v);
      return;
    }

    setLoadingFile(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: "Not signed in",
          description: "Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch("/api/atlas-resource-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ resource_id: resource.id }),
      });

      const data = (await res.json()) as { url?: string; message?: string; error?: string };

      if (!res.ok || !data.url) {
        toast({
          title: "Could not open resource",
          description: data.message ?? data.error ?? "Unknown error",
          variant: "destructive",
        });
        return;
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast({
        title: "Network error",
        description: "Could not reach the file. Try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {resource.kind === "link" ? (
            <Link2 className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
          ) : (
            <FileText className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{resource.title}</p>
            <Badge variant="outline" className="text-xs mt-1">
              {ROLE_LABELS[resource.role] ?? resource.role}
            </Badge>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleOpen} disabled={loadingFile}>
          {loadingFile ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : resource.kind === "text" ? (
            expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ExternalLink className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      {resource.kind === "text" && expanded && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{resource.text}</p>
      )}
    </div>
  );
}

export function LessonResourcesList({ resources }: { resources: LessonResource[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="w-5 h-5" />
          Lesson Plan
        </CardTitle>
        <CardDescription>Resources ({resources.length})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {resources.map((resource) => (
          <ResourceRow key={resource.id} resource={resource} />
        ))}
      </CardContent>
    </Card>
  );
}
