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

        <!-- Child's Handwriting Ink Thumbnail -->
        <div class="ink-preview-box" @click="openReplay(q.id)">
          <img
            v-if="getThumbnail(q.id)"
            :src="getThumbnail(q.id)"
            class="ink-thumb"
            alt="小朋友筆跡"
          />
          <span v-else class="no-ink">未作答</span>
          <span class="thumb-hint">🔍 筆順</span>
        </div>

        <!-- Standard Answer -->
        <div class="standard-answer font-kaiti">
          <span class="ans-label">標準答案</span>
          <span class="ans-text">{{ q.type === 'sound' ? q.zhuyin : q.char }}</span>
        </div>

        <!-- Recognized Preview -->
        <div class="recognized-cand">
          <span class="ans-label">自動辨識</span>
          <span class="cand-text">{{ getAnswer(q.id)?.userZhuyin || getAnswer(q.id)?.userChar || '—' }}</span>
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
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.page-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.page-desc {
  margin: 4px 0 0;
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.btn-done {
  padding: 10px 24px;
  font-size: 1.1rem;
}

.filter-tabs {
  display: flex;
  gap: 10px;
}

.tab-btn {
  padding: 8px 18px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 0.95rem;
  background: white;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
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
}

.review-item {
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  transition: all 0.15s;
}

.item-ok { border-left: 6px solid var(--color-ok); }
.item-ng { border-left: 6px solid var(--color-ng); }
.item-unsure { border-left: 6px solid var(--color-unsure); }

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 60px;
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
  font-size: 0.75rem;
  color: var(--color-coral-dark);
  font-weight: 700;
}

.item-context {
  font-size: 1.8rem;
  font-weight: 700;
  flex: 1.2;
}

.target-ch {
  background: var(--color-banana-light);
  color: #B45309;
  padding: 0 4px;
  border-radius: 4px;
}

.ink-preview-box {
  width: 70px;
  height: 70px;
  border: 1px solid var(--color-border);
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

.standard-answer, .recognized-cand {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
}

.ans-label {
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.ans-text {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-mint-dark);
}

.cand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-main);
}

.judge-toggle-btn {
  padding: 8px 18px;
  border-radius: var(--radius-pill);
  font-size: 1rem;
  font-weight: 800;
  border: 2px solid transparent;
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

.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.replay-card {
  background: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.btn-cancel {
  padding: 6px 16px;
  border-radius: var(--radius-md);
  background: var(--color-cream-subtle);
  font-weight: 700;
}
</style>
