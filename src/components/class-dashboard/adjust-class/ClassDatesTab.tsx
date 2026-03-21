import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Class } from '@/hooks/useClasses';

interface ClassDatesTabProps {
  classData: Class;
}

export const ClassDatesTab: React.FC<ClassDatesTabProps> = ({ classData }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(classData.start_date);
  const [endDate, setEndDate] = useState(classData.end_date);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveDateRange = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({ start_date: startDate, end_date: endDate })
        .eq('id', classData.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      await queryClient.invalidateQueries({ queryKey: ['timeline-data'] });
      toast({ title: 'Date Range Updated', description: 'Class date range has been updated successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update date range.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Class Date Range
        </CardTitle>
        <CardDescription>Adjust the start and end dates for your class</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Changing date ranges may affect timeline visualizations and assessment filtering.
            Ensure all existing assessments fall within the new date range.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Current: {format(new Date(classData.start_date), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Current: {format(new Date(classData.end_date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveDateRange} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Update Date Range'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
