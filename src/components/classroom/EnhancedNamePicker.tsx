import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shuffle, Maximize2, User, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClassroomTheme } from "@/contexts/ClassroomThemeContext";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

interface EnhancedNamePickerProps {
  students: Student[];
  className?: string;
}

export function EnhancedNamePicker({ students, className }: EnhancedNamePickerProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const { currentTheme } = useClassroomTheme();

  const pickRandomStudent = () => {
    if (students.length === 0) return;
    
    setIsSpinning(true);
    
    // Spin effect: rapidly change students
    let count = 0;
    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * students.length);
      setSelectedStudent(students[randomIndex]);
      count++;
      
      if (count >= 15) {
        clearInterval(spinInterval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const openFullscreen = () => {
    const width = Math.min(600, window.innerWidth * 0.9);
    const height = Math.min(500, window.innerHeight * 0.8);
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const newWindow = window.open(
      '',
      'name-picker-fullscreen',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`
    );

    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Name Picker</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: ${currentTheme.gradient};
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              overflow: hidden;
            }
            .picker-container {
              text-align: center;
              background: ${currentTheme.containerBg};
              backdrop-filter: blur(20px);
              border-radius: clamp(16px, 3vw, 24px);
              padding: clamp(30px, 6vw, 60px);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              min-width: min(400px, 90vw);
              max-width: 90vw;
            }
            .student-name {
              font-size: clamp(2rem, 8vw, 3rem);
              font-weight: 700;
              color: white;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              margin-bottom: clamp(15px, 3vw, 20px);
              min-height: clamp(3rem, 8vw, 4rem);
              display: flex;
              align-items: center;
              justify-content: center;
              word-break: break-word;
            }
            .button {
              background: white;
              color: #f5576c;
              border: none;
              padding: clamp(12px, 2.5vw, 15px) clamp(30px, 6vw, 40px);
              border-radius: clamp(10px, 2vw, 12px);
              font-size: clamp(1rem, 2.5vw, 1.1rem);
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
              transition: transform 0.2s;
              white-space: nowrap;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .button:active {
              transform: translateY(0);
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.8); }
              to { opacity: 1; transform: scale(1); }
            }
            @media (max-width: 600px) {
              .picker-container {
                padding: clamp(20px, 4vw, 30px);
                margin: 0 10px;
              }
              .button {
                width: 100%;
                max-width: 200px;
              }
            }
            .fade-in {
              animation: fadeIn 0.3s ease-out;
            }
          </style>
        </head>
        <body>
          <div class="picker-container">
            <div class="student-name" id="selectedStudent">
              ${selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'Click to pick a student'}
            </div>
            <button class="button" onclick="pickStudent()">
              🎲 Pick Student
            </button>
          </div>
          <script>
            const students = ${JSON.stringify(students)};
            
            function pickStudent() {
              if (students.length === 0) return;
              
              let count = 0;
              const spinInterval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * students.length);
                const student = students[randomIndex];
                const display = document.getElementById('selectedStudent');
                display.textContent = student.first_name + ' ' + student.last_name;
                count++;
                
                if (count >= 15) {
                  clearInterval(spinInterval);
                  display.classList.add('fade-in');
                  setTimeout(() => display.classList.remove('fade-in'), 300);
                }
              }, 100);
            }
          </script>
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const openWheelPicker = () => {
    if (students.length === 0) return;
    
    const width = 900;
    const height = 1000;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Encode students data to pass via URL
    const studentsData = encodeURIComponent(JSON.stringify(students));
    const url = `/spinner?students=${studentsData}`;

    const newWindow = window.open(
      url,
      'spinner-window',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`
    );
  };



  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-xl", className)}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50" />
      
      {/* Frosted Glass Effect Card */}
      <div className="relative backdrop-blur-sm bg-white/40 p-6 rounded-xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-pink-600" />
            <h3 className="font-semibold text-lg text-gray-800">Name Picker</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/50"
              onClick={openWheelPicker}
              disabled={students.length === 0}
              title="Open Spinning Wheel"
            >
              <Circle className="w-4 h-4 text-purple-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/50"
              onClick={openFullscreen}
              title="Open Fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Student Display */}
        <div className="mb-6">
          <div className="relative flex items-center justify-center py-12 px-4 bg-white/60 rounded-2xl min-h-[160px]">
            {selectedStudent ? (
              <div className={cn(
                "text-center transition-all duration-300",
                isSpinning && "blur-sm"
              )}>
                <div className="flex items-center justify-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  ID: {selectedStudent.student_id}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Shuffle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <div className="text-lg font-medium">Click to pick a student</div>
              </div>
            )}
          </div>
        </div>

        {/* Control Button */}
        <Button
          onClick={pickRandomStudent}
          disabled={students.length === 0 || isSpinning}
          size="lg"
          className={cn(
            "w-full rounded-xl font-semibold shadow-lg transition-all duration-200",
            "bg-gradient-to-r from-pink-500 to-purple-500",
            "hover:from-pink-600 hover:to-purple-600",
            "text-white"
          )}
        >
          <Shuffle className="w-5 h-5 mr-2" />
          {isSpinning ? "Picking..." : "Pick Random Student"}
        </Button>

        {/* Student Count */}
        <div className="mt-3 text-center">
          <p className="text-xs font-medium text-gray-600">
            {students.length} {students.length === 1 ? "student" : "students"} selected
          </p>
        </div>
      </div>
    </Card>
  );
}

