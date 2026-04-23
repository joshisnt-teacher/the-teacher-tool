import { useState } from 'react';
import bcrypt from 'bcryptjs';
import { centralSupabase } from '@/integrations/supabase/centralClient';

export interface CentralStudent {
  id: string;
  username: string;
  pin: string;
  first_name: string;
  last_name: string;
  year_level: string;
  created_by: string;
  created_at: string;
}

export const useStudentVerification = () => {
  const [isLoading, setIsLoading] = useState(false);

  const verify = async (username: string, pin: string): Promise<CentralStudent | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await centralSupabase
        .from('students')
        .select('*')
        .eq('username', username.trim())
        .single();
      if (error || !data) return null;

      const pinMatches = await bcrypt.compare(pin.trim(), data.pin);
      if (!pinMatches) return null;

      return data as CentralStudent;
    } finally {
      setIsLoading(false);
    }
  };

  return { verify, isLoading };
};
