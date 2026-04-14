import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Returns whether the current user has an API key saved
export const useOpenAIKeyStatus = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['openai-key-status', user?.id],
    queryFn: async () => {
      if (!user) return { hasKey: false };
      const { data } = await supabase
        .from('users')
        .select('openai_vault_id')
        .eq('id', user.id)
        .single();
      return { hasKey: !!data?.openai_vault_id };
    },
    enabled: !!user,
  });
};

// Saves a new or updated OpenAI API key to Vault
export const useSaveOpenAIKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      const { error } = await supabase.functions.invoke('save-openai-key', {
        body: { apiKey },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-key-status', user?.id] });
      toast({ title: 'API key saved', description: 'Your OpenAI key is encrypted and stored securely.' });
    },
    onError: () => {
      toast({ title: 'Failed to save key', description: 'Check the key format and try again.', variant: 'destructive' });
    },
  });
};

// Removes the OpenAI API key from Vault
export const useRemoveOpenAIKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('save-openai-key', {
        body: { action: 'delete' },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-key-status', user?.id] });
      toast({ title: 'API key removed' });
    },
    onError: () => {
      toast({ title: 'Failed to remove key', variant: 'destructive' });
    },
  });
};
