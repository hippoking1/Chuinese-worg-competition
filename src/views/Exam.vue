<template>
  <div class="exam-page" :class="{ 'left-handed': settings.dominantHand === 'left' }">
    <!-- Top Bar -->
    <header class="exam-header">
      <div class="header-left">
        <button type="button" class="btn-exit" @click="confirmExit" title="結束測驗">
          <span>✕ 離開</span>
        </button>
        <CountdownTimer v-if="examStore.totalDurationSec > 0" :seconds="examStore.timeRemainingSec" />
      </div>

      <div class="header-center">
        <span class="progress-pill">
          已作答 {{ examStore.answeredCount }} / {{ examStore.currentExam.length }}
        </span>
      </div>

      <div class="header-right">
        <button
          type="button"
          class="btn-chunky btn-coral btn-submit"
          @click="submitExam"
        >
          <span>交卷 🏁</span>
        </button>
      </div>
    </header>

    <!-- Question + Handwriting Pad Main Section -->
    <main v-if="currentQ" class="exam-main">
      <!-- Left Panel: Question Card -->
      <div class="panel-left">
        <QuestionCard
          :question="currentQ"
          :index="examStore.currentIndex"
          :total="examStore.currentExam.length"
        />

        <!-- Instant Practice Feedback (Practice mode only) -->
        <div v-if="examStore.currentMode === 'practice'" class="practice-feedback-card card-chunky">
          <button
            type="button"
            class="btn-chunky btn-banana"
            @click="showAnswer = !showAnswer"
          >
            {{ showAnswer ? '隱藏答案' : '💡 看標準答案' }}
          </button>
          <div v-if="showAnswer" class="answer-reveal">
            <span>標準答案：</span>
            <strong class="correct-text font-kaiti">
              {{ currentQ.type === 'sound' ? currentQ.zhuyin : currentQ.char }}
            </strong>
          </div>
        </div>
      </div>

      <!-- Right Panel: Writing Pad -->
      <div class="panel-right">
        <!-- Sound question: Zhuyin Pad -->
        <template v-if="currentQ.type === 'sound'">
          <ZhuyinPad
            :key="currentQ.id"
            ref="zhuyinPadRef"
            :customTemplates="customZhuyinTemplates"
            @change="onZhuyinChange"
          />
        </template>

        <!-- Form question: Full Character Handwriting Pad -->
        <template v-else>
          <HandwritingPad
            :key="currentQ.id"
            ref="hanziPadRef"
            :modelValue="currentAnswer?.userInk"
            :showToolbar="!settings.strictMode"
            @change="onHanziChange"
            @clear="onHanziClear"
          />
          <div v-if="settings.strictMode" class="strict-notice">
            <span>⚠️ 競賽嚴格模式：塗改不予計分，寫錯請全格清除</span>
          </div>
        </template>
      </div>
    </main>

    <!-- Bottom Navigation Bar -->
    <footer class="exam-footer">
      <div class="footer-dots">
        <ProgressDots
          :total="examStore.currentExam.length"
          :currentIndex="examStore.currentIndex"
          :isAnswered="isIndexAnswered"
          @select="jumpToIndex"
        />
      </div>

      <div class="footer-actions">
        <button
          type="button"
          class="btn-chunky btn-primary btn-next"
          @click="goNext"
        >
          <span>{{ examStore.isLastQuestion ? '前往批改 ➔' : '下一題 ➔' }}</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import CountdownTimer from '../components/CountdownTimer.vue';
import HandwritingPad from '../components/HandwritingPad.vue';
import ProgressDots from '../components/ProgressDots.vue';
import QuestionCard from '../components/QuestionCard.vue';
import ZhuyinPad from '../components/ZhuyinPad.vue';
import { getCalibrationTemplates } from '../lib/db';
import { autoJudgeForm, autoJudgeSound } from '../lib/grading';
import { recognizeHanziWithGoogle } from '../lib/recognizer/google';
import { useExamStore } from '../stores/exam';
import { usePlayerStore } from '../stores/player';
import { useSettingsStore } from '../stores/settings';
import type { Ink } from '../types';

const router = useRouter();
const examStore = useExamStore();
const playerStore = usePlayerStore();
const settings = useSettingsStore();

const hanziPadRef = ref<any>(null);
const zhuyinPadRef = ref<any>(null);
const customZhuyinTemplates = ref<any[]>([]);
const showAnswer = ref(false);

const currentQ = computed(() => examStore.currentQuestion);
const currentAnswer = computed(() => {
  if (!currentQ.value) return null;
  return examStore.answers[currentQ.value.id] || null;
});

