import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAssessmentImport } from '@/hooks/useAssessmentImport';
import { useStudents } from '@/hooks/useStudents';
import {
  parseAssessmentCSV,
  parseSingleMarkCSV,
  parseKahootSummarySheet,
  type AssessmentImportFormat,
  type ParsedAssessmentData,
} from '@/utils/csvAssessmentParser';
import { Upload, Download } from 'lucide-react';

interface ImportAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
}

export const ImportAssessmentDialog = ({ open, onOpenChange, classId }: ImportAssessmentDialogProps) => {
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<'Diagnostic' | 'Formative' | 'Summative'>('Formative');
  const [totalMarks, setTotalMarks] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedAssessmentData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [resultFormat, setResultFormat] = useState<AssessmentImportFormat>('standard');
  const [studentMappings, setStudentMappings] = useState<Record<number, string>>({});
  const [singleMarkData, setSingleMarkData] = useState<Record<string, { score: string; percentage: string }>>({});

  const { toast } = useToast();
  const importMutation = useAssessmentImport();
  const { data: classStudents, isLoading: studentsLoading } = useStudents(classId);

  const uniqueClassStudents = useMemo(() => {
    if (!classStudents) return [];
    const seen = new Set<string>();
    return classStudents.filter((student) => {
      if (seen.has(student.id)) return false;
      seen.add(student.id);
      return true;
    });
  }, [classStudents]);

  const classStudentOptions = useMemo(() => {
    return (
      uniqueClassStudents?.map(student => ({
        id: student.id,
        label: `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.student_id || 'Unnamed student',
      })) ?? []
    );
  }, [uniqueClassStudents]);

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

  const resetStudentMappings = () => setStudentMappings({});

  useEffect(() => {
    if (!parsedData || !uniqueClassStudents) {
      if (!parsedData) {
        resetStudentMappings();
      }
      return;
    }

    setStudentMappings(prev => {
      const next = { ...prev };

      const studentsById = new Map<string, string>();
      uniqueClassStudents.forEach(student => {
        if (student.student_id) {
          studentsById.set(student.student_id, student.id);
        }
      });

      if (parsedData.sourceFormat === 'standard') {
        parsedData.students.forEach((participant, index) => {
          if (!next[index] && participant.studentId) {
            const match = studentsById.get(participant.studentId);
            if (match) {
              next[index] = match;
            }
          }
        });
      } else if (parsedData.sourceFormat === 'kahoot') {
        const normalizedNameMap = new Map<string, string>();
        uniqueClassStudents.forEach(student => {
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

        parsedData.students.forEach((participant, index) => {
          if (next[index]) return;

          const candidates = buildNameCandidates(participant.displayName);
          if (participant.firstName || participant.lastName) {
            candidates.add(`${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim());
          }

          for (const candidate of candidates) {
            const normalized = normalizeForMatch(candidate);
            if (!normalized) continue;
            const match = normalizedNameMap.get(normalized);
            if (match) {
              next[index] = match;
              break;
            }
          }
        });
      }

      return next;
    });
  }, [parsedData, uniqueClassStudents]);

  const resetUploadedData = () => {
    setCsvFile(null);
    setParsedData(null);
    setTotalMarks(0);
    resetStudentMappings();
    setSingleMarkData({});
  };

  useEffect(() => {
    if (resultFormat === 'single_mark' && uniqueClassStudents) {
      const initial: Record<string, { score: string; percentage: string }> = {};
      uniqueClassStudents.forEach(student => {
        initial[student.id] = { score: '', percentage: '' };
      });
      setSingleMarkData(initial);
    }
  }, [resultFormat, uniqueClassStudents]);

  const handleFormatChange = (value: AssessmentImportFormat) => {
    setResultFormat(value);
    resetUploadedData();
  };

  const handleFileUpload = async (file: File) => {
    try {
      let data: ParsedAssessmentData;

      if (resultFormat === 'standard' || resultFormat === 'single_mark') {
        if (!file.name.toLowerCase().endsWith('.csv')) {
          toast({
            title: 'Invalid File',
            description: `Please upload a CSV file for the ${resultFormat === 'standard' ? 'Standard' : 'Single Mark'} format.`,
            variant: 'destructive',
          });
          return;
        }

        const text = await file.text();
        data = resultFormat === 'standard' ? parseAssessmentCSV(text) : parseSingleMarkCSV(text);
      } else {
        const lowerName = file.name.toLowerCase();
        if (!(lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls'))) {
          toast({
            title: 'Invalid File',
            description: 'Please upload an Excel (.xlsx) file exported from Kahoot!',
            variant: 'destructive',
          });
          return;
        }

        const buffer = await file.arrayBuffer();
        data = parseKahootSummarySheet(buffer);
      }

      setParsedData(data);
      if (data.totalMarks > 0) {
        setTotalMarks(data.totalMarks);
      }
      setCsvFile(file);

      // Prefill single mark inputs from uploaded CSV
      if (resultFormat === 'single_mark' && data.sourceFormat === 'single_mark') {
        const studentsById = new Map<string, typeof uniqueClassStudents[number]>();
        uniqueClassStudents?.forEach(s => {
          if (s.student_id) studentsById.set(s.student_id, s);
        });

        const prefilled: Record<string, { score: string; percentage: string }> = {};
        data.students.forEach(s => {
          if (s.studentId) {
            const match = studentsById.get(s.studentId);
            if (match) {
              prefilled[match.id] = {
                score: s.totalScore > 0 ? String(s.totalScore) : '',
                percentage: s.totalPercentage > 0 ? String(s.totalPercentage) : '',
              };
            }
          }
        });
        setSingleMarkData(prev => ({ ...prev, ...prefilled }));
      }
    } catch (error) {
      console.error('Import parsing error:', error);
      toast({
        title: 'Parse Error',
        description:
          resultFormat === 'standard'
            ? 'Could not parse the CSV file. Please check the format.'
            : 'Could not parse the Kahoot! Summary sheet. Please verify the export format.',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const mappedKahootComplete = useMemo(() => {
    if (!parsedData || parsedData.sourceFormat !== 'kahoot') return true;
    return parsedData.students.every((_, index) => Boolean(studentMappings[index]));
  }, [parsedData, studentMappings]);

  const duplicateKahootMappings = useMemo(() => {
    if (!parsedData || parsedData.sourceFormat !== 'kahoot') {
      return new Set<string>();
    }

    const counts = new Map<string, number>();
    parsedData.students.forEach((_, index) => {
      const mappedId = studentMappings[index];
      if (mappedId) {
        counts.set(mappedId, (counts.get(mappedId) ?? 0) + 1);
      }
    });

    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([studentId]) => studentId)
    );
  }, [parsedData, studentMappings]);

  const escapeCsv = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const handleDownloadTemplate = () => {
    if (!uniqueClassStudents || uniqueClassStudents.length === 0) {
      toast({
        title: 'No students found',
        description: 'This class has no students to include in the template.',
        variant: 'destructive',
      });
      return;
    }

    const questionCount = 10;
    const questionColumns = Array.from({ length: questionCount }, (_, i) => `Q${i + 1}`);
    const headers = ['StudentID', 'FirstName', 'LastName', ...questionColumns, 'Total'];

    const questionTextRow = ['Question Text', '', '', ...Array(questionCount).fill(''), ''];
    const questionTypeRow = ['Question Type', '', '', ...Array(questionCount).fill(''), ''];
    const contentDescriptorRow = ['Content Descriptor', '', '', ...Array(questionCount).fill(''), ''];
    const bloomsTaxonomyRow = ["Bloom's Taxonomy", '', '', ...Array(questionCount).fill(''), ''];
    const availableMarksRow = ['Available Marks', '', '', ...Array(questionCount).fill('1'), '0'];
    const separatorRow = ['# Add student scores below', '', '', ...Array(questionCount).fill(''), ''];

    const studentRows = uniqueClassStudents.map((student) => {
      const id = student.student_id || '';
      const firstName = student.first_name || '';
      const lastName = student.last_name || '';
      const scores = Array(questionCount).fill('0');
      return [id, firstName, lastName, ...scores, '0'];
    });

    const allRows = [
      headers,
      questionTextRow,
      questionTypeRow,
      contentDescriptorRow,
      bloomsTaxonomyRow,
      availableMarksRow,
      separatorRow,
      ...studentRows,
    ];

    const csvContent = allRows.map((row) => row.map(escapeCsv).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment_template_${classId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template downloaded',
      description: `A template with ${uniqueClassStudents.length} students and ${questionCount} questions has been downloaded.`,
    });
  };

  const handleDownloadSingleMarkTemplate = () => {
    if (!uniqueClassStudents || uniqueClassStudents.length === 0) {
      toast({
        title: 'No students found',
        description: 'This class has no students to include in the template.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['StudentID', 'FirstName', 'LastName', 'Score', 'Percentage'];

    const studentRows = uniqueClassStudents.map((student) => {
      const id = student.student_id || '';
      const firstName = student.first_name || '';
      const lastName = student.last_name || '';
      return [id, firstName, lastName, '', ''];
    });

    const allRows = [headers, ...studentRows];

    const csvContent = allRows.map((row) => row.map(escapeCsv).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `single_mark_template_${classId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template downloaded',
      description: `A single-mark template with ${uniqueClassStudents.length} students has been downloaded.`,
    });
  };

  const hasDuplicateMappings = duplicateKahootMappings.size > 0;

  const hasAnySingleMarkData = useMemo(() => {
    return Object.values(singleMarkData).some(
      m => m.score.trim() !== '' || m.percentage.trim() !== ''
    );
  }, [singleMarkData]);

  const handleImport = () => {
    if (!title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide an assessment title.",
        variant: "destructive",
      });
      return;
    }

    let assessmentData: ParsedAssessmentData;

    if (resultFormat === 'single_mark') {
      if (parsedData) {
        assessmentData = {
          ...parsedData,
          students: parsedData.students.map((student, index) => ({
            ...student,
            resolvedStudentId: studentMappings[index],
          })),
        };
      } else {
        if (!hasAnySingleMarkData) {
          toast({
            title: "No Marks Entered",
            description: "Please enter at least one score or percentage.",
            variant: "destructive",
          });
          return;
        }

        const students = (uniqueClassStudents || [])
          .filter(s => s.student_id)
          .map(s => {
            const mark = singleMarkData[s.id] || { score: '', percentage: '' };
            const scoreNum = parseFloat(mark.score) || 0;
            const pctNum = parseFloat(mark.percentage) || 0;
            return {
              studentId: s.student_id!,
              firstName: s.first_name || '',
              lastName: s.last_name || '',
              displayName: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.student_id!,
              scores: [] as number[],
              totalScore: scoreNum,
              totalPercentage: pctNum,
              resolvedStudentId: s.id,
            };
          });

        assessmentData = {
          sourceFormat: 'single_mark',
          questions: [],
          students,
          totalMarks: 0,
        };
      }
    } else {
      if (!parsedData) {
        toast({
          title: "Missing Information",
          description: "Please upload an assessment results file.",
          variant: "destructive",
        });
        return;
      }

      if (parsedData.sourceFormat === 'kahoot' && !mappedKahootComplete) {
        toast({
          title: "Map Students",
          description: "Please map all Kahoot! players to students in this class before importing.",
          variant: "destructive",
        });
        return;
      }

      if (parsedData.sourceFormat === 'kahoot' && hasDuplicateMappings) {
        toast({
          title: "Resolve Duplicate Mappings",
          description: "Each Kahoot! player must be linked to a different student.",
          variant: "destructive",
        });
        return;
      }

      assessmentData = {
        ...parsedData,
        students: parsedData.students.map((student, index) => ({
          ...student,
          resolvedStudentId: studentMappings[index],
        })),
      };
    }

    importMutation.mutate({
      classId,
      assessmentData,
      title,
      taskType,
      totalMarks,
      dueDate: dueDate || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        // Reset form
        setTitle('');
        setTaskType('Formative');
        resetUploadedData();
        setDueDate('');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] max-w-2xl flex-col p-0 sm:p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Import Assessment Results</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <div className="space-y-2">
              <Label>Results Format</Label>
              <RadioGroup
                value={resultFormat}
                onValueChange={(value) => handleFormatChange(value as AssessmentImportFormat)}
                className="grid grid-cols-3 gap-2"
              >
                <label className="flex items-center space-x-2 rounded-md border p-3 text-sm hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="standard" id="format-standard" />
                  <span className="font-medium">Standard</span>
                </label>
                <label className="flex items-center space-x-2 rounded-md border p-3 text-sm hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="single_mark" id="format-single-mark" />
                  <span className="font-medium">Single Mark</span>
                </label>
                <label className="flex items-center space-x-2 rounded-md border p-3 text-sm hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="kahoot" id="format-kahoot" />
                  <span className="font-medium">Kahoot!</span>
                </label>
              </RadioGroup>
              <p className="text-sm text-muted-foreground">
                {resultFormat === 'standard'
                  ? 'Upload a Teacher Tempo CSV export.'
                  : resultFormat === 'single_mark'
                    ? 'Upload a CSV with StudentID, Score and/or Percentage columns.'
                    : 'Upload a Kahoot! Summary Excel export (.xlsx).'}
              </p>
            </div>
          </div>

          {(resultFormat === 'standard' || resultFormat === 'single_mark') && (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resultFormat === 'standard' ? handleDownloadTemplate : handleDownloadSingleMarkTemplate}
                disabled={studentsLoading || !uniqueClassStudents || uniqueClassStudents.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Assessment Results File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {csvFile ? (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  <span>{csvFile.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your file here, or{' '}
                    <label className="text-primary hover:underline cursor-pointer">
                      browse
                      <input
                        type="file"
                        accept={resultFormat === 'standard' || resultFormat === 'single_mark' ? '.csv' : '.xlsx,.xls'}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Manual Single Mark Entry */}
          {resultFormat === 'single_mark' && (
            <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/10 p-4">
              <div>
                <h4 className="font-medium">Enter Marks Manually</h4>
                <p className="text-sm text-muted-foreground">
                  Type a score and/or percentage for each student. You can also upload a CSV above to prefill these fields.
                </p>
              </div>
              {studentsLoading ? (
                <p className="text-sm text-muted-foreground">Loading students…</p>
              ) : !uniqueClassStudents || uniqueClassStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students found in this class.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2">
                    <div className="col-span-6">Student</div>
                    <div className="col-span-3">Score</div>
                    <div className="col-span-3">Percentage</div>
                  </div>
                  {uniqueClassStudents.map((student) => (
                    <div key={student.id} className="grid grid-cols-12 gap-2 items-center rounded-md border bg-background p-2">
                      <div className="col-span-6 text-sm truncate">
                        {`${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.student_id || 'Unnamed student'}
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min={0}
                          placeholder="—"
                          value={singleMarkData[student.id]?.score ?? ''}
                          onChange={(e) =>
                            setSingleMarkData(prev => ({
                              ...prev,
                              [student.id]: { ...prev[student.id], score: e.target.value },
                            }))
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="—"
                          value={singleMarkData[student.id]?.percentage ?? ''}
                          onChange={(e) =>
                            setSingleMarkData(prev => ({
                              ...prev,
                              [student.id]: { ...prev[student.id], percentage: e.target.value },
                            }))
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {parsedData && (
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Preview</h4>
              <p className="text-sm text-muted-foreground">
                {parsedData.sourceFormat === 'single_mark'
                  ? `${parsedData.students.length} students`
                  : `${parsedData.questions.length} questions • ${parsedData.students.length} students`}
              </p>
              {parsedData.sourceFormat !== 'single_mark' && (
                <p className="text-sm text-muted-foreground">
                  Total marks: {parsedData.totalMarks}
                </p>
              )}
            </div>
          )}

          {parsedData && parsedData.sourceFormat === 'kahoot' && (
            <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/10 p-4">
              <div>
                <h4 className="font-medium">Map Kahoot! Players</h4>
                <p className="text-sm text-muted-foreground">
                  Match each player to a student in this class before importing. Unmapped players cannot be imported.
                </p>
              </div>
              {studentsLoading ? (
                <p className="text-sm text-muted-foreground">Loading students…</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {parsedData.students.map((participant, index) => {
                    const mappedStudentId = studentMappings[index];
                    const isUnmapped = !mappedStudentId;
                    const isDuplicate = Boolean(mappedStudentId && duplicateKahootMappings.has(mappedStudentId));

                    return (
                      <div
                        key={`${participant.displayName}-${index}`}
                        className={`rounded-lg border p-3 ${
                          isUnmapped
                            ? 'border-destructive/50 bg-destructive/5'
                            : isDuplicate
                              ? 'border-amber-500/70 bg-amber-100/30'
                              : 'border-muted-foreground/25'
                        }`}
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium">{participant.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {participant.scores.filter(score => score > 0).length} correct • {participant.totalScore} / {parsedData.totalMarks}
                            </p>
                          </div>
                          <div className="w-full md:w-80">
                            <Select
                              value={mappedStudentId ?? ''}
                              onValueChange={(value) =>
                                setStudentMappings(prev => ({
                                  ...prev,
                                  [index]: value,
                                }))
                              }
                            >
                              <SelectTrigger
                                className={
                                  isUnmapped
                                    ? 'border-destructive'
                                    : isDuplicate
                                      ? 'border-amber-500 bg-amber-100/30'
                                      : undefined
                                }
                              >
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                              <SelectContent>
                                {classStudentOptions.map(option => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Assessment Details Form */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Assessment Title *</Label>
              <Input
                id="title"
                placeholder="Enter assessment title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Assessment Type *</Label>
              <Select value={taskType} onValueChange={(value: 'Diagnostic' | 'Formative' | 'Summative') => setTaskType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diagnostic">Diagnostic</SelectItem>
                  <SelectItem value="Formative">Formative</SelectItem>
                  <SelectItem value="Summative">Summative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks *</Label>
              <Input
                id="totalMarks"
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 border-t border-muted-foreground/10 bg-background/95 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={
              importMutation.isPending ||
              !title.trim() ||
              (resultFormat !== 'single_mark' && !parsedData) ||
              (resultFormat === 'single_mark' && !parsedData && !hasAnySingleMarkData) ||
              !mappedKahootComplete ||
              hasDuplicateMappings
            }
          >
            {importMutation.isPending ? 'Importing...' : 'Import Assessment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};