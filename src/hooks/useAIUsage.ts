import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { centralSupabase } from '@/integrations/supabase/centralClient';
import { useAuth } from '@/hooks/useAuth';

export interface AIUsage {
  used: number;
  cap: number;
  plan: string;
}

export const useAIUsage = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-usage', user?.id],
    queryFn: async (): Promise<AIUsage> => {
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('teacher_profiles')
        .select('central_teacher_id')
        .eq('id', user.id)
        .single();

      if (!profile?.central_teacher_id) {
        // Teacher hasn't SSO'd yet — return free defaults
        return { used: 0, cap: 75, plan: 'free' };
      }

      const centralTeacherId = profile.central_teacher_id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [usageResult, subResult, configResult] = await Promise.all([
        centralSupabase
          .from('ai_actions')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', centralTeacherId)
          .gte('created_at', startOfMonth),
        centralSupabase
          .from('subscriptions')
          .select('plan')
          .eq('teacher_id', centralTeacherId)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1),
        centralSupabase
          .from('platform_config')
          .select('free_ai_actions_per_month, pro_ai_actions_per_month')
          .single(),
      ]);

      const used = usageResult.count ?? 0;
      const plan = subResult.data?.[0]?.plan ?? 'free';
      const cfg = configResult.data;
      const cap = (plan === 'pro' || plan === 'school')
        ? (cfg?.pro_ai_actions_per_month ?? 1500)
        : (cfg?.free_ai_actions_per_month ?? 75);

      return { used, cap, plan };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
};
