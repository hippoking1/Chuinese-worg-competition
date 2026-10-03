<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
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
</style>
