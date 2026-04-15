import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestions, Question, QuestionWithMetadata } from "@/hooks/useQuestions";
import { useQuestionResults } from "@/hooks/useQuestionResults";
import { Edit, Plus, BarChart3, Trash2 } from "lucide-react";
import { useState } from "react";
import AddQuestionsDialog from "./AddQuestionsDialog";

import EditQuestionDialog from "./EditQuestionDialog";
import { QuestionAnalysisView } from './QuestionAnalysisView';
import { QuestionCard } from './QuestionCard';
import { useToast } from '@/hooks/use-toast';
import { useQuestionMutations } from '@/hooks/useQuestions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuestionsTabProps {
  taskId: string;
  classId?: string;
}

export const QuestionsTab = ({ taskId, classId }: QuestionsTabProps) => {
  const { data: questions, isLoading: questionsLoading } = useQuestions(taskId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [showAnalysisFor, setShowAnalysisFor] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithMetadata | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<QuestionWithMetadata | null>(null);
  const { toast } = useToast();
  const { deleteQuestion } = useQuestionMutations();

  const handleDeleteQuestion = async (question: QuestionWithMetadata) => {
    try {
      await deleteQuestion.mutateAsync(question.id);
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      setDeletingQuestion(null);
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getQuestionTypeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'multiple choice':
      case 'multiple_choice':
      case 'mcq':
        return 'bg-blue-100 text-blue-800';
      case 'short answer':
      case 'short_answer':
        return 'bg-green-100 text-green-800';
      case 'essay':
      case 'extended answer':
      case 'extended_answer':
      case 'extended response':
        return 'bg-purple-100 text-purple-800';
      case 'calculation':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (questionsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="p-8 text-center">
          <div className="text-muted-foreground mb-4">
            No questions have been added to this assessment yet.
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Questions
            </Button>
          </div>
          </CardContent>
        </Card>
        
        <AddQuestionsDialog 
          taskId={taskId}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
        <div className="flex gap-3">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questions.map((question) => (
          <div key={question.id} className="space-y-4">
            <QuestionCard 
              question={question} 
              onViewAnalysis={() => setShowAnalysisFor(
                showAnalysisFor === question.id ? null : question.id
              )}
              onEdit={() => setEditingQuestion(question)}
              onDelete={() => setDeletingQuestion(question)}
            />
            {showAnalysisFor === question.id && (
              <div className="col-span-full">
                <QuestionAnalysisView question={question} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <AddQuestionsDialog 
        taskId={taskId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <EditQuestionDialog
        question={editingQuestion}
        open={!!editingQuestion}
        onOpenChange={(open) => !open && setEditingQuestion(null)}
        classId={classId}
      />

      <AlertDialog open={!!deletingQuestion} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Question {deletingQuestion?.number}? This action cannot be undone.
              All associated results and metadata will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingQuestion && handleDeleteQuestion(deletingQuestion)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};