const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   Header, mobile menu, scroll state
   -------------------------------------------------------------------------- */
const header = document.querySelector<HTMLElement>('[data-header]');
const menuToggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');

const setScrolled = () => {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 24);
};
setScrolled();
window.addEventListener('scroll', setScrolled, { passive: true });

if (header && menuToggle) {
  const firstMenuLink = header.querySelector<HTMLAnchorElement>('.site-nav a');
  const closeMenu = (restoreFocus = false) => {
    header.classList.remove('is-menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Buka menu');
    if (restoreFocus) menuToggle.focus();
  };
  menuToggle.addEventListener('click', () => {
    const open = !header.classList.contains('is-menu-open');
    header.classList.toggle('is-menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    if (open) {
      // The nav precedes the toggle in DOM order; move keyboard focus into it.
      window.setTimeout(() => firstMenuLink?.focus(), 30);
    }
  });
  header.querySelectorAll<HTMLAnchorElement>('.site-nav a').forEach((link) => {
    link.addEventListener('click', () => closeMenu(true));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu(true);
  });
}

/* --------------------------------------------------------------------------
   Reveal on scroll
   -------------------------------------------------------------------------- */
const revealNodes = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
if (reduceMotion) {
  revealNodes.forEach((node) => node.classList.add('is-inview'));
} else if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-inview');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('is-inview'));
}

/* --------------------------------------------------------------------------
   Ticker: only animate while it is near the viewport
   -------------------------------------------------------------------------- */
const ticker = document.querySelector<HTMLElement>('.joke-ticker');
if (ticker && !reduceMotion) {
  if ('IntersectionObserver' in window) {
    const tickerObserver = new IntersectionObserver(
      ([entry]) => ticker.classList.toggle('is-active', Boolean(entry?.isIntersecting)),
      { rootMargin: '120px 0px' },
    );
    tickerObserver.observe(ticker);
  } else {
    ticker.classList.add('is-active');
  }
}

/* --------------------------------------------------------------------------
   Subtle pointer tilt (desktop only)
   -------------------------------------------------------------------------- */
if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 2.4).toFixed(2)}deg) rotateY(${(x * 2.4).toFixed(2)}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

/* --------------------------------------------------------------------------
   Morning strip
   -------------------------------------------------------------------------- */
const morningItems = [...document.querySelectorAll<HTMLElement>('[data-morning-strip] li')];
if (morningItems.length > 0) {
  let index = 0;
  morningItems[0]?.classList.add('is-active');
  if (!reduceMotion) {
    window.setInterval(() => {
      morningItems[index]?.classList.remove('is-active');
      index = (index + 1) % morningItems.length;
      morningItems[index]?.classList.add('is-active');
    }, 2800);
  }
}

/* --------------------------------------------------------------------------
   Mode tabs
   -------------------------------------------------------------------------- */
const modeTabs = [...document.querySelectorAll<HTMLButtonElement>('[data-mode-tab]')];
const modePanels = [...document.querySelectorAll<HTMLElement>('[data-mode-panel]')];
const modeImages = [...document.querySelectorAll<HTMLElement>('[data-mode-image]')];
const captionTitle = document.querySelector<HTMLElement>('[data-mode-caption-title]');
const captionSub = document.querySelector<HTMLElement>('[data-mode-caption-sub]');
const modeIndex = document.querySelector<HTMLElement>('[data-mode-index]');

const modeCopy: Record<string, { title: string; sub: string; index: string }> = {
  motor: {
    title: 'Selip. Rem. Gas. Ulang.',
    sub: 'Baca celah. Hindari angkot. Jangan masuk busway.',
    index: '01 / 03',
  },
  krl: {
    title: 'Berdesakan. Tapi semua mau sampai.',
    sub: 'Pintu, pegangan, kursi, transfer. Kadang cuma berdiri.',
    index: '02 / 03',
  },
  multimodal: {
    title: 'Satu pagi, tiga ritme.',
    sub: 'Motor ke stasiun, KRL ke kota, jalan kaki ke kantor.',
    index: '03 / 03',
  },
};

const setMode = (mode: string) => {
  for (const tab of modeTabs) {
    const active = tab.dataset.modeTab === mode;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  for (const panel of modePanels) {
    panel.hidden = panel.dataset.modePanel !== mode;
  }
  for (const image of modeImages) {
    image.classList.toggle('is-active', image.dataset.modeImage === mode);
  }
  const copy = modeCopy[mode] ?? modeCopy.motor;
  if (copy) {
    if (captionTitle) captionTitle.textContent = copy.title;
    if (captionSub) captionSub.textContent = copy.sub;
    if (modeIndex) modeIndex.textContent = copy.index;
  }
};

for (const tab of modeTabs) {
  tab.addEventListener('click', () => setMode(tab.dataset.modeTab ?? 'motor'));
  tab.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const current = modeTabs.indexOf(tab);
    const next =
      event.key === 'ArrowRight'
        ? (current + 1) % modeTabs.length
        : (current - 1 + modeTabs.length) % modeTabs.length;
    const target = modeTabs[next];
    if (target) {
      target.focus();
      setMode(target.dataset.modeTab ?? 'motor');
    }
  });
}

