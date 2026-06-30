import { useAIUsage } from "@/hooks/useAIUsage";

export function AiUsageIndicator() {
  const { data, isLoading } = useAIUsage();

  if (isLoading || !data) {
    return (
      <div className="px-3 py-2 space-y-1.5">
        <div className="h-3 w-3/4 rounded bg-sidebar-foreground/10 animate-pulse" />
        <div className="h-1.5 w-full rounded-full bg-sidebar-foreground/10 animate-pulse" />
      </div>
    );
  }

  const { used, cap, plan } = data;
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  const atLimit = used >= cap;
  const nearLimit = pct >= 80;

  const barColor = atLimit ? "bg-red-500" : nearLimit ? "bg-amber-500" : "bg-green-500";
  const textColor = atLimit ? "text-red-400" : nearLimit ? "text-amber-400" : "text-green-500";

  return (
    <div className="px-3 py-2 space-y-1.5">
      {plan === 'demo' && (
        <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
          Demo Account
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${textColor}`}>
          {atLimit ? "AI limit reached" : `${used} / ${cap} AI actions`}
        </span>
        <span className="text-xs text-sidebar-foreground/40 capitalize">{plan}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-sidebar-foreground/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atLimit && (
        <p className="text-[10px] text-sidebar-foreground/40">
          {plan === 'demo' ? 'Contact Josh to increase your limit' : 'Upgrade to Pro for more'}
        </p>
      )}
    </div>
  );
}
