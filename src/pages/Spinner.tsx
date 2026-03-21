import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { StudentSpinner } from '@/components/classroom/StudentSpinner';

const Spinner = () => {
  const [searchParams] = useSearchParams();
  
  // Get students data from URL params
  const studentsParam = searchParams.get('students');
  let students = [];
  
  try {
    if (studentsParam) {
      students = JSON.parse(decodeURIComponent(studentsParam));
    }
  } catch (e) {
    console.error('Failed to parse students data', e);
  }

  return <StudentSpinner students={students} />;
};

export default Spinner;
