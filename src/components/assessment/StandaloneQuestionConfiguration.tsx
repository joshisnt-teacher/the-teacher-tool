import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileQuestion, BookOpen, Target, Brain, Plus, Trash2 } from 'lucide-react';
import { ContentItemSelector } from './ContentItemSelector';
import { TagSelector } from './TagSelector';

export interface QuestionConfig {
  id?: string; // For editing existing questions
  number: string;
  text: string;
  type: string;
  maxScore: number;
  contentDescriptor: string;
  keySkill: string;
  bloomsTaxonomyTagId: string;
  contentItemIds: string[];
  conceptTagIds: string[];
  capabilityTagIds: string[];
}

interface StandaloneQuestionConfigurationProps {
  initialQuestions?: QuestionConfig[];
  onComplete: (questions: QuestionConfig[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const StandaloneQuestionConfiguration: React.FC<StandaloneQuestionConfigurationProps> = ({
  initialQuestions = [],
  onComplete,
  onCancel,
  isLoading = false,
}) => {
  const [questions, setQuestions] = useState<QuestionConfig[]>(
    initialQuestions.length > 0 ? initialQuestions : [createEmptyQuestion(1)]
  );

  function createEmptyQuestion(number: number): QuestionConfig {
    return {
      number: number.toString(),
      text: '',
      type: '',
      maxScore: 1,
      contentDescriptor: '',
      keySkill: '',
      bloomsTaxonomyTagId: '',
      contentItemIds: [],
      conceptTagIds: [],
      capabilityTagIds: [],
    };
  }

  const addQuestion = () => {
    const nextNumber = questions.length + 1;
    setQuestions(prev => [...prev, createEmptyQuestion(nextNumber)]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof QuestionConfig, value: string | number | string[]) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const handleSave = () => {
    onComplete(questions);
  };

  const canSave = questions.length > 0 && questions.every(q => 
    q.number.trim() !== '' && q.maxScore > 0
  );

  return (
    <div className="space-y-6">
      {/* Questions Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5" />
            Questions Configuration ({questions.length} question{questions.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full">
            <div className="space-y-4 pr-4">
              {questions.map((question, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <span className="text-sm text-muted-foreground">Question {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{question.maxScore} mark{question.maxScore !== 1 ? 's' : ''}</Badge>
                      {questions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Question Number</Label>
                      <Input
                        value={question.number}
                        onChange={(e) => updateQuestion(index, 'number', e.target.value)}
                        placeholder="e.g., Q1, 1a, 2.1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <Select
                        value={question.type}
                        onValueChange={(value) => updateQuestion(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                          <SelectItem value="Short Answer">Short Answer</SelectItem>
                          <SelectItem value="Long Answer">Long Answer</SelectItem>
                          <SelectItem value="Definition">Definition</SelectItem>
                          <SelectItem value="Essay">Essay</SelectItem>
                          <SelectItem value="Calculation">Calculation</SelectItem>
                          <SelectItem value="True/False">True/False</SelectItem>
                          <SelectItem value="Fill in the Blank">Fill in the Blank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Score</Label>
                      <Input
                        type="number"
                        value={question.maxScore}
                        onChange={(e) => updateQuestion(index, 'maxScore', parseFloat(e.target.value) || 1)}
                        min="0.5"
                        step="0.5"
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Brain className="w-4 h-4" />
                        Bloom's Taxonomy
                      </Label>
                      <TagSelector
                        selectedIds={question.bloomsTaxonomyTagId ? [question.bloomsTaxonomyTagId] : []}
                        onSelectionChange={(ids) => updateQuestion(index, 'bloomsTaxonomyTagId', ids[0] || '')}
                        type="blooms_taxonomy"
                        placeholder="Select Bloom's level..."
                        maxSelections={1}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Textarea
                      value={question.text}
                      onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                      placeholder="Enter the full question text..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        Content Descriptor
                      </Label>
                      <Input
                        value={question.contentDescriptor}
                        onChange={(e) => updateQuestion(index, 'contentDescriptor', e.target.value)}
                        placeholder="e.g., ACDSEH008"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Key Skill</Label>
                      <Input
                        value={question.keySkill}
                        onChange={(e) => updateQuestion(index, 'keySkill', e.target.value)}
                        placeholder="e.g., Source analysis"
                      />
                    </div>
                  </div>

                  {/* Content Items and Tags */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        Linked Content Items
                      </Label>
                      <ContentItemSelector
                        selectedIds={question.contentItemIds}
                        onSelectionChange={(ids) => updateQuestion(index, 'contentItemIds', ids)}
                        placeholder="Search and link content items..."
                        maxSelections={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          Concept Tags
                        </Label>
                        <TagSelector
                          selectedIds={question.conceptTagIds}
                          onSelectionChange={(ids) => updateQuestion(index, 'conceptTagIds', ids)}
                          type="concept"
                          placeholder="Select concept tags..."
                          maxSelections={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          Capability Tags
                        </Label>
                        <TagSelector
                          selectedIds={question.capabilityTagIds}
                          onSelectionChange={(ids) => updateQuestion(index, 'capabilityTagIds', ids)}
                          type="capability"
                          placeholder="Select capability tags..."
                          maxSelections={5}
                        />
                      </div>
                    </div>
                  </div>

                  {index < questions.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}

              {/* Add Question Button */}
              <Button
                variant="outline"
                onClick={addQuestion}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Question
              </Button>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!canSave || isLoading}
        >
          {isLoading ? 'Saving...' : `Save ${questions.length} Question${questions.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};

export default StandaloneQuestionConfiguration;