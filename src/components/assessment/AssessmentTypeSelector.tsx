import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface AssessmentTypeSelectorProps {
  selectedType: 'Diagnostic' | 'Formative' | 'Summative' | null;
  onSelect: (type: 'Diagnostic' | 'Formative' | 'Summative') => void;
}

export const AssessmentTypeSelector: React.FC<AssessmentTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  const assessmentTypes = [
    {
      type: 'Diagnostic' as const,
      title: 'Diagnostic Assessment',
      description: 'Check prior knowledge and identify learning gaps before instruction',
      available: true,
    },
    {
      type: 'Formative' as const,
      title: 'Formative Assessment',
      description: 'Monitor student learning and provide ongoing feedback during instruction',
      available: true,
    },
    {
      type: 'Summative' as const,
      title: 'Summative Assessment',
      description: 'Evaluate student learning at the end of an instructional unit',
      available: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Choose Assessment Type</h2>
        <p className="text-muted-foreground">
          Select the type of assessment you want to create for your class.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {assessmentTypes.map((type) => (
          <Card
            key={type.type}
            className={`cursor-pointer transition-all border-2 ${
              !type.available
                ? 'opacity-50 cursor-not-allowed border-muted'
                : selectedType === type.type
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-primary/50'
            }`}
            onClick={() => type.available && onSelect(type.type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {type.title}
                  {selectedType === type.type && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </CardTitle>
                {!type.available && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {type.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};