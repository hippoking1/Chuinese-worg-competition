<template>
  <div class="star-burst-layer"></div>
</template>

<script setup lang="ts">
import confetti from 'canvas-confetti';
import { onMounted } from 'vue';

const props = withDefaults(
  defineProps<{
    stars?: number;
  }>(),
  {
    stars: 3
  }
);

onMounted(() => {
  // Fire festive child-friendly confetti bursts
  confetti({
    particleCount: props.stars >= 3 ? 90 : 45,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#9FE2C8', '#FF7A6B', '#5AA9E6', '#FFD43F', '#FFB7B2']
  });

  if (props.stars >= 3) {
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  }
});
</script>

<style scoped>
.star-burst-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}
</style>
