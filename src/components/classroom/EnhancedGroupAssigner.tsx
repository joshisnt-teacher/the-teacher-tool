import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users2, Maximize2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClassroomTheme } from "@/contexts/ClassroomThemeContext";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

interface EnhancedGroupAssignerProps {
  students: Student[];
  className?: string;
}

export function EnhancedGroupAssigner({ students, className }: EnhancedGroupAssignerProps) {
  const [numberOfGroups, setNumberOfGroups] = useState(2);
  const [groups, setGroups] = useState<Student[][]>([]);
  const { currentTheme } = useClassroomTheme();

  const createRandomGroups = () => {
    if (students.length === 0) return;
    
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const newGroups: Student[][] = [];
    
    // Calculate students per group and remainder
    const totalStudents = shuffled.length;
    const studentsPerGroup = Math.floor(totalStudents / numberOfGroups);
    const remainder = totalStudents % numberOfGroups;
    
    let currentIndex = 0;
    
    // Create groups with base size
    for (let i = 0; i < numberOfGroups; i++) {
      const groupSize = studentsPerGroup + (i < remainder ? 1 : 0);
      newGroups.push(shuffled.slice(currentIndex, currentIndex + groupSize));
      currentIndex += groupSize;
    }
    
    setGroups(newGroups);
  };

  const openFullscreen = () => {
    const width = Math.min(800, window.innerWidth * 0.9);
    const height = Math.min(700, window.innerHeight * 0.9);
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const newWindow = window.open(
      '',
      'group-assigner-fullscreen',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Group Assigner</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: ${currentTheme.gradient};
              padding: clamp(15px, 3vw, 30px);
              min-height: 100vh;
              margin: 0;
            }
            .container {
              max-width: min(90vw, 800px);
              margin: 0 auto;
            }
            .header {
              text-align: center;
              background: rgba(255, 255, 255, 0.15);
              backdrop-filter: blur(20px);
              border-radius: clamp(15px, 3vw, 20px);
              padding: clamp(20px, 4vw, 30px);
              margin-bottom: clamp(20px, 4vw, 30px);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .title {
              font-size: clamp(1.5rem, 4vw, 2rem);
              font-weight: 700;
              color: white;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              margin-bottom: clamp(10px, 2vw, 15px);
            }
            .button {
              background: white;
              color: #00f2fe;
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
            .groups-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(min(250px, 90vw), 1fr));
              gap: clamp(15px, 3vw, 20px);
            }
            .group {
              background: rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(10px);
              border-radius: clamp(12px, 2.5vw, 16px);
              padding: clamp(15px, 3vw, 20px);
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.5);
            }
            .group-title {
              font-size: 1.3rem;
              font-weight: 700;
              color: #00a6ff;
              margin-bottom: 12px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e0f2fe;
            }
            .student {
              padding: clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 12px);
              margin: clamp(4px, 1vw, 6px) 0;
              background: ${currentTheme.containerBg};
              border-radius: clamp(6px, 1.5vw, 8px);
              color: #0c4a6e;
              font-weight: 500;
              font-size: clamp(0.9rem, 2vw, 1rem);
            }
            .group {
              opacity: 0;
              transform: translateY(20px);
              animation: slideInUp 0.6s ease-out forwards;
            }
            .group:nth-child(1) { animation-delay: 0.1s; }
            .group:nth-child(2) { animation-delay: 0.2s; }
            .group:nth-child(3) { animation-delay: 0.3s; }
            .group:nth-child(4) { animation-delay: 0.4s; }
            .group:nth-child(5) { animation-delay: 0.5s; }
            .group:nth-child(6) { animation-delay: 0.6s; }
            .group:nth-child(7) { animation-delay: 0.7s; }
            .group:nth-child(8) { animation-delay: 0.8s; }
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .student {
              opacity: 0;
              transform: translateX(-10px);
              animation: slideInLeft 0.4s ease-out forwards;
            }
            .student:nth-child(2) { animation-delay: 0.1s; }
            .student:nth-child(3) { animation-delay: 0.2s; }
            .student:nth-child(4) { animation-delay: 0.3s; }
            .student:nth-child(5) { animation-delay: 0.4s; }
            .student:nth-child(6) { animation-delay: 0.5s; }
            .student:nth-child(7) { animation-delay: 0.6s; }
            .student:nth-child(8) { animation-delay: 0.7s; }
            @keyframes slideInLeft {
              from {
                opacity: 0;
                transform: translateX(-10px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            @media (max-width: 600px) {
              .container {
                padding: 0 10px;
              }
              .controls {
                flex-direction: column;
                align-items: center;
              }
              .button {
                width: 100%;
                max-width: 200px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">📚 Random Groups</div>
              <button class="button" onclick="createGroups()">
                🎲 Create New Groups
              </button>
            </div>
            <div class="groups-container" id="groups"></div>
          </div>
          <script>
            const students = ${JSON.stringify(students)};
            const numberOfGroups = ${numberOfGroups};
            
            ${groups.length > 0 ? 'createGroups();' : ''}
            
            function createGroups() {
              const shuffled = [...students].sort(() => Math.random() - 0.5);
              const groups = [];
              
              // Calculate students per group and remainder
              const totalStudents = shuffled.length;
              const studentsPerGroup = Math.floor(totalStudents / numberOfGroups);
              const remainder = totalStudents % numberOfGroups;
              
              let currentIndex = 0;
              
              // Create groups with base size
              for (let i = 0; i < numberOfGroups; i++) {
                const groupSize = studentsPerGroup + (i < remainder ? 1 : 0);
                groups.push(shuffled.slice(currentIndex, currentIndex + groupSize));
                currentIndex += groupSize;
              }
              
              // Clear existing groups first
              document.getElementById('groups').innerHTML = '';
              
              // Add groups with staggered animation
              groups.forEach((group, index) => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'group';
                groupDiv.style.animationDelay = (index * 0.1) + 's';
                
                const titleDiv = document.createElement('div');
                titleDiv.className = 'group-title';
                titleDiv.textContent = 'Group ' + (index + 1);
                groupDiv.appendChild(titleDiv);
                
                group.forEach((student, studentIndex) => {
                  const studentDiv = document.createElement('div');
                  studentDiv.className = 'student';
                  studentDiv.style.animationDelay = ((index * 0.1) + (studentIndex * 0.1) + 0.2) + 's';
                  studentDiv.textContent = student.first_name + ' ' + student.last_name;
                  groupDiv.appendChild(studentDiv);
                });
                
                document.getElementById('groups').appendChild(groupDiv);
              });
            }
          </script>
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const groupColors = [
    "from-blue-100 to-blue-200 border-blue-300",
    "from-green-100 to-green-200 border-green-300",
    "from-purple-100 to-purple-200 border-purple-300",
    "from-orange-100 to-orange-200 border-orange-300",
    "from-pink-100 to-pink-200 border-pink-300",
    "from-teal-100 to-teal-200 border-teal-300",
  ];

  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-xl", className)}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50" />
      
      {/* Frosted Glass Effect Card */}
      <div className="relative backdrop-blur-sm bg-white/40 p-6 rounded-xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-cyan-600" />
            <h3 className="font-semibold text-lg text-gray-800">Group Assigner</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-white/50"
            onClick={openFullscreen}
          >
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </Button>
        </div>

        {/* Settings */}
        <div className="mb-4">
          <Label htmlFor="numberOfGroups" className="text-gray-700 font-medium mb-2 block text-sm">
            Number of Groups
          </Label>
          <Select value={numberOfGroups.toString()} onValueChange={(value) => setNumberOfGroups(parseInt(value))}>
            <SelectTrigger className="bg-white/60 border-white/50 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 groups</SelectItem>
              <SelectItem value="3">3 groups</SelectItem>
              <SelectItem value="4">4 groups</SelectItem>
              <SelectItem value="5">5 groups</SelectItem>
              <SelectItem value="6">6 groups</SelectItem>
              <SelectItem value="7">7 groups</SelectItem>
              <SelectItem value="8">8 groups</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Groups Button */}
        <Button
          onClick={createRandomGroups}
          disabled={students.length === 0}
          size="lg"
          className={cn(
            "w-full mb-4 rounded-xl font-semibold shadow-lg transition-all duration-200",
            "bg-gradient-to-r from-cyan-500 to-blue-500",
            "hover:from-cyan-600 hover:to-blue-600",
            "text-white"
          )}
        >
          <Users2 className="w-5 h-5 mr-2" />
          Create Random Groups
        </Button>

        {/* Student Count */}
        <div className="mb-3 text-center">
          <p className="text-xs font-medium text-gray-600">
            {students.length} students selected
          </p>
        </div>

        {/* Groups Display */}
        {groups.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-xs text-gray-700 mb-2">
              {groups.length} {groups.length === 1 ? "Group" : "Groups"} Created:
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {groups.map((group, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border-2 bg-gradient-to-br shadow-sm animate-in slide-in-from-bottom-4 fade-in duration-500",
                    groupColors[index % groupColors.length]
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                    <Users className="w-3 h-3" />
                    <span className="text-xs">Group {index + 1}</span>
                  </div>
                  <div className="space-y-0.5">
                    {group.map((student, studentIndex) => (
                      <div
                        key={student.id}
                        className="text-xs text-gray-700 pl-4 animate-in slide-in-from-left-2 fade-in duration-300"
                        style={{ animationDelay: `${(index * 100) + (studentIndex * 50) + 200}ms` }}
                      >
                        {studentIndex + 1}. {student.first_name} {student.last_name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {groups.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Users2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No groups created yet</p>
            <p className="text-xs mt-1">Click the button above to create random groups</p>
          </div>
        )}
      </div>
    </Card>
  );
}

