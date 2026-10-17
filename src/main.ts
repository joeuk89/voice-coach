import './style.css';
import { registerSW } from 'virtual:pwa-register';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app not found');

app.innerHTML = `
  <h1>Voice Trainer</h1>
  <p>Hello world. The real routine is on its way.</p>
  <div class="status" id="status">Checking offline support…</div>
`;

const status = document.querySelector<HTMLDivElement>('#status')!;

registerSW({
  immediate: true,
  onOfflineReady() {
    status.textContent = 'Ready to work offline.';
  },
  onRegisteredSW() {
    if (status.textContent?.startsWith('Checking')) {
      status.textContent = 'Service worker registered.';
    }
  },
  onRegisterError(error) {
    status.textContent = `Service worker failed: ${String(error)}`;
  },
});
