import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ParsedAssessmentData } from '@/utils/csvAssessmentParser';

export interface ImportAssessmentParams {
  classId: string;
  assessmentData: ParsedAssessmentData;
  title: string;
  taskType: 'Diagnostic' | 'Formative' | 'Summative';
  totalMarks: number;
  dueDate?: string;
}

const normalizeForMatch = (value: string | undefined | null) =>
  (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const buildNameCandidates = (displayName: string) => {
  const candidates = new Set<string>();
  const trimmed = displayName.trim();
  if (trimmed) {
    candidates.add(trimmed);
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1) {
      candidates.add(`${parts[0]} ${parts[parts.length - 1]}`);
    }
    parts.forEach(part => candidates.add(part));
  }
  return candidates;
};

export const useAssessmentImport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: ImportAssessmentParams) => {
      const { classId, assessmentData, title, taskType, totalMarks, dueDate } = params;

      try {
        // Step 1: Create the task/assessment
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .insert({
            name: title,
            class_id: classId,
            task_type: taskType,
            max_score: totalMarks,
            due_date: dueDate,
            assessment_format: assessmentData.sourceFormat === 'kahoot' ? 'Kahoot' : assessmentData.sourceFormat === 'single_mark' ? 'single_mark' : 'traditional',
            is_legacy: false,
          })
          .select()
          .single();

        if (taskError) throw taskError;

        // Step 2: Create questions (skip for single mark imports)
        let questions: any[] | null = null;
        if (assessmentData.sourceFormat !== 'single_mark' && assessmentData.questions.length > 0) {
          const questionsToInsert = assessmentData.questions.map(q => ({
            task_id: task.id,
            number: q.number,
            question: q.question,
            question_type: q.questionType,
            content_item: q.contentDescriptor,
            blooms_taxonomy: q.bloomsTaxonomy,
            max_score: q.maxScore,
          }));

          const { data: insertedQuestions, error: questionsError } = await supabase
            .from('questions')
            .insert(questionsToInsert)
            .select();

          if (questionsError) throw questionsError;
          questions = insertedQuestions;
        }

        // Step 3: Get or create students
        const existingStudents = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId)
          .order('last_name');

        const existingStudentIds = new Set<string>();
        existingStudents.data?.forEach(student => {
          if (student.student_id) {
            existingStudentIds.add(student.student_id);
          }
        });

        // Create missing students (only for standard imports where an ID is provided)
        const studentsToCreate =
          assessmentData.sourceFormat === 'standard'
            ? assessmentData.students
                .filter(s => s.studentId && !existingStudentIds.has(s.studentId))
                .map(s => ({
                  student_id: s.studentId,
                  first_name: s.firstName,
                  last_name: s.lastName,
                  class_id: classId,
                }))
            : [];

        if (studentsToCreate.length > 0) {
          const { error: createStudentsError } = await supabase
            .from('students')
            .insert(studentsToCreate);

          if (createStudentsError) throw createStudentsError;
        }

        // Get all students for the class (including newly created ones)
        const { data: allStudents, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId)
          .order('last_name');

        if (studentsError) throw studentsError;

        const studentIdMap = new Map<string, string>();
        const normalizedNameMap = new Map<string, string>();

        allStudents?.forEach(student => {
          if (student.student_id) {
            studentIdMap.set(student.student_id, student.id);
          }

          const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim();
          if (fullName) {
            normalizedNameMap.set(normalizeForMatch(fullName), student.id);
          }
          if (student.first_name) {
            normalizedNameMap.set(normalizeForMatch(student.first_name), student.id);
          }
          if (student.last_name) {
            normalizedNameMap.set(normalizeForMatch(student.last_name), student.id);
          }
        });

        // Step 4: Create question results
        const questionResults: any[] = [];
        const taskResults: any[] = [];
        const unmatchedNames: string[] = [];

        for (const studentData of assessmentData.students) {
          let studentDbId: string | undefined = studentData.resolvedStudentId;

          if (!studentDbId && (assessmentData.sourceFormat === 'standard' || assessmentData.sourceFormat === 'single_mark') && studentData.studentId) {
            studentDbId = studentIdMap.get(studentData.studentId);
          } else if (assessmentData.sourceFormat === 'kahoot') {
            const candidates = buildNameCandidates(studentData.displayName);
            if (studentData.firstName || studentData.lastName) {
              candidates.add(`${studentData.firstName ?? ''} ${studentData.lastName ?? ''}`.trim());
            }

            for (const candidate of candidates) {
              const normalized = normalizeForMatch(candidate);
              if (!normalized) continue;
              const match = normalizedNameMap.get(normalized);
              if (match) {
                studentDbId = match;
                break;
              }
            }
          }

          if (!studentDbId) {
            if (studentData.displayName) {
              unmatchedNames.push(studentData.displayName);
            }
            continue;
          }

          // Create question results for each question (skip for single mark)
          if (assessmentData.sourceFormat !== 'single_mark' && questions) {
            for (let i = 0; i < assessmentData.questions.length; i++) {
              if (questions[i]) {
                const rawScore = studentData.scores[i] ?? 0;
                const maxScore = assessmentData.questions[i].maxScore || 0;
                const percentScore = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;

                questionResults.push({
                  question_id: questions[i].id,
                  student_id: studentDbId,
                  raw_score: rawScore,
                  percent_score: percentScore,
                });
              }
            }
          }

          // Create overall task result
          let rawScore = studentData.totalScore;
          let percentScore = studentData.totalPercentage;

          if (assessmentData.sourceFormat === 'single_mark') {
            if (percentScore === 0 && totalMarks > 0 && rawScore > 0) {
              percentScore = Math.round((rawScore / totalMarks) * 100);
            } else if (rawScore === 0 && totalMarks > 0 && percentScore > 0) {
              rawScore = Math.round((percentScore / 100) * totalMarks);
            }
          } else {
            percentScore = totalMarks > 0 ? Math.round((rawScore / totalMarks) * 100) : 0;
          }

          taskResults.push({
            task_id: task.id,
            student_id: studentDbId,
            raw_score: rawScore,
            percent_score: percentScore,
          });
        }

        // Insert question results
        if (questionResults.length > 0) {
          const uniqueQuestionResults = Array.from(
            new Map(
              questionResults.map(result => [
                `${result.question_id}-${result.student_id}`,
                result,
              ])
            ).values()
          );

          const { error: questionResultsError } = await supabase
            .from('question_results')
            .upsert(uniqueQuestionResults, {
              onConflict: 'question_id,student_id',
              ignoreDuplicates: false,
            });

          if (questionResultsError) throw questionResultsError;
        }

        // Insert task results
        if (taskResults.length > 0) {
          const uniqueTaskResults = Array.from(
            new Map(
              taskResults.map(result => [
                `${result.task_id}-${result.student_id}`,
                result,
              ])
            ).values()
          );

          const { error: taskResultsError } = await supabase
            .from('results')
            .upsert(uniqueTaskResults, {
              onConflict: 'task_id,student_id',
              ignoreDuplicates: false,
            });

          if (taskResultsError) throw taskResultsError;
        }

        return {
          task,
          questionsCount: questions?.length || 0,
          studentsCount: assessmentData.students.length,
          newStudentsCount: studentsToCreate.length,
          unmatchedNames,
        };

      } catch (error) {
        console.error('Assessment import error:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['question_results'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['assessment-results'] });
      queryClient.invalidateQueries({ queryKey: ['assessment'] });
      
      const unmatchedNotice =
        result.unmatchedNames && result.unmatchedNames.length > 0
          ? ` ${result.unmatchedNames.length} result${result.unmatchedNames.length === 1 ? '' : 's'} need name linking.`
          : '';

      toast({
        title: "Import Successful",
        description: `Imported assessment with ${result.questionsCount} questions for ${result.studentsCount} students${result.newStudentsCount > 0 ? ` (${result.newStudentsCount} new students created)` : ''}.${unmatchedNotice}`,
      });
    },
    onError: (error) => {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: "There was an error importing the assessment. Please check the file format and try again.",
        variant: "destructive",
      });
    },
  });
};