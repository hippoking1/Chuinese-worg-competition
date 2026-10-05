<template>
  <div class="settings-page">
    <header class="settings-header">
      <button type="button" class="btn-back" @click="router.push('/home')">
        ◀ 回首頁
      </button>
      <h2 class="page-title">⚙ 系統偏好設定</h2>
    </header>

    <div class="settings-card card-chunky">
      <!-- 1. Pen Only Palm Rejection -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-title">觸控筆專用防手掌誤觸</span>
          <span class="setting-desc">啟用後手寫板只感應觸控筆（Apple Pencil / S Pen），手掌放上螢幕不會畫到。</span>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="settings.penOnly" />
          <span class="slider"></span>
        </label>
      </div>

      <!-- 2. Sound Effects -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-title">活潑音效反饋</span>
          <span class="setting-desc">答對時播放輕快音效與結算歡呼彩帶。</span>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="settings.soundEnabled" />
          <span class="slider"></span>
        </label>
      </div>

      <!-- 3. Strict Competition Mode -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-title">競賽嚴格模式 (塗改不計分)</span>
          <span class="setting-desc">比照全國競賽標準，關閉橡皮擦與復原按鈕，並對擦除過之題目做標記。</span>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="settings.strictMode" />
          <span class="slider"></span>
        </label>
      </div>

      <!-- 4. Dominant Hand Layout -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-title">持筆慣用手</span>
          <span class="setting-desc">調整按鈕與題目排列方向，方便非持筆手點選「下一題」。</span>
        </div>
        <div class="hand-selector">
          <button
            type="button"
            class="hand-btn"
            :class="{ active: settings.dominantHand === 'right' }"
            @click="settings.dominantHand = 'right'"
          >
            右手持筆
          </button>
          <button
            type="button"
            class="hand-btn"
            :class="{ active: settings.dominantHand === 'left' }"
            @click="settings.dominantHand = 'left'"
          >
            左手持筆
          </button>
        </div>
      </div>

      <!-- 5. Offline Sync -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-title">上傳暫存成績</span>
          <span class="setting-desc">如果曾在離線環境下練習，可在此將本機暫存成績同步至雲端。</span>
        </div>
        <button type="button" class="btn-sync" :disabled="isSyncing" @click="handleSync">
          {{ isSyncing ? '同步中...' : '立即同步' }}
        </button>
      </div>

      <!-- 6. App Version & Force Update -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-title">軟體版本與更新 (PWA)</span>
          <span class="setting-desc">目前版本：v1.3.0 (最新版)。App 會在每次開啟或連網時自動抓取最新版本；若手機顯示舊畫面，可點此強制清除快取並載入。</span>
        </div>
        <button type="button" class="btn-sync" :disabled="isUpdatingApp" @click="forceUpdateApp">
          {{ isUpdatingApp ? '更新中...' : '🔄 檢查並強制更新' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { flushOfflineOutbox } from '../lib/api';
import { useSettingsStore } from '../stores/settings';

const router = useRouter();
const settings = useSettingsStore();
const isSyncing = ref(false);
const isUpdatingApp = ref(false);

async function handleSync() {
  isSyncing.value = true;
  try {
    const count = await flushOfflineOutbox();
    alert(`同步完成！共上傳了 ${count} 筆測驗成績。`);
  } catch (err) {
    alert('同步失敗，請檢查網路連線或稍後再試。');
  } finally {
    isSyncing.value = false;
  }
}

async function forceUpdateApp() {
  isUpdatingApp.value = true;
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
    alert('已成功清除本機舊快取！即將重新載入最新版本...');
    window.location.reload();
  } catch (err: any) {
    alert(`更新失敗: ${err.message || '請重新整理網頁'}`);
    window.location.reload();
  } finally {
    isUpdatingApp.value = false;
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-header {
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

.settings-card {
  background: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--color-border);
}

.setting-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.setting-desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.hand-selector {
  display: flex;
  gap: 8px;
}

.hand-btn {
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 0.9rem;
  font-weight: 700;
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
}

.hand-btn.active {
  background: var(--color-mint);
  border-color: var(--color-mint-dark);
  color: #1A4D3B;
}

.btn-sync {
  padding: 8px 18px;
  border-radius: var(--radius-pill);
  background: var(--color-sky-light);
  border: 1px solid var(--color-sky);
  color: var(--color-sky-dark);
  font-weight: 700;
}

/* Switch Toggle Styling */
.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #CBD5E0;
  transition: 0.2s;
  border-radius: 28px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: var(--color-mint-dark);
}

input:checked + .slider:before {
  transform: translateX(24px);
}
</style>
