<template>
  <div class="zhuyin-pad-container">
    <div class="zhuyin-layout">
      <!-- Left Column: 3 vertical symbol boxes + optional neutral tone at top -->
      <div class="symbol-column">
        <!-- Top slot: Neutral Tone (˙) -->
        <div class="neutral-slot" :class="{ active: hasNeutralTone }">
          <button
            type="button"
            class="neutral-btn"
            :class="{ selected: hasNeutralTone }"
            @click="toggleNeutralTone"
          >
            <span>˙ (輕聲)</span>
          </button>
        </div>

        <!-- Slot 1: Initial (聲母) -->
        <div class="slot-item">
          <div class="slot-canvas-wrap">
            <HandwritingPad
              ref="slot1Ref"
              :modelValue="slot1Ink"
              :showToolbar="false"
              @change="onSlot1Change"
            />
            <div v-if="slot1Cand" class="cand-tag">{{ slot1Cand }}</div>
          </div>
          <span class="slot-label">聲母</span>
        </div>

        <!-- Slot 2: Medial (介母) -->
        <div class="slot-item">
          <div class="slot-canvas-wrap">
            <HandwritingPad
              ref="slot2Ref"
              :modelValue="slot2Ink"
              :showToolbar="false"
              @change="onSlot2Change"
            />
            <div v-if="slot2Cand" class="cand-tag">{{ slot2Cand }}</div>
          </div>
          <span class="slot-label">介母</span>
        </div>

        <!-- Slot 3: Final (韻母) -->
        <div class="slot-item">
          <div class="slot-canvas-wrap">
            <HandwritingPad
              ref="slot3Ref"
              :modelValue="slot3Ink"
              :showToolbar="false"
              @change="onSlot3Change"
            />
            <div v-if="slot3Cand" class="cand-tag">{{ slot3Cand }}</div>
          </div>
          <span class="slot-label">韻母</span>
        </div>
      </div>

      <!-- Right Column: Tone area (聲調區) -->
      <div class="tone-column">
        <div class="tone-canvas-wrap">
          <HandwritingPad
            ref="toneRef"
            :modelValue="toneInk"
            :showToolbar="false"
            @change="onToneChange"
          />
          <div v-if="toneMark" class="cand-tag tone-cand">{{ toneMark }}</div>
        </div>
        <span class="slot-label">聲調 (ˊ ˇ ˋ)</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="zhuyin-actions">
      <div class="preview-box">
        <span class="preview-label">目前辨識：</span>
        <span class="preview-val">{{ combinedZhuyin || '（請於左側書寫）' }}</span>
      </div>
      <button type="button" class="btn-clear-all" @click="clearAll">
        <span>全部清除</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { recognizePointcloud, type PPoint, type PTemplate } from '../lib/recognizer/dollarP';
import { recognizeZhuyinWithGoogle } from '../lib/recognizer/google';
import { classifyTone } from '../lib/recognizer/tone';
import { DEFAULT_ZHUYIN_TEMPLATES } from '../lib/recognizer/zhuyinTemplates';
import { FINALS, INITIALS, MEDIALS } from '../lib/zhuyin';
import type { Ink } from '../types';
import HandwritingPad from './HandwritingPad.vue';

const props = defineProps<{
  customTemplates?: PTemplate[];
}>();

const emit = defineEmits<{
  (e: 'change', payload: { combinedZhuyin: string; fullInk: Ink; candidates: string[] }): void;
}>();

const slot1Ref = ref<any>(null);
const slot2Ref = ref<any>(null);
const slot3Ref = ref<any>(null);
const toneRef = ref<any>(null);

const slot1Ink = ref<Ink>([]);
const slot2Ink = ref<Ink>([]);
const slot3Ink = ref<Ink>([]);
const toneInk = ref<Ink>([]);
const hasNeutralTone = ref(false);

const slot1Cand = ref('');
const slot2Cand = ref('');
const slot3Cand = ref('');
const detectedTone = ref<1 | 2 | 3 | 4 | 0>(1);

