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
          <p class="card-desc">比照全國語文競賽：字音 100 題 ＋ 字形 100 題，限時 10 分鐘，滿分 100 分！</p>
          <div class="card-meta">
            <span>⏱ 10 分鐘</span>
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

      <!-- 3. Range Practice Mode (New!) -->
      <div class="mode-card card-chunky range-card" @click="openRangeModal">
        <div class="card-icon-badge">🎯</div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">題庫範圍練習</h3>
            <span class="mode-tag range-tag">重點加強</span>
          </div>
          <p class="card-desc">自由指定年份、題型（字音/字形）、題號區間（如 1–25 題）專項練習或限時測驗！</p>
          <div class="card-meta">
            <span>📚 自選範圍</span>
            <span>⚡ 順序/亂序</span>
            <span>⏱ 練習/計時</span>
          </div>
        </div>
      </div>

      <!-- 4. Free Practice -->
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

      <!-- 5. Wrong Book -->
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

      <!-- 6. Year Exam -->
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
    </div>

    <!-- Range Exam Modal -->
    <div v-if="showRangeModal" class="modal-overlay" @click.self="showRangeModal = false">
      <div class="modal-card card-chunky range-modal-card">
        <div class="modal-title-row">
          <h3>🎯 題庫範圍練習與測驗</h3>
          <button type="button" class="btn-close-modal" @click="showRangeModal = false">✕</button>
        </div>

        <div class="range-form">
          <!-- 1. 年份選擇 -->
          <div class="form-section">
            <label class="section-label">1. 選擇年度：</label>
            <div class="segmented-control">
              <button
                type="button"
                class="seg-btn"
                :class="{ active: rangeYear === 'all' }"
                @click="rangeYear = 'all'"
              >
                全部年度
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: rangeYear === 114 }"
                @click="rangeYear = 114"
              >
                114 年度
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: rangeYear === 113 }"
                @click="rangeYear = 113"
              >
                113 年度
              </button>
            </div>
          </div>

          <!-- 2. 題型選擇 -->
          <div class="form-section">
            <label class="section-label">2. 選擇題型：</label>
            <div class="segmented-control">
              <button
                type="button"
                class="seg-btn"
                :class="{ active: rangeType === 'all' }"
                @click="rangeType = 'all'"
              >
                全部 (字音＋字形)
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: rangeType === 'sound' }"
                @click="rangeType = 'sound'"
              >
                僅字音 🔊 (鍵盤)
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: rangeType === 'form' }"
                @click="rangeType = 'form'"
              >
                僅字形 ✍️ (手寫)
              </button>
            </div>
          </div>

          <!-- 3. 題號範圍 -->
          <div class="form-section">
            <div class="section-label-row">
              <label class="section-label">3. 題號區間：</label>
              <span class="range-hint">（每份試卷各 100 題）</span>
            </div>
            <!-- Quick Chips -->
            <div class="chips-row">
              <button
                type="button"
                class="chip-btn"
                :class="{ active: rangeStartNo === 1 && rangeEndNo === 25 }"
                @click="setQuickRange(1, 25)"
              >
                1 ~ 25 題
              </button>
              <button
                type="button"
                class="chip-btn"
                :class="{ active: rangeStartNo === 26 && rangeEndNo === 50 }"
                @click="setQuickRange(26, 50)"
              >
                26 ~ 50 題
              </button>
              <button
                type="button"
                class="chip-btn"
                :class="{ active: rangeStartNo === 51 && rangeEndNo === 75 }"
                @click="setQuickRange(51, 75)"
              >
                51 ~ 75 題
              </button>
              <button
                type="button"
                class="chip-btn"
                :class="{ active: rangeStartNo === 76 && rangeEndNo === 100 }"
                @click="setQuickRange(76, 100)"
              >
                76 ~ 100 題
              </button>
              <button
                type="button"
                class="chip-btn"
                :class="{ active: rangeStartNo === 1 && rangeEndNo === 50 }"
                @click="setQuickRange(1, 50)"
              >
                前 50 題
              </button>
              <button
                type="button"
                class="chip-btn"
                :class="{ active: rangeStartNo === 51 && rangeEndNo === 100 }"
                @click="setQuickRange(51, 100)"
              >
                後 50 題
              </button>
              <button
                type="button"
                class="chip-btn"
                :class="{ active: rangeStartNo === 1 && rangeEndNo === 100 }"
                @click="setQuickRange(1, 100)"
              >
                1 ~ 100 全選
              </button>
            </div>

            <!-- Custom Range Inputs -->
            <div class="custom-range-row">
              <span>自訂：從第</span>
              <input
                type="number"
                v-model.number="rangeStartNo"
                min="1"
                max="100"
                class="num-input"
              />
              <span>題 到 第</span>
              <input
                type="number"
                v-model.number="rangeEndNo"
                min="1"
                max="100"
                class="num-input"
              />
              <span>題</span>
            </div>
          </div>

          <!-- 4. 練習題數 -->
          <div class="form-section">
            <div class="section-label-row">
              <label class="section-label">4. 練習題數：</label>
              <span class="range-hint">（此範圍共有 {{ totalInRangeCount }} 題）</span>
            </div>
            <div class="chips-row">
              <button
                type="button"
                class="chip-btn count-chip"
                :class="{ active: rangeCountMode === 'all' }"
                @click="setRangeCountMode('all')"
              >
                全部 ({{ totalInRangeCount }} 題)
              </button>
              <button
                v-if="totalInRangeCount >= 10"
                type="button"
                class="chip-btn count-chip"
                :class="{ active: rangeCountMode === 10 }"
                @click="setRangeCountMode(10)"
              >
                10 題
              </button>
              <button
                v-if="totalInRangeCount >= 20"
                type="button"
                class="chip-btn count-chip"
                :class="{ active: rangeCountMode === 20 }"
                @click="setRangeCountMode(20)"
              >
                20 題
              </button>
              <button
                v-if="totalInRangeCount >= 30"
                type="button"
                class="chip-btn count-chip"
                :class="{ active: rangeCountMode === 30 }"
                @click="setRangeCountMode(30)"
              >
                30 題
              </button>
              <button
                v-if="totalInRangeCount >= 50"
                type="button"
                class="chip-btn count-chip"
                :class="{ active: rangeCountMode === 50 }"
                @click="setRangeCountMode(50)"
              >
                50 題
              </button>
              <button
                type="button"
                class="chip-btn count-chip"
                :class="{ active: rangeCountMode === 'custom' }"
                @click="setRangeCountMode('custom')"
              >
                ✏️ 自訂題數
              </button>
            </div>

            <!-- Custom count input -->
            <div v-if="rangeCountMode === 'custom'" class="custom-range-row">
              <span>自選題數：抽取</span>
              <input
                type="number"
                v-model.number="rangeCustomCount"
                min="1"
                :max="totalInRangeCount"
                class="num-input count-input"
              />
              <span>題（最多 {{ totalInRangeCount }} 題）</span>
            </div>
          </div>

          <!-- 5. 模式與順序 -->
          <div class="form-section form-toggles-row">
            <div class="toggle-col">
              <label class="section-label">題目順序：</label>
              <div class="segmented-control">
                <button
                  type="button"
                  class="seg-btn"
                  :class="{ active: !rangeShuffle }"
                  @click="rangeShuffle = false"
                >
                  依題號順序
                </button>
                <button
                  type="button"
                  class="seg-btn"
                  :class="{ active: rangeShuffle }"
                  @click="rangeShuffle = true"
                >
                  隨機亂序
                </button>
              </div>
            </div>

            <div class="toggle-col">
              <label class="section-label">測驗方式：</label>
              <div class="segmented-control">
                <button
                  type="button"
                  class="seg-btn"
                  :class="{ active: !rangeTimed }"
                  @click="rangeTimed = false"
                >
                  自由練習 (不限時)
                </button>
                <button
                  type="button"
                  class="seg-btn"
                  :class="{ active: rangeTimed }"
                  @click="rangeTimed = true"
                >
                  計時測驗 (限時)
                </button>
              </div>
            </div>
          </div>

          <!-- Summary & Start Button -->
          <div class="range-summary-card">
            <div class="summary-text-col">
              <span>預計練習：<strong class="count-highlight">{{ finalRangeCount }}</strong> 題</span>
              <span class="range-total-note">（範圍總計 {{ totalInRangeCount }} 題）</span>
            </div>
            <span v-if="rangeTimed" class="time-hint">⏱ 限時 {{ Math.max(1, Math.round(finalRangeCount * 3 / 60 * 10) / 10) }} 分鐘</span>
            <span v-else class="time-hint">📖 可隨時看標準答案</span>
          </div>

          <button
            type="button"
            class="btn-chunky btn-primary btn-start-range"
            :disabled="finalRangeCount === 0"
            @click="startRangeExam"
          >
            <span>🚀 開始範圍練習 ({{ finalRangeCount }} 題)</span>
          </button>
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
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import Mascot from '../components/Mascot.vue';
import { buildExamQuestions } from '../lib/examBuilder';
import { useExamStore } from '../stores/exam';
import { usePlayerStore } from '../stores/player';
import { useQuestionsStore } from '../stores/questions';
import type { ExamMode } from '../types';

