export type QuestionType = 'sound' | 'form';

export interface Question {
  id: string;              // e.g. "114-S-008"
  type: QuestionType;      // 'sound' or 'form'
  year: number;            // 113 or 114
  level: string;           // '國小'
  no: number;              // 1 - 100
  context: string;         // e.g. "鳧舉兔起"
  target: number;          // 0-based code-point index of target char in context
  char: string;            // target character e.g. "鳧"
  zhuyin: string;          // standard Zhuyin answer e.g. "ㄈㄨˊ"
  alt_answers?: string;    // alternate acceptable answers separated by |
  tags?: string;
  enabled: boolean;
  note?: string;
}

export type Point = [number, number, number, number?]; // [x, y, timestamp, pressure?]
export type Stroke = Point[];
export type Ink = Stroke[];

export interface Player {
  id: string;
  nickname: string;
  avatar: string;          // icon name e.g. 'owl', 'fox', 'bear', 'rabbit'
  pinHash: string;         // SHA-256(salt + pin)
  salt: string;
  createdAt: string;
}

export type ExamMode = 'official' | 'mini' | 'practice' | 'wrong' | 'year';

export type JudgeResult = 'ok' | 'ng' | 'unsure';

export interface AnswerItem {
  questionId: string;
  userInk?: Ink;           // saved locally in IndexedDB
  userZhuyin?: string;     // recognized or entered zhuyin
  userChar?: string;       // recognized or entered char
  autoJudge: JudgeResult;
  finalJudge: JudgeResult; // can be toggled by user in review
  clearedCount: number;    // times erased / cleared
  durationMs: number;
}

export interface ExamAttempt {
  id: string;              // uuid or timestamp-id
  playerId: string;
  mode: ExamMode;
  year?: number;
  startedAt: string;
  durationSec: number;
  soundCorrect: number;
  soundTotal: number;
  formCorrect: number;
  formTotal: number;
  score: number;           // 0 to 100 (each word 0.5 pts in official)
  answers: Record<string, AnswerItem>;
  syncedToCloud: boolean;
}

export interface MasteryRecord {
  playerId: string;
  questionId: string;
  correctStreak: number;
  wrongCount: number;
  lastSeen: string;
}
