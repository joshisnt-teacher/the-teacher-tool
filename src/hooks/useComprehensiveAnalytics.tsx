import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClassKPIs {
  classAverage: number;
  classAverageChange: number;
  highBandCount: number;
  highBandPercentage: number;
  lowBandCount: number;
  lowBandPercentage: number;
  studentsOnTarget: number;
  studentsOnTargetPercentage: number;
  flaggedStudents: number;
  totalStudents: number;
}

export interface InterventionFlag {
  id: string;
  type: 'performance' | 'decline' | 'question_difficulty';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  studentIds?: string[];
  questionIds?: string[];
  data: any;
}

export interface QuestionDifficulty {
  questionId: string;
  questionNumber: number;
  questionTitle: string;
  averageScore: number;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'very_hard';
  taskName: string;
  bloomLevel?: string;
  scaCode?: string;
}

export const useClassKPIs = (classId: string, assessmentRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: ['class-kpis', classId, assessmentRange],
    queryFn: async () => {
      // Get all students in the class
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('class_id', classId);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        return {
          classAverage: 0,
          classAverageChange: 0,
          highBandCount: 0,
          highBandPercentage: 0,
          lowBandCount: 0,
          lowBandPercentage: 0,
          studentsOnTarget: 0,
          studentsOnTargetPercentage: 0,
          flaggedStudents: 0,
          totalStudents: 0,
        } as ClassKPIs;
      }

      // Get tasks within the specified range or all tasks
      let tasksQuery = supabase
        .from('tasks')
        .select('id, name, due_date')
        .eq('class_id', classId)
        .not('due_date', 'is', null)
        .order('due_date');

      if (assessmentRange) {
        tasksQuery = tasksQuery
          .gte('due_date', assessmentRange.start)
          .lte('due_date', assessmentRange.end);
      }

      const { data: tasks, error: tasksError } = await tasksQuery;

      if (tasksError) throw tasksError;

      if (!tasks || tasks.length === 0) {
        return {
          classAverage: 0,
          classAverageChange: 0,
          highBandCount: 0,
          highBandPercentage: 0,
          lowBandCount: 0,
          lowBandPercentage: 0,
          studentsOnTarget: 0,
          studentsOnTargetPercentage: 0,
          flaggedStudents: 0,
          totalStudents: students.length,
        } as ClassKPIs;
      }

      // Get results for all tasks
      const taskIds = tasks.map(t => t.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select('student_id, task_id, percent_score')
        .in('task_id', taskIds)
        .not('percent_score', 'is', null);

      if (resultsError) throw resultsError;

      // Calculate KPIs
      const latestTask = tasks[tasks.length - 1];
      const previousTask = tasks.length > 1 ? tasks[tasks.length - 2] : null;

      const latestResults = results?.filter(r => r.task_id === latestTask.id) || [];
      const previousResults = previousTask ? results?.filter(r => r.task_id === previousTask.id) || [] : [];

      const latestAverage = latestResults.length > 0 
        ? latestResults.reduce((sum, r) => sum + r.percent_score, 0) / latestResults.length
        : 0;

      const previousAverage = previousResults.length > 0
        ? previousResults.reduce((sum, r) => sum + r.percent_score, 0) / previousResults.length
        : latestAverage;

      const classAverageChange = latestAverage - previousAverage;

      // Count bands (using 65% as target threshold)
      const highBandCount = latestResults.filter(r => r.percent_score >= 65).length;
      const lowBandCount = latestResults.filter(r => r.percent_score < 50).length;
      const studentsOnTarget = latestResults.filter(r => r.percent_score >= 65).length;

      // Simple flagged students calculation (students with significant decline)
      let flaggedStudents = 0;
      if (previousResults.length > 0) {
        students.forEach(student => {
          const latestResult = latestResults.find(r => r.student_id === student.id);
          const previousResult = previousResults.find(r => r.student_id === student.id);
          
          if (latestResult && previousResult) {
            const decline = previousResult.percent_score - latestResult.percent_score;
            if (decline >= 20) flaggedStudents++;
          }
        });
      }

      return {
        classAverage: Math.round(latestAverage),
        classAverageChange: Math.round(classAverageChange),
        highBandCount,
        highBandPercentage: Math.round((highBandCount / latestResults.length) * 100),
        lowBandCount,
        lowBandPercentage: Math.round((lowBandCount / latestResults.length) * 100),
        studentsOnTarget,
        studentsOnTargetPercentage: Math.round((studentsOnTarget / latestResults.length) * 100),
        flaggedStudents,
        totalStudents: students.length,
      } as ClassKPIs;
    },
    enabled: !!classId,
  });
};

