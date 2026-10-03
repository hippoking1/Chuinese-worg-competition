import type { JudgeResult, Question } from '../types';
import { normalizeZhuyin } from './zhuyin';

export function autoJudgeForm(q: Question, candidates: string[]): JudgeResult {
  if (!candidates || candidates.length === 0) return 'unsure';

  const acceptable = [q.char, ...(q.alt_answers ? q.alt_answers.split('|') : [])].map(s => s.trim());

  // Strict check: top candidate must be exact match
  if (acceptable.includes(candidates[0])) {
    return 'ok';
  }

  // If in top 5 candidates, mark as unsure for human review
  if (candidates.slice(1, 5).some(c => acceptable.includes(c))) {
    return 'unsure';
  }

  return 'ng';
}

export function autoJudgeSound(q: Question, candidates: string[]): JudgeResult {
  if (!candidates || candidates.length === 0) return 'unsure';

  const acceptable = [q.zhuyin, ...(q.alt_answers ? q.alt_answers.split('|') : [])].map(normalizeZhuyin);

  const normalizedCandidates = candidates.map(normalizeZhuyin);

  if (acceptable.includes(normalizedCandidates[0])) {
    return 'ok';
  }

  if (normalizedCandidates.slice(1, 4).some(c => acceptable.includes(c))) {
    return 'unsure';
  }

  return 'ng';
}
