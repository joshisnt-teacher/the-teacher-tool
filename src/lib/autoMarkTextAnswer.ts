export interface MarkingCriteria {
  expected_keywords?: string[];
  match_type?: 'all' | 'any';
  case_sensitive?: boolean;
}

export function autoMarkTextAnswer(
  answer: string,
  criteria: MarkingCriteria | null | undefined,
  maxScore: number
): number {
  if (!criteria || !criteria.expected_keywords || criteria.expected_keywords.length === 0) {
    // No criteria defined - award full marks by default for text answers
    return maxScore;
  }

  const text = criteria.case_sensitive ? answer : answer.toLowerCase();
  const keywords = criteria.expected_keywords.map((k) =>
    criteria.case_sensitive ? k : k.toLowerCase()
  );

  if (criteria.match_type === 'all') {
    const allFound = keywords.every((k) => text.includes(k));
    return allFound ? maxScore : 0;
  } else {
    const matched = keywords.filter((k) => text.includes(k)).length;
    if (keywords.length === 0) return maxScore;
    return Math.round((matched / keywords.length) * maxScore);
  }
}