const router = useRouter();
const playerStore = usePlayerStore();
const examStore = useExamStore();
const qStore = useQuestionsStore();

const showPracticeModal = ref(false);
const showYearModal = ref(false);
const showRangeModal = ref(false);

// Range Mode Configuration
const rangeYear = ref<number | 'all'>('all');
const rangeType = ref<'all' | 'sound' | 'form'>('all');
const rangeStartNo = ref(1);
const rangeEndNo = ref(25);
const rangeShuffle = ref(false);
const rangeTimed = ref(false);

// Configurable question count in range
const rangeCountMode = ref<'all' | 10 | 20 | 30 | 50 | 'custom'>('all');
const rangeCustomCount = ref<number>(20);

function openRangeModal() {
  showRangeModal.value = true;
}

function setQuickRange(start: number, end: number) {
  rangeStartNo.value = start;
  rangeEndNo.value = end;
}

function setRangeCountMode(mode: 'all' | 10 | 20 | 30 | 50 | 'custom') {
  rangeCountMode.value = mode;
  if (mode === 'custom' && (!rangeCustomCount.value || rangeCustomCount.value <= 0)) {
    rangeCustomCount.value = Math.min(20, totalInRangeCount.value || 20);
  }
}

// Total questions matching year, type, and startNo..endNo
const totalInRangeQuestions = computed(() => {
  const start = Math.max(1, Math.min(rangeStartNo.value || 1, rangeEndNo.value || 100));
  const end = Math.min(100, Math.max(rangeStartNo.value || 1, rangeEndNo.value || 100));
  return buildExamQuestions(qStore.questions, 'range', {
    range: {
      year: rangeYear.value,
      type: rangeType.value,
      startNo: start,
      endNo: end
    }
  });
});

