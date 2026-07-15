document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');
  const overlay = document.getElementById('game-overlay');
  const scoreEl = document.getElementById('score');
  const bestScoreEl = document.getElementById('best-score');
  const statusEl = document.getElementById('game-status');
  const canvas = document.getElementById('snake-canvas');
  const startButton = document.getElementById('start-button');
  const pauseButton = document.getElementById('pause-button');
  const restartButton = document.getElementById('restart-button');
  const controlButtons = document.querySelectorAll('[data-direction]');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    siteNav.addEventListener('click', (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        siteNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (window.SnakeGame && canvas && scoreEl && bestScoreEl && statusEl && overlay && startButton && pauseButton && restartButton) {
    window.snakeGame = new window.SnakeGame({
      canvas,
      scoreEl,
      bestScoreEl,
      statusEl,
      overlayEl: overlay,
      startButton,
      pauseButton,
      restartButton,
      controlButtons,
    });
  }
});
