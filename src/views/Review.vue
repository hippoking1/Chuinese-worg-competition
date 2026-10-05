<template>
  <div class="review-page">
    <header class="review-header">
      <div class="title-col">
        <h2 class="page-title">測驗批改與確認</h2>
        <p class="page-desc">系統已進行自動初判，請點擊按鈕確認或修正對錯判定：</p>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="btn-chunky btn-primary btn-done"
          @click="confirmAndFinish"
        >
          <span>確認成績送出 ➔</span>
        </button>
      </div>
    </header>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: currentFilter === 'all' }"
        @click="currentFilter = 'all'"
      >
        全部 ({{ questions.length }})
      </button>
      <button
        type="button"
        class="tab-btn tab-unsure"
        :class="{ active: currentFilter === 'unsure' }"
        @click="currentFilter = 'unsure'"
      >
        待確認 ❓ ({{ countUnsure }})
      </button>
      <button
        type="button"
        class="tab-btn tab-ng"
        :class="{ active: currentFilter === 'ng' }"
        @click="currentFilter = 'ng'"
      >
        錯誤 ❌ ({{ countNg }})
      </button>
      <button
        type="button"
        class="tab-btn tab-ok"
        :class="{ active: currentFilter === 'ok' }"
        @click="currentFilter = 'ok'"
      >
        正確 ✅ ({{ countOk }})
      </button>
    </div>

    <!-- Review Grid -->
    <div class="review-list">
      <div
        v-for="q in filteredQuestions"
        :key="q.id"
        class="review-item card-chunky"
        :class="getJudgeClass(q.id)"
      >
        <div class="item-top-bar">
          <div class="item-heading">
            <div class="item-meta">
              <span class="item-no">#{{ q.no }}</span>
              <span class="type-tag" :class="q.type">{{ q.type === 'sound' ? '字音' : '字形' }}</span>
              <span v-if="getAnswer(q.id)?.clearedCount" class="cleared-warning" title="曾塗改清除">
                ⚠️ 塗改
              </span>
            </div>

            <!-- Question phrase -->
            <div class="item-context font-kaiti">
              <span
                v-for="(ch, idx) in Array.from(q.context)"
                :key="idx"
                :class="{ 'target-ch': idx === q.target }"
              >
                {{ ch }}
              </span>
            </div>
          </div>

          <!-- Toggle Button -->
          <div class="item-action">
            <button
              type="button"
              class="judge-toggle-btn"
              :class="getJudge(q.id)"
              @click="toggleJudge(q.id)"
            >
              <span v-if="getJudge(q.id) === 'ok'">✅ 正確</span>
              <span v-else-if="getJudge(q.id) === 'ng'">❌ 錯誤</span>
              <span v-else>❓ 待確認</span>
            </button>
          </div>
        </div>

        <div class="item-compare-row">
          <!-- Child's Handwriting Ink Thumbnail or Typed Zhuyin -->
          <div class="compare-block user-input-block">
            <span class="ans-label">小朋友作答</span>
            <div v-if="q.type === 'form'" class="ink-preview-box" @click="openReplay(q.id)">
              <img
                v-if="getThumbnail(q.id)"
                :src="getThumbnail(q.id)"
                class="ink-thumb"
                alt="小朋友筆跡"
              />
              <span v-else class="no-ink">未作答</span>
              <span class="thumb-hint">🔍 筆順</span>
            </div>
            <div v-else class="typed-zhuyin-box font-kaiti">
              <span class="typed-val" :class="{ 'no-ans': !getAnswer(q.id)?.userZhuyin }">
                {{ getAnswer(q.id)?.userZhuyin || '未作答' }}
              </span>
              <span class="type-hint">⌨️ 鍵盤</span>
            </div>
          </div>

          <!-- Form AI recognition result -->
          <div v-if="q.type === 'form'" class="compare-block recognized-cand">
            <span class="ans-label">AI 辨識</span>
            <span class="cand-text font-kaiti">{{ getAnswer(q.id)?.userChar || '—' }}</span>
          </div>

          <div class="compare-divider">➜</div>

          <!-- Standard Answer -->
          <div class="compare-block standard-answer font-kaiti">
            <span class="ans-label">標準答案</span>
            <span class="ans-text">{{ q.type === 'sound' ? q.zhuyin : q.char }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stroke Replay Modal -->
    <div v-if="replayInk" class="modal-overlay" @click.self="replayInk = null">
      <div class="replay-card card-chunky">
        <h3>筆順與手寫重播</h3>
        <InkReplay :ink="replayInk" />
        <button type="button" class="btn-cancel" @click="replayInk = null">關閉</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import InkReplay from '../components/InkReplay.vue';
import { inkToThumbnail } from '../lib/ink';
import { useExamStore } from '../stores/exam';
import type { JudgeResult, Question } from '../types';

const router = useRouter();
const examStore = useExamStore();

const currentFilter = ref<'all' | 'unsure' | 'ng' | 'ok'>('all');
const replayInk = ref<any>(null);

const questions = computed(() => examStore.currentExam);

function getAnswer(qId: string) {
  return examStore.answers[qId];
}

function getJudge(qId: string): JudgeResult {
  return examStore.answers[qId]?.finalJudge || 'unsure';
}

function getJudgeClass(qId: string) {
  const j = getJudge(qId);
  return {
    'item-ok': j === 'ok',
    'item-ng': j === 'ng',
    'item-unsure': j === 'unsure'
  };
}

const countOk = computed(() => questions.value.filter(q => getJudge(q.id) === 'ok').length);
const countNg = computed(() => questions.value.filter(q => getJudge(q.id) === 'ng').length);
const countUnsure = computed(() => questions.value.filter(q => getJudge(q.id) === 'unsure').length);

const filteredQuestions = computed(() => {
  if (currentFilter.value === 'all') return questions.value;
  return questions.value.filter(q => getJudge(q.id) === currentFilter.value);
});

// Cache thumbnails in memory
const thumbnailMap: Record<string, string> = {};
function getThumbnail(qId: string): string {
  if (thumbnailMap[qId]) return thumbnailMap[qId];
  const ans = getAnswer(qId);
  if (!ans || !ans.userInk || ans.userInk.length === 0) return '';
  const url = inkToThumbnail(ans.userInk, 80, 80);
  thumbnailMap[qId] = url;
  return url;
}

function toggleJudge(qId: string) {
  examStore.toggleJudge(qId);
}

function openReplay(qId: string) {
  const ans = getAnswer(qId);
  if (ans && ans.userInk && ans.userInk.length > 0) {
    replayInk.value = ans.userInk;
  }
}

async function confirmAndFinish() {
  try {
    await examStore.finishExam();
  } catch (err) {
    console.error('Failed to confirm and finish exam:', err);
  } finally {
    router.push('/result');
  }
}
</script>

<style scoped>
.review-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 22px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  gap: 16px;
}

