import { ref } from 'vue';
import { registerSW } from 'virtual:pwa-register';

export const pwaUpdating = ref(false);

export async function forceUpdateApp(): Promise<void> {
  pwaUpdating.value = true;
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
  } catch (err) {
    console.warn('[PWA] Error clearing caches:', err);
  }

  const baseUrl = window.location.href.split('#')[0].split('?')[0];
  const targetUrl = `${baseUrl}?v=${Date.now()}${window.location.hash || ''}`;
  window.location.replace(targetUrl);
}

export function setupPWA() {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] New version ready, updating immediately...');
      pwaUpdating.value = true;
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[PWA] App is ready for offline use.');
    },
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service Worker registered:', swUrl);
      if (registration) {
        // Check for updates every 10 minutes
        setInterval(() => {
          registration.update().catch(() => {});
        }, 10 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] Service worker registration error:', error);
    }
  });

  // Whenever user returns to the app (unlocks phone, switches back from other app)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker?.getRegistration().then(reg => {
        if (reg) {
          reg.update().catch(() => {});
        }
      });
    }
  });

  // When a new service worker takes over, reload to apply the latest version seamlessly
  let refreshing = false;
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    pwaUpdating.value = true;
    console.log('[PWA] New version activated, reloading...');
    window.location.reload();
  });
}