function isIndexAnswered(idx: number): boolean {
  const q = examStore.currentExam[idx];
  if (!q) return false;
  const ans = examStore.answers[q.id];
  return !!ans && ((ans.userInk && ans.userInk.length > 0) || !!ans.userZhuyin || !!ans.userChar);
}

function jumpToIndex(idx: number) {
  examStore.currentIndex = idx;
  showAnswer.value = false;
}

function goNext() {
  if (examStore.isLastQuestion) {
    submitExam();
  } else {
    examStore.currentIndex++;
    showAnswer.value = false;
  }
}

// Background recognition for Chinese character
let debounceTimer: number | null = null;
function onHanziChange(ink: Ink) {
  if (!currentQ.value) return;
  const q = currentQ.value;

  examStore.recordAnswer(q.id, { ink });

  // Debounced cloud recognition
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(async () => {
    const dims = hanziPadRef.value?.getCanvasDimensions() || { width: 300, height: 300 };
    const candidates = await recognizeHanziWithGoogle(ink, dims.width, dims.height);
    const judge = autoJudgeForm(q, candidates);
    examStore.recordAnswer(q.id, {
      userChar: candidates[0] || '',
      autoJudge: judge
    });
  }, 400);
}

function onHanziClear() {
  if (!currentQ.value) return;
  examStore.recordAnswer(currentQ.value.id, { ink: [], cleared: true });
}

function onZhuyinChange(payload: { combinedZhuyin: string; fullInk: Ink; candidates: string[] }) {
  if (!currentQ.value) return;
  const q = currentQ.value;
  const judge = autoJudgeSound(q, payload.candidates);
  examStore.recordAnswer(q.id, {
    ink: payload.fullInk,
    userZhuyin: payload.combinedZhuyin,
    autoJudge: judge
  });
}

function confirmExit() {
  if (confirm('確定要結束本次測驗嗎？已作答的內容將不會保留。')) {
    examStore.stopTimer();
    router.push('/home');
  }
}

async function submitExam() {
  const unanswered = examStore.currentExam.length - examStore.answeredCount;
  if (unanswered > 0) {
    if (!confirm(`還有 ${unanswered} 題尚未作答，確定要交卷嗎？`)) {
      return;
    }
  }
  try {
    await examStore.finishExam();
  } catch (err) {
    console.error('Failed to save exam attempt:', err);
  } finally {
    router.push('/review');
  }
}

onMounted(async () => {
  if (examStore.currentExam.length === 0) {
    router.push('/home');
    return;
  }
  const pid = playerStore.currentPlayer?.id;
  if (pid) {
    customZhuyinTemplates.value = await getCalibrationTemplates(pid);
  }
});
</script>

<style scoped>
.exam-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--color-cream-bg);
  padding: 12px 18px;
  gap: 12px;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 52px;
  flex-shrink: 0;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-exit {
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.progress-pill {
  background: white;
  border: 1px solid var(--color-border);
  padding: 6px 16px;
  border-radius: var(--radius-pill);
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--color-mint-dark);
  box-shadow: var(--shadow-sm);
}

.btn-submit {
  padding: 8px 20px;
  font-size: 1rem;
}

.exam-main {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
  width: 100%;
}

.panel-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  min-width: 0;
}

.panel-right {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  min-width: 0;
}

.practice-feedback-card {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}

.answer-reveal {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-main);
}

.correct-text {
  font-size: 1.8rem;
  color: var(--color-coral-dark);
  margin-left: 6px;
}

.strict-notice {
  margin-top: 8px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-coral-dark);
}

.exam-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 60px;
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.footer-dots {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.footer-actions {
  flex-shrink: 0;
}

.btn-next {
  padding: 10px 24px;
}

/* Left handed layout support (desktop / landscape) */
.left-handed .exam-main {
  flex-direction: row-reverse;
}

/* Mobile & Tablet Portrait Layout */
@media (max-width: 820px), (orientation: portrait) {
  .exam-page {
    padding: 8px 10px;
    gap: 8px;
  }

  .exam-header {
    height: 44px;
  }

  .btn-exit {
    padding: 6px 10px;
    font-size: 0.85rem;
  }

  .progress-pill {
    padding: 4px 10px;
    font-size: 0.85rem;
  }

  .btn-submit {
    padding: 6px 14px;
    font-size: 0.9rem;
  }

  .exam-main {
    flex-direction: column;
    gap: 8px;
  }

  .panel-left {
    flex: 0 0 auto;
    width: 100%;
    gap: 6px;
  }

  .panel-right {
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  .practice-feedback-card {
    padding: 6px 12px;
  }

  .exam-footer {
    height: 48px;
    gap: 8px;
  }

  .btn-next {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .left-handed .exam-main {
    flex-direction: column;
  }
}
</style>
