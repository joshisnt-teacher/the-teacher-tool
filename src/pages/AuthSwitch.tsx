import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CENTRAL_HUB_URL = import.meta.env.VITE_CENTRAL_HUB_URL || 'https://edufied.com.au';
const APP_SLUG = 'pulse';
const LANDING_ROUTE = '/dashboard';

// Fast-switch entry point for the Edufied toolbar. If this app already has a
// saved session we go straight in; otherwise we bounce through the hub's
// silent SSO flow, which lands on /auth/teacher/sso as usual.
const AuthSwitch = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        navigate(LANDING_ROUTE, { replace: true });
      } else {
        const redirectUri = `${window.location.origin}/auth/teacher/sso`;
        window.location.replace(
          `${CENTRAL_HUB_URL}/auth/sso?app=${APP_SLUG}&redirect_uri=${encodeURIComponent(redirectUri)}`
        );
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Opening…</p>
      </div>
    </div>
  );
};

export default AuthSwitch;
