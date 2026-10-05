<template>
  <div class="zhuyin-keyboard-container card-chunky">
    <!-- Display current input -->
    <div class="input-display-row">
      <div class="display-box font-kaiti" :class="{ empty: !currentZhuyin }">
        <span v-if="currentZhuyin" class="zhuyin-text">{{ currentZhuyin }}</span>
        <span v-else class="placeholder">請點選下方鍵盤輸入注音</span>
      </div>

      <div class="display-actions">
        <button
          type="button"
          class="btn-action btn-backspace"
          :disabled="!currentZhuyin"
          @click="onBackspace"
          title="刪除最後一個符號"
        >
          <span>⌫ 倒退</span>
        </button>
        <button
          type="button"
          class="btn-action btn-clear"
          :disabled="!currentZhuyin"
          @click="onClear"
          title="全部清除"
        >
          <span>🗑 清除</span>
        </button>
      </div>
    </div>

    <!-- Virtual Zhuyin Keyboard -->
    <div class="keyboard-grid">
      <!-- Row 1: Initials 1 (11 keys) -->
      <div class="kb-row">
        <button
          v-for="sym in row1Initials"
          :key="sym"
          type="button"
          class="key-btn key-initial"
          :class="{ active: initial === sym }"
          @click="pressKey(sym)"
        >
          {{ sym }}
        </button>
      </div>

      <!-- Row 2: Initials 2 (10 keys) -->
      <div class="kb-row">
        <button
          v-for="sym in row2Initials"
          :key="sym"
          type="button"
          class="key-btn key-initial"
          :class="{ active: initial === sym }"
          @click="pressKey(sym)"
        >
          {{ sym }}
        </button>
      </div>

      <!-- Row 3: Medials (3) + Finals 1 (8) (11 keys) -->
      <div class="kb-row">
        <button
          v-for="sym in row3Medials"
          :key="sym"
          type="button"
          class="key-btn key-medial"
          :class="{ active: medial === sym }"
          @click="pressKey(sym)"
        >
          {{ sym }}
        </button>
        <div class="key-divider"></div>
        <button
          v-for="sym in row3Finals"
          :key="sym"
          type="button"
          class="key-btn key-final"
          :class="{ active: finalPart === sym }"
          @click="pressKey(sym)"
        >
          {{ sym }}
        </button>
      </div>

      <!-- Row 4: Finals 2 (5) + Tones (4) + Backspace (10 keys) -->
      <div class="kb-row">
        <button
          v-for="sym in row4Finals"
          :key="sym"
          type="button"
          class="key-btn key-final"
          :class="{ active: finalPart === sym }"
          @click="pressKey(sym)"
        >
          {{ sym }}
        </button>
        <div class="key-divider"></div>
        <button
          type="button"
          class="key-btn key-tone"
          :class="{ active: neutral }"
          @click="toggleNeutral"
          title="輕聲"
        >
          ˙
        </button>
        <button
          type="button"
          class="key-btn key-tone"
          :class="{ active: tone === 2 }"
          @click="setTone(2)"
          title="二聲"
        >
          ˊ
        </button>
        <button
          type="button"
          class="key-btn key-tone"
          :class="{ active: tone === 3 }"
          @click="setTone(3)"
          title="三聲"
        >
          ˇ
        </button>
        <button
          type="button"
          class="key-btn key-tone"
          :class="{ active: tone === 4 }"
          @click="setTone(4)"
          title="四聲"
        >
          ˋ
        </button>
        <button
          type="button"
          class="key-btn key-fn-del"
          :disabled="!currentZhuyin"
          @click="onBackspace"
          title="倒退刪除"
        >
          ⌫
        </button>
      </div>
    </div>

    <!-- Keyboard legend hint -->
    <div class="keyboard-legend">
      <span class="legend-item"><span class="dot dot-initial"></span>聲母</span>
      <span class="legend-item"><span class="dot dot-medial"></span>介母</span>
      <span class="legend-item"><span class="dot dot-final"></span>韻母</span>
      <span class="legend-item"><span class="dot dot-tone"></span>聲調</span>
      <span class="desktop-hint">（支援電腦鍵盤標準注音輸入）</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { ALL_ZHUYIN_SYMBOLS, FINALS, INITIALS, MEDIALS, parseZhuyin } from '../lib/zhuyin';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
  (e: 'change', val: string): void;
}>();

