<template>
  <div class="result-page">
    <StarBurst v-if="starsEarned > 0" :stars="starsEarned" />

    <div class="result-card card-chunky">
      <Mascot :size="'lg'" :mood="starsEarned >= 2 ? 'cheer' : 'happy'" :speech="mascotMessage" />

      <h1 class="result-title">測驗成果結算</h1>

      <!-- Stars Row -->
      <div class="stars-row">
        <span
          v-for="s in 3"
          :key="s"
          class="star-item"
          :class="{ earned: s <= starsEarned }"
        >
          ★
        </span>
      </div>

      <!-- Big Score Display -->
      <div class="score-display">
        <span class="score-num">{{ attempt?.score ?? 0 }}</span>
        <span class="score-unit">分</span>
      </div>

      <!-- Detail Badges -->
      <div class="detail-grid">
        <div class="detail-box">
          <span class="box-label">字音正確率</span>
          <span class="box-val">{{ soundRate }}%</span>
          <span class="box-sub">({{ attempt?.soundCorrect }} / {{ attempt?.soundTotal }})</span>
        </div>

        <div class="detail-box">
          <span class="box-label">字形正確率</span>
          <span class="box-val">{{ formRate }}%</span>
          <span class="box-sub">({{ attempt?.formCorrect }} / {{ attempt?.formTotal }})</span>
        </div>

        <div class="detail-box">
          <span class="box-label">測驗用時</span>
          <span class="box-val">{{ durationText }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions-row">
        <button type="button" class="btn-chunky btn-primary" @click="retry">
          🔄 再測一次
        </button>
        <button type="button" class="btn-chunky btn-coral" @click="router.push('/wrong')">
          📕 複習錯題
        </button>
        <button type="button" class="btn-chunky btn-subtle" @click="router.push('/home')">
          🏠 回首頁
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Mascot from '../components/Mascot.vue';
import StarBurst from '../components/StarBurst.vue';
import { playFanfare, playSuccessChime } from '../lib/audio';
import { useExamStore } from '../stores/exam';
import { useSettingsStore } from '../stores/settings';

const router = useRouter();
const examStore = useExamStore();
const settings = useSettingsStore();

const attempt = computed(() => examStore.activeAttempt);

const starsEarned = computed(() => {
  const s = attempt.value?.score ?? 0;
  if (s >= 90) return 3;
  if (s >= 75) return 2;
  if (s >= 50) return 1;
  return 0;
});

const mascotMessage = computed(() => {
  const s = attempt.value?.score ?? 0;
  if (s >= 95) return '太厲害了！簡直是國語文競賽神童！🦉🎉';
  if (s >= 85) return '太棒了！表現非常出色喔！✨';
  if (s >= 70) return '很不錯喔！再把錯的字看一看就更強了！💪';
  return '再接再厲！每天練習一定會進步！🌱';
});

const soundRate = computed(() => {
  const a = attempt.value;
  if (!a || a.soundTotal === 0) return 0;
  return Math.round((a.soundCorrect / a.soundTotal) * 100);
});

const formRate = computed(() => {
  const a = attempt.value;
  if (!a || a.formTotal === 0) return 0;
  return Math.round((a.formCorrect / a.formTotal) * 100);
});

const durationText = computed(() => {
  const sec = attempt.value?.durationSec ?? 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} 分 ${s} 秒`;
});

function retry() {
  examStore.startExam(examStore.currentMode, { year: examStore.activeAttempt?.year });
  router.push('/exam');
}

onMounted(() => {
  if (starsEarned.value >= 2) {
    playFanfare(settings.soundEnabled);
  } else {
    playSuccessChime(settings.soundEnabled);
  }
});
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: radial-gradient(circle at 50% 20%, #FFFDF9 0%, #EEF6F2 100%);
}

.result-card {
  background: white;
  width: 100%;
  max-width: 580px;
  padding: 36px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.result-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 900;
  color: var(--color-text-main);
}

.stars-row {
  display: flex;
  gap: 12px;
}

.star-item {
  font-size: 3rem;
  color: #E2E8F0;
  transition: transform 0.2s;
}

.star-item.earned {
  color: var(--color-banana);
  filter: drop-shadow(0 2px 8px rgba(255, 212, 63, 0.6));
  animation: starPop 0.5s ease;
}

@keyframes starPop {
  0% { transform: scale(0.5); opacity: 0; }
  80% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

.score-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 4px 0;
}

.score-num {
  font-size: 5rem;
  font-weight: 900;
  color: var(--color-mint-dark);
  line-height: 1;
}

.score-unit {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-text-muted);
  margin-left: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  margin: 10px 0;
}

.detail-box {
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.box-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.box-val {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.box-sub {
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.actions-row {
  display: flex;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