.title-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.page-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.btn-done {
  padding: 10px 22px;
  font-size: 1rem;
  white-space: nowrap;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  width: 100%;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 0.9rem;
  background: white;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  transition: all 0.15s;
}

.tab-btn.active {
  background: var(--color-mint);
  border-color: var(--color-mint-dark);
  color: #1A4D3B;
}

.tab-unsure.active {
  background: var(--color-banana);
  border-color: var(--color-banana-dark);
  color: #5A4300;
}

.tab-ng.active {
  background: var(--color-coral);
  border-color: var(--color-coral-dark);
  color: white;
}

.tab-ok.active {
  background: var(--color-mint);
  border-color: var(--color-mint-dark);
  color: #1A4D3B;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.review-item {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: white;
  box-sizing: border-box;
  width: 100%;
}

.item-ok { border-left: 6px solid var(--color-ok); }
.item-ng { border-left: 6px solid var(--color-ng); }
.item-unsure { border-left: 6px solid var(--color-unsure); }

.item-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #F1F5F9;
}

.item-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.item-no {
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-text-main);
}

.type-tag {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
}

.type-tag.sound { background: var(--color-sky-light); color: var(--color-sky-dark); }
.type-tag.form { background: var(--color-mint-light); color: var(--color-mint-dark); }

