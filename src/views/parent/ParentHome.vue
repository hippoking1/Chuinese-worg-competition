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
      <div class="section-header-row">
        <h3 class="section-title">📊 Google 試算表與雲端紀錄</h3>
        <button type="button" class="btn-toggle-guide" @click="showGuide = !showGuide">
          {{ showGuide ? '收起部署指南 ▲' : '📖 部署重點教學 ▼' }}
        </button>
      </div>

      <p class="section-desc">
        本 App 支援搭配 Google 試算表作為雲端題庫與成績總表，每次測驗完畢後會將成績自動即時上傳至 Google 試算表。
      </p>

      <!-- GAS Guide Collapsible -->
      <div v-if="showGuide" class="guide-box">
        <h4 class="guide-title">💡 檢查清單：確保試算表能順利接收成績</h4>
        <ol class="guide-list">
          <li>
            <strong>網址必須為網頁應用程式網址：</strong>
            結尾必須是 <code>/exec</code>（例如 <code>https://script.google.com/macros/s/.../exec</code>）。請在 Apps Script 右上角點擊「部署」>「管理部署作業」，點擊網址右邊的「複製」按鈕，避免漏複製字元。請勿複製瀏覽器上方的編輯器網址。
          </li>
          <li>
            <strong>誰可以存取 (Who has access)：</strong>
            部署時必須選擇「<strong>所有人 (Anyone)</strong>」！若選成「僅限我自己」，外部瀏覽器會因沒有授權而無法送出成績。
          </li>
          <li>
            <strong>執行身分 (Execute as)：</strong>
            必須選擇「<strong>我 (Me)</strong>」。
          </li>
          <li>
            <strong>API 存取權杖 (Token)：</strong>
            請打開 Google 試算表的 <code>Config</code> 分頁，查看第 2 行 <code>api_token</code> 欄位對應的數值。此處填寫的權杖必須與試算表中的數值完全一致。
          </li>
          <li>
            <strong>程式碼更新後需部署新版本：</strong>
            若有修改 <code>Code.gs</code>，必須點擊「管理部署作業」>「鉛筆圖示 (編輯)」> 版本下拉選「<strong>新版本</strong>」> 點擊「部署」才會生效。
          </li>
        </ol>
      </div>

      <div class="gas-config-box">
        <div class="field-item">
          <label>Google Apps Script 網頁應用程式網址 (GAS URL)：</label>
          <input
            v-model="gasUrlInput"
            placeholder="https://script.google.com/macros/s/.../exec"
            class="config-input"
            @blur="gasUrlInput = normalizeGasUrl(gasUrlInput)"
          />
          <span class="field-hint">💡 網址結尾必須為 /exec，失焦或測試時系統會自動為您補上。</span>
        </div>

        <div class="field-item">
          <label>API 存取權杖 (Token)：</label>
          <input
            v-model="gasTokenInput"
            placeholder="請查看試算表 Config 分頁中的 api_token"
            class="config-input"
          />
          <span class="field-hint">💡 需與 Google 試算表「Config」分頁中的 api_token 完全相同。</span>
        </div>

        <!-- Outbox Alert if any unsynced attempts exist -->
        <div v-if="outboxCount > 0" class="outbox-alert">
          <span>📦 目前本機有 <strong>{{ outboxCount }}</strong> 筆測驗成績暫存尚未同步至雲端。</span>
          <button
            type="button"
            class="btn-sync-small"
            :disabled="syncingOutbox"
            @click="manualSyncOutbox"
          >
            {{ syncingOutbox ? '同步中...' : '立即補傳全部' }}
          </button>
        </div>

        <!-- Connection Test Feedback -->
        <div
          v-if="testStatus.state !== 'idle'"
          class="test-status-banner"
          :class="'status-' + testStatus.state"
        >
          <div class="status-icon">
            <span v-if="testStatus.state === 'loading'">⏳</span>
            <span v-else-if="testStatus.state === 'success'">✅</span>
            <span v-else>❌</span>
          </div>
          <div class="status-content">
            <p class="status-msg">{{ testStatus.message }}</p>
            <p v-if="testStatus.flushed && testStatus.flushed > 0" class="status-sub">
              🎉 同時已將本機暫存的 {{ testStatus.flushed }} 筆成績同步寫入試算表！
            </p>
          </div>
        </div>

        <div class="gas-btn-group">
          <button
            type="button"
            class="btn-chunky btn-primary"
            :disabled="testStatus.state === 'loading'"
            @click="runTestGas"
          >
            {{ testStatus.state === 'loading' ? '連線診斷中...' : '🔍 測試連線並同步' }}
          </button>
          <button type="button" class="btn-chunky btn-save" @click="saveGasConfig">
            💾 儲存雲端設定
          </button>
        </div>
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
import { normalizeGasUrl, testGasConnection, flushOfflineOutbox } from '../../lib/api';
import { getOfflineOutbox } from '../../lib/db';

