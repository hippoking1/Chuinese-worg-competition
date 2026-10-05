<template>
  <div class="history-page">
    <header class="history-header">
      <button type="button" class="btn-back" @click="router.push('/home')">
        ◀ 回首頁
      </button>
      <h2 class="page-title">📊 歷次測驗成績</h2>
    </header>

    <!-- Score Trend Chart (SVG) -->
    <div v-if="attempts.length > 1" class="chart-card card-chunky">
      <h3>成績趨勢圖 (最近 {{ chartPoints.length }} 次)</h3>
      <div class="svg-wrap">
        <svg viewBox="0 0 500 200" preserveAspectRatio="none" class="chart-svg">
          <!-- Horizontal Grid Lines -->
          <line x1="40" y1="20" x2="480" y2="20" stroke="#E2E8F0" stroke-dasharray="3,3" />
          <line x1="40" y1="60" x2="480" y2="60" stroke="#E2E8F0" stroke-dasharray="3,3" />
          <line x1="40" y1="100" x2="480" y2="100" stroke="#E2E8F0" stroke-dasharray="3,3" />
          <line x1="40" y1="140" x2="480" y2="140" stroke="#E2E8F0" stroke-dasharray="3,3" />
          <line x1="40" y1="180" x2="480" y2="180" stroke="#CBD5E0" />

          <!-- Y-axis labels -->
          <text x="10" y="25" font-size="10" fill="#A0AEC0">100</text>
          <text x="15" y="105" font-size="10" fill="#A0AEC0">50</text>
          <text x="20" y="185" font-size="10" fill="#A0AEC0">0</text>

          <!-- Trend Area + Polyline -->
          <polyline
            :points="svgPolyline"
            fill="none"
            stroke="#9FE2C8"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Dots for each score -->
          <circle
            v-for="(pt, idx) in chartPoints"
            :key="idx"
            :cx="pt.x"
            :cy="pt.y"
            r="5"
            fill="#429878"
            stroke="white"
            stroke-width="2"
          />
        </svg>
      </div>
    </div>

    <!-- Attempt List -->
    <div v-if="attempts.length === 0" class="empty-state card-chunky">
      <p>目前還沒有任何測驗紀錄，快去挑戰一次吧！</p>
    </div>

    <div v-else class="attempts-list">
      <div
        v-for="a in attempts"
        :key="a.id"
        class="attempt-item card-chunky"
      >
        <div class="attempt-left">
          <span class="attempt-mode-badge" :class="a.mode">{{ getModeName(a.mode) }}</span>
          <span class="attempt-date">{{ formatDate(a.startedAt) }}</span>
        </div>

        <div class="attempt-scores">
          <div class="score-pill">
            <span class="score-val">{{ a.score }}</span>
            <span class="score-unit">分</span>
          </div>
          <div class="score-breakdown">
            <span>字音 {{ a.soundCorrect }}/{{ a.soundTotal }}</span>
            <span>字形 {{ a.formCorrect }}/{{ a.formTotal }}</span>
            <span>用時 {{ Math.floor(a.durationSec / 60) }}分{{ a.durationSec % 60 }}秒</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getLocalAttempts } from '../lib/db';
import { usePlayerStore } from '../stores/player';
import type { ExamAttempt } from '../types';

const router = useRouter();
const playerStore = usePlayerStore();
const attempts = ref<ExamAttempt[]>([]);

async function loadHistory() {
  const pid = playerStore.currentPlayer?.id;
  attempts.value = await getLocalAttempts(pid);
}

function getModeName(mode: string): string {
  if (mode === 'official') return '🏆 正式模擬';
  if (mode === 'mini') return '⚡ 迷你挑戰';
  if (mode === 'practice') return '📖 自由練習';
  if (mode === 'wrong') return '📕 錯題本';
  if (mode === 'year') return '📜 歷屆整卷';
  return mode;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const chartPoints = computed(() => {
  const recent = [...attempts.value].reverse().slice(-10);
  if (recent.length <= 1) return [];
  const startX = 60;
  const endX = 460;
  const stepX = (endX - startX) / (recent.length - 1);

  return recent.map((a, idx) => {
    const x = startX + idx * stepX;
    // Map score 0-100 to y 180 to 20
    const y = 180 - (a.score / 100) * 160;
    return { x, y, score: a.score };
  });
});

const svgPolyline = computed(() => {
  return chartPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.history-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 16px;
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

.chart-card {
  background: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-card h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.svg-wrap {
  width: 100%;
  height: 200px;
}

.chart-svg {
  width: 100%;
  height: 100%;
}

.empty-state {
  background: white;
  padding: 30px;
  text-align: center;
  color: var(--color-text-muted);
}

.attempts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attempt-item {
  background: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.attempt-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attempt-mode-badge {
  font-size: 0.85rem;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-cream-subtle);
  color: var(--color-text-main);
  align-self: flex-start;
}

.attempt-date {
  font-size: 0.85rem;
  color: var(--color-text-light);
}

.attempt-scores {
  display: flex;
  align-items: center;
  gap: 20px;
}

.score-pill {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score-val {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--color-mint-dark);
}

.score-unit {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  gap: 2px;
}

@media (max-width: 640px) {
  .history-page {
    padding: 10px 10px 30px;
    gap: 12px;
  }

  .history-header {
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

  .chart-card {
    padding: 14px;
  }

  .attempt-item {
    padding: 12px 14px;
    gap: 10px;
  }

  .attempt-scores {
    gap: 10px;
  }

  .score-val {
    font-size: 1.8rem;
  }

  .score-breakdown {
    font-size: 0.75rem;
  }
}
</style>
