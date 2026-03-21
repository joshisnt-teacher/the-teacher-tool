import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface AssessmentFormWizardProps {
  currentStep: number;
  steps: Step[];
}

export const AssessmentFormWizard: React.FC<AssessmentFormWizardProps> = ({
  currentStep,
  steps,
}) => {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Create Assessment</h1>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}
        </div>
      </div>
      
      <Progress value={progress} className="mb-6" />
      
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 min-w-fit ${
                index < steps.length - 1 ? 'mr-8' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <div className="min-w-0">
                <div className={`font-medium text-sm ${
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};