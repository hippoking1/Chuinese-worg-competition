<template>
  <div class="wrong-book-page">
    <header class="wrong-header">
      <button type="button" class="btn-back" @click="router.push('/home')">
        ◀ 回首頁
      </button>
      <h2 class="page-title">📕 錯題反覆本</h2>
      <button
        v-if="wrongQuestions.length > 0"
        type="button"
        class="btn-chunky btn-coral btn-practice"
        @click="startWrongExam"
      >
        <span>⚡ 練習所有錯題 ({{ wrongQuestions.length }})</span>
      </button>
    </header>

    <!-- Empty State -->
    <div v-if="wrongQuestions.length === 0" class="empty-state card-chunky">
      <Mascot size="lg" mood="cheer" speech="目前沒有任何未消化的錯題！太神啦！🦉🌟" />
      <p class="empty-hint">繼續保持！在模擬測驗中寫錯的題目會自動收集到這裡。</p>
    </div>

    <!-- Wrong Questions List -->
    <div v-else class="wrong-list">
      <div
        v-for="item in wrongQuestions"
        :key="item.q.id"
        class="wrong-item card-chunky"
      >
        <div class="wrong-meta">
          <span class="type-badge" :class="item.q.type">
            {{ item.q.type === 'sound' ? '字音' : '字形' }}
          </span>
          <span class="year-label">{{ item.q.year }} 年</span>
          <span class="wrong-count-tag">累計錯 {{ item.mastery.wrongCount }} 次</span>
        </div>

        <div class="wrong-context font-kaiti">
          <span
            v-for="(ch, idx) in Array.from(item.q.context)"
            :key="idx"
            :class="{ 'target-ch': idx === item.q.target }"
          >
            {{ ch }}
          </span>
        </div>

        <div class="wrong-answer font-kaiti">
          <span class="ans-label">正解</span>
          <span class="ans-text">{{ item.q.type === 'sound' ? item.q.zhuyin : item.q.char }}</span>
        </div>

        <div class="streak-badge">
          <span>消除進度</span>
          <strong>{{ item.mastery.correctStreak }} / 3 次</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Mascot from '../components/Mascot.vue';
import { getLocalMastery } from '../lib/db';
import { useExamStore } from '../stores/exam';
import { usePlayerStore } from '../stores/player';
import { useQuestionsStore } from '../stores/questions';
import type { MasteryRecord, Question } from '../types';

const router = useRouter();
const playerStore = usePlayerStore();
const qStore = useQuestionsStore();
const examStore = useExamStore();

interface WrongItem {
  q: Question;
  mastery: MasteryRecord;
}

const wrongQuestions = ref<WrongItem[]>([]);

async function loadWrongs() {
  if (!qStore.loaded) await qStore.loadQuestions();
  const pid = playerStore.currentPlayer?.id || 'guest';
  const mastery = await getLocalMastery(pid);

  const list: WrongItem[] = [];
  for (const q of qStore.questions) {
    const rec = mastery[q.id];
    if (rec && rec.wrongCount > 0 && rec.correctStreak < 3) {
      list.push({ q, mastery: rec });
    }
  }

  // Sort by highest wrongCount first
  list.sort((a, b) => b.mastery.wrongCount - a.mastery.wrongCount);
  wrongQuestions.value = list;
}

async function startWrongExam() {
  await examStore.startExam('wrong');
  router.push('/exam');
}

onMounted(() => {
  loadWrongs();
});
</script>

<style scoped>
.wrong-book-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.wrong-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 14px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.btn-back {
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 0.9rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.empty-state {
  background: white;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.empty-hint {
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wrong-item {
  background: white;
  padding: 16px 22px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.wrong-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 70px;
}

.type-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
}

.type-badge.sound { background: var(--color-sky-light); color: var(--color-sky-dark); }
.type-badge.form { background: var(--color-mint-light); color: var(--color-mint-dark); }

.year-label {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.wrong-count-tag {
  font-size: 0.75rem;
  color: var(--color-coral-dark);
  font-weight: 700;
}

.wrong-context {
  font-size: 1.8rem;
  font-weight: 700;
  flex: 1;
}

.target-ch {
  background: var(--color-banana-light);
  color: #B45309;
  padding: 0 4px;
  border-radius: 4px;
}

.wrong-answer {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
}

.ans-label {
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.ans-text {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-mint-dark);
}

.streak-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.streak-badge strong {
  font-size: 1.1rem;
  color: var(--color-mint-dark);
}

@media (max-width: 640px) {
  .wrong-book-page {
    padding: 10px 10px 30px;
    gap: 12px;
  }

  .wrong-header {
    padding: 10px 14px;
    gap: 10px;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .btn-back {
    padding: 6px 12px;
    font-size: 0.85rem;
  }

  .wrong-item {
    padding: 12px 14px;
    gap: 10px;
  }

  .wrong-meta {
    min-width: 50px;
  }

  .wrong-context {
    font-size: 1.35rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ans-text {
    font-size: 1.35rem;
  }

  .streak-badge {
    padding: 4px 8px;
    font-size: 0.72rem;
  }

  .streak-badge strong {
    font-size: 0.95rem;
  }
}
</style>
