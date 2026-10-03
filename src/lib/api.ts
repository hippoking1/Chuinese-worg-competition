import type { ExamAttempt, Question } from '../types';
import { addToOfflineOutbox, getOfflineOutbox, removeFromOfflineOutbox } from './db';

const GAS_URL = import.meta.env.VITE_GAS_URL || '';
const GAS_TOKEN = import.meta.env.VITE_GAS_TOKEN || '';

export async function fetchQuestionsFromCloud(currentVersion?: string): Promise<{
  questions?: Question[];
  version?: string;
  notModified?: boolean;
} | null> {
  if (!GAS_URL) return null;

  try {
    const url = new URL(GAS_URL);
    url.searchParams.set('action', 'questions');
    if (GAS_TOKEN) url.searchParams.set('token', GAS_TOKEN);
    if (currentVersion) url.searchParams.set('v', currentVersion);

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    if (json.ok) {
      return {
        questions: json.questions,
        version: json.version,
        notModified: json.notModified
      };
    }
  } catch (err) {
    console.warn('Failed to fetch questions from Google Apps Script:', err);
  }

  return null;
}

export async function submitAttemptToCloud(attempt: ExamAttempt): Promise<boolean> {
  if (!GAS_URL) {
    await addToOfflineOutbox(attempt);
    return false;
  }

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Avoid CORS preflight OPTIONS
      },
      body: JSON.stringify({
        action: 'submitAttempt',
        token: GAS_TOKEN,
        attempt: {
          id: attempt.id,
          playerId: attempt.playerId,
          mode: attempt.mode,
          year: attempt.year,
          startedAt: attempt.startedAt,
          durationSec: attempt.durationSec,
          soundCorrect: attempt.soundCorrect,
          soundTotal: attempt.soundTotal,
          formCorrect: attempt.formCorrect,
          formTotal: attempt.formTotal,
          score: attempt.score,
          // Compact results mapping
          resultsJson: JSON.stringify(
            Object.fromEntries(
              Object.entries(attempt.answers).map(([qid, ans]) => [qid, ans.finalJudge === 'ok' ? 1 : 0])
            )
          )
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok) {
        await removeFromOfflineOutbox(attempt.id);
        return true;
      }
    }
  } catch (err) {
    console.warn('Cloud submit failed, adding to offline outbox:', err);
  }

  await addToOfflineOutbox(attempt);
  return false;
}

export async function flushOfflineOutbox(): Promise<number> {
  const outbox = await getOfflineOutbox();
  let successCount = 0;
  for (const attempt of outbox) {
    const ok = await submitAttemptToCloud(attempt);
    if (ok) successCount++;
  }
  return successCount;
}