/* --------------------------------------------------------------------------
   Route map tooltip
   -------------------------------------------------------------------------- */
const stationButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-station]')];
const mapTooltip = document.querySelector<HTMLElement>('[data-map-tooltip]');
const tooltipName = document.querySelector<HTMLElement>('[data-tooltip-name]');
const tooltipCode = document.querySelector<HTMLElement>('[data-tooltip-code]');
const tooltipNote = document.querySelector<HTMLElement>('[data-tooltip-note]');

const showStation = (button: HTMLButtonElement) => {
  stationButtons.forEach((item) => item.classList.toggle('is-active', item === button));
  if (!mapTooltip) return;
  if (tooltipName) tooltipName.textContent = button.dataset.name ?? '';
  if (tooltipCode) tooltipCode.textContent = button.dataset.code ?? '';
  if (tooltipNote) tooltipNote.textContent = button.dataset.note ?? '';
  mapTooltip.classList.add('is-visible');
};

if (mapTooltip) {
  for (const button of stationButtons) {
    button.addEventListener('mouseenter', () => showStation(button));
    button.addEventListener('focus', () => showStation(button));
    button.addEventListener('click', () => showStation(button));
  }
  const defaultStation = stationButtons[0];
  if (defaultStation && window.matchMedia('(pointer: fine)').matches && window.innerWidth > 700) {
    showStation(defaultStation);
  }
}

/* --------------------------------------------------------------------------
   Waitlist
   -------------------------------------------------------------------------- */
const waitlistForm = document.querySelector<HTMLFormElement>('[data-waitlist-form]');
const waitlistStatus = document.querySelector<HTMLElement>('[data-form-status]');
const waitlistSubmit = document.querySelector<HTMLButtonElement>('[data-waitlist-submit]');

const setStatus = (message: string, state: 'error' | 'success' | 'idle' = 'idle') => {
  if (!waitlistStatus) return;
  waitlistStatus.textContent = message;
  waitlistStatus.classList.toggle('is-error', state === 'error');
  waitlistStatus.classList.toggle('is-success', state === 'success');
};

if (waitlistForm) {
  waitlistForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(waitlistForm);
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();
    const consent = formData.get('consent') === 'on';
    const website = String(formData.get('website') ?? '');

    if (website) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('Email-nya belum benar. Coba cek lagi.', 'error');
      return;
    }
    if (!consent) {
      setStatus('Centang persetujuan dulu, ya.', 'error');
      return;
    }

    if (waitlistSubmit) {
      waitlistSubmit.disabled = true;
      waitlistSubmit.textContent = 'Mengirim…';
    }
    setStatus('Mengirim…');

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent: true, source: 'landing-prealpha', website }),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setStatus('Siap. Kami kabari saat build awal bisa dicoba. Terima kasih.', 'success');
      waitlistForm.reset();
      if (waitlistSubmit) waitlistSubmit.textContent = 'Terdaftar';
    } catch {
      window.clearTimeout(timeout);
      setStatus(
        'Belum tersambung. Kirim email ke wniseries@gmail.com dengan subjek “Daftar tunggu” — kami simpan manual.',
        'error',
      );
      if (waitlistSubmit) {
        waitlistSubmit.disabled = false;
        waitlistSubmit.textContent = 'Coba lagi';
      }
    }
  });
}

/* --------------------------------------------------------------------------
   Lazy route map (keeps the 150 KB SVG out of the initial HTML)
   -------------------------------------------------------------------------- */
const mapSlot = document.querySelector<HTMLElement>('[data-map-svg]');
if (mapSlot) {
  let mapLoaded = false;
  const loadMap = async () => {
    if (mapLoaded) return;
    mapLoaded = true;
    try {
      const response = await fetch('/images/route-map.svg', { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      mapSlot.innerHTML = await response.text();
      mapSlot.classList.add('is-loaded');
    } catch {
      mapLoaded = false;
    }
  };
  if ('IntersectionObserver' in window) {
    const mapObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        mapObserver.disconnect();
        void loadMap();
      },
      { rootMargin: '500px 0px' },
    );
    mapObserver.observe(mapSlot);
  } else {
    void loadMap();
  }
}
