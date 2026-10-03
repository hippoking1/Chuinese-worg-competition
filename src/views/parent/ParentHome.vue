<template>
  <div class="parent-page">
    <header class="parent-header">
      <button type="button" class="btn-back" @click="router.push('/profiles')">
        ◀ 返回小朋友選單
      </button>
      <h2 class="page-title">⚙ 家長與題庫管理後台</h2>
    </header>

    <!-- 1. Kids Management -->
    <section class="admin-section card-chunky">
      <h3 class="section-title">小朋友帳號管理 ({{ playerStore.players.length }}/3)</h3>
      <div class="kids-list">
        <div v-for="kid in playerStore.players" :key="kid.id" class="kid-admin-row">
          <div class="kid-admin-info">
            <span class="kid-avatar">{{ getAvatarEmoji(kid.avatar) }}</span>
            <div class="kid-text">
              <strong class="kid-title">{{ kid.nickname }}</strong>
              <span class="kid-meta">建立於 {{ new Date(kid.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
          <div class="kid-admin-actions">
            <button
              v-if="playerStore.players.length > 1"
              type="button"
              class="btn-delete"
              @click="deleteKid(kid.id, kid.nickname)"
            >
              刪除帳號
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Google Sheets Cloud Integration -->
    <section class="admin-section card-chunky">
      <h3 class="section-title">Google 試算表與雲端題庫</h3>
      <p class="section-desc">
        本 App 支援搭配 Google 試算表作為雲端題庫與成績總表，所有選手成績皆會自動安全儲存至雲端試算表。
      </p>

      <div class="gas-config-box">
        <div class="field-item">
          <label>Google Apps Script 網頁應用程式網址 (GAS URL)：</label>
          <input
            v-model="gasUrlInput"
            placeholder="https://script.google.com/macros/s/.../exec"
            class="config-input"
          />
        </div>
        <div class="field-item">
          <label>API 存取權杖 (Token)：</label>
          <input
            v-model="gasTokenInput"
            placeholder="在試算表 Setup.gs 產生的 token"
            class="config-input"
          />
        </div>
        <button type="button" class="btn-chunky btn-primary" @click="saveGasConfig">
          儲存雲端設定
        </button>
      </div>
    </section>

    <!-- 3. Question Bank Status & Proof -->
    <section class="admin-section card-chunky">
      <h3 class="section-title">題庫現況與校對</h3>
      <div class="bank-stats">
        <div class="stat-pill">
          <span>總題數</span>
          <strong>{{ qStore.questions.length }} 題</strong>
        </div>
        <div class="stat-pill">
          <span>114年字音</span>
          <strong>100 題</strong>
        </div>
        <div class="stat-pill">
          <span>114年字形</span>
          <strong>100 題</strong>
        </div>
        <div class="stat-pill">
          <span>113年字音</span>
          <strong>100 題</strong>
        </div>
        <div class="stat-pill">
          <span>113年字形</span>
          <strong>100 題</strong>
        </div>
      </div>

      <div class="proof-links">
        <a href="./proof.html" target="_blank" class="btn-chunky btn-sky proof-btn">
          🔍 開啟 400 題原卷對照校對表 (proof.html)
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '../../stores/player';
import { useQuestionsStore } from '../../stores/questions';

const router = useRouter();
const playerStore = usePlayerStore();
const qStore = useQuestionsStore();

const gasUrlInput = ref(localStorage.getItem('quiz_custom_gas_url') || '');
const gasTokenInput = ref(localStorage.getItem('quiz_custom_gas_token') || '');

function getAvatarEmoji(av: string): string {
  if (av === 'owl') return '🦉';
  if (av === 'fox') return '🦊';
  if (av === 'bear') return '🐻';
  if (av === 'rabbit') return '🐰';
  return '🌟';
}

async function deleteKid(id: string, name: string) {
  if (confirm(`確定要刪除「${name}」的帳號嗎？此動作將刪除該帳號在本機的測驗紀錄。`)) {
    await playerStore.deletePlayer(id);
  }
}

function saveGasConfig() {
  localStorage.setItem('quiz_custom_gas_url', gasUrlInput.value.trim());
  localStorage.setItem('quiz_custom_gas_token', gasTokenInput.value.trim());
  alert('雲端設定已儲存！');
}

onMounted(() => {
  if (!playerStore.isParentAuthenticated) {
    router.push('/profiles');
  }
});
</script>

<style scoped>
.parent-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.parent-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 14px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.btn-back {
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 0.9rem;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.admin-section {
  background: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.section-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.kids-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kid-admin-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.kid-admin-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kid-avatar {
  font-size: 2rem;
}

.kid-text {
  display: flex;
  flex-direction: column;
}

.kid-title {
  font-size: 1.1rem;
}

.kid-meta {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.btn-delete {
  background: var(--color-coral-light);
  border: 1px solid var(--color-coral);
  color: var(--color-coral-dark);
  font-weight: 700;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
}

.gas-config-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-item label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-main);
}

.config-input {
  padding: 10px 14px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
}

.bank-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stat-pill {
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-pill span {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.stat-pill strong {
  font-size: 1.1rem;
  color: var(--color-mint-dark);
}

.proof-links {
  margin-top: 10px;
}

.proof-btn {
  text-decoration: none;
  font-size: 1rem;
}
</style>
