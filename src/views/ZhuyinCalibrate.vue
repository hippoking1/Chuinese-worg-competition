<template>
  <div class="calibrate-page">
    <header class="calibrate-header">
      <button type="button" class="btn-back" @click="router.push('/home')">
        ◀ 回首頁
      </button>
      <h2 class="page-title">🎯 注音個人化筆跡校正</h2>
    </header>

    <div v-if="!isCompleted" class="calibrate-card card-chunky">
      <div class="progress-info">
        <span class="step-count">符號 {{ currentIndex + 1 }} / {{ symbols.length }}</span>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${((currentIndex + 1) / symbols.length) * 100}%` }"></div>
        </div>
      </div>

      <div class="symbol-prompt">
        <p class="prompt-hint">請在右側方格中書寫注音符號：</p>
        <span class="current-symbol font-kaiti">{{ currentSymbol }}</span>
      </div>

      <div class="pad-wrap">
        <HandwritingPad
          ref="padRef"
          :showToolbar="true"
          @change="onStrokeChange"
        />
      </div>

      <div class="actions-row">
        <button
          type="button"
          class="btn-chunky btn-primary btn-save-symbol"
          :disabled="currentInk.length === 0"
          @click="saveCurrentAndNext"
        >
          <span>記錄並下一個 ➔</span>
        </button>
      </div>
    </div>

    <!-- Completion Screen -->
    <div v-else class="completed-card card-chunky">
      <Mascot size="lg" mood="cheer" speech="太棒了！專屬注音筆跡已建立完成！🦉✨" />
      <h2>校正完成！</h2>
      <p>系統已學會你的專屬手寫風格，字音測驗辨識率將大幅提升！</p>
      <button type="button" class="btn-chunky btn-primary" @click="router.push('/home')">
        回到首頁開始測驗
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import HandwritingPad from '../components/HandwritingPad.vue';
import Mascot from '../components/Mascot.vue';
import { saveCalibrationTemplates } from '../lib/db';
import { normalizePointcloud, type PPoint, type PTemplate } from '../lib/recognizer/dollarP';
import { ALL_ZHUYIN_SYMBOLS } from '../lib/zhuyin';
import { usePlayerStore } from '../stores/player';
import type { Ink } from '../types';

const router = useRouter();
const playerStore = usePlayerStore();

const symbols = ALL_ZHUYIN_SYMBOLS; // 37 symbols
const currentIndex = ref(0);
const padRef = ref<any>(null);
const currentInk = ref<Ink>([]);
const recordedTemplates = ref<PTemplate[]>([]);
const isCompleted = ref(false);

const currentSymbol = computed(() => symbols[currentIndex.value]);

function onStrokeChange(ink: Ink) {
  currentInk.value = ink;
}

async function saveCurrentAndNext() {
  if (currentInk.value.length === 0) return;

  const pts: PPoint[] = [];
  currentInk.value.forEach((stroke, strokeId) => {
    stroke.forEach(p => {
      pts.push({ x: p[0], y: p[1], strokeId });
    });
  });

  recordedTemplates.value.push({
    name: currentSymbol.value,
    points: normalizePointcloud(pts)
  });

  padRef.value?.clear();
  currentInk.value = [];

  if (currentIndex.value < symbols.length - 1) {
    currentIndex.value++;
  } else {
    // Finish
    const pid = playerStore.currentPlayer?.id || 'guest';
    await saveCalibrationTemplates(pid, recordedTemplates.value);
    isCompleted.value = true;
  }
}
</script>

<style scoped>
.calibrate-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.calibrate-header {
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
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.calibrate-card {
  background: white;
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.progress-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-count {
  font-weight: 800;
  color: var(--color-mint-dark);
  font-size: 0.95rem;
  align-self: flex-end;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: #E2E8F0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-mint);
  transition: width 0.2s ease;
}

.symbol-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.prompt-hint {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-muted);
}

.current-symbol {
  font-size: 4rem;
  font-weight: 800;
  color: var(--color-coral-dark);
  line-height: 1.1;
}

.pad-wrap {
  width: 260px;
  height: 260px;
}

.actions-row {
  margin-top: 10px;
}

.btn-save-symbol {
  padding: 12px 28px;
}

.completed-card {
  background: white;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}
</style>