const router = useRouter();
const playerStore = usePlayerStore();
const qStore = useQuestionsStore();

const gasUrlInput = ref(localStorage.getItem('quiz_custom_gas_url') || '');
const gasTokenInput = ref(localStorage.getItem('quiz_custom_gas_token') || '');

const outboxCount = ref(0);
const syncingOutbox = ref(false);
const showGuide = ref(false);

const testStatus = ref<{
  state: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  flushed?: number;
}>({
  state: 'idle',
  message: ''
});

function getAvatarEmoji(av: string): string {
  if (av === 'owl') return '🦉';
  if (av === 'fox') return '🦊';
  if (av === 'bear') return '🐻';
  if (av === 'rabbit') return '🐰';
  return '🌟';
}

async function refreshOutboxCount() {
  const outbox = await getOfflineOutbox();
  outboxCount.value = outbox.length;
}

async function deleteKid(id: string, name: string) {
  if (confirm(`確定要刪除「${name}」的帳號嗎？此動作將刪除該帳號在本機的測驗紀錄。`)) {
    await playerStore.deletePlayer(id);
  }
}

async function runTestGas() {
  const normalizedUrl = normalizeGasUrl(gasUrlInput.value);
  gasUrlInput.value = normalizedUrl;

  testStatus.value = {
    state: 'loading',
    message: '正在連線至 Google 試算表進行權限與功能驗證...'
  };

  const res = await testGasConnection(normalizedUrl, gasTokenInput.value);

  if (res.ok) {
    localStorage.setItem('quiz_custom_gas_url', normalizedUrl);
    localStorage.setItem('quiz_custom_gas_token', gasTokenInput.value.trim());

    await refreshOutboxCount();
    testStatus.value = {
      state: 'success',
      message: res.message,
      flushed: res.flushedCount
    };
  } else {
    testStatus.value = {
      state: 'error',
      message: res.message
    };
  }
}

async function manualSyncOutbox() {
  syncingOutbox.value = true;
  try {
    const count = await flushOfflineOutbox();
    await refreshOutboxCount();
    if (count > 0) {
      alert(`成功補傳 ${count} 筆測驗成績至 Google 試算表！`);
    } else {
      alert('同步完成（若仍有暫存，請確認 GAS 連線狀態與權限）');
    }
  } catch (err: any) {
    alert(`補傳失敗: ${err.message || '請確認網路與 GAS 設定'}`);
  } finally {
    syncingOutbox.value = false;
  }
}

function saveGasConfig() {
  const normalizedUrl = normalizeGasUrl(gasUrlInput.value);
  gasUrlInput.value = normalizedUrl;
  localStorage.setItem('quiz_custom_gas_url', normalizedUrl);
  localStorage.setItem('quiz_custom_gas_token', gasTokenInput.value.trim());
  alert('雲端設定已儲存！建議點擊「測試連線並同步」以確保網址與權杖皆可正常運作。');
}

onMounted(async () => {
  if (!playerStore.isParentAuthenticated) {
    router.push('/profiles');
    return;
  }
  await refreshOutboxCount();
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

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.btn-toggle-guide {
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-primary-dark);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle-guide:hover {
  background: var(--color-cream);
}

.guide-box {
  background: var(--color-cream-subtle);
  border: 1.5px solid var(--color-sun-border, #fcd34d);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  animation: fadeIn 0.2s ease-in;
}

.guide-title {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.guide-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.88rem;
  color: var(--color-text-main);
  line-height: 1.5;
}

.guide-list code {
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  font-family: monospace;
}

.gas-config-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.field-hint {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.config-input {
  padding: 10px 14px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
}

.outbox-alert {
  background: #fff7ed;
  border: 1.5px solid #fdba74;
  color: #9a3412;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.btn-sync-small {
  background: #ea580c;
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-sync-small:disabled {
  opacity: 0.6;
}

.test-status-banner {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.status-icon {
  font-size: 1.3rem;
  line-height: 1.2;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-msg {
  margin: 0;
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.4;
}

.status-sub {
  margin: 0;
  font-size: 0.85rem;
}

.status-loading {
  background: #eff6ff;
  border: 1.5px solid #93c5fd;
  color: #1e40af;
}

.status-success {
  background: #ecfdf5;
  border: 1.5px solid #6ee7b7;
  color: #065f46;
}

.status-error {
  background: #fef2f2;
  border: 1.5px solid #fca5a5;
  color: #991b1b;
}

.gas-btn-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-save {
  background: var(--color-mint);
  color: white;
  border: 2px solid var(--color-mint-dark);
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
