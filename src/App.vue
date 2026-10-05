<template>
  <div class="app-container">
    <div v-if="pwaUpdating" class="pwa-update-banner">
      <span>🚀 正在套用最新版本更新，請稍候...</span>
    </div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { pwaUpdating } from './pwa';
import { usePlayerStore } from './stores/player';
import { useQuestionsStore } from './stores/questions';

const playerStore = usePlayerStore();
const qStore = useQuestionsStore();

onMounted(async () => {
  await playerStore.loadPlayers();
  await qStore.loadQuestions();
});
</script>

<style>
.app-container {
  min-height: 100vh;
  width: 100%;
}

.pwa-update-banner {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: #166534;
  color: white;
  padding: 8px 20px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.9rem;
  z-index: 99999;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}
</style>
