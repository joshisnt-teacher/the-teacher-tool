import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuestionMutations, QuestionWithMetadata } from '@/hooks/useQuestions';
import { useClassContentItems } from '@/hooks/useClassContentItems';

// Maps any stored question_type variant to the canonical display value
const normaliseQuestionType = (raw: string): string => {
  switch (raw.toLowerCase().replace(/[\s_-]/g, '')) {
    case 'multiplechoice':
    case 'mcq':
      return 'Multiple Choice';
    case 'shortanswer':
      return 'Short Answer';
    case 'extendedanswer':
    case 'extendedresponse':
      return 'Extended Response';
    case 'fillintheblank':
    case 'fillintheblanks':
      return 'Fill in the Blank';
    default:
      // Return capitalised as-is for known values (Essay, True/False, Calculation)
      return raw;
  }
};

// Maps any stored blooms_taxonomy variant to the canonical verb form (Australian English)
const BLOOMS_MAP: Record<string, string> = {
  remember: 'Remember', remembering: 'Remember',
  understand: 'Understand', understanding: 'Understand',
  apply: 'Apply', applying: 'Apply',
  analyse: 'Analyse', analyze: 'Analyse', analysing: 'Analyse', analyzing: 'Analyse',
  evaluate: 'Evaluate', evaluating: 'Evaluate',
  create: 'Create', creating: 'Create',
};

const normaliseBloomsTaxonomy = (raw: string): string =>
  BLOOMS_MAP[raw.toLowerCase()] ?? raw;

interface EditQuestionDialogProps {
  question: QuestionWithMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string;
}

const EditQuestionDialog: React.FC<EditQuestionDialogProps> = ({
  question,
  open,
  onOpenChange,
  classId,
}) => {
  const [formData, setFormData] = useState({
    number: '',
    question: '',
    question_type: '',
    max_score: '',
    content_item: '',
    blooms_taxonomy: '',
  });

  useEffect(() => {
    if (question) {
      setFormData({
        number: question.number?.toString() || '',
        question: question.question || '',
        question_type: question.question_type ? normaliseQuestionType(question.question_type) : '',
        max_score: question.max_score?.toString() || '',
        content_item: question.content_item || '',
        blooms_taxonomy: question.blooms_taxonomy ? normaliseBloomsTaxonomy(question.blooms_taxonomy) : '',
      });
    }
  }, [question]);

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { updateQuestion } = useQuestionMutations();
  const { data: classContentItems = [] } = useClassContentItems(classId);

  // Don't render if question is null
  if (!question) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateQuestion.mutateAsync({
        id: question.id,
        number: parseInt(formData.number),
        question: formData.question,
        question_type: formData.question_type,
        max_score: parseFloat(formData.max_score),
        content_item: formData.content_item,
        blooms_taxonomy: formData.blooms_taxonomy,
      });

      toast({
        title: "Success",
        description: "Question updated successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Question {question.number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="number">Question Number</Label>
              <Input
                id="number"
                type="number"
                value={formData.number}
                onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="max_score">Max Score</Label>
              <Input
                id="max_score"
                type="number"
                step="0.1"
                value={formData.max_score}
                onChange={(e) => setFormData(prev => ({ ...prev, max_score: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="question">Question Text</Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="question_type">Question Type</Label>
            <Select
              value={formData.question_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, question_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                <SelectItem value="Short Answer">Short Answer</SelectItem>
                <SelectItem value="Extended Response">Extended Response</SelectItem>
                <SelectItem value="Essay">Essay</SelectItem>
                <SelectItem value="True/False">True/False</SelectItem>
                <SelectItem value="Fill in the Blank">Fill in the Blank</SelectItem>
                <SelectItem value="Calculation">Calculation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content_item">Content Descriptor</Label>
            {classContentItems.length > 0 ? (
              <Select
                value={formData.content_item}
                onValueChange={(value) => setFormData(prev => ({ ...prev, content_item: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a content descriptor" />
                </SelectTrigger>
                <SelectContent className="max-w-md">
                  {classContentItems.map((item) => (
                    <SelectItem key={item.content_item.id} value={item.content_item.code}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{item.content_item.display_code || item.content_item.code}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">{item.content_item.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="content_item"
                value={formData.content_item}
                onChange={(e) => setFormData(prev => ({ ...prev, content_item: e.target.value }))}
                placeholder="e.g., ACHGK040"
              />
            )}
          </div>

          <div>
            <Label htmlFor="blooms_taxonomy">Bloom's Taxonomy</Label>
            <Select
              value={formData.blooms_taxonomy}
              onValueChange={(value) => setFormData(prev => ({ ...prev, blooms_taxonomy: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Bloom's level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Remember">Remember</SelectItem>
                <SelectItem value="Understand">Understand</SelectItem>
                <SelectItem value="Apply">Apply</SelectItem>
                <SelectItem value="Analyse">Analyse</SelectItem>
                <SelectItem value="Evaluate">Evaluate</SelectItem>
                <SelectItem value="Create">Create</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestionDialog;