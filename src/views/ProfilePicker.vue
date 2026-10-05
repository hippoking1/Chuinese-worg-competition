<template>
  <div class="profile-picker-page">
    <div class="header-section">
      <Mascot size="lg" mood="happy" speech="今天想練習哪一位小達人呢？" />
      <h1 class="page-title">字音字形小達人</h1>
      <p class="page-subtitle">請點選你的頭像開始挑戰！</p>
    </div>

    <!-- Avatar Selection List (1-3 kids) -->
    <div class="profiles-grid">
      <div
        v-for="kid in playerStore.players"
        :key="kid.id"
        class="profile-card card-chunky"
        @click="selectKid(kid)"
      >
        <div class="avatar-circle">
          <span class="avatar-emoji">{{ getAvatarEmoji(kid.avatar) }}</span>
        </div>
        <span class="kid-name">{{ kid.nickname }}</span>
      </div>

      <!-- Add New Kid (if under 3) -->
      <div
        v-if="playerStore.players.length < 3"
        class="profile-card add-card"
        @click="showAddModal = true"
      >
        <div class="avatar-circle add-circle">
          <span class="add-plus">＋</span>
        </div>
        <span class="kid-name">新增小朋友</span>
      </div>
    </div>

    <!-- Parent Section Button & Version -->
    <div class="footer-section">
      <button type="button" class="btn-parent" @click="openParentPin">
        <span>⚙ 家長管理專區</span>
      </button>
      <div class="version-hint-row">
        <span class="version-text">軟體版本：v1.3.0</span>
        <button type="button" class="btn-quick-update" @click="forceUpdateApp" title="強制清除快取更新">
          🔄 檢查更新
        </button>
      </div>
    </div>

    <!-- PIN Modal for Kid -->
    <PinPad
      v-if="kidPendingPin"
      ref="pinPadRef"
      :title="`${kidPendingPin.nickname}，請輸入密碼`"
      subtitle="請輸入 4 位數 PIN 碼 (預設: 1234)"
      @submit="onKidPinSubmit"
      @cancel="kidPendingPin = null"
    />

    <!-- PIN Modal for Parent -->
    <PinPad
      v-if="showParentPin"
      ref="parentPinPadRef"
      title="家長管理專區"
      subtitle="請輸入家長 4 位數 PIN 碼"
      @submit="onParentPinSubmit"
      @cancel="showParentPin = false"
    />

    <!-- Add Kid Modal -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="add-kid-card card-chunky">
        <h3>新增小朋友</h3>
        <div class="form-group">
          <label>暱稱：</label>
          <input v-model="newKidName" placeholder="例如：小明" maxlength="8" class="text-input" />
        </div>
        <div class="form-group">
          <label>選擇代表圖案：</label>
          <div class="avatar-picker-row">
            <button
              v-for="av in ['owl', 'fox', 'bear', 'rabbit']"
              :key="av"
              type="button"
              class="av-select-btn"
              :class="{ selected: newKidAvatar === av }"
              @click="newKidAvatar = av"
            >
              {{ getAvatarEmoji(av) }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>4 位數 PIN 碼：</label>
          <input
            v-model="newKidPin"
            type="password"
            maxlength="4"
            placeholder="4位數字"
            class="text-input"
          />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="showAddModal = false">取消</button>
          <button
            type="button"
            class="btn-confirm btn-primary"
            :disabled="!newKidName || newKidPin.length !== 4"
            @click="submitNewKid"
          >
            建立帳號
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Mascot from '../components/Mascot.vue';
import { usePlayerStore } from '../stores/player';
import type { Player } from '../types';
import PinPad from './PinPad.vue';
import { forceUpdateApp } from '../pwa';

const router = useRouter();
const playerStore = usePlayerStore();

const kidPendingPin = ref<Player | null>(null);
const pinPadRef = ref<any>(null);

const showParentPin = ref(false);
const parentPinPadRef = ref<any>(null);

const showAddModal = ref(false);
const newKidName = ref('');
const newKidAvatar = ref('fox');
const newKidPin = ref('');

function getAvatarEmoji(av: string): string {
  if (av === 'owl') return '🦉';
  if (av === 'fox') return '🦊';
  if (av === 'bear') return '🐻';
  if (av === 'rabbit') return '🐰';
  return '🌟';
}

function selectKid(kid: Player) {
  kidPendingPin.value = kid;
}

async function onKidPinSubmit(pin: string) {
  if (!kidPendingPin.value) return;
  const ok = await playerStore.verifyPin(kidPendingPin.value, pin);
  if (ok) {
    playerStore.selectPlayer(kidPendingPin.value);
    kidPendingPin.value = null;
    router.push('/home');
  } else {
    pinPadRef.value?.triggerError();
  }
}

function openParentPin() {
  showParentPin.value = true;
}

async function onParentPinSubmit(pin: string) {
  const ok = await playerStore.verifyParentPin(pin);
  if (ok) {
    showParentPin.value = false;
    router.push('/parent');
  } else {
    parentPinPadRef.value?.triggerError();
  }
}

async function submitNewKid() {
  if (!newKidName.value || newKidPin.value.length !== 4) return;
  const created = await playerStore.createPlayer(newKidName.value, newKidAvatar.value, newKidPin.value);
  playerStore.selectPlayer(created);
  showAddModal.value = false;
  router.push('/home');
}
</script>

<style scoped>
.profile-picker-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 40px 20px;
  background: radial-gradient(circle at 50% 20%, #FFFDF9 0%, #F5F9F7 100%);
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 2.4rem;
  font-weight: 900;
  color: #1A365D;
}

.page-subtitle {
  margin: 0;
  font-size: 1.15rem;
  color: var(--color-text-muted);
}

.profiles-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 30px 0;
}

.profile-card {
  width: 170px;
  height: 200px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.profile-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}

.avatar-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--color-banana-light);
  border: 3px solid var(--color-banana);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-emoji {
  font-size: 3rem;
}

.kid-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.add-card {
  border: 3px dashed var(--color-border);
  background: transparent;
  box-shadow: none;
}

.add-circle {
  background: var(--color-cream-subtle);
  border: 2px dashed var(--color-border);
}

.add-plus {
  font-size: 2.4rem;
  color: var(--color-text-light);
}

.footer-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.btn-parent {
  background: white;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-muted);
  padding: 8px 22px;
  border-radius: var(--radius-pill);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.version-hint-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.version-text {
  font-weight: 600;
}

.btn-quick-update {
  background: #EEF2FF;
  border: 1px solid #C7D2FE;
  color: #4338CA;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.add-kid-card {
  background: white;
  padding: 28px;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.form-group label {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-text-main);
}

.text-input {
  padding: 10px 14px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
  outline: none;
}

.text-input:focus {
  border-color: var(--color-mint-dark);
}

.avatar-picker-row {
  display: flex;
  gap: 10px;
}

.av-select-btn {
  font-size: 1.8rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-cream-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}

.av-select-btn.selected {
  border-color: var(--color-mint-dark);
  background: var(--color-mint-light);
  transform: scale(1.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.btn-cancel {
  padding: 10px 18px;
  border-radius: var(--radius-md);
  background: var(--color-cream-subtle);
  font-weight: 700;
}

.btn-confirm {
  padding: 10px 20px;
}
</style>
