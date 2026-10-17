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

let cleanup: (() => void) | undefined;

function render() {
  cleanup?.();
  const route = routeFromHash();
  app!.dataset['route'] = route;
  app!.innerHTML = '';
  cleanup = screens[route](app!);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();

registerSW({ immediate: true });
