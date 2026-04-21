import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentProgress {
  id: string;
  name: string;
  trend: 'up' | 'down' | 'stable';
  improvement: number;
  firstScore: number | null;
  latestScore: number | null;
}

export interface GradeDistribution {
  grade: string;
  count: number;
  range: string;
}

export interface ContentItemPerformance {
  student: string;
  studentId: string;
  [key: string]: string; // Dynamic criteria columns
}

export const useStudentProgressAnalytics = (classId: string) => {
  return useQuery({
    queryKey: ['student-progress-analytics', classId],
    queryFn: async () => {
      // Get all students in this class
      const { data: studentsRaw, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, enrolments!inner(class_id)')
        .eq('enrolments.class_id', classId)
        .order('last_name');
      const students = studentsRaw?.map(({ enrolments: _, ...s }) => s);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        return [];
      }

      // Get all results for these students
      const studentIds = students.map(s => s.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select(`
          student_id,
          percent_score,
          created_at,
          task_id,
          tasks!inner(due_date)
        `)
        .in('student_id', studentIds)
        .not('percent_score', 'is', null)
        .order('tasks.due_date');

      if (resultsError) throw resultsError;

      const progressData: StudentProgress[] = [];

      for (const student of students) {
        const studentResults = results?.filter(r => r.student_id === student.id) || [];
        
        if (studentResults.length >= 2) {
          // Sort by task due date to get first and latest
          const sortedResults = studentResults.sort((a, b) => 
            new Date(a.tasks.due_date).getTime() - new Date(b.tasks.due_date).getTime()
          );
          
          const firstScore = sortedResults[0].percent_score || 0;
          const latestScore = sortedResults[sortedResults.length - 1].percent_score || 0;
          const improvement = latestScore - firstScore;
          
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (improvement > 5) trend = 'up';
          else if (improvement < -5) trend = 'down';
          
          progressData.push({
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            trend,
            improvement: Math.round(improvement),
            firstScore,
            latestScore,
          });
        }
      }

      return progressData;
    },
    enabled: !!classId,
  });
};

export const useGradeDistribution = (classId: string) => {
  return useQuery({
    queryKey: ['grade-distribution', classId],
    queryFn: async () => {
      // Get the most recent task for this class
      const { data: latestTask, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('class_id', classId)
        .order('due_date', { ascending: false })
        .limit(1)
        .single();

      if (taskError || !latestTask) {
        return [];
      }

      // Get all results for the latest task
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select('percent_score')
        .eq('task_id', latestTask.id)
        .not('percent_score', 'is', null);

      if (resultsError) throw resultsError;

      if (!results || results.length === 0) {
        return [];
      }

      // Calculate distribution
      const distribution = {
        '0-49': 0,
        '50-64': 0,
        '65-79': 0,
        '80-100': 0,
      };

      results.forEach(result => {
        const score = result.percent_score || 0;
        if (score < 50) distribution['0-49']++;
        else if (score < 65) distribution['50-64']++;
        else if (score < 80) distribution['65-79']++;
        else distribution['80-100']++;
      });

      const gradeDistribution: GradeDistribution[] = [
        { grade: '0-49', count: distribution['0-49'], range: 'F' },
        { grade: '50-64', count: distribution['50-64'], range: 'D' },
        { grade: '65-79', count: distribution['65-79'], range: 'P' },
        { grade: '80-100', count: distribution['80-100'], range: 'E' },
      ];

      return gradeDistribution;
    },
    enabled: !!classId,
  });
};

export const useContentItemPerformance = (classId: string) => {
  return useQuery({
    queryKey: ['content-item-performance', classId],
    queryFn: async () => {
      // Get students in this class
      const { data: studentsRaw, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, enrolments!inner(class_id)')
        .eq('enrolments.class_id', classId)
        .order('last_name');
      const students = studentsRaw?.map(({ enrolments: _, ...s }) => s);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        return [];
      }

      // Get the most recent task and its questions
      const { data: latestTask, error: taskError } = await supabase
        .from('tasks')
        .select('id, name')
        .eq('class_id', classId)
        .order('due_date', { ascending: false })
        .limit(1)
        .single();

      if (taskError || !latestTask) {
        return [];
      }

      // Get questions for this task
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, number, max_score')
        .eq('task_id', latestTask.id);

      if (questionsError || !questions || questions.length === 0) {
        return [];
      }

      // Get question results for all students
      const questionIds = questions.map(q => q.id);
      const { data: questionResults, error: resultsError } = await supabase
        .from('question_results')
        .select('student_id, question_id, percent_score')
        .in('question_id', questionIds)
        .not('percent_score', 'is', null);

      if (resultsError) throw resultsError;

      // Create performance matrix
      const performanceData: ContentItemPerformance[] = [];

      for (const student of students) {
        const studentData: ContentItemPerformance = {
          student: `${student.first_name} ${student.last_name.charAt(0)}.`,
          studentId: student.id,
        };

        // Group questions by number for now (simplified approach)
        const questionScores: { [key: string]: number[] } = {};
        
        questions.forEach(question => {
          const studentResult = questionResults?.find(
            r => r.student_id === student.id && r.question_id === question.id
          );
          
          if (studentResult) {
            const key = `Q${question.number}`;
            
            if (!questionScores[key]) {
              questionScores[key] = [];
            }
            questionScores[key].push(studentResult.percent_score || 0);
          }
        });

        // Calculate average for each question and assign grade band
        Object.entries(questionScores).forEach(([key, scores]) => {
          const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          let band = 'X';
          if (average >= 80) band = 'E';
          else if (average >= 65) band = 'P';
          else if (average >= 50) band = 'D';
          
          studentData[key] = band;
        });

        performanceData.push(studentData);
      }

      return performanceData;
    },
    enabled: !!classId,
  });
};