import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ConfidenceCheckConfigProps {
  form: UseFormReturn<any>;
}

export const ConfidenceCheckConfig: React.FC<ConfidenceCheckConfigProps> = ({
  form,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Configure Confidence Check</h2>
        <p className="text-muted-foreground">
          Create a question that students will rate their confidence on using a 1-10 scale.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Question</CardTitle>
          <CardDescription>
            Write a clear question or statement that students will assess their confidence on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="question_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question/Statement *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Example: How confident are you in solving quadratic equations?"
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Student Experience Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-background rounded-lg border">
            <p className="font-medium mb-3">
              {form.watch('question_text') || 'Your question will appear here...'}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Rate your confidence level:</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <Badge
                    key={num}
                    variant={num === 5 ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  >
                    {num}
                  </Badge>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Not confident</span>
                <span>Very confident</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Students will click on a number from 1 (not confident) to 10 (very confident) to submit their response.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};