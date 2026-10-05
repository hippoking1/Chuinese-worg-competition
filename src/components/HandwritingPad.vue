<template>
  <div class="pad-container" :class="{ 'pen-mode': isPenActive }">
    <div class="canvas-wrapper" ref="wrapperRef">
      <canvas
        ref="canvasRef"
        class="writing-canvas"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      ></canvas>

      <!-- Traditional Rice-character (米字格) Grid Guide -->
      <svg class="grid-guide" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1="50" x2="100" y2="50" stroke="#E2DDD5" stroke-dasharray="3,3" stroke-width="0.8" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="#E2DDD5" stroke-dasharray="3,3" stroke-width="0.8" />
        <line x1="0" y1="0" x2="100" y2="100" stroke="#EBE7DF" stroke-dasharray="3,3" stroke-width="0.6" />
        <line x1="100" y1="0" x2="0" y2="100" stroke="#EBE7DF" stroke-dasharray="3,3" stroke-width="0.6" />
      </svg>
    </div>

    <!-- Action Toolbar below pad -->
    <div v-if="showToolbar" class="pad-toolbar">
      <button
        type="button"
        class="tool-btn btn-undo"
        :disabled="strokes.length === 0"
        @click="undo"
        title="復原上一筆"
      >
        <span>↩ 復原</span>
      </button>

      <button
        type="button"
        class="tool-btn btn-clear"
        :disabled="strokes.length === 0"
        @click="clear"
        title="清除重寫"
      >
        <span>🗑 清除</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { drawInk, drawStroke } from '../lib/ink';
import { useSettingsStore } from '../stores/settings';
import type { Ink, Point, Stroke } from '../types';

const props = withDefaults(
  defineProps<{
    modelValue?: Ink;
    showToolbar?: boolean;
    strokeColor?: string;
    strokeWidth?: number;
    disabled?: boolean;
  }>(),
  {
    showToolbar: true,
    strokeColor: '#2D3748',
    strokeWidth: 4,
    disabled: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', ink: Ink): void;
  (e: 'change', ink: Ink): void;
  (e: 'clear'): void;
}>();

const settings = useSettingsStore();

const wrapperRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const strokes = ref<Ink>(props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) : []);
const isDrawing = ref(false);
const currentStroke = ref<Stroke>([]);
const isPenActive = ref(false);

let ctx: CanvasRenderingContext2D | null = null;
let dpr = 1;
let resizeObserver: ResizeObserver | null = null;

function setupCanvas() {
  const canvas = canvasRef.value;
  const wrapper = wrapperRef.value;
  if (!canvas || !wrapper) return;

  dpr = window.devicePixelRatio || 1;
  const rect = wrapper.getBoundingClientRect();
  const width = rect.width || 300;
  const height = rect.height || 300;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
    redraw();
  }
}

function redraw() {
  if (!ctx || !canvasRef.value) return;
  const canvas = canvasRef.value;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  drawInk(ctx, strokes.value, props.strokeColor, props.strokeWidth);
  if (currentStroke.value.length > 0) {
    drawStroke(ctx, currentStroke.value, props.strokeColor, props.strokeWidth);
  }
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled) return;
  // Stylus Palm Rejection: if user writes with stylus, ignore finger touch
  if (e.pointerType === 'pen') {
    isPenActive.value = true;
  } else if (isPenActive.value && settings.penOnly && e.pointerType === 'touch') {
    return; // Reject palm
  }

  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.setPointerCapture(e.pointerId);

  isDrawing.value = true;
  const rect = canvas.getBoundingClientRect();
  const pt: Point = [e.clientX - rect.left, e.clientY - rect.top, e.timeStamp, e.pressure || 0.5];
  currentStroke.value = [pt];
  redraw();
}

function onPointerMove(e: PointerEvent) {
  if (!isDrawing.value || !canvasRef.value) return;
  if (isPenActive.value && settings.penOnly && e.pointerType === 'touch') return;

  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();

  // Support 120Hz/240Hz stylus sampling rate if supported
  const events = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];
  for (const ev of events) {
    const pt: Point = [ev.clientX - rect.left, ev.clientY - rect.top, ev.timeStamp, ev.pressure || 0.5];
    currentStroke.value.push(pt);
  }

  redraw();
}

function onPointerUp(e: PointerEvent) {
  if (!isDrawing.value) return;
  isDrawing.value = false;

  if (currentStroke.value.length > 0) {
    strokes.value.push(currentStroke.value);
    currentStroke.value = [];
    redraw();
    emitChange();
  }

  try {
    canvasRef.value?.releasePointerCapture(e.pointerId);
  } catch {}
}

function undo() {
  if (strokes.value.length === 0) return;
  strokes.value.pop();
  redraw();
  emitChange();
}

function clear() {
  strokes.value = [];
  currentStroke.value = [];
  redraw();
  emit('clear');
  emitChange();
}

function emitChange() {
  const cloned = JSON.parse(JSON.stringify(strokes.value));
  emit('update:modelValue', cloned);
  emit('change', cloned);
}

function getCanvasDimensions() {
  const canvas = canvasRef.value;
  if (!canvas) return { width: 300, height: 300 };
  return {
    width: canvas.width / dpr,
    height: canvas.height / dpr
  };
}

defineExpose({
  clear,
  undo,
  getCanvasDimensions,
  getStrokes: () => strokes.value
});

watch(
  () => props.modelValue,
  val => {
    if (val && JSON.stringify(val) !== JSON.stringify(strokes.value)) {
      strokes.value = JSON.parse(JSON.stringify(val));
      redraw();
    } else if (!val && strokes.value.length > 0) {
      strokes.value = [];
      redraw();
    }
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    setupCanvas();
    if (wrapperRef.value) {
      resizeObserver = new ResizeObserver(() => setupCanvas());
      resizeObserver.observe(wrapperRef.value);
    }
  });
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
.pad-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  min-height: 140px;
  background: #FFFDF9;
  border: 3px solid var(--color-mint);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(159, 226, 200, 0.2);
}

.writing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  z-index: 2;
  cursor: crosshair;
}

.grid-guide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.pad-toolbar {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  width: 100%;
  justify-content: flex-end;
}

.tool-btn {
  font-size: 0.95rem;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: var(--radius-pill);
  background: white;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  color: var(--color-text-main);
  transition: all 0.15s;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-undo:not(:disabled):hover {
  background: var(--color-sky-light);
  border-color: var(--color-sky);
  color: var(--color-sky-dark);
}

.btn-clear:not(:disabled):hover {
  background: var(--color-coral-light);
  border-color: var(--color-coral);
  color: var(--color-coral-dark);
}

@media (max-width: 820px), (orientation: portrait), (max-height: 520px) {
  .canvas-wrapper {
    min-height: 120px;
  }

  .pad-toolbar {
    margin-top: 4px;
    gap: 8px;
  }

  .tool-btn {
    font-size: 0.82rem;
    padding: 5px 12px;
  }
}
</style>
