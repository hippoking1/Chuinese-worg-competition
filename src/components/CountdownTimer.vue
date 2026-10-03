<template>
  <div class="timer-pill" :class="{ 'warning-pulse': isWarning }">
    <span class="timer-icon">⏱</span>
    <span class="timer-text">{{ formattedTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  seconds: number;
}>();

const formattedTime = computed(() => {
  const m = Math.floor(props.seconds / 60);
  const s = props.seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const isWarning = computed(() => props.seconds <= 60 && props.seconds > 0);
</script>

<style scoped>
.timer-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 2px solid var(--color-mint);
  border-radius: var(--radius-pill);
  padding: 6px 16px;
  box-shadow: var(--shadow-sm);
  color: var(--color-text-main);
  font-weight: 800;
  font-size: 1.15rem;
}

.timer-icon {
  font-size: 1.2rem;
}

.warning-pulse {
  background: var(--color-coral-light);
  border-color: var(--color-coral);
  color: var(--color-coral-dark);
  animation: pulseTimer 1s infinite alternate;
}

@keyframes pulseTimer {
  0% { transform: scale(1); }
  100% { transform: scale(1.06); }
}
</style>
