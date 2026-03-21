import { read, utils } from 'xlsx';

export type AssessmentImportFormat = 'standard' | 'kahoot';

export interface ParsedQuestion {
  number: number;
  question: string;
  questionType: string;
  contentDescriptor?: string;
  bloomsTaxonomy?: string;
  maxScore: number;
}

export interface ParsedStudentResult {
  studentId?: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  externalName?: string;
  scores: number[];
  totalScore: number;
  totalPercentage: number;
  resolvedStudentId?: string;
}

export interface ParsedAssessmentData {
  sourceFormat: AssessmentImportFormat;
  questions: ParsedQuestion[];
  students: ParsedStudentResult[];
  totalMarks: number;
}

const normalizeCsvLine = (line: string) => line.replace(/\r/g, '');

export const parseAssessmentCSV = (csvContent: string): ParsedAssessmentData => {
  const lines = csvContent
    .split('\n')
    .map(normalizeCsvLine)
    .filter(line => line.trim().length > 0);

  if (lines.length < 8) {
    throw new Error('CSV file is missing required rows.');
  }

  // Parse header to identify question columns
  const headers = lines[0].split(',');
  const questionColumns: number[] = [];

  headers.forEach((header, index) => {
    if (header.match(/^Q\d+$/i)) {
      questionColumns.push(index);
    }
  });

  if (questionColumns.length === 0) {
    throw new Error('No question columns (Q1, Q2, ...) were found in the CSV header.');
  }

  // Extract metadata rows
  const questionTexts = lines[1].split(',');
  const questionTypes = lines[2].split(',');
  const contentDescriptors = lines[3].split(',');
  const bloomsTaxonomy = lines[4].split(',');
  const availableMarks = lines[5].split(',');

  // Build questions array
  const questions = questionColumns.map((colIndex, questionIndex) => ({
    number: questionIndex + 1,
    question: questionTexts[colIndex] || '',
    questionType: questionTypes[colIndex] || '',
    contentDescriptor: contentDescriptors[colIndex] || undefined,
    bloomsTaxonomy: bloomsTaxonomy[colIndex] || undefined,
    maxScore: parseInt(availableMarks[colIndex] ?? '0', 10) || 0,
  }));

  const totalMarks = questions.reduce((sum, q) => sum + q.maxScore, 0);
  const totalColumnIndex = headers.findIndex(header => header.trim().toLowerCase() === 'total');

  const students = lines.slice(7).map(line => {
    const values = line.split(',');
    const studentId = values[0]?.trim() || '';
    if (!studentId) {
      return null;
    }

    const firstName = values[1]?.trim() || '';
    const lastName = values[2]?.trim() || '';
    const scores = questionColumns.map(colIndex => parseInt(values[colIndex] ?? '0', 10) || 0);
    const totalScore =
      totalColumnIndex >= 0
        ? parseInt(values[totalColumnIndex] ?? '0', 10) || scores.reduce((sum, score) => sum + score, 0)
        : scores.reduce((sum, score) => sum + score, 0);
    const totalPercentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;

    return {
      studentId,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim() || studentId,
      scores,
      totalScore,
      totalPercentage,
      resolvedStudentId: undefined,
    } as ParsedStudentResult;
  }).filter((student): student is ParsedStudentResult => Boolean(student));

  return {
    sourceFormat: 'standard',
    questions,
    students,
    totalMarks,
  };
};

const normalizeString = (value: string | number | undefined | null) =>
  `${value ?? ''}`.trim();

export const parseKahootSummarySheet = (arrayBuffer: ArrayBuffer): ParsedAssessmentData => {
  const workbook = read(arrayBuffer, { type: 'array' });
  const sheetName = 'Kahoot! Summary';
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" was not found in the uploaded file.`);
  }

  const range = utils.decode_range(sheet['!ref'] ?? 'A1');
  const headerRowIndex = 2; // Row 3 in Excel (0-based indexing)

  const headerValues: string[] = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = utils.encode_cell({ r: headerRowIndex, c: col });
    const cellValue = normalizeString(sheet[cellAddress]?.v);
    headerValues.push(cellValue);
  }

  const playerColumnIndex = headerValues.findIndex(value => value.toLowerCase() === 'player');
  if (playerColumnIndex === -1) {
    throw new Error('Could not find a "Player" column in the Kahoot! Summary sheet.');
  }

  const totalScoreColumnIndex = headerValues.findIndex(value =>
    value.toLowerCase().startsWith('total score')
  );

  const questionColumnIndexes: number[] = [];
  headerValues.forEach((value, index) => {
    if (/^q\d+$/i.test(value)) {
      questionColumnIndexes.push(index);
    }
  });

  if (questionColumnIndexes.length === 0) {
    throw new Error('No question columns (Q1, Q2, ...) were found in the Kahoot! Summary sheet.');
  }

  const questions = questionColumnIndexes.map((colIndex, questionNumber) => {
    const questionTextCell = utils.encode_cell({ r: headerRowIndex, c: range.s.c + colIndex + 1 });
    const questionText = normalizeString(sheet[questionTextCell]?.v);

    return {
      number: questionNumber + 1,
      question: questionText || `Q${questionNumber + 1}`,
      questionType: 'Multiple Choice',
      maxScore: 1,
    } as ParsedQuestion;
  });

  const students: ParsedStudentResult[] = [];
  const firstDataRowIndex = headerRowIndex + 1; // Row 4 in Excel

  for (let row = firstDataRowIndex; row <= range.e.r; row++) {
    const playerCell = utils.encode_cell({ r: row, c: range.s.c + playerColumnIndex });
    const playerName = normalizeString(sheet[playerCell]?.v);

    if (!playerName) {
      // Stop parsing when we encounter an empty player name
      break;
    }

    const scores = questionColumnIndexes.map(colIndex => {
      const questionCell = utils.encode_cell({ r: row, c: range.s.c + colIndex });
      const rawValue = Number(sheet[questionCell]?.v ?? 0);
      return rawValue > 1 ? 1 : 0;
    });

    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const totalPercentage = questions.length > 0 ? Math.round((totalScore / questions.length) * 100) : 0;

    students.push({
      displayName: playerName,
      externalName: playerName,
      scores,
      totalScore,
      totalPercentage,
      resolvedStudentId: undefined,
    });
  }

  return {
    sourceFormat: 'kahoot',
    questions,
    students,
    totalMarks: questions.length,
  };
};