.cleared-warning {
  font-size: 0.72rem;
  color: var(--color-coral-dark);
  font-weight: 700;
  background: var(--color-coral-light);
  padding: 1px 4px;
  border-radius: 4px;
}

.item-context {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.target-ch {
  background: var(--color-banana-light);
  color: #B45309;
  padding: 0 4px;
  border-radius: 4px;
}

.item-action {
  flex-shrink: 0;
}

.judge-toggle-btn {
  padding: 7px 16px;
  border-radius: var(--radius-pill);
  font-size: 0.95rem;
  font-weight: 800;
  border: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.1s;
}

.judge-toggle-btn:active {
  transform: scale(0.96);
}

.judge-toggle-btn.ok {
  background: var(--color-ok-bg);
  border-color: var(--color-ok);
  color: var(--color-ok);
}

.judge-toggle-btn.ng {
  background: var(--color-ng-bg);
  border-color: var(--color-ng);
  color: var(--color-ng);
}

.judge-toggle-btn.unsure {
  background: var(--color-unsure-bg);
  border-color: var(--color-unsure);
  color: var(--color-unsure);
}

/* Compare Row */
.item-compare-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 18px;
  width: 100%;
  flex-wrap: wrap;
}

.compare-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.compare-divider {
  font-size: 1.2rem;
  color: #94A3B8;
  font-weight: 900;
}

.ans-label {
  font-size: 0.72rem;
  color: var(--color-text-light);
  font-weight: 600;
}

.ink-preview-box {
  width: 58px;
  height: 58px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #FFFDF9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.typed-zhuyin-box {
  width: 68px;
  height: 58px;
  border: 1.5px solid #BAE6FD;
  border-radius: var(--radius-sm);
  background: #F0F9FF;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.typed-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0369A1;
  text-align: center;
  line-height: 1.1;
}

.typed-val.no-ans {
  font-size: 0.75rem;
  color: var(--color-text-light);
  font-family: var(--font-ui);
}

.type-hint {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(3, 105, 161, 0.75);
  color: white;
  font-size: 0.55rem;
  padding: 1px 3px;
  border-top-left-radius: 3px;
  font-family: var(--font-ui);
}

.ink-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.no-ink {
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.thumb-hint {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.65rem;
  padding: 1px 4px;
  border-top-left-radius: 4px;
}

.ans-text {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-mint-dark);
  line-height: 1.1;
}

.cand-text {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-text-main);
  line-height: 1.1;
}

/* Modal */
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

.replay-card {
  background: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 320px;
  width: 100%;
}

.btn-cancel {
  padding: 6px 16px;
  border-radius: var(--radius-md);
  background: var(--color-cream-subtle);
  font-weight: 700;
}

/* Mobile Media Query */
@media (max-width: 640px) {
  .review-page {
    padding: 10px 10px 30px;
    gap: 10px;
  }

  .review-header {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 14px;
    gap: 10px;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .page-desc {
    font-size: 0.82rem;
  }

  .btn-done {
    width: 100%;
    text-align: center;
    justify-content: center;
    padding: 10px 14px;
  }

  .filter-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  .tab-btn {
    padding: 6px 2px;
    font-size: 0.75rem;
    border-radius: 6px;
    white-space: normal;
    line-height: 1.2;
  }

  .review-item {
    padding: 10px 12px;
    gap: 8px;
  }

  .item-top-bar {
    gap: 8px;
    padding-bottom: 6px;
  }

  .item-heading {
    gap: 8px;
  }

  .item-context {
    font-size: 1.25rem;
    letter-spacing: 1px;
  }

  .judge-toggle-btn {
    padding: 5px 10px;
    font-size: 0.85rem;
  }

  .item-compare-row {
    gap: 12px;
  }

  .ans-text {
    font-size: 1.35rem;
  }

  .cand-text {
    font-size: 1.2rem;
  }
}
</style>
