import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { LogIn, Lock, ChevronDown, ChevronUp } from 'lucide-react';

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
    window.location.href = `${CENTRAL_HUB_URL}/auth/sso?app=pulse&redirect_uri=${encodeURIComponent(redirectUri)}`;
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <LogIn className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Teacher Dashboard</CardTitle>
          <CardDescription>
            Sign in with your edufied account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full h-11" onClick={handleSSOLogin}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign in with edufied
          </Button>

          {/* Fallback direct login for admin/dev use */}
          <div>
            <button
              type="button"
              onClick={() => setShowFallback(!showFallback)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto transition-colors"
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
