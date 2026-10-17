import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { renderDone } from './screens/done';
import { renderGuided } from './screens/guided';
import { renderHome } from './screens/home';
import { renderLibrary } from './screens/library';
import { isLibraryHash } from './screens/library/helpers';
import { renderSettings } from './screens/settings';
import { playEntrance } from './lib/dom';

type Route = 'home' | 'guided' | 'done' | 'settings' | 'library';
type Screen = (root: HTMLElement) => () => void;

const screens: Record<Route, Screen> = {
  home: renderHome,
  guided: renderGuided,
  done: renderDone,
  settings: renderSettings,
  library: renderLibrary,
};

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app not found');

const routes = new Map<string, Route>([
  ['', 'home'],
  ['#/', 'home'],
  ['#/go', 'guided'],
  ['#/done', 'done'],
  ['#/settings', 'settings'],
]);

function routeFromHash(): Route {
  if (isLibraryHash(location.hash)) return 'library';
  return routes.get(location.hash) ?? 'home';
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
let firstRender = true;

function render() {
  if (!routes.has(location.hash) && !isLibraryHash(location.hash)) {
    location.replace('#/');
    return;
  }
  const route = routeFromHash();
  if (reloadPending && !isBusy(route)) {
    location.reload();
    return;
  }
  cleanup?.();
  app!.dataset['route'] = route;
  app!.innerHTML = '';
  cleanup = screens[route](app!);
  if (!firstRender) playEntrance(app!);
  firstRender = false;
  window.scrollTo(0, 0);
  app!.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  applyUpdateIfIdle();
}

window.addEventListener('hashchange', render);
render();
