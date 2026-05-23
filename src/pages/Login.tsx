import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogIn, Lock, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';

const CENTRAL_HUB_URL = import.meta.env.VITE_CENTRAL_HUB_URL || 'https://edufied.com.au';

const Login = () => {
  const [showFallback, setShowFallback] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSSOLogin = () => {
    const redirectUri = `${window.location.origin}/auth/teacher/sso`;
    const ssoUrl = `${CENTRAL_HUB_URL}/auth/sso?app=pulse&redirect_uri=${encodeURIComponent(redirectUri)}`;

    const popup = window.open(ssoUrl, 'edufied-sso', 'width=500,height=620,left=400,top=200');

    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'sso_success') return;

      window.removeEventListener('message', onMessage);
      popup?.close();

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      } else {
        toast.error('Sign in failed. Please try again.');
      }
    };

    window.addEventListener('message', onMessage);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error('Invalid email or password');
    } else {
      toast.success('Welcome back!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-background to-cyan-950/30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(56,189,248,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <Card className="w-full max-w-md relative z-10 border-white/10 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-primary/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Teacher Dashboard</CardTitle>
            <CardDescription className="mt-1">
              Sign in with your edufied account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full h-11 shadow-lg shadow-primary/20" onClick={handleSSOLogin}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign in with edufied
          </Button>

          {/* Fallback direct login for admin/dev use */}
          <div>
            <button
              type="button"
              onClick={() => setShowFallback(!showFallback)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mx-auto transition-colors"
            >
              {showFallback ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Direct login
            </button>

            {showFallback && (
              <form onSubmit={handleSignIn} className="space-y-3 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="teacher@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                  <Lock className="w-4 h-4 mr-2" />
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
