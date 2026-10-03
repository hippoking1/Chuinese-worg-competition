<template>
  <div class="replay-container">
    <canvas ref="canvasRef" class="replay-canvas"></canvas>
    <div class="replay-controls">
      <button type="button" class="btn-replay" @click="startReplay">
        <span>▶ 筆順重播</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { drawStroke, getInkBoundingBox } from '../lib/ink';
import type { Ink, Point, Stroke } from '../types';

const props = defineProps<{
  ink: Ink;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;

function setupAndDraw(drawAll = true) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = 200;
  const height = 200;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  // Background grid
  ctx.strokeStyle = '#F0EDE6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
  ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
  ctx.stroke();

  if (!drawAll || !props.ink || props.ink.length === 0) return;

  const bbox = getInkBoundingBox(props.ink);
  if (bbox.width <= 0 || bbox.height <= 0) return;

  const scale = Math.min((width * 0.75) / bbox.width, (height * 0.75) / bbox.height);
  const offsetX = (width - bbox.width * scale) / 2 - bbox.minX * scale;
  const offsetY = (height - bbox.height * scale) / 2 - bbox.minY * scale;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  for (const s of props.ink) {
    drawStroke(ctx, s, '#2D3748', 3 / scale);
  }
  ctx.restore();
}

function startReplay() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  setupAndDraw(false);

  const canvas = canvasRef.value;
  if (!canvas || !props.ink || props.ink.length === 0) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 200;
  const height = 200;
  const bbox = getInkBoundingBox(props.ink);
  const scale = Math.min((width * 0.75) / bbox.width, (height * 0.75) / bbox.height);
  const offsetX = (width - bbox.width * scale) / 2 - bbox.minX * scale;
  const offsetY = (height - bbox.height * scale) / 2 - bbox.minY * scale;

  let strokeIdx = 0;
  let ptIdx = 0;
  const drawnInk: Ink = [];

  function step() {
    if (!ctx) return;
    if (strokeIdx >= props.ink.length) return;

    const currentTargetStroke = props.ink[strokeIdx];
    if (!drawnInk[strokeIdx]) drawnInk[strokeIdx] = [];

    // Advance 2 points per frame for smooth playback
    for (let k = 0; k < 2 && ptIdx < currentTargetStroke.length; k++) {
      drawnInk[strokeIdx].push(currentTargetStroke[ptIdx]);
      ptIdx++;
    }

    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#F0EDE6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
    ctx.stroke();

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    for (let s = 0; s < drawnInk.length; s++) {
      drawStroke(ctx, drawnInk[s], s === strokeIdx ? '#FF7A6B' : '#2D3748', 3 / scale);
    }
    ctx.restore();

    if (ptIdx >= currentTargetStroke.length) {
      strokeIdx++;
      ptIdx = 0;
    }

    if (strokeIdx < props.ink.length) {
      animationFrameId = requestAnimationFrame(step);
    }
  }

  animationFrameId = requestAnimationFrame(step);
}

watch(() => props.ink, () => setupAndDraw(true), { deep: true });

onMounted(() => {
  nextTick(() => setupAndDraw(true));
});
</script>

<style scoped>
.replay-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.replay-canvas {
  width: 200px;
  height: 200px;
  background: white;
  border: 2px solid var(--color-mint);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.btn-replay {
  background: var(--color-mint-light);
  border: 1px solid var(--color-mint);
  color: var(--color-mint-dark);
  font-weight: 700;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
}
</style>
