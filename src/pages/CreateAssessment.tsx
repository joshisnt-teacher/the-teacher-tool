import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AssessmentFormWizard } from '@/components/assessment/AssessmentFormWizard';
import { AssessmentTypeSelector } from '@/components/assessment/AssessmentTypeSelector';
import { AssessmentDetailsForm } from '@/components/assessment/AssessmentDetailsForm';
import { AssessmentFormatSelector } from '@/components/assessment/AssessmentFormatSelector';
import { ConfidenceCheckConfig } from '@/components/assessment/ConfidenceCheckConfig';
import { useCreateAssessment, CreateAssessmentData } from '@/hooks/useCreateAssessment';

const assessmentSchema = z.object({
  name: z.string().min(1, "Assessment name is required"),
  task_type: z.enum(['Diagnostic', 'Formative', 'Summative']),
  description: z.string().optional(),
  assessment_format: z.literal('confidence_check'),
  blooms_taxonomy: z.string().optional(),
  key_skill: z.string().optional(),
  content_item_id: z.string().optional(),
  question_text: z.string().min(1, "Question text is required for confidence check"),
  due_date: z.string().optional(),
  weight_percent: z.number().min(0).max(100).optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

const CreateAssessment: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const createAssessment = useCreateAssessment();

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      assessment_format: 'confidence_check',
    },
  });

  const steps = [
    { id: 1, title: 'Assessment Type', description: 'Choose the type of assessment' },
    { id: 2, title: 'Details', description: 'Enter assessment information' },
    { id: 3, title: 'Format', description: 'Select assessment format' },
    { id: 4, title: 'Configuration', description: 'Configure assessment settings' },
  ];

  const selectedType = form.watch('task_type');
  const selectedFormat = form.watch('assessment_format');

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return !!selectedType;
      case 2:
        return form.getValues('name')?.length > 0;
      case 3:
        return !!selectedFormat;
      case 4:
        return form.getValues('question_text')?.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: AssessmentFormData) => {
    if (!classId) return;

    const assessmentData: CreateAssessmentData = {
      name: data.name,
      class_id: classId,
      task_type: data.task_type,
      assessment_format: data.assessment_format,
      description: data.description,
      blooms_taxonomy: data.blooms_taxonomy,
      key_skill: data.key_skill,
      content_item_id: data.content_item_id,
      question_text: data.question_text,
      due_date: data.due_date,
      weight_percent: data.weight_percent,
      is_legacy: false,
    };

    try {
      await createAssessment.mutateAsync(assessmentData);
      navigate(`/class/${classId}`);
    } catch (error) {
      console.error('Failed to create assessment:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <AssessmentTypeSelector
            selectedType={selectedType}
            onSelect={(type) => form.setValue('task_type', type)}
          />
        );
      case 2:
        return (
          <AssessmentDetailsForm
            form={form}
            classId={classId!}
          />
        );
      case 3:
        return (
          <AssessmentFormatSelector
            selectedFormat={selectedFormat}
            onSelect={(format) => form.setValue('assessment_format', format as 'confidence_check')}
          />
        );
      case 4:
        return <ConfidenceCheckConfig form={form} />;
      default:
        return null;
    }
  };

  if (!classId) {
    return <div>Invalid class ID</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/class/${classId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Class
        </Button>
      </div>

      <AssessmentFormWizard currentStep={currentStep} steps={steps} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canContinue()}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!canContinue() || createAssessment.isPending}
                >
                  {createAssessment.isPending ? 'Creating...' : 'Create Assessment'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateAssessment;