import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, MessageCircle, FileText, Gamepad2, Map } from 'lucide-react';

interface AssessmentFormatSelectorProps {
  selectedFormat: string | null;
  onSelect: (format: string) => void;
}

export const AssessmentFormatSelector: React.FC<AssessmentFormatSelectorProps> = ({
  selectedFormat,
  onSelect,
}) => {
  const assessmentFormats = [
    {
      id: 'confidence_check',
      title: 'Confidence Check-in',
      description: 'Students rate their confidence level (1-10) on a single question or topic',
      icon: MessageCircle,
      available: true,
    },
    {
      id: 'quiz',
      title: 'Quiz',
      description: 'Multiple choice, true/false, and short answer questions',
      icon: FileText,
      available: false,
    },
    {
      id: 'kahoot',
      title: 'Kahoot Style',
      description: 'Interactive game-based assessment with real-time results',
      icon: Gamepad2,
      available: false,
    },
    {
      id: 'map_challenge',
      title: 'Map Challenge',
      description: 'Location-based questions using interactive maps',
      icon: Map,
      available: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Choose Assessment Format</h2>
        <p className="text-muted-foreground">
          Select how students will complete this assessment.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {assessmentFormats.map((format) => {
          const Icon = format.icon;
          return (
            <Card
              key={format.id}
              className={`cursor-pointer transition-all border-2 ${
                !format.available
                  ? 'opacity-50 cursor-not-allowed border-muted'
                  : selectedFormat === format.id
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
              onClick={() => format.available && onSelect(format.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${format.available ? 'text-primary' : 'text-muted-foreground'}`} />
                    <CardTitle className="text-lg flex items-center gap-2">
                      {format.title}
                      {selectedFormat === format.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </CardTitle>
                  </div>
                  {!format.available && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {format.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};