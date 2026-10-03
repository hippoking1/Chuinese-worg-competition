<template>
  <div class="progress-bar-container">
    <button
      type="button"
      class="nav-arrow"
      :disabled="currentIndex <= 0"
      @click="$emit('select', currentIndex - 1)"
      title="上一題"
    >
      ◀
    </button>

    <div class="dots-scroll" ref="scrollRef">
      <button
        v-for="(item, idx) in total"
        :key="idx"
        type="button"
        class="dot-btn"
        :class="{
          current: idx === currentIndex,
          answered: isAnswered(idx)
        }"
        @click="$emit('select', idx)"
      >
        <span>{{ idx + 1 }}</span>
      </button>
    </div>

    <button
      type="button"
      class="nav-arrow"
      :disabled="currentIndex >= total - 1"
      @click="$emit('select', currentIndex + 1)"
      title="下一題"
    >
      ▶
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

const props = defineProps<{
  total: number;
  currentIndex: number;
  isAnswered: (idx: number) => boolean;
}>();

defineEmits<{
  (e: 'select', idx: number): void;
}>();

const scrollRef = ref<HTMLDivElement | null>(null);

watch(
  () => props.currentIndex,
  idx => {
    nextTick(() => {
      const container = scrollRef.value;
      if (!container) return;
      const target = container.children[idx] as HTMLElement;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }
);
</script>

<style scoped>
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: white;
  padding: 8px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.nav-arrow {
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--color-text-main);
  flex-shrink: 0;
}

.nav-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.dots-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 4px 0;
  flex: 1;
}

.dots-scroll::-webkit-scrollbar {
  display: none;
}

.dot-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F0EDE6;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: all 0.15s;
}

.dot-btn.answered {
  background: var(--color-mint-light);
  border-color: var(--color-mint-dark);
  color: var(--color-mint-dark);
}

.dot-btn.current {
  background: var(--color-coral);
  border-color: var(--color-coral-dark);
  color: white;
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(255, 122, 107, 0.4);
}
</style>
