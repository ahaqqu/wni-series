import './styles.css';
import { Game } from './game/Game';
import { Hud } from './ui/Hud';

function must<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

const canvas = must<HTMLCanvasElement>('game-canvas');
const game = new Game(canvas);

const hud = new Hud(game, {
  root: must('hud'),
  landing: must('landing'),
  pauseMenu: must('pause-menu'),
  resultMenu: must('result-menu'),
  modeMenu: must('mode-menu'),
  paywall: must('paywall'),
  banner: must('banner'),
});

hud.bind();
game.start();

// Landing kinetic polish: slight parallax on hero title
const title = document.querySelector('.hero-title');
if (title) {
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      (title as HTMLElement).style.transform = `translateY(${y * 0.12}px)`;
    },
    { passive: true },
  );
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.dispose();
  });
}
