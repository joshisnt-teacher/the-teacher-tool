import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useAIMarkResponses } from '@/hooks/useAIMarking';
import { useOpenAIKeyStatus } from '@/hooks/useAISettings';

interface Question {
  id: string;
  number: number;
  question_type: string;
  max_score: number;
}

interface QuestionResult {
  id: string;
  question_id: string;
  student_id: string;
  raw_score: number | null;
  percent_score: number | null;
  response_data: unknown;
  ai_feedback: string | null;
}

interface Student {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface OverallResult {
  student_id: string;
  percent_score: number | null;
}

interface Option {
  id: string;
  option_text: string;
}

interface Props {
  taskId: string;
  questions: Question[];
  questionResults: QuestionResult[];
  students: Student[];
  overallResults: OverallResult[];
  optionsMap: Record<string, Option[]>;
}

export function ExitTicketResponsesTable({
  taskId,
  questions,
  questionResults,
  students,
  overallResults,
  optionsMap,
}: Props) {
  const { data: keyStatus } = useOpenAIKeyStatus();
  const aiMarkMutation = useAIMarkResponses();

  const submittedStudentIds = new Set(questionResults.map((qr) => qr.student_id));

  const hasUnmarkedText = questionResults.some((qr) => {
    const q = questions.find((q) => q.id === qr.question_id);
    return q && q.question_type !== 'multiple_choice' && qr.raw_score == null;
  });

  const handleMarkAll = () => {
    const ids = questionResults
      .filter((qr) => {
        const q = questions.find((q) => q.id === qr.question_id);
        return q && q.question_type !== 'multiple_choice' && qr.raw_score == null;
      })
      .map((qr) => qr.id);
    if (ids.length > 0) {
      aiMarkMutation.mutate({ questionResultIds: ids, taskId });
    }
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No questions found for this exit ticket.
        </CardContent>
      </Card>
    );
  }

  const sortedStudents = [...students].sort((a, b) =>
    (a.last_name ?? '').localeCompare(b.last_name ?? '')
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Student Responses</CardTitle>
        {keyStatus?.hasKey && hasUnmarkedText && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={aiMarkMutation.isPending}
          >
            {aiMarkMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Marking…
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                AI Mark All
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 min-w-[160px] font-medium">Student</th>
                {questions.map((q) => (
                  <th key={q.id} className="text-left p-3 min-w-[200px] font-medium">
                    Q{q.number}
                    <span className="block text-xs text-muted-foreground font-normal">
                      ({q.max_score} pts)
                    </span>
                  </th>
                ))}
                <th className="text-left p-3 min-w-[80px] font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student) => {
                const submitted = submittedStudentIds.has(student.id);
                const studentQRs = questionResults.filter(
                  (qr) => qr.student_id === student.id
                );
                const overall = overallResults.find((r) => r.student_id === student.id);

                if (!submitted) {
                  return (
                    <tr key={student.id} className="border-b opacity-50">
                      <td className="p-3 font-medium">
                        {student.first_name} {student.last_name}
                      </td>
                      <td
                        colSpan={questions.length + 1}
                        className="p-3 text-muted-foreground italic text-xs"
                      >
                        Not submitted
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={student.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium align-top">
                      {student.first_name} {student.last_name}
                    </td>
                    {questions.map((q) => {
                      const qr = studentQRs.find((r) => r.question_id === q.id);
                      const isMC = q.question_type === 'multiple_choice';
                      const responseData = qr?.response_data as any;

                      let answerDisplay: React.ReactNode = (
                        <span className="text-muted-foreground text-xs">-</span>
                      );

                      if (isMC && responseData?.selected_option_id) {
                        const opt = optionsMap[q.id]?.find(
                          (o) => o.id === responseData.selected_option_id
                        );
                        // percent_score === 100 means correct for MC questions
                        const correct = qr?.percent_score === 100;
                        answerDisplay = (
                          <div className="flex items-start gap-1.5">
                            {correct ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {opt?.option_text ?? 'Selected option'}
                            </span>
                          </div>
                        );
                      } else if (responseData?.text) {
                        answerDisplay = (
                          <span className="text-xs whitespace-pre-wrap line-clamp-3">
                            {responseData.text}
                          </span>
                        );
                      }

                      return (
                        <td key={q.id} className="p-3 align-top">
                          <div className="space-y-1.5">
                            {answerDisplay}
                            {qr?.ai_feedback && !isMC && (
                              <p className="text-xs text-muted-foreground italic">
                                AI: {qr.ai_feedback}
                              </p>
                            )}
                            {!isMC && (
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {qr?.raw_score != null
                                    ? `${qr.raw_score}/${q.max_score}`
                                    : `-/${q.max_score}`}
                                </Badge>
                                {keyStatus?.hasKey && qr && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    title="Re-mark with AI"
                                    onClick={() =>
                                      aiMarkMutation.mutate({
                                        questionResultIds: [qr.id],
                                        taskId,
                                      })
                                    }
                                    disabled={aiMarkMutation.isPending}
                                  >
                                    <Bot className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-3 align-top">
                      {overall?.percent_score != null ? (
                        <Badge variant="outline">
                          {Math.round(overall.percent_score)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
