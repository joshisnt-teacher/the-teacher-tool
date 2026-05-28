import { Link } from "react-router-dom";

interface EdufiedLogoProps {
  className?: string;
  collapsed?: boolean;
  href?: string;
  toolName?: string;
}

export function EdufiedLogo({ className, collapsed, href = "/dashboard", toolName }: EdufiedLogoProps) {
  const content = (
    <>
      <div
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-5 9 5-9 5-9-5z" />
          <path d="M7 11v4a5 5 0 0010 0v-4" />
        </svg>
      </div>
      {!collapsed && toolName && (
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight leading-tight text-sidebar-foreground">
            {toolName}
          </span>
          <span className="text-[11px] leading-tight text-sidebar-foreground/60">
            by Edufied
          </span>
        </div>
      )}
      {!collapsed && !toolName && (
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          Edufied
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={`flex items-center gap-2 ${className ?? ""}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={`flex items-center gap-2 ${className ?? ""}`}>{content}</div>;
}