const totalInRangeCount = computed(() => totalInRangeQuestions.value.length);

// Final number of questions that will be given in the exam
const finalRangeCount = computed(() => {
  const total = totalInRangeCount.value;
  if (total === 0) return 0;
  if (rangeCountMode.value === 'all') {
    return total;
  }
  let target = 0;
  if (typeof rangeCountMode.value === 'number') {
    target = rangeCountMode.value;
  } else if (rangeCountMode.value === 'custom') {
    target = rangeCustomCount.value || 1;
  }
  return Math.max(1, Math.min(target, total));
});

async function startRangeExam() {
  const start = Math.max(1, Math.min(rangeStartNo.value || 1, rangeEndNo.value || 100));
  const end = Math.min(100, Math.max(rangeStartNo.value || 1, rangeEndNo.value || 100));
  const qCount = rangeCountMode.value === 'all' ? undefined : finalRangeCount.value;
  showRangeModal.value = false;
  await examStore.startExam('range', {
    range: {
      year: rangeYear.value,
      type: rangeType.value,
      startNo: start,
      endNo: end,
      shuffle: rangeShuffle.value,
      timed: rangeTimed.value,
      questionCount: qCount
    }
  });
  router.push('/exam');
}

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

/* Range Card & Modal styles */
.range-card {
  border-top: 6px solid #8B5CF6;
}