// Keyboard layout rows
const row1Initials = ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ'];
const row2Initials = ['ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ'];
const row3Medials = ['ㄧ', 'ㄨ', 'ㄩ'];
const row3Finals = ['ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ'];
const row4Finals = ['ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 'ㄦ'];

// Syllable components
const neutral = ref(false);
const initial = ref('');
const medial = ref('');
const finalPart = ref('');
const tone = ref<1 | 2 | 3 | 4 | 0>(1);

// Initialize from modelValue
function loadFromValue(val?: string) {
  if (!val) {
    neutral.value = false;
    initial.value = '';
    medial.value = '';
    finalPart.value = '';
    tone.value = 1;
    return;
  }
  const parsed = parseZhuyin(val);
  neutral.value = parsed.neutral;
  initial.value = parsed.initial || '';
  medial.value = parsed.medial || '';
  finalPart.value = parsed.final || '';
  tone.value = parsed.tone;
}

watch(() => props.modelValue, loadFromValue, { immediate: true });

const currentZhuyin = computed(() => {
  const parts: string[] = [];
  if (neutral.value) parts.push('˙');
  if (initial.value) parts.push(initial.value);
  if (medial.value) parts.push(medial.value);
  if (finalPart.value) parts.push(finalPart.value);
  if (!neutral.value) {
    if (tone.value === 2) parts.push('ˊ');
    else if (tone.value === 3) parts.push('ˇ');
    else if (tone.value === 4) parts.push('ˋ');
  }
  return parts.join('');
});

function emitChange() {
  const z = currentZhuyin.value;
  emit('update:modelValue', z);
  emit('change', z);
}

function pressKey(sym: string) {
  if (INITIALS.includes(sym)) {
    initial.value = sym;
  } else if (MEDIALS.includes(sym)) {
    medial.value = sym;
  } else if (FINALS.includes(sym)) {
    finalPart.value = sym;
  }
  emitChange();
}

function toggleNeutral() {
  neutral.value = !neutral.value;
  if (neutral.value) {
    tone.value = 0;
  } else {
    tone.value = 1;
  }
  emitChange();
}

function setTone(t: 2 | 3 | 4) {
  neutral.value = false;
  if (tone.value === t) {
    tone.value = 1; // Toggle off to 1st tone
  } else {
    tone.value = t;
  }
  emitChange();
}

function onBackspace() {
  if (tone.value !== 1 || neutral.value) {
    tone.value = 1;
    neutral.value = false;
  } else if (finalPart.value) {
    finalPart.value = '';
  } else if (medial.value) {
    medial.value = '';
  } else if (initial.value) {
    initial.value = '';
  }
  emitChange();
}

function onClear() {
  neutral.value = false;
  initial.value = '';
  medial.value = '';
  finalPart.value = '';
  tone.value = 1;
  emitChange();
}

// Physical keyboard standard DaQuan layout mapping
const DAQUAN_MAP: Record<string, string> = {
  '1': 'ㄅ', 'q': 'ㄆ', 'a': 'ㄇ', 'z': 'ㄈ',
  '2': 'ㄉ', 'w': 'ㄊ', 's': 'ㄋ', 'x': 'ㄌ',
  'e': 'ㄍ', 'd': 'ㄎ', 'c': 'ㄏ',
  'r': 'ㄐ', 'f': 'ㄑ', 'v': 'ㄒ',
  '5': 'ㄓ', 't': 'ㄔ', 'g': 'ㄕ', 'b': 'ㄖ',
  'y': 'ㄗ', 'h': 'ㄘ', 'n': 'ㄙ',
  'u': 'ㄧ', 'j': 'ㄨ', 'm': 'ㄩ',
  '8': 'ㄚ', 'i': 'ㄛ', 'k': 'ㄜ', ',': 'ㄝ',
  '9': 'ㄞ', 'o': 'ㄟ', 'l': 'ㄠ', '.': 'ㄡ',
  '0': 'ㄢ', 'p': 'ㄣ', ';': 'ㄤ', '/': 'ㄥ', '-': 'ㄦ',
  '7': '˙', '6': 'ˊ', '3': 'ˇ', '4': 'ˋ'
};

function onKeyDown(e: KeyboardEvent) {
  // If focus is in an input or textarea, ignore
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
    return;
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    onBackspace();
    return;
  }
  if (e.key === 'Delete' || e.key === 'Escape') {
    e.preventDefault();
    onClear();
    return;
  }
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    // Spacebar = 1st tone (no mark)
    if (tone.value !== 1) {
      tone.value = 1;
      neutral.value = false;
      emitChange();
    }
    return;
  }

  // Direct Zhuyin character typed
  if (ALL_ZHUYIN_SYMBOLS.includes(e.key)) {
    e.preventDefault();
    pressKey(e.key);
    return;
  }
  if (e.key === '˙') {
    e.preventDefault();
    toggleNeutral();
    return;
  }
  if (e.key === 'ˊ') {
    e.preventDefault();
    setTone(2);
    return;
  }
  if (e.key === 'ˇ') {
    e.preventDefault();
    setTone(3);
    return;
  }
  if (e.key === 'ˋ') {
    e.preventDefault();
    setTone(4);
    return;
  }

  // Standard DaQuan key mapping
  const mapped = DAQUAN_MAP[e.key.toLowerCase()];
  if (mapped) {
    e.preventDefault();
    if (mapped === '˙') {
      toggleNeutral();
    } else if (mapped === 'ˊ') {
      setTone(2);
    } else if (mapped === 'ˇ') {
      setTone(3);
    } else if (mapped === 'ˋ') {
      setTone(4);
    } else {
      pressKey(mapped);
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<style scoped>
.zhuyin-keyboard-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: var(--radius-lg);
  width: 100%;
  box-sizing: border-box;
}

/* Display row */
.input-display-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #FFFDF9;
  border: 2px solid var(--color-mint);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  min-height: 58px;
}

