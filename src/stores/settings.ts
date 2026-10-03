import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const penOnly = ref<boolean>(localStorage.getItem('quiz_pen_only') !== 'false');
  const soundEnabled = ref<boolean>(localStorage.getItem('quiz_sound') !== 'false');
  const strictMode = ref<boolean>(localStorage.getItem('quiz_strict') === 'true');
  const layoutMode = ref<'single' | 'sheet'>((localStorage.getItem('quiz_layout') as 'single' | 'sheet') || 'single');
  const dominantHand = ref<'right' | 'left'>((localStorage.getItem('quiz_hand') as 'right' | 'left') || 'right');

  watch(penOnly, v => localStorage.setItem('quiz_pen_only', String(v)));
  watch(soundEnabled, v => localStorage.setItem('quiz_sound', String(v)));
  watch(strictMode, v => localStorage.setItem('quiz_strict', String(v)));
  watch(layoutMode, v => localStorage.setItem('quiz_layout', v));
  watch(dominantHand, v => localStorage.setItem('quiz_hand', v));

  return {
    penOnly,
    soundEnabled,
    strictMode,
    layoutMode,
    dominantHand
  };
});
