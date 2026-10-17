import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { renderDone } from './screens/done';
import { renderGuided } from './screens/guided';
import { renderHome } from './screens/home';
import { renderSettings } from './screens/settings';

type Route = 'home' | 'guided' | 'done' | 'settings';
type Screen = (root: HTMLElement) => () => void;

const screens: Record<Route, Screen> = {
  home: renderHome,
  guided: renderGuided,
  done: renderDone,
  settings: renderSettings,
};

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app not found');

function routeFromHash(): Route {
  switch (location.hash) {
    case '#/go':
      return 'guided';
    case '#/done':
      return 'done';
    case '#/settings':
      return 'settings';
    default:
      return 'home';
  }
}

/** Taking an update reloads the page, which would throw away a routine in progress. */
function isBusy(route: Route): boolean {
  return route === 'guided' || route === 'done';
}

let updateWaiting = false;
let reloadPending = false;

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateWaiting = true;
    applyUpdateIfIdle();
  },
  onNeedReload() {
    if (isBusy(routeFromHash())) reloadPending = true;
    else location.reload();
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update().catch(() => undefined);
    });
  },
});

function applyUpdateIfIdle() {
  if (!updateWaiting || isBusy(routeFromHash())) return;
  updateWaiting = false;
  void updateSW(true);
}

let cleanup: (() => void) | undefined;

function render() {
  const route = routeFromHash();
  if (reloadPending && !isBusy(route)) {
    location.reload();
    return;
  }
  cleanup?.();
  app!.dataset['route'] = route;
  app!.innerHTML = '';
  cleanup = screens[route](app!);
  window.scrollTo(0, 0);
  applyUpdateIfIdle();
}

window.addEventListener('hashchange', render);
render();
