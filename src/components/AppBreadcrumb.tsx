import { Link, useLocation, useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Static route segment labels
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Settings",
  "create-class": "Create Class",
  classroom: "Classroom",
  "exit-tickets": "Exit Tickets",
  "create-exit-ticket": "Create Exit Ticket",
  resources: "Resources",
  curriculum: "Curriculum",
  "curriculum-browser": "Curriculum",
  class: "Classes",
  assessment: "Assessment",
  "create-assessment": "Create Assessment",
  student: "Student",
  session: "Session",
  "student-report": "Student Report",
};

interface BreadcrumbSegment {
  label: string;
  href: string;
}

function useAppBreadcrumbs(): BreadcrumbSegment[] {
  const location = useLocation();
  const params = useParams();
  const path = location.pathname;

  // Build segments from path
  const parts = path.split("/").filter(Boolean);
  const segments: BreadcrumbSegment[] = [];

  let currentPath = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    currentPath += `/${part}`;

    // Skip parameter values — we'll label them generically or by context
    if (Object.values(params).includes(part)) {
      // If this is the last segment, show as current page label
      if (i === parts.length - 1) {
        const parent = parts[i - 1];
        const label =
          parent === "class"
            ? "Class"
            : parent === "assessment"
            ? "Assessment"
            : parent === "classroom"
            ? "Classroom"
            : parent === "student"
            ? "Student Report"
            : parent === "session"
            ? "Session"
            : part;
        segments.push({ label, href: currentPath });
      }
      continue;
    }

    const label = ROUTE_LABELS[part] || part.charAt(0).toUpperCase() + part.slice(1);
    segments.push({ label, href: currentPath });
  }

  // Always start with Dashboard if not already there
  if (segments.length === 0 || segments[0].label !== "Dashboard") {
    segments.unshift({ label: "Dashboard", href: "/dashboard" });
  }

  return segments;
}

export function AppBreadcrumb() {
  const segments = useAppBreadcrumbs();

  if (segments.length <= 1) {
    return null;
  }

  // Truncate if more than 4 segments
  const displaySegments =
    segments.length > 4
      ? [
          segments[0],
          { label: "...", href: segments[0].href },
          ...segments.slice(segments.length - 2),
        ]
      : segments;

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-sm text-muted-foreground">
        {displaySegments.map((segment, index) => {
          const isLast = index === displaySegments.length - 1;
          return (
            <BreadcrumbItem key={`${segment.href}-${index}`}>
              {isLast ? (
                <BreadcrumbPage className="text-foreground font-medium">
                  {segment.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={segment.href}>{segment.label}</Link>
                </BreadcrumbLink>
              )}
              {!isLast && <BreadcrumbSeparator className="mx-1" />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
