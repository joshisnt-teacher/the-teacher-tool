// src/components/assessment/ActionsTab.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BrainCircuit, MessageSquare, AlertTriangle,
  Copy, Download, RefreshCw, Loader2,
} from 'lucide-react';
import { useClassActions, ActionType } from '@/hooks/useClassActions';
import { useOpenAIKeyStatus } from '@/hooks/useAISettings';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Props {
  taskId: string;
}

interface ClassAnalysisOutput {
  summary: string;
  strengths: string[];
  gaps: string[];
  reteach_topics: string[];
}

interface StudentFeedbackOutput {
  students: { student_id: string; first_name: string; last_name: string; feedback: string }[];
}

interface StrugglingOutput {
  at_risk: { student_id: string; first_name: string; last_name: string; score_percent: number | null; reason: string }[];
}

const formatTs = (iso: string) => format(new Date(iso), 'dd MMM yyyy, h:mm a');

export const ActionsTab = ({ taskId }: Props) => {
  const { savedResults, runAction, runningAction } = useClassActions(taskId);
  const { data: keyStatus } = useOpenAIKeyStatus();

  if (!keyStatus?.hasKey) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-2">
        <BrainCircuit className="w-8 h-8 mx-auto opacity-40" />
        <p className="font-medium">AI actions require an OpenAI API key.</p>
        <p className="text-sm">
          Add your key in{' '}
          <Link to="/settings" className="underline hover:text-foreground">
            Settings → AI Marking
          </Link>
          .
        </p>
      </div>
    );
  }

  const downloadFeedbackCSV = (data: StudentFeedbackOutput) => {
    const rows = [
      ['First Name', 'Last Name', 'Feedback'],
      ...data.students.map((s) => [
        s.first_name,
        s.last_name,
        `"${s.feedback.replace(/"/g, '""')}"`,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-feedback.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const RunButton = ({
    action,
    label,
    runningLabel,
  }: {
    action: ActionType;
    label: string;
    runningLabel: string;
  }) => {
    const hasSaved = !!savedResults[action];
    const isRunning = runningAction === action;
    return (
      <Button
        size="sm"
        variant={hasSaved ? 'outline' : 'default'}
        onClick={() => runAction(action)}
        disabled={runningAction !== null}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            {runningLabel}
          </>
        ) : hasSaved ? (
          <>
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Re-run
          </>
        ) : (
          label
        )}
      </Button>
    );
  };

  const classResult = savedResults.class_analysis;
  const feedbackResult = savedResults.student_feedback;
  const strugglingResult = savedResults.struggling_students;

  const classData = classResult?.output_json as ClassAnalysisOutput | undefined;
  const feedbackData = feedbackResult?.output_json as StudentFeedbackOutput | undefined;
  const strugglingData = strugglingResult?.output_json as StrugglingOutput | undefined;

  return (
    <div className="space-y-4 p-1">

      {/* ── CLASS ANALYSIS ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <CardTitle className="text-base">Class Analysis</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Analyse class-wide strengths and gaps
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {classResult && (
                <p className="text-xs text-muted-foreground">
                  Last run: {formatTs(classResult.created_at)}
                </p>
              )}
              <RunButton action="class_analysis" label="Run Analysis" runningLabel="Analysing…" />
            </div>
          </div>
        </CardHeader>
        {classData && (
          <CardContent className="pt-0 space-y-3 border-t">
            <p className="text-sm text-muted-foreground pt-3">{classData.summary}</p>
            {(
              [
                { label: 'Class Strengths', items: classData.strengths, colour: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Areas to Reteach', items: classData.reteach_topics, colour: 'text-amber-600 dark:text-amber-400' },
                { label: 'Common Gaps', items: classData.gaps, colour: 'text-rose-600 dark:text-rose-400' },
              ] as const
            ).map(({ label, items, colour }) =>
              items?.length > 0 ? (
                <div key={label}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${colour}`}>
                    {label}
                  </p>
                  <ul className="space-y-1">
                    {items.map((item, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STUDENT FEEDBACK ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <CardTitle className="text-base">Student Feedback</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Generate a written comment for each student
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {feedbackResult && (
                <p className="text-xs text-muted-foreground">
                  Last run: {formatTs(feedbackResult.created_at)}
                </p>
              )}
              <RunButton
                action="student_feedback"
                label="Generate Feedback"
                runningLabel="Generating…"
              />
            </div>
          </div>
        </CardHeader>
        {feedbackData?.students && feedbackData.students.length > 0 && (
          <CardContent className="pt-0 space-y-2 border-t">
            <div className="pt-3 space-y-2">
              {feedbackData.students.map((s) => (
                <div
                  key={s.student_id}
                  className="flex items-start justify-between gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{s.feedback}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0 h-7 w-7"
                    onClick={() => {
                      navigator.clipboard.writeText(s.feedback);
                      toast.success('Copied');
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => downloadFeedbackCSV(feedbackData)}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download as CSV
            </Button>
          </CardContent>
        )}
      </Card>

      {/* ── STRUGGLING STUDENTS ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <CardTitle className="text-base">Flag Struggling Students</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Identify students who may need extra support
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {strugglingResult && (
                <p className="text-xs text-muted-foreground">
                  Last run: {formatTs(strugglingResult.created_at)}
                </p>
              )}
              <RunButton
                action="struggling_students"
                label="Identify Students"
                runningLabel="Identifying…"
              />
            </div>
          </div>
        </CardHeader>
        {strugglingData && (
          <CardContent className="pt-0 border-t">
            {strugglingData.at_risk.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 pt-4">
                No students flagged as struggling — great result!
              </p>
            ) : (
              <div className="pt-3 space-y-2">
                {strugglingData.at_risk.map((s) => (
                  <div
                    key={s.student_id}
                    className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {s.first_name} {s.last_name}
                        </p>
                        {s.score_percent !== null && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(s.score_percent)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{s.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

    </div>
  );
};