let slot1Timer: number | null = null;
let slot2Timer: number | null = null;
let slot3Timer: number | null = null;

const templates = computed(() => {
  return [...(props.customTemplates || []), ...DEFAULT_ZHUYIN_TEMPLATES];
});

function inkToPoints(ink: Ink): PPoint[] {
  const pts: PPoint[] = [];
  ink.forEach((stroke, strokeId) => {
    stroke.forEach(p => {
      pts.push({ x: p[0], y: p[1], strokeId });
    });
  });
  return pts;
}

function recognizeSlotLocal(ink: Ink, allowed: string[]): string {
  if (!ink || ink.length === 0) return '';
  const pts = inkToPoints(ink);
  const filteredTemplates = templates.value.filter(t => allowed.includes(t.name));
  const res = recognizePointcloud(pts, filteredTemplates.length > 0 ? filteredTemplates : templates.value);
  return res.length > 0 ? res[0].name : '';
}

function onSlot1Change(ink: Ink) {
  slot1Ink.value = ink;
  slot1Cand.value = recognizeSlotLocal(ink, INITIALS);
  notifyChange();

  if (slot1Timer) clearTimeout(slot1Timer);
  if (ink.length > 0) {
    slot1Timer = window.setTimeout(async () => {
      const dims = slot1Ref.value?.getCanvasDimensions() || { width: 100, height: 90 };
      const cands = await recognizeZhuyinWithGoogle(ink, dims.width, dims.height, INITIALS);
      if (cands.length > 0 && slot1Ink.value === ink) {
        slot1Cand.value = cands[0];
        notifyChange();
      }
    }, 200);
  }
}

function onSlot2Change(ink: Ink) {
  slot2Ink.value = ink;
  slot2Cand.value = recognizeSlotLocal(ink, MEDIALS);
  notifyChange();

  if (slot2Timer) clearTimeout(slot2Timer);
  if (ink.length > 0) {
    slot2Timer = window.setTimeout(async () => {
      const dims = slot2Ref.value?.getCanvasDimensions() || { width: 100, height: 90 };
      const cands = await recognizeZhuyinWithGoogle(ink, dims.width, dims.height, MEDIALS);
      if (cands.length > 0 && slot2Ink.value === ink) {
        slot2Cand.value = cands[0];
        notifyChange();
      }
    }, 200);
  }
}

const SLOT3_ALLOWED = [...FINALS, ...MEDIALS];
function onSlot3Change(ink: Ink) {
  slot3Ink.value = ink;
  slot3Cand.value = recognizeSlotLocal(ink, SLOT3_ALLOWED);
  notifyChange();

  if (slot3Timer) clearTimeout(slot3Timer);
  if (ink.length > 0) {
    slot3Timer = window.setTimeout(async () => {
      const dims = slot3Ref.value?.getCanvasDimensions() || { width: 100, height: 90 };
      const cands = await recognizeZhuyinWithGoogle(ink, dims.width, dims.height, SLOT3_ALLOWED);
      if (cands.length > 0 && slot3Ink.value === ink) {
        slot3Cand.value = cands[0];
        notifyChange();
      }
    }, 200);
  }
}

function onToneChange(ink: Ink) {
  toneInk.value = ink;
  const dims = toneRef.value?.getCanvasDimensions() || { width: 100, height: 200 };
  detectedTone.value = classifyTone(ink, dims.width, dims.height);
  notifyChange();
}

const toneMark = computed(() => {
  if (hasNeutralTone.value) return '˙ (輕聲)';
  if (detectedTone.value === 2) return 'ˊ (二聲)';
  if (detectedTone.value === 3) return 'ˇ (三聲)';
  if (detectedTone.value === 4) return 'ˋ (四聲)';
  return '';
});

function toggleNeutralTone() {
  hasNeutralTone.value = !hasNeutralTone.value;
  if (hasNeutralTone.value) {
    detectedTone.value = 0;
  } else {
    detectedTone.value = 1;
  }
  notifyChange();
}

