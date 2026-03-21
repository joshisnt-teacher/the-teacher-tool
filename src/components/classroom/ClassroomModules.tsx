import React from "react";
import { EnhancedTimer } from "./EnhancedTimer";
import { EnhancedNamePicker } from "./EnhancedNamePicker";
import { EnhancedGroupAssigner } from "./EnhancedGroupAssigner";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

interface ClassroomModulesProps {
  students: Student[];
  isLessonActive: boolean;
  selectedStudents: Set<string>;
}

export function ClassroomModules({ students, isLessonActive, selectedStudents }: ClassroomModulesProps) {

  // Filter students based on selection
  const availableStudents = students.filter(s => selectedStudents.has(s.id));

  return (
    <div className="space-y-6">
      {/* Enhanced Timer Module */}
      <EnhancedTimer />

      {/* Enhanced Name Picker Module */}
      <EnhancedNamePicker students={availableStudents} />

      {/* Enhanced Group Assigner Module */}
      <EnhancedGroupAssigner students={availableStudents} />
    </div>
  );
}