export const useQuestionDifficulty = (classId: string) => {
  return useQuery({
    queryKey: ['question-difficulty', classId],
    queryFn: async () => {
      // Get all tasks for the class
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name')
        .eq('class_id', classId);

      if (tasksError) throw tasksError;

      if (!tasks || tasks.length === 0) return [];

      // Get all questions for these tasks - using any to bypass type issues
      const taskIds = tasks.map(t => t.id);
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, number, question, task_id, max_score')
        .in('task_id', taskIds) as { data: any[] | null; error: any };

      if (questionsError) throw questionsError;

      if (!questions || questions.length === 0) return [];

      // Get question results
      const questionIds = questions.map((q: any) => q.id);
      const { data: questionResults, error: resultsError } = await supabase
        .from('question_results')
        .select('question_id, percent_score')
        .in('question_id', questionIds)
        .not('percent_score', 'is', null);

      if (resultsError) throw resultsError;

      // Calculate difficulty for each question
      const questionDifficulty: QuestionDifficulty[] = [];

      questions.forEach((question: any) => {
        const results = questionResults?.filter(r => r.question_id === question.id) || [];
        
        if (results.length > 0) {
          const averageScore = results.reduce((sum, r) => sum + r.percent_score, 0) / results.length;
          
          let difficultyLevel: 'easy' | 'medium' | 'hard' | 'very_hard' = 'medium';
          if (averageScore >= 80) difficultyLevel = 'easy';
          else if (averageScore >= 65) difficultyLevel = 'medium';
          else if (averageScore >= 50) difficultyLevel = 'hard';
          else difficultyLevel = 'very_hard';

          const task = tasks.find(t => t.id === question.task_id);

          questionDifficulty.push({
            questionId: question.id,
            questionNumber: question.number,
            questionTitle: question.question || `Question ${question.number}`,
            averageScore: Math.round(averageScore),
            difficultyLevel,
            taskName: task?.name || 'Unknown Task',
          });
        }
      });

      // Sort by difficulty (hardest first)
      return questionDifficulty.sort((a, b) => a.averageScore - b.averageScore);
    },
    enabled: !!classId,
  });
};

export const useInterventionFlags = (classId: string, threshold: number = 20) => {
  return useQuery({
    queryKey: ['intervention-flags', classId, threshold],
    queryFn: async () => {
      const flags: InterventionFlag[] = [];

      // Get students and their recent performance
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('class_id', classId);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) return flags;

      // Get recent tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name, due_date')
        .eq('class_id', classId)
        .order('due_date', { ascending: false })
        .limit(5);

      if (tasksError) throw tasksError;

      if (!tasks || tasks.length < 2) return flags;

      // Get results for recent tasks
      const taskIds = tasks.map(t => t.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select('student_id, task_id, percent_score')
        .in('task_id', taskIds)
        .not('percent_score', 'is', null);

      if (resultsError) throw resultsError;

      // Flag 1: Students with consecutive low scores
      const lowPerformers: string[] = [];
      students.forEach(student => {
        const studentResults = results?.filter(r => r.student_id === student.id) || [];
        const recentScores = studentResults
          .sort((a, b) => {
            const taskA = tasks.find(t => t.id === a.task_id);
            const taskB = tasks.find(t => t.id === b.task_id);
            return new Date(taskB?.due_date || 0).getTime() - new Date(taskA?.due_date || 0).getTime();
          })
          .slice(0, 2);
        
        if (recentScores.length >= 2 && recentScores.every(s => s.percent_score < 50)) {
          lowPerformers.push(student.id);
        }
      });

      if (lowPerformers.length > 0) {
        flags.push({
          id: 'low-performers',
          type: 'performance',
          severity: 'high',
          title: 'Students with Consecutive Low Scores',
          description: `${lowPerformers.length} students scored below 50% in their last two assessments`,
          studentIds: lowPerformers,
          data: { count: lowPerformers.length }
        });
      }

      // Flag 2: Students with significant decline
      const decliningStudents: string[] = [];
      students.forEach(student => {
        const studentResults = results?.filter(r => r.student_id === student.id) || [];
        if (studentResults.length >= 2) {
          const sortedResults = studentResults.sort((a, b) => {
            const taskA = tasks.find(t => t.id === a.task_id);
            const taskB = tasks.find(t => t.id === b.task_id);
            return new Date(taskB?.due_date || 0).getTime() - new Date(taskA?.due_date || 0).getTime();
          });
          
          const latest = sortedResults[0];
          const previous = sortedResults[1];
          const decline = previous.percent_score - latest.percent_score;
          
          if (decline >= threshold) {
            decliningStudents.push(student.id);
          }
        }
      });

      if (decliningStudents.length > 0) {
        flags.push({
          id: 'declining-students',
          type: 'decline',
          severity: 'medium',
          title: 'Students with Significant Decline',
          description: `${decliningStudents.length} students dropped ≥${threshold}% from their previous assessment`,
          studentIds: decliningStudents,
          data: { count: decliningStudents.length, threshold }
        });
      }

      return flags;
    },
    enabled: !!classId,
  });
};

