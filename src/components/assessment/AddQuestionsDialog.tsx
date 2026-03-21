import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuestionMutations } from '@/hooks/useQuestions';
// Question metadata functionality removed
// All metadata functionality removed - import statements cleaned up
import StandaloneQuestionConfiguration, { QuestionConfig } from './StandaloneQuestionConfiguration';

interface AddQuestionsDialogProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddQuestionsDialog: React.FC<AddQuestionsDialogProps> = ({
  taskId,
  open,
  onOpenChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { createQuestion } = useQuestionMutations();

  const handleQuestionsComplete = async (questions: QuestionConfig[]) => {
    setIsLoading(true);
    
    try {
      // Create questions sequentially to maintain order
      for (const [index, question] of questions.entries()) {
        const createdQuestion = await createQuestion.mutateAsync({
          task_id: taskId,
          number: parseInt(question.number) || (index + 1),
          question: question.text || null,
          question_type: question.type || null,
          max_score: question.maxScore,
          content_item: null,
          blooms_taxonomy: null,
          general_capabilities: null,
        });

        // Note: Metadata and tag functionality has been removed for simplicity
      }

      toast({
        title: "Success",
        description: `${questions.length} question${questions.length !== 1 ? 's' : ''} added successfully`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error creating questions:', error);
      toast({
        title: "Error",
        description: "Failed to create questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Questions to Assessment</DialogTitle>
          <DialogDescription>
            Configure the questions for this assessment. You can add multiple questions and specify their details, types, and metadata.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <StandaloneQuestionConfiguration
            onComplete={handleQuestionsComplete}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuestionsDialog;