<template>
  <div class="home-page">
    <!-- Top Navigation Bar -->
    <header class="home-header">
      <div class="player-info" @click="router.push('/profiles')">
        <span class="player-avatar">{{ getAvatarEmoji(playerStore.currentPlayer?.avatar || 'owl') }}</span>
        <span class="player-name">{{ playerStore.currentPlayer?.nickname || '小達人' }}</span>
        <span class="switch-hint">切換 ▾</span>
      </div>

      <div class="header-tools">
        <button type="button" class="tool-circle-btn" @click="router.push('/wrong')" title="錯題本">
          <span>📕</span>
        </button>
        <button type="button" class="tool-circle-btn" @click="router.push('/history')" title="測驗紀錄">
          <span>📊</span>
        </button>
        <button type="button" class="tool-circle-btn" @click="router.push('/settings')" title="設定">
          <span>⚙</span>
        </button>
      </div>
    </header>

    <!-- Hero Mascot Greeting -->
    <div class="hero-section">
      <Mascot size="md" mood="happy" speech="準備好大顯身手了嗎？今天想做什麼挑戰呢？" />
    </div>

    <!-- Mode Cards Grid -->
    <div class="modes-grid">
      <!-- 1. Official Competition Simulation -->
      <div class="mode-card card-chunky official-card" @click="startMode('official')">
        <div class="card-icon-badge">🏆</div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">全國競賽正式模擬</h3>
            <span class="mode-tag official-tag">競賽規格</span>
          </div>
          <p class="card-desc">比照全國語文競賽：字音 100 題 ＋ 字形 100 題，限時 20 分鐘，滿分 100 分！</p>
          <div class="card-meta">
            <span>⏱ 20 分鐘</span>
            <span>📝 200 題</span>
            <span>🎯 0.5 分/字</span>
          </div>
        </div>
      </div>

      <!-- 2. Mini Challenge -->
      <div class="mode-card card-chunky mini-card" @click="startMode('mini')">
        <div class="card-icon-badge">⚡</div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">每日迷你挑戰</h3>
            <span class="mode-tag mini-tag">每日必練</span>
          </div>
          <p class="card-desc">字音 25 題 ＋ 字形 25 題，限時 5 分鐘，快速練速度與手感！</p>
          <div class="card-meta">
            <span>⏱ 5 分鐘</span>
            <span>📝 50 題</span>
          </div>
        </div>
      </div>

      <!-- 3. Free Practice -->
      <div class="mode-card card-chunky practice-card" @click="openPracticeModal">
        <div class="card-icon-badge">📖</div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">自由練習模式</h3>
            <span class="mode-tag practice-tag">無壓力</span>
          </div>
          <p class="card-desc">自選題數，不限時間，寫完每題可立即對答案與複習！</p>
          <div class="card-meta">
            <span>⏱ 不限時</span>
            <span>📝 10 / 20 / 50 題</span>
          </div>
        </div>
      </div>

      <!-- 4. Wrong Book -->
      <div class="mode-card card-chunky wrong-card" @click="router.push('/wrong')">
        <div class="card-icon-badge">📕</div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">錯題反覆本</h3>
            <span class="mode-tag wrong-tag">弱點強化</span>
          </div>
          <p class="card-desc">集中攻克常寫錯的字詞，連續答對 3 次才能光榮畢業！</p>
        </div>
      </div>

      <!-- 5. Year Exam -->
      <div class="mode-card card-chunky year-card" @click="openYearModal">
        <div class="card-icon-badge">📜</div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">歷屆試卷整卷練</h3>
            <span class="mode-tag year-tag">題庫原卷</span>
          </div>
          <p class="card-desc">114 年與 113 年全國語文競賽完整試卷（各 100 題）。</p>
        </div>
      </div>

      <!-- 6. Stylus Calibration -->
      <div class="mode-card card-chunky calibrate-card" @click="router.push('/calibrate')">
        <div class="card-icon-badge">🎯</div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">注音個人化校正</h3>
            <span class="mode-tag calibrate-tag">觸控筆專屬</span>
          </div>
          <p class="card-desc">親手書寫 37 個注音符號建立專屬字跡模板，大幅提升平板手寫辨識率！</p>
        </div>
      </div>
    </div>

    <!-- Practice Count Modal -->
    <div v-if="showPracticeModal" class="modal-overlay">
      <div class="modal-card card-chunky">
        <h3>選擇練習題數</h3>
        <div class="btn-group-row">
          <button type="button" class="btn-chunky btn-sky" @click="startPractice(10)">10 題</button>
          <button type="button" class="btn-chunky btn-sky" @click="startPractice(20)">20 題</button>
          <button type="button" class="btn-chunky btn-sky" @click="startPractice(50)">50 題</button>
        </div>
        <button type="button" class="btn-cancel" @click="showPracticeModal = false">取消</button>
      </div>
    </div>

    <!-- Year Exam Selection Modal -->
    <div v-if="showYearModal" class="modal-overlay">
      <div class="modal-card card-chunky">
        <h3>選擇歷屆試題</h3>
        <div class="year-btn-grid">
          <button type="button" class="btn-chunky btn-mint" @click="startYearExam(114, 'sound')">
            114 年 字音（100 題）
          </button>
          <button type="button" class="btn-chunky btn-mint" @click="startYearExam(114, 'form')">
            114 年 字形（100 題）
          </button>
          <button type="button" class="btn-chunky btn-mint" @click="startYearExam(113, 'sound')">
            113 年 字音（100 題）
          </button>
          <button type="button" class="btn-chunky btn-mint" @click="startYearExam(113, 'form')">
            113 年 字形（100 題）
          </button>
        </div>
        <button type="button" class="btn-cancel" @click="showYearModal = false">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Mascot from '../components/Mascot.vue';
import { useExamStore } from '../stores/exam';
import { usePlayerStore } from '../stores/player';
import type { ExamMode } from '../types';

const router = useRouter();
const playerStore = usePlayerStore();
const examStore = useExamStore();

const showPracticeModal = ref(false);
const showYearModal = ref(false);

function getAvatarEmoji(av: string): string {
  if (av === 'owl') return '🦉';
  if (av === 'fox') return '🦊';
  if (av === 'bear') return '🐻';
  if (av === 'rabbit') return '🐰';
  return '🌟';
}

async function startMode(mode: ExamMode) {
  await examStore.startExam(mode);
  router.push('/exam');
}

function openPracticeModal() {
  showPracticeModal.value = true;
}

async function startPractice(count: number) {
  showPracticeModal.value = false;
  await examStore.startExam('practice', { practiceCount: count });
  router.push('/exam');
}

function openYearModal() {
  showYearModal.value = true;
}

async function startYearExam(year: number, type: 'sound' | 'form') {
  showYearModal.value = false;
  await examStore.startExam('year', { year, yearType: type });
  router.push('/exam');
}
</script>

<style scoped>
.home-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px 20px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  transition: background 0.15s;
}

.player-info:hover {
  background: var(--color-cream-subtle);
}

.player-avatar {
  font-size: 1.8rem;
}

.player-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.switch-hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.header-tools {
  display: flex;
  gap: 10px;
}

.tool-circle-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.hero-section {
  display: flex;
  justify-content: center;
  margin: 4px 0;
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
}

.mode-card {
  padding: 20px;
  display: flex;
  gap: 16px;
  cursor: pointer;
  background: white;
  transition: transform 0.15s, box-shadow 0.15s;
}

.mode-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card-icon-badge {
  font-size: 2.4rem;
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  background: var(--color-cream-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.mode-tag {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
}

.official-tag { background: #FEEBC8; color: #C05621; }
.mini-tag { background: #FEFCBF; color: #975A16; }
.practice-tag { background: #EBF8FF; color: #2B6CB0; }
.wrong-tag { background: #FED7D7; color: #9B2C2C; }
.year-tag { background: #E6FFFA; color: #234E52; }
.calibrate-tag { background: #FAF5FF; color: #553C9A; }

.card-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.card-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-mint-dark);
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

.modal-card {
  background: white;
  padding: 24px;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: center;
}

.btn-group-row {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.year-btn-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-cancel {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  background: var(--color-cream-subtle);
  font-weight: 700;
  align-self: center;
}
</style>
