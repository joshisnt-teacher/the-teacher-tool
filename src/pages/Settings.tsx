import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { useSchools, useCreateSchool, useUpdateUserSchool } from '@/hooks/useSchools';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Upload, User, School, Plus, Bot, Eye, EyeOff } from 'lucide-react';
import { useOpenAIKeyStatus, useSaveOpenAIKey, useRemoveOpenAIKey } from '@/hooks/useAISettings';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const Settings = () => {
  const { data: currentUser, isLoading } = useCurrentUser();
  const { signOut } = useAuth();
  const { data: schools } = useSchools();
  const createSchoolMutation = useCreateSchool();
  const updateUserSchoolMutation = useUpdateUserSchool();
  
  const [name, setName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolDomain, setSchoolDomain] = useState('');
  const queryClient = useQueryClient();
  const { data: keyStatus } = useOpenAIKeyStatus();
  const saveKeyMutation = useSaveOpenAIKey();
  const removeKeyMutation = useRemoveOpenAIKey();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    await saveKeyMutation.mutateAsync(apiKeyInput.trim());
    setApiKeyInput('');
  };

  React.useEffect(() => {
    if (currentUser?.name) {
      setName(currentUser.name);
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !name.trim()) return;

    setUpdating(true);
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', currentUser.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
    setUpdating(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.school_id) return;

    // Check if user can update logo
    if (!['ADMIN', 'HOLA'].includes(currentUser.role)) {
      toast.error('Only administrators can update the school logo');
      return;
    }

    setUploading(true);
    
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `school-logo-${currentUser.school_id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('school-logos')
        .getPublicUrl(fileName);

      // Update school record
      const { error: updateError } = await supabase
        .from('schools')
        .update({ logo_url: publicUrl })
        .eq('id', currentUser.school_id);

      if (updateError) {
        throw updateError;
      }

      toast.success('School logo updated successfully');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    }
    
    setUploading(false);
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) return;

    createSchoolMutation.mutate({
      name: schoolName,
      domain: schoolDomain || undefined,
    }, {
      onSuccess: (newSchool) => {
        // Automatically assign the new school to the current user
        if (currentUser) {
          updateUserSchoolMutation.mutate({
            userId: currentUser.id,
            schoolId: newSchool.id,
          });
        }
        setSchoolName('');
        setSchoolDomain('');
        setShowCreateSchool(false);
      },
    });
  };

  const handleSelectSchool = async (schoolId: string) => {
    if (!currentUser) return;

    updateUserSchoolMutation.mutate({
      userId: currentUser.id,
      schoolId,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your display name"
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="h-11 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={currentUser?.role || ''}
                    disabled
                    className="h-11 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Role is assigned by your administrator
                  </p>
                </div>

                <Button type="submit" disabled={updating || !name.trim()}>
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* School Settings */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5" />
                School Information
              </CardTitle>
              <CardDescription>
                {currentUser?.school ? 'View and manage your school\'s profile' : 'Select or create a school to get started'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUser?.school ? (
                // User has a school - show current school info
                <>
                  <div className="space-y-2">
                    <Label>Current School</Label>
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <div className="font-medium">{currentUser.school.name}</div>
                      {currentUser.school.logo_url && (
                        <div className="mt-2">
                          <img 
                            src={currentUser.school.logo_url} 
                            alt="School logo" 
                            className="w-12 h-12 rounded object-cover border"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>School Logo</Label>
                    <div className="flex items-center gap-4">
                      {currentUser.school.logo_url ? (
                        <img 
                          src={currentUser.school.logo_url} 
                          alt="School logo" 
                          className="w-16 h-16 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border">
                          <School className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      
                      {['ADMIN', 'HOLA'].includes(currentUser?.role || '') && (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={uploading}
                            className="hidden"
                            id="logo-upload"
                          />
                          <Label htmlFor="logo-upload">
                            <Button variant="outline" asChild disabled={uploading}>
                              <span className="cursor-pointer">
                                <Upload className="w-4 h-4 mr-2" />
                                {uploading ? 'Uploading...' : 'Upload Logo'}
                              </span>
                            </Button>
                          </Label>
                        </div>
                      )}
                    </div>
                    
                    {!['ADMIN', 'HOLA'].includes(currentUser?.role || '') && (
                      <p className="text-xs text-muted-foreground">
                        Only administrators can update the school logo
                      </p>
                    )}
                  </div>
                </>
              ) : (
                // User doesn't have a school - show school selection/creation
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Existing School</Label>
                    {schools && schools.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {schools.map((school) => (
                          <div 
                            key={school.id}
                            className="p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleSelectSchool(school.id)}
                          >
                            <div className="font-medium">{school.name}</div>
                            {school.domain && (
                              <div className="text-sm text-muted-foreground">{school.domain}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No schools found</p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label>Create New School</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateSchool(!showCreateSchool)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {showCreateSchool ? 'Cancel' : 'Create School'}
                      </Button>
                    </div>

                    {showCreateSchool && (
                      <form onSubmit={handleCreateSchool} className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="school-name">School Name *</Label>
                          <Input
                            id="school-name"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="Enter school name"
                            className="h-10"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="school-domain">School Domain (Optional)</Label>
                          <Input
                            id="school-domain"
                            value={schoolDomain}
                            onChange={(e) => setSchoolDomain(e.target.value)}
                            placeholder="e.g., school.edu.au"
                            className="h-10"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowCreateSchool(false);
                              setSchoolName('');
                              setSchoolDomain('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={createSchoolMutation.isPending || !schoolName.trim()}
                          >
                            {createSchoolMutation.isPending ? 'Creating...' : 'Create & Join School'}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Marking
              </CardTitle>
              <CardDescription>
                Add your OpenAI API key to enable AI-powered marking of student text responses.
                Your key is encrypted and never stored in plain text.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {keyStatus?.hasKey ? (
                  <span className="text-sm text-green-600 font-medium">Key saved</span>
                ) : (
                  <span className="text-sm text-muted-foreground">No key set</span>
                )}
              </div>

              <form onSubmit={handleSaveKey} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <div className="relative">
                    <Input
                      id="openai-key"
                      type={showKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="sk-..."
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses <strong>gpt-4o-mini</strong> — fractions of a cent per response.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={saveKeyMutation.isPending || !apiKeyInput.trim()}
                  >
                    {saveKeyMutation.isPending ? 'Saving...' : keyStatus?.hasKey ? 'Update Key' : 'Save Key'}
                  </Button>
                  {keyStatus?.hasKey && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeKeyMutation.mutate()}
                      disabled={removeKeyMutation.isPending}
                    >
                      {removeKeyMutation.isPending ? 'Removing...' : 'Remove Key'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;