.display-box {
  display: flex;
  align-items: center;
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--color-text-main);
  letter-spacing: 4px;
}

.display-box.empty {
  font-size: 1rem;
  color: var(--color-text-muted);
  font-weight: 600;
  letter-spacing: 0;
  font-family: var(--font-ui);
}

.display-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  font-size: 0.9rem;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: white;
  transition: all 0.15s;
}

.btn-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-backspace:not(:disabled):hover {
  background: var(--color-sky-light);
  border-color: var(--color-sky);
  color: var(--color-sky-dark);
}

.btn-clear:not(:disabled):hover {
  background: var(--color-coral-light);
  border-color: var(--color-coral);
  color: var(--color-coral-dark);
}

/* Virtual Keyboard */
.keyboard-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.kb-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  width: 100%;
}

.key-divider {
  width: 2px;
  background: var(--color-border);
  margin: 2px 2px;
  border-radius: 2px;
}

.key-btn {
  flex: 1;
  max-width: 58px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-kaiti);
  font-size: 1.45rem;
  font-weight: 800;
  border-radius: 8px;
  border: 2px solid transparent;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
  transition: transform 0.08s, box-shadow 0.08s;
  user-select: none;
  touch-action: manipulation;
}

.key-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.12);
}

/* Color coding for phonetic types */
.key-initial {
  background: #E0F2FE;
  border-color: #BAE6FD;
  color: #0369A1;
}

.key-initial.active {
  background: #0284C7;
  color: white;
  border-color: #0369A1;
  transform: scale(1.05);
}

.key-medial {
  background: #FEF3C7;
  border-color: #FDE68A;
  color: #B45309;
}

.key-medial.active {
  background: #F59E0B;
  color: white;
  border-color: #D97706;
  transform: scale(1.05);
}

.key-final {
  background: #FEE2E2;
  border-color: #FECACA;
  color: #B91C1C;
}

.key-final.active {
  background: #EF4444;
  color: white;
  border-color: #DC2626;
  transform: scale(1.05);
}

.key-tone {
  background: #F3E8FF;
  border-color: #E9D5FF;
  color: #7E22CE;
  font-size: 1.6rem;
}

.key-tone.active {
  background: #9333EA;
  color: white;
  border-color: #7E22CE;
  transform: scale(1.05);
}

.key-fn-del {
  background: #F3F4F6;
  border-color: #E5E7EB;
  color: #4B5563;
  font-size: 1.15rem;
  font-family: var(--font-ui);
}

.key-fn-del:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Legend */
.keyboard-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 700;
  margin-top: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-initial { background: #0284C7; }
.dot-medial { background: #F59E0B; }
.dot-final { background: #EF4444; }
.dot-tone { background: #9333EA; }

.desktop-hint {
  font-size: 0.75rem;
  color: var(--color-text-light);
  font-weight: 500;
}

/* Responsive for Mobile Portrait & Compact Screens */
@media (max-width: 820px), (orientation: portrait), (max-height: 520px) {
  .zhuyin-keyboard-container {
    padding: 6px 8px;
    gap: 6px;
  }

  .input-display-row {
    padding: 4px 10px;
    min-height: 42px;
  }

  .display-box {
    font-size: 1.6rem;
    letter-spacing: 2px;
  }

  .btn-action {
    padding: 5px 8px;
    font-size: 0.78rem;
  }

  .keyboard-grid {
    gap: 4px;
  }

  .kb-row {
    gap: 3px;
  }

  .key-btn {
    height: 38px;
    font-size: 1.15rem;
    border-radius: 6px;
  }

  .key-tone {
    font-size: 1.3rem;
  }

  .keyboard-legend {
    gap: 8px;
    font-size: 0.72rem;
  }

  .desktop-hint {
    display: none;
  }
}

@media (max-height: 480px) {
  .key-btn {
    height: 30px;
    font-size: 1rem;
  }
  .input-display-row {
    min-height: 36px;
  }
}
</style>
