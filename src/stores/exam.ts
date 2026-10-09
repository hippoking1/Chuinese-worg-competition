import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { submitAttemptToCloud } from '../lib/api';
import { getLocalMastery, saveAttemptInk, saveLocalAttempt, saveLocalMastery } from '../lib/db';
import { buildExamQuestions } from '../lib/examBuilder';
import type { AnswerItem, ExamAttempt, ExamMode, JudgeResult, MasteryRecord, Question } from '../types';
import { usePlayerStore } from './player';
import { useQuestionsStore } from './questions';

export const useExamStore = defineStore('exam', () => {
  const currentExam = ref<Question[]>([]);
  const currentIndex = ref<number>(0);
  const currentMode = ref<ExamMode>('practice');
  const examYear = ref<number | undefined>(undefined);
  const answers = ref<Record<string, AnswerItem>>({});
  
  const timeRemainingSec = ref<number>(600);
  const totalDurationSec = ref<number>(600);
  const timerRunning = ref<boolean>(false);
  const isTimeUp = ref<boolean>(false);
  let timerInterval: number | null = null;

  const activeAttempt = ref<ExamAttempt | null>(null);
  const isFinished = ref<boolean>(false);

  const currentQuestion = computed(() => currentExam.value[currentIndex.value] || null);
  const isLastQuestion = computed(() => currentIndex.value >= currentExam.value.length - 1);

  const answeredCount = computed(() => {
    return Object.values(answers.value).filter(
      a => (!!a.userInk && a.userInk.length > 0) || (!!a.userZhuyin && a.userZhuyin.length > 0) || (!!a.userChar && a.userChar.length > 0)
    ).length;
  });

  async function startExam(
    mode: ExamMode,
    options?: {
      practiceCount?: number;
      year?: number;
      yearType?: 'sound' | 'form';
      range?: {
        year?: number | 'all';
        type?: 'sound' | 'form' | 'all';
        startNo?: number;
        endNo?: number;
        shuffle?: boolean;
        timed?: boolean;
        questionCount?: number;
      };
    }
  ) {
    const qStore = useQuestionsStore();
    const pStore = usePlayerStore();
    if (!qStore.loaded) await qStore.loadQuestions();

    const pid = pStore.currentPlayer?.id || 'guest';
    const mastery = await getLocalMastery(pid);

    currentMode.value = mode;
    examYear.value = typeof options?.range?.year === 'number' ? options.range.year : options?.year;
    currentIndex.value = 0;
    answers.value = {};
    isFinished.value = false;
    isTimeUp.value = false;

    currentExam.value = buildExamQuestions(qStore.questions, mode, {
      practiceCount: options?.practiceCount,
      year: options?.year,
      yearType: options?.yearType,
      range: options?.range,
      mastery
    });

    // Initialize answer items
    for (const q of currentExam.value) {
      answers.value[q.id] = {
        questionId: q.id,
        autoJudge: 'unsure',
        finalJudge: 'unsure',
        clearedCount: 0,
        durationMs: 0
      };
    }

    // Set timer
    if (mode === 'official') {
      timeRemainingSec.value = 10 * 60; // 10 minutes (全國競賽標準)
      totalDurationSec.value = 10 * 60;
    } else if (mode === 'mini') {
      timeRemainingSec.value = 5 * 60; // 5 minutes
      totalDurationSec.value = 5 * 60;
    } else if (mode === 'range' && options?.range?.timed) {
      // 3 seconds per question (same pace as 200 questions in 10 min)
      const totalSec = Math.max(60, currentExam.value.length * 3);
      timeRemainingSec.value = totalSec;
      totalDurationSec.value = totalSec;
    } else {
      timeRemainingSec.value = 0; // Practice mode / untimed: no countdown limit
      totalDurationSec.value = 0;
    }

    startTimer();
  }

  function startTimer() {
    stopTimer();
    if (totalDurationSec.value > 0) {
      timerRunning.value = true;
      timerInterval = window.setInterval(() => {
        if (timeRemainingSec.value > 1) {
          timeRemainingSec.value--;
        } else {
          // Time's up! Force stop immediately
          timeRemainingSec.value = 0;
          stopTimer();
          isTimeUp.value = true;
        }
      }, 1000);
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerRunning.value = false;
  }

  function recordAnswer(
    qId: string,
    payload: {
      ink?: any;
      userZhuyin?: string;
      userChar?: string;
      autoJudge?: JudgeResult;
      cleared?: boolean;
    }
  ) {
    if (isFinished.value || isTimeUp.value) return;

    if (!answers.value[qId]) {
      answers.value[qId] = {
        questionId: qId,
        autoJudge: 'unsure',
        finalJudge: 'unsure',
        clearedCount: 0,
        durationMs: 0
      };
    }
    const item = answers.value[qId];
    if (payload.ink !== undefined) item.userInk = payload.ink;
    if (payload.userZhuyin !== undefined) item.userZhuyin = payload.userZhuyin;
    if (payload.userChar !== undefined) item.userChar = payload.userChar;
    if (payload.autoJudge !== undefined) {
      item.autoJudge = payload.autoJudge;
      item.finalJudge = payload.autoJudge;
    }
    if (payload.cleared) item.clearedCount++;
  }

  function toggleJudge(qId: string) {
    const item = answers.value[qId];
    if (!item) return;
    if (item.finalJudge === 'ok') item.finalJudge = 'ng';
    else if (item.finalJudge === 'ng') item.finalJudge = 'ok';
    else item.finalJudge = 'ok';
  }

  function setJudge(qId: string, judge: JudgeResult) {
    if (answers.value[qId]) {
      answers.value[qId].finalJudge = judge;
    }
  }

  async function finishExam(): Promise<ExamAttempt> {
    stopTimer();
    if (isFinished.value && activeAttempt.value) {
      return activeAttempt.value;
    }
    isFinished.value = true;

    const pStore = usePlayerStore();
    const pid = pStore.currentPlayer?.id || 'guest';
    const pName = pStore.currentPlayer?.nickname || '訪客';
    const elapsedSec = totalDurationSec.value > 0 ? totalDurationSec.value - timeRemainingSec.value : 0;

    let soundCorrect = 0, soundTotal = 0;
    let formCorrect = 0, formTotal = 0;

    for (const q of currentExam.value) {
      const ans = answers.value[q.id];
      const isOk = ans && ans.finalJudge === 'ok';
      if (q.type === 'sound') {
        soundTotal++;
        if (isOk) soundCorrect++;
      } else {
        formTotal++;
        if (isOk) formCorrect++;
      }
    }

    const totalQuestions = soundTotal + formTotal;
    // Official: 200 questions, 0.5 pt each = 100 max
    // Mini / Practice: proportion to 100
    const rawScore = totalQuestions > 0 ? ((soundCorrect + formCorrect) / totalQuestions) * 100 : 0;
    const finalScore = Math.round(rawScore * 10) / 10;

    const attempt: ExamAttempt = {
      id: 'attempt_' + Date.now(),
      playerId: pid,
      playerName: pName,
      mode: currentMode.value,
      year: examYear.value,
      startedAt: new Date().toISOString(),
      durationSec: elapsedSec,
      soundCorrect,
      soundTotal,
      formCorrect,
      formTotal,
      score: finalScore,
      answers: JSON.parse(JSON.stringify(answers.value)),
      syncedToCloud: false
    };

    activeAttempt.value = attempt;

    // Save ink strokes to IndexedDB
    for (const [qid, ans] of Object.entries(answers.value)) {
      if (ans.userInk) {
        await saveAttemptInk(attempt.id, qid, ans.userInk);
      }
    }

    // Save attempt locally
    await saveLocalAttempt(attempt);

    // Update mastery records
    const mastery = await getLocalMastery(pid);
    for (const q of currentExam.value) {
      const isOk = answers.value[q.id]?.finalJudge === 'ok';
      const m = mastery[q.id] || {
        playerId: pid,
        questionId: q.id,
        correctStreak: 0,
        wrongCount: 0,
        lastSeen: new Date().toISOString()
      };
      if (isOk) {
        m.correctStreak++;
      } else {
        m.correctStreak = 0;
        m.wrongCount++;
      }
      m.lastSeen = new Date().toISOString();
      mastery[q.id] = m;
    }
    await saveLocalMastery(pid, mastery);

    // Submit to cloud in background
    submitAttemptToCloud(attempt).then(ok => {
      if (ok) attempt.syncedToCloud = true;
    });

    return attempt;
  }

  return {
    currentExam,
    currentIndex,
    currentMode,
    answers,
    timeRemainingSec,
    totalDurationSec,
    timerRunning,
    isTimeUp,
    activeAttempt,
    isFinished,
    currentQuestion,
    isLastQuestion,
    answeredCount,
    startExam,
    startTimer,
    stopTimer,
    recordAnswer,
    toggleJudge,
    setJudge,
    finishExam
  };
});
