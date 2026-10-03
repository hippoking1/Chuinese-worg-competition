import { get, set, del } from 'idb-keyval';
import type { ExamAttempt, Ink, MasteryRecord, Player, Question } from '../types';
import type { PTemplate } from './recognizer/dollarP';

const KEY_QUESTIONS = 'quiz_questions';
const KEY_PLAYERS = 'quiz_players';
const KEY_ATTEMPTS = 'quiz_attempts';
const KEY_MASTERY = 'quiz_mastery';
const KEY_OUTBOX = 'quiz_outbox';
const KEY_CALIBRATION = 'quiz_calibration_templates';

export async function getLocalQuestions(): Promise<Question[] | null> {
  return (await get<Question[]>(KEY_QUESTIONS)) || null;
}

export async function saveLocalQuestions(questions: Question[]): Promise<void> {
  await set(KEY_QUESTIONS, questions);
}

export async function getLocalPlayers(): Promise<Player[]> {
  return (await get<Player[]>(KEY_PLAYERS)) || [];
}

export async function saveLocalPlayers(players: Player[]): Promise<void> {
  await set(KEY_PLAYERS, players);
}

export async function getLocalAttempts(playerId?: string): Promise<ExamAttempt[]> {
  const all = (await get<ExamAttempt[]>(KEY_ATTEMPTS)) || [];
  if (!playerId) return all;
  return all.filter(a => a.playerId === playerId);
}

export async function saveLocalAttempt(attempt: ExamAttempt): Promise<void> {
  const all = (await get<ExamAttempt[]>(KEY_ATTEMPTS)) || [];
  const idx = all.findIndex(a => a.id === attempt.id);
  if (idx >= 0) {
    all[idx] = attempt;
  } else {
    all.unshift(attempt);
  }
  // Keep up to 50 recent attempts
  if (all.length > 50) {
    all.length = 50;
  }
  await set(KEY_ATTEMPTS, all);
}

export async function getLocalMastery(playerId: string): Promise<Record<string, MasteryRecord>> {
  const all = (await get<Record<string, Record<string, MasteryRecord>>>(KEY_MASTERY)) || {};
  return all[playerId] || {};
}

export async function saveLocalMastery(playerId: string, mastery: Record<string, MasteryRecord>): Promise<void> {
  const all = (await get<Record<string, Record<string, MasteryRecord>>>(KEY_MASTERY)) || {};
  all[playerId] = mastery;
  await set(KEY_MASTERY, all);
}

export async function getCalibrationTemplates(playerId: string): Promise<PTemplate[]> {
  const all = (await get<Record<string, PTemplate[]>>(KEY_CALIBRATION)) || {};
  return all[playerId] || [];
}

export async function saveCalibrationTemplates(playerId: string, templates: PTemplate[]): Promise<void> {
  const all = (await get<Record<string, PTemplate[]>>(KEY_CALIBRATION)) || {};
  all[playerId] = templates;
  await set(KEY_CALIBRATION, all);
}

export async function getOfflineOutbox(): Promise<ExamAttempt[]> {
  return (await get<ExamAttempt[]>(KEY_OUTBOX)) || [];
}

export async function addToOfflineOutbox(attempt: ExamAttempt): Promise<void> {
  const outbox = await getOfflineOutbox();
  if (!outbox.some(a => a.id === attempt.id)) {
    outbox.push(attempt);
    await set(KEY_OUTBOX, outbox);
  }
}

export async function removeFromOfflineOutbox(attemptId: string): Promise<void> {
  const outbox = await getOfflineOutbox();
  const filtered = outbox.filter(a => a.id !== attemptId);
  await set(KEY_OUTBOX, filtered);
}

export async function saveAttemptInk(attemptId: string, qId: string, ink: Ink): Promise<void> {
  const key = `ink_${attemptId}_${qId}`;
  await set(key, ink);
}

export async function getAttemptInk(attemptId: string, qId: string): Promise<Ink | null> {
  const key = `ink_${attemptId}_${qId}`;
  return (await get<Ink>(key)) || null;
}
