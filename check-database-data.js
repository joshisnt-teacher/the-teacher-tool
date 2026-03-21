// Script to check the current database content
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseData() {
  console.log('🔍 Checking database content...\n');
  
  try {
    // Check schools
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*');
    
    if (schoolsError) {
      console.error('❌ Error fetching schools:', schoolsError);
    } else {
      console.log(`🏫 Schools (${schools?.length || 0}):`);
      schools?.forEach((school, index) => {
        console.log(`   ${index + 1}. ${school.name} (ID: ${school.id})`);
      });
    }

    // Check users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`\n👤 Users (${users?.length || 0}):`);
      users?.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || user.email} (Role: ${user.role}, School: ${user.school_id ? 'Yes' : 'No'})`);
      });
    }

    // Check classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*');
    
    if (classesError) {
      console.error('❌ Error fetching classes:', classesError);
    } else {
      console.log(`\n📚 Classes (${classes?.length || 0}):`);
      classes?.forEach((cls, index) => {
        console.log(`   ${index + 1}. ${cls.class_name} (${cls.subject} - ${cls.year_level})`);
        console.log(`       Teacher: ${cls.teacher_id}, School: ${cls.school_id}`);
      });
    }

    // Check tasks/assessments
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*');
    
    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError);
    } else {
      console.log(`\n📝 Tasks/Assessments (${tasks?.length || 0}):`);
      tasks?.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.name} (${task.task_type || 'Unknown Type'})`);
        console.log(`       Format: ${task.assessment_format || 'Standard'}, Max Score: ${task.max_score || 'N/A'}`);
        console.log(`       Class: ${task.class_id}, Due: ${task.due_date || 'No due date'}`);
      });
    }

    // Check questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*');
    
    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
    } else {
      console.log(`\n❓ Questions (${questions?.length || 0}):`);
      questions?.forEach((question, index) => {
        console.log(`   ${index + 1}. Q${question.number}: ${question.question?.substring(0, 50) || 'No question text'}...`);
        console.log(`       Task: ${question.task_id}, Max Score: ${question.max_score || 'N/A'}`);
      });
    }

    // Check question results
    const { data: questionResults, error: questionResultsError } = await supabase
      .from('question_results')
      .select('*');
    
    if (questionResultsError) {
      console.error('❌ Error fetching question results:', questionResultsError);
    } else {
      console.log(`\n📊 Question Results (${questionResults?.length || 0}):`);
      questionResults?.forEach((result, index) => {
        console.log(`   ${index + 1}. Question: ${result.question_id}, Student: ${result.student_id}`);
        console.log(`       Raw Score: ${result.raw_score || 'N/A'}, Percent: ${result.percent_score || 'N/A'}%`);
      });
    }

    // Check students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*');
    
    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
    } else {
      console.log(`\n🎓 Students (${students?.length || 0}):`);
      students?.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.first_name} ${student.last_name} (${student.student_id})`);
        console.log(`       Class: ${student.class_id}, Email: ${student.email || 'N/A'}`);
      });
    }

    // Check results (assessment results)
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('*');
    
    if (resultsError) {
      console.error('❌ Error fetching results:', resultsError);
    } else {
      console.log(`\n📈 Assessment Results (${results?.length || 0}):`);
      results?.forEach((result, index) => {
        console.log(`   ${index + 1}. Task: ${result.task_id}, Student: ${result.student_id}`);
        console.log(`       Raw: ${result.raw_score || 'N/A'}, Percent: ${result.percent_score || 'N/A'}%, Normalized: ${result.normalised_percent || 'N/A'}%`);
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkDatabaseData();
