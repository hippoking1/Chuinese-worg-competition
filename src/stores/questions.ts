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

  return {
    questions,
    version,
    loaded,
    loadQuestions
  };
});