const combinedZhuyin = computed(() => {
  const parts: string[] = [];
  if (hasNeutralTone.value) parts.push('˙');
  if (slot1Cand.value) parts.push(slot1Cand.value);
  if (slot2Cand.value) parts.push(slot2Cand.value);
  if (slot3Cand.value) parts.push(slot3Cand.value);
  if (!hasNeutralTone.value) {
    if (detectedTone.value === 2) parts.push('ˊ');
    else if (detectedTone.value === 3) parts.push('ˇ');
    else if (detectedTone.value === 4) parts.push('ˋ');
  }
  return parts.join('');
});

function notifyChange() {
  const fullInk: Ink = [
    ...slot1Ink.value,
    ...slot2Ink.value,
    ...slot3Ink.value,
    ...toneInk.value
  ];
  const zhuyin = combinedZhuyin.value;
  const cands = zhuyin ? [zhuyin] : [];
  emit('change', {
    combinedZhuyin: zhuyin,
    fullInk,
    candidates: cands
  });
}

function clearAll() {
  if (slot1Timer) clearTimeout(slot1Timer);
  if (slot2Timer) clearTimeout(slot2Timer);
  if (slot3Timer) clearTimeout(slot3Timer);
  slot1Ink.value = [];
  slot2Ink.value = [];
  slot3Ink.value = [];
  toneInk.value = [];
  slot1Cand.value = '';
  slot2Cand.value = '';
  slot3Cand.value = '';
  detectedTone.value = 1;
  hasNeutralTone.value = false;
  slot1Ref.value?.clear();
  slot2Ref.value?.clear();
  slot3Ref.value?.clear();
  toneRef.value?.clear();
  notifyChange();
}

defineExpose({
  clearAll
});
</script>

<style scoped>
.zhuyin-pad-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.zhuyin-layout {
  display: flex;
  gap: 16px;
  width: 100%;
}

.symbol-column {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.neutral-slot {
  display: flex;
  justify-content: center;
}

.neutral-btn {
  background: white;
  border: 2px dashed var(--color-border);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-muted);
  transition: all 0.15s;
}

.neutral-btn.selected {
  background: var(--color-banana-light);
  border-color: var(--color-banana-dark);
  color: var(--color-banana-dark);
}

.slot-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.slot-canvas-wrap {
  position: relative;
  width: 100%;
  height: 90px;
}

.slot-canvas-wrap :deep(.canvas-wrapper) {
  min-height: 90px;
  border-color: var(--color-sky);
}

.slot-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-light);
}

.tone-column {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.tone-canvas-wrap {
  position: relative;
  width: 100%;
  height: 290px;
}

.tone-canvas-wrap :deep(.canvas-wrapper) {
  min-height: 290px;
  border-color: var(--color-coral);
}

.cand-tag {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--color-sky-dark);
  color: var(--color-sky-dark);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
  font-weight: 800;
  font-size: 1rem;
  pointer-events: none;
  z-index: 5;
}

.tone-cand {
  border-color: var(--color-coral-dark);
  color: var(--color-coral-dark);
}

.zhuyin-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-cream-subtle);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.preview-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.preview-val {
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--color-sky-dark);
}

.btn-clear-all {
  background: white;
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-coral-dark);
}

@media (max-width: 820px), (orientation: portrait) {
  .zhuyin-pad-container {
    gap: 6px;
    height: 100%;
  }

  .zhuyin-layout {
    gap: 10px;
    flex: 1;
    min-height: 0;
  }

  .neutral-btn {
    padding: 3px 10px;
    font-size: 0.8rem;
  }

  .slot-item {
    gap: 2px;
  }

  .slot-canvas-wrap {
    height: 72px;
  }

  .slot-canvas-wrap :deep(.canvas-wrapper) {
    min-height: 72px;
  }

  .tone-canvas-wrap {
    height: 100%;
    min-height: 220px;
  }

  .tone-canvas-wrap :deep(.canvas-wrapper) {
    min-height: 220px;
  }

  .zhuyin-actions {
    padding: 4px 10px;
  }

  .preview-val {
    font-size: 1.1rem;
  }
}
</style>
