import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  school_id: string | null;
  school?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export const useCurrentUser = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['currentUser', user?.id],
    queryFn: async (): Promise<CurrentUser | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          school_id,
          schools:school_id (
            id,
            name,
            logo_url
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      return {
        ...data,
        school: Array.isArray(data.schools) ? data.schools[0] : data.schools
      };
    },
    enabled: !!user,
  });
};