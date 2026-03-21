import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Target, Brain, TrendingUp } from 'lucide-react';
import { useQuestions } from '@/hooks/useQuestions';
import { useContentItems } from '@/hooks/useContentItems';
import { useTags } from '@/hooks/useTags';

interface CurriculumInsightsCardProps {
  taskId: string;
}

export const CurriculumInsightsCard: React.FC<CurriculumInsightsCardProps> = ({ taskId }) => {
  const { data: questions = [] } = useQuestions(taskId);
  const { data: allContentItems = [] } = useContentItems({});
  const { data: conceptTags = [] } = useTags('concept');
  const { data: capabilityTags = [] } = useTags('capability');

  // Analyze Bloom's taxonomy distribution
  const bloomsLevels = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create'];
  const bloomsDistribution = bloomsLevels.map(level => {
    const count = questions.filter(q => 
      (q as any).metadata?.some((m: any) => m.key === 'blooms_taxonomy' && m.value === level)
    ).length;
    return { level, count, percentage: questions.length > 0 ? (count / questions.length) * 100 : 0 };
  });

  // Count questions linked to content items via the junction table
  const { data: linkedContentItems = [] } = useContentItems({});
  const questionsWithContentItems = questions.filter(q => 
    linkedContentItems.some(ci => ci.id && questions.some(question => question.id === q.id))
  ).length;

  // Count questions with metadata
  const questionsWithContentDescriptor = questions.filter(q =>
    (q as any).metadata?.some((m: any) => m.key === 'content_descriptor' && m.value)
  ).length;

  const questionsWithKeySkills = questions.filter(q =>
    (q as any).metadata?.some((m: any) => m.key === 'key_skill' && m.value)
  ).length;

  const questionsWithBloomsTaxonomy = questions.filter(q =>
    (q as any).metadata?.some((m: any) => m.key === 'blooms_taxonomy' && m.value)
  ).length;

  const getBloomsColor = (level: string) => {
    const colors = {
      'Remember': 'bg-blue-500',
      'Understand': 'bg-green-500',
      'Apply': 'bg-yellow-500',
      'Analyse': 'bg-orange-500',
      'Evaluate': 'bg-red-500',
      'Create': 'bg-purple-500',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Assessment Quality Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Assessment Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-900">{questionsWithContentDescriptor}</div>
              <div className="text-sm text-blue-600">
                Questions with Content Descriptors
              </div>
              <Progress 
                value={questions.length > 0 ? (questionsWithContentDescriptor / questions.length) * 100 : 0} 
                className="mt-2"
              />
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-900">{questionsWithKeySkills}</div>
              <div className="text-sm text-green-600">
                Questions with Key Skills
              </div>
              <Progress 
                value={questions.length > 0 ? (questionsWithKeySkills / questions.length) * 100 : 0} 
                className="mt-2"
              />
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Brain className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-900">{questionsWithBloomsTaxonomy}</div>
              <div className="text-sm text-purple-600">
                Questions with Bloom's Level
              </div>
              <Progress 
                value={questions.length > 0 ? (questionsWithBloomsTaxonomy / questions.length) * 100 : 0} 
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloom's Taxonomy Distribution */}
      {questionsWithBloomsTaxonomy > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Bloom's Taxonomy Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bloomsDistribution
                .filter(item => item.count > 0)
                .map((item) => (
                  <div key={item.level} className="flex items-center gap-3">
                    <div className="w-20 text-sm font-medium">{item.level}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={item.percentage} 
                          className="flex-1 h-2"
                        />
                        <div className="text-sm text-muted-foreground w-12">
                          {item.count} ({item.percentage.toFixed(0)}%)
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`w-3 h-3 rounded-full ${getBloomsColor(item.level)}`}
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Curriculum Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{questionsWithContentItems}</div>
              <div className="text-sm text-orange-600">Questions with Content Links</div>
            </div>
            
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-900">{questions.length}</div>
              <div className="text-sm text-indigo-600">Total Questions</div>
            </div>
          </div>
          
          {questionsWithContentItems > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Content Linking Quality:</div>
              <Progress 
                value={questions.length > 0 ? (questionsWithContentItems / questions.length) * 100 : 0}
                className="h-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {questionsWithContentItems} of {questions.length} questions have content item links
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};