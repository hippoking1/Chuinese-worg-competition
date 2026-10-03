import type { ExamMode, MasteryRecord, Question } from '../types';

export function buildExamQuestions(
  allQuestions: Question[],
  mode: ExamMode,
  options?: {
    practiceCount?: number;
    year?: number;
    yearType?: 'sound' | 'form';
    mastery?: Record<string, MasteryRecord>;
  }
): Question[] {
  const activeQuestions = allQuestions.filter(q => q.enabled);

  if (mode === 'year') {
    const year = options?.year || 114;
    const type = options?.yearType;
    return activeQuestions
      .filter(q => q.year === year && (!type || q.type === type))
      .sort((a, b) => a.no - b.no);
  }

  if (mode === 'official') {
    // 100 sound + 100 form
    const sounds = shuffle(activeQuestions.filter(q => q.type === 'sound')).slice(0, 100);
    const forms = shuffle(activeQuestions.filter(q => q.type === 'form')).slice(0, 100);
    return [...sounds, ...forms];
  }

  if (mode === 'mini') {
    // 25 sound + 25 form
    const sounds = shuffle(activeQuestions.filter(q => q.type === 'sound')).slice(0, 25);
    const forms = shuffle(activeQuestions.filter(q => q.type === 'form')).slice(0, 25);
    return [...sounds, ...forms];
  }

  if (mode === 'wrong') {
    const mastery = options?.mastery || {};
    const wrongQs = activeQuestions.filter(q => {
      const rec = mastery[q.id];
      return rec && rec.wrongCount > 0 && rec.correctStreak < 3;
    });
    // Sort by highest wrongCount first
    return wrongQs.sort((a, b) => {
      const wa = mastery[a.id]?.wrongCount || 0;
      const wb = mastery[b.id]?.wrongCount || 0;
      return wb - wa;
    });
  }

  // Practice mode: weighted by mistake frequency
  const count = options?.practiceCount || 20;
  const mastery = options?.mastery || {};

  const weightedList = activeQuestions.map(q => {
    const rec = mastery[q.id];
    let weight = 1;
    if (rec) {
      weight = Math.max(0.2, 1 + rec.wrongCount * 2 - rec.correctStreak);
    }
    return { q, weight };
  });

  const selected: Question[] = [];
  const usedContexts = new Set<string>();

  for (let i = 0; i < count && weightedList.length > 0; i++) {
    const totalWeight = weightedList.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * totalWeight;
    let chosenIdx = 0;
    for (let j = 0; j < weightedList.length; j++) {
      r -= weightedList[j].weight;
      if (r <= 0) {
        chosenIdx = j;
        break;
      }
    }

    const candidate = weightedList[chosenIdx].q;
    weightedList.splice(chosenIdx, 1);

    if (!usedContexts.has(candidate.context)) {
      selected.push(candidate);
      usedContexts.add(candidate.context);
    }
  }

  return selected;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
