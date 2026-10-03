<template>
  <div class="question-card card-chunky">
    <div class="card-header">
      <span class="type-badge" :class="question.type">
        {{ question.type === 'sound' ? '字音測驗' : '字形測驗' }}
      </span>
      <span class="q-num">第 {{ index + 1 }} 題 / 共 {{ total }} 題</span>
      <button
        v-if="speechSupported"
        type="button"
        class="speak-btn"
        @click="speakContext"
        title="朗讀語詞"
      >
        <span>🔊 朗讀</span>
      </button>
    </div>

    <!-- Instruction -->
    <div class="instruction">
      <span v-if="question.type === 'sound'">請在右側寫出<strong class="highlight-text">黃色字</strong>的正確注音：</span>
      <span v-else>請在右側寫出<strong class="highlight-text">方格中</strong>的正確國字：</span>
    </div>

    <!-- Phrase Display -->
    <div class="phrase-display font-kaiti">
      <template v-if="question.type === 'sound'">
        <span
          v-for="(char, cIdx) in contextChars"
          :key="cIdx"
          class="char-item"
          :class="{ 'target-sound': cIdx === question.target }"
        >
          {{ char }}
        </span>
      </template>

      <template v-else>
        <span
          v-for="(char, cIdx) in contextChars"
          :key="cIdx"
          class="char-item"
        >
          <template v-if="cIdx === question.target">
            <div class="target-form-box">
              <span class="box-zhuyin">{{ question.zhuyin }}</span>
              <div class="empty-square">？</div>
            </div>
          </template>
          <template v-else>
            {{ char }}
          </template>
        </span>
      </template>
    </div>

    <!-- Tag & Note -->
    <div v-if="question.tags" class="tag-row">
      <span class="tag-pill">{{ question.tags }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Question } from '../types';

const props = defineProps<{
  question: Question;
  index: number;
  total: number;
}>();

const contextChars = computed(() => {
  return Array.from(props.question.context);
});

const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function speakContext() {
  if (!speechSupported) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(props.question.context);
  utter.lang = 'zh-TW';
  utter.rate = 0.85;
  window.speechSynthesis.speak(utter);
}
</script>

<style scoped>
.question-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: white;
}

.card-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-badge {
  font-size: 0.9rem;
  font-weight: 800;
  padding: 4px 14px;
  border-radius: var(--radius-pill);
}

.type-badge.sound {
  background: var(--color-sky-light);
  color: var(--color-sky-dark);
  border: 1px solid var(--color-sky);
}

.type-badge.form {
  background: var(--color-mint-light);
  color: var(--color-mint-dark);
  border: 1px solid var(--color-mint);
}

.q-num {
  font-weight: 700;
  color: var(--color-text-muted);
  font-size: 1rem;
}

.speak-btn {
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-main);
}

.instruction {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text-main);
  text-align: center;
}

.highlight-text {
  color: #B25E00;
  background: var(--color-banana-light);
  padding: 2px 6px;
  border-radius: 4px;
}

.phrase-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 10px 0;
  font-size: 3.5rem;
  font-weight: 700;
  color: #1A202C;
}

.char-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.target-sound {
  background: #FFF0A8;
  border: 3px solid #F59E0B;
  border-radius: 12px;
  padding: 0 8px;
  color: #B45309;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
  animation: pulseBox 2s infinite ease-in-out;
}

@keyframes pulseBox {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.target-form-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.box-zhuyin {
  font-size: 1.25rem;
  color: var(--color-sky-dark);
  font-weight: 800;
  line-height: 1;
}

.empty-square {
  width: 70px;
  height: 70px;
  border: 3px dashed var(--color-mint-dark);
  background: var(--color-mint-light);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  color: var(--color-mint-dark);
  font-family: var(--font-ui);
}

.tag-row {
  display: flex;
  gap: 8px;
}

.tag-pill {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-cream-subtle);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}
</style>
