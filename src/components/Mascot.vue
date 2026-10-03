<template>
  <div class="mascot-wrapper" :class="[size, mood]">
    <img src="/mascot.svg" class="mascot-img" alt="智慧貓頭鷹" />
    <div v-if="speech" class="mascot-bubble">
      <span>{{ speech }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg';
  mood?: 'happy' | 'thinking' | 'cheer';
  speech?: string;
}>();
</script>

<style scoped>
.mascot-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.mascot-img {
  display: block;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08));
  transition: transform 0.2s ease;
}

.sm .mascot-img { width: 44px; height: 44px; }
.md .mascot-img { width: 72px; height: 72px; }
.lg .mascot-img { width: 110px; height: 110px; }

.happy .mascot-img {
  animation: floatBounce 2.4s ease-in-out infinite;
}

.cheer .mascot-img {
  animation: cheerJump 0.8s ease infinite alternate;
}

.thinking .mascot-img {
  animation: tiltHead 3s ease-in-out infinite;
}

@keyframes floatBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes cheerJump {
  0% { transform: translateY(0) rotate(-3deg); }
  100% { transform: translateY(-12px) rotate(4deg); }
}

@keyframes tiltHead {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-6deg); }
}

.mascot-bubble {
  background: white;
  border: 2px solid var(--color-mint);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-main);
  box-shadow: var(--shadow-sm);
  position: relative;
  max-width: 220px;
}

.mascot-bubble::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 8px 6px 0;
  border-style: solid;
  border-color: transparent var(--color-mint) transparent transparent;
}
</style>
