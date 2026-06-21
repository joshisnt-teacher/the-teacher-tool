import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user } = useAuth();

  React.useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user) {
      window.location.href = '/dashboard';
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Teacher Dashboard
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage your class, track how students are going, and keep assessments in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What you can do in Pulse
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for teachers: track progress, run assessments, and see where students need help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>
                See where each student is at and keep your rolls tidy
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Spot patterns in your data and work out who needs a hand
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Assessment Tools</CardTitle>
              <CardDescription>
                Set up assessments and watch progress update as you go
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-primary/5 border-primary/20 max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to get started?</CardTitle>
            <CardDescription className="text-lg">
              Sign in and get back to teaching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                Sign In to Your Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
