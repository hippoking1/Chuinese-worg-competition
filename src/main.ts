import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { setupPWA } from './pwa';
import { router } from './router';
import './styles/base.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount('#app');

// Start PWA background auto-updater
setupPWA();

