import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Class } from '@/hooks/useClasses';

interface ClassBasicTabProps {
  classData: Class;
  onClose: () => void;
}

export const ClassBasicTab: React.FC<ClassBasicTabProps> = ({ classData, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    class_name: classData.class_name,
    subject: classData.subject,
    year_level: classData.year_level,
    term: classData.term,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBasicSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          class_name: formData.class_name,
          subject: formData.subject,
          year_level: formData.year_level,
          term: formData.term,
        })
        .eq('id', classData.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({ title: 'Settings Updated', description: 'Class basic settings have been updated successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update class settings.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    setIsDeletingClass(true);
    try {
      const { error } = await supabase.from('classes').delete().eq('id', classData.id);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      onClose();
      toast({ title: 'Class Deleted', description: `${classData.class_name} has been permanently deleted.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete class.', variant: 'destructive' });
    } finally {
      setIsDeletingClass(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Basic Class Information
        </CardTitle>
        <CardDescription>Update the basic details of your class</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="class_name">Class Name</Label>
            <Input
              id="class_name"
              value={formData.class_name}
              onChange={(e) => handleInputChange('class_name', e.target.value)}
              placeholder="e.g., Mathematics 10A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="e.g., Mathematics"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year_level">Year Level</Label>
            <Input
              id="year_level"
              value={formData.year_level}
              onChange={(e) => handleInputChange('year_level', e.target.value)}
              placeholder="e.g., 10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term">Term</Label>
            <Input
              id="term"
              value={formData.term}
              onChange={(e) => handleInputChange('term', e.target.value)}
              placeholder="e.g., Term 1"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeletingClass}>
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeletingClass ? 'Deleting...' : 'Delete Class'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Class</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{classData.class_name}"? This action cannot be undone and will permanently remove:
                  <br />• All students in this class
                  <br />• All assessments and their results
                  <br />• All class sessions and notes
                  <br />• All progress tracking data
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteClass}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Class
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSaveBasicSettings} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