export const useStudentGrowthAnalytics = (classId: string) => {
  return useQuery({
    queryKey: ['student-growth-analytics', classId],
    queryFn: async () => {
      // Get all students in the class
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('class_id', classId);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) return [];

      // Get all results for these students with task info
      const studentIds = students.map(s => s.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select(`
          student_id,
          percent_score,
          created_at,
          task_id,
          tasks!inner(due_date, name)
        `)
        .in('student_id', studentIds)
        .not('percent_score', 'is', null)
        .order('tasks(due_date)');

      if (resultsError) throw resultsError;

      const growthData = [];

      for (const student of students) {
        const studentResults = results?.filter(r => r.student_id === student.id) || [];
        
        if (studentResults.length >= 2) {
          // Sort by task due date
          const sortedResults = studentResults.sort((a, b) => 
            new Date(a.tasks.due_date).getTime() - new Date(b.tasks.due_date).getTime()
          );
          
          const firstScore = sortedResults[0].percent_score || 0;
          const latestScore = sortedResults[sortedResults.length - 1].percent_score || 0;
          const improvement = latestScore - firstScore;
          
          let trend: 'improving' | 'declining' | 'stable' = 'stable';
          if (improvement > 5) trend = 'improving';
          else if (improvement < -5) trend = 'declining';
          
          growthData.push({
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            trend,
            improvement: Math.round(improvement),
            firstScore,
            latestScore,
            assessmentCount: sortedResults.length,
          });
        }
      }

      return growthData;
    },
    enabled: !!classId,
  });
};

export const useDistributionOverTime = (classId: string) => {
  return useQuery({
    queryKey: ['distribution-over-time', classId],
    queryFn: async () => {
      // Get all tasks for this class ordered by date
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name, due_date')
        .eq('class_id', classId)
        .not('due_date', 'is', null)
        .order('due_date');

      if (tasksError) throw tasksError;

      if (!tasks || tasks.length === 0) return [];

      // Get all results for these tasks
      const taskIds = tasks.map(t => t.id);
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select('task_id, percent_score')
        .in('task_id', taskIds)
        .not('percent_score', 'is', null);

      if (resultsError) throw resultsError;

      const distributionData = [];

      for (const task of tasks) {
        const taskResults = results?.filter(r => r.task_id === task.id) || [];
        
        if (taskResults.length > 0) {
          // Calculate distribution
          const distribution = {
            high: taskResults.filter(r => r.percent_score >= 80).length,
            proficient: taskResults.filter(r => r.percent_score >= 65 && r.percent_score < 80).length,
            developing: taskResults.filter(r => r.percent_score >= 50 && r.percent_score < 65).length,
            below: taskResults.filter(r => r.percent_score < 50).length,
          };

          distributionData.push({
            taskName: task.name,
            date: task.due_date,
            ...distribution,
            total: taskResults.length,
          });
        }
      }

      return distributionData;
    },
    enabled: !!classId,
  });
};