.range-card:hover {
  border-color: #7C3AED;
}

.range-tag {
  background: #EDE9FE;
  color: #6D28D9;
}

.range-modal-card {
  max-width: 500px;
  text-align: left;
  max-height: 90vh;
  overflow-y: auto;
  gap: 20px;
}

.modal-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title-row h3 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--color-text-main);
  font-weight: 800;
}

.btn-close-modal {
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 800;
  color: var(--color-text-muted);
}

.range-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-main);
}

.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.range-hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.segmented-control {
  display: flex;
  background: var(--color-cream-subtle);
  padding: 3px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  gap: 3px;
}

.seg-btn {
  flex: 1;
  padding: 8px 10px;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  transition: all 0.15s;
  text-align: center;
}

.seg-btn.active {
  background: white;
  color: var(--color-text-main);
  box-shadow: var(--shadow-sm);
}

.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: var(--radius-pill);
  background: var(--color-cream-subtle);
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  transition: all 0.15s;
}

.chip-btn:hover {
  background: white;
}

.chip-btn.active {
  background: #8B5CF6;
  border-color: #7C3AED;
  color: white;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.count-chip.active {
  background: #0D9488;
  border-color: #0F766E;
  color: white;
  box-shadow: 0 2px 4px rgba(13, 148, 136, 0.3);
}

.custom-range-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-main);
  margin-top: 4px;
}

.num-input {
  width: 60px;
  padding: 6px 8px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 800;
  text-align: center;
  color: var(--color-text-main);
  font-family: inherit;
}

.num-input:focus {
  outline: none;
  border-color: #8B5CF6;
}

.count-input {
  width: 72px;
  border-color: #0D9488;
}

.count-input:focus {
  border-color: #0F766E;
}

.form-toggles-row {
  display: flex;
  gap: 12px;
}

.toggle-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.range-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #F5F3FF;
  border: 1px solid #DDD6FE;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 700;
  color: #5B21B6;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-text-col {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.range-total-note {
  font-size: 0.8rem;
  color: #6D28D9;
  font-weight: 500;
}

.count-highlight {
  font-size: 1.25rem;
  color: #7C3AED;
}

.time-hint {
  font-size: 0.85rem;
  color: #6D28D9;
}

.btn-start-range {
  width: 100%;
  padding: 12px 20px;
  font-size: 1.1rem;
  background: #8B5CF6;
  border-color: #7C3AED;
  color: white;
}

.btn-start-range:hover {
  background: #7C3AED;
}

@media (max-width: 640px) {
  .home-page {
    padding: 10px 10px 30px;
    gap: 12px;
  }

  .home-header {
    padding: 8px 12px;
  }

  .player-info {
    padding: 2px 6px;
    gap: 6px;
  }

  .player-avatar {
    font-size: 1.5rem;
  }

  .player-name {
    font-size: 1rem;
  }

  .tool-circle-btn {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }

  .modes-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .mode-card {
    padding: 12px 14px;
    gap: 12px;
  }

  .card-icon-badge {
    width: 48px;
    height: 48px;
    font-size: 1.8rem;
  }

  .card-title {
    font-size: 1.1rem;
  }

  .card-desc {
    font-size: 0.82rem;
  }

  .range-modal-card {
    padding: 16px 12px;
    gap: 14px;
  }

  .chips-row {
    gap: 4px;
  }

  .chip-btn {
    padding: 4px 8px;
    font-size: 0.78rem;
  }
}
</style>
