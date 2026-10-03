<template>
  <div class="pinpad-modal">
    <div class="pinpad-card card-chunky" :class="{ wobble: isError }">
      <div class="pinpad-header">
        <h3 class="pinpad-title">{{ title }}</h3>
        <p class="pinpad-subtitle">{{ subtitle || '請輸入 4 位數密碼' }}</p>
      </div>

      <!-- Dots display -->
      <div class="dots-display">
        <div
          v-for="i in 4"
          :key="i"
          class="pin-dot"
          :class="{ filled: enteredPin.length >= i }"
        ></div>
      </div>

      <!-- Keypad -->
      <div class="keypad-grid">
        <button
          v-for="num in ['1', '2', '3', '4', '5', '6', '7', '8', '9']"
          :key="num"
          type="button"
          class="num-key"
          @click="pressNum(num)"
        >
          {{ num }}
        </button>
        <button type="button" class="num-key cancel-key" @click="$emit('cancel')">
          取消
        </button>
        <button type="button" class="num-key" @click="pressNum('0')">
          0
        </button>
        <button type="button" class="num-key del-key" @click="pressDel">
          ⌫
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  subtitle?: string;
}>();

const emit = defineEmits<{
  (e: 'submit', pin: string): void;
  (e: 'cancel'): void;
}>();

const enteredPin = ref('');
const isError = ref(false);

function pressNum(n: string) {
  if (enteredPin.value.length < 4) {
    enteredPin.value += n;
    if (enteredPin.value.length === 4) {
      emit('submit', enteredPin.value);
    }
  }
}

function pressDel() {
  if (enteredPin.value.length > 0) {
    enteredPin.value = enteredPin.value.slice(0, -1);
  }
}

function triggerError() {
  isError.value = true;
  enteredPin.value = '';
  setTimeout(() => {
    isError.value = false;
  }, 500);
}

defineExpose({
  triggerError,
  clear: () => { enteredPin.value = ''; }
});
</script>

<style scoped>
.pinpad-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(45, 55, 72, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 16px;
}

.pinpad-card {
  background: white;
  width: 100%;
  max-width: 320px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  border-radius: var(--radius-lg);
}

.pinpad-header {
  text-align: center;
}

.pinpad-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.pinpad-subtitle {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.dots-display {
  display: flex;
  gap: 16px;
  margin: 8px 0;
}

.pin-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #E2E8F0;
  border: 2px solid #CBD5E0;
  transition: all 0.15s ease;
}

.pin-dot.filled {
  background: var(--color-coral);
  border-color: var(--color-coral-dark);
  transform: scale(1.15);
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
}

.num-key {
  height: 60px;
  font-size: 1.5rem;
  font-weight: 800;
  background: var(--color-cream-subtle);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-main);
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-key, .del-key {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.wobble {
  animation: wobbleAnim 0.4s ease;
}

@keyframes wobbleAnim {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-10px); }
  40%, 80% { transform: translateX(10px); }
}
</style>
