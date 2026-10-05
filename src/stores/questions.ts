import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchQuestionsFromCloud } from '../lib/api';
import { getLocalQuestions, saveLocalQuestions } from '../lib/db';
import type { Question } from '../types';

export const useQuestionsStore = defineStore('questions', () => {
  const questions = ref<Question[]>([]);
  const version = ref<string>(localStorage.getItem('quiz_q_version') || '1.0');
  const loaded = ref<boolean>(false);

  async function loadQuestions() {
    // 1. Try local cache first for instant responsiveness
    const cached = await getLocalQuestions();
    if (cached && cached.length > 0) {
      questions.value = cached;
      loaded.value = true;
    }

    // 2. Background check Google Apps Script
    try {
      const cloudRes = await fetchQuestionsFromCloud(version.value);
      if (cloudRes && cloudRes.questions && cloudRes.questions.length > 0) {
        questions.value = cloudRes.questions;
        version.value = cloudRes.version || String(Date.now());
        localStorage.setItem('quiz_q_version', version.value);
        await saveLocalQuestions(questions.value);
        loaded.value = true;
        return;
      }
    } catch (err) {
      console.warn('Could not refresh questions from cloud:', err);
    }

    // 3. Fallback to bundled public/questions.json if still empty
    if (questions.value.length === 0) {
      try {
        const res = await fetch('./questions.json');
        if (res.ok) {
          const list: Question[] = await res.json();
          questions.value = list;
          await saveLocalQuestions(list);
          loaded.value = true;
        }
      } catch (err) {
        console.error('Failed to load bundled questions.json:', err);
      }
    }
  }

  async function syncQuestionsFromCloud(force = false): Promise<{ ok: boolean; count: number; message: string }> {
    try {
      const cloudRes = await fetchQuestionsFromCloud(force ? undefined : version.value);
      if (cloudRes && cloudRes.notModified) {
        return { ok: true, count: questions.value.length, message: '雲端題庫已是最新版本，無需更新。' };
      }
      if (cloudRes && cloudRes.questions && cloudRes.questions.length > 0) {
        questions.value = cloudRes.questions;
        version.value = cloudRes.version || String(Date.now());
        localStorage.setItem('quiz_q_version', version.value);
        await saveLocalQuestions(questions.value);
        loaded.value = true;
        return { ok: true, count: cloudRes.questions.length, message: `成功從 Google 試算表同步 ${cloudRes.questions.length} 道題目！` };
      }
      return { ok: false, count: 0, message: 'Google 試算表 Questions 分頁中尚無題目資料。' };
    } catch (err: any) {
      return { ok: false, count: 0, message: `同步失敗: ${err.message || '網路異常'}` };
    }
  }

  return {
    questions,
    version,
    loaded,
    loadQuestions,
    syncQuestionsFromCloud
  };
});
