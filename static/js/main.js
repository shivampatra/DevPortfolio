/**
 * main.js — portfolio front-end behaviour
 *
 * Every feature is its own function and runs inside try/catch, so one missing
 * element can never stop the others (previously a missing #theme-toggle threw
 * and silently killed back-to-top, scroll-spy, animations and the projects code).
 *
 *   initTheme         light / dark, remembered, follows the OS until chosen
 *   initPreloader     progress ring, always removed (with a failsafe)
 *   initScrollState   navbar shadow + back-to-top button
 *   initNav           closes the mobile menu on link click, scroll-spy
 *   initReveal        scroll-reveal for legacy .animate__animated elements
 *   initFooter        year, "show more" social links
 *   initContactForm   validation messages + sending state
 *   initProjects      staggered reveal, pointer tilt, tag filters (FLIP)
 *   initProjectDetail reading progress, table-of-contents highlight, flow connectors
 */
(() => {
  'use strict';

  const $  = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)');

  /** localStorage / sessionStorage throw in private mode or when blocked */
  const safeStorage = (kind) => ({
    get(key) { try { return window[kind].getItem(key); } catch { return null; } },
    set(key, value) { try { window[kind].setItem(key, value); } catch { /* ignore */ } },
  });
  const local = safeStorage('localStorage');
  const session = safeStorage('sessionStorage');


  /* ------------------------------------------------------------------ Theme */
  function initTheme() {
    const root = document.documentElement;
    const toggles = $$('#theme-toggle, [data-theme-toggle]');
    const systemLight = window.matchMedia('(prefers-color-scheme: light)');
    const barColor = { dark: '#0b1120', light: '#f4f6fb' };

    const apply = (theme, persist) => {
      root.setAttribute('data-bs-theme', theme);
      // The old CSS keyed off <body data-bs-theme>, while JS set it on <html>.
      // Keep the attribute on <html> only so the two can never disagree.
      if (document.body) document.body.removeAttribute('data-bs-theme');
      if (persist) local.set('theme', theme);

      let meta = $('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = barColor[theme];

      const next = theme === 'dark' ? 'light' : 'dark';
      toggles.forEach((button) => {
        button.setAttribute('aria-label', `Switch to ${next} theme`);
        button.setAttribute('title', `Switch to ${next} theme`);
      });
    };

    const saved = local.get('theme');
    const declared = root.getAttribute('data-bs-theme');
    const initial =
      saved === 'light' || saved === 'dark' ? saved :
      declared === 'light' || declared === 'dark' ? declared :
      systemLight.matches ? 'light' : 'dark';

    apply(initial, false);

    toggles.forEach((button) => {
      button.addEventListener('click', () => {
        apply(root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark', true);
      });
    });

    // Follow OS changes until the visitor makes an explicit choice
    if (systemLight.addEventListener) {
      systemLight.addEventListener('change', (event) => {
        if (!local.get('theme')) apply(event.matches ? 'light' : 'dark', false);
      });
    }
  }


  /* -------------------------------------------------------------- Preloader */
  function initPreloader() {
    const preloader = $('#preloader');
    if (!preloader) return;

    // Already seen this session: don't make people wait again
    if (session.get('preloader-seen') === '1') {
      preloader.remove();
      return;
    }

    const host = $('.spinner-container', preloader) || preloader;
    const NS = 'http://www.w3.org/2000/svg';
    const RADIUS = 46;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    const svgEl = (name, attrs) => {
      const el = document.createElementNS(NS, name);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      return el;
    };

    host.textContent = '';
    preloader.setAttribute('role', 'status');
    preloader.setAttribute('aria-live', 'polite');

    const ring = document.createElement('div');
    ring.className = 'preloader__ring';

    const svg = svgEl('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' });
    const bar = svgEl('circle', {
      class: 'preloader__bar', cx: 50, cy: 50, r: RADIUS,
      'stroke-dasharray': CIRCUMFERENCE.toFixed(2),
      'stroke-dashoffset': CIRCUMFERENCE.toFixed(2),
    });
    svg.append(svgEl('circle', { class: 'preloader__track', cx: 50, cy: 50, r: RADIUS }), bar);

    const mark = document.createElement('div');
    mark.className = 'preloader__mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = preloader.dataset.initials || 'SP';

    const label = document.createElement('span');
    label.className = 'visually-hidden';
    label.textContent = 'Loading';

    ring.append(svg, mark);
    host.append(ring, label);

    let progress = 0;
    const setProgress = (value) => {
      progress = Math.min(100, value);
      bar.setAttribute('stroke-dashoffset', (CIRCUMFERENCE * (1 - progress / 100)).toFixed(2));
    };

    // Ease towards 90% while the page loads; the real `load` event finishes it
    const ticker = window.setInterval(() => setProgress(progress + (90 - progress) * 0.07), 120);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearInterval(ticker);
      setProgress(100);
      session.set('preloader-seen', '1');

      window.setTimeout(() => {
        preloader.classList.add('fade-out');
        preloader.setAttribute('aria-hidden', 'true');
        window.setTimeout(() => preloader.remove(), 600);
      }, 350);
    };

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });

    // Failsafe: a slow CDN or font must never trap people behind the loader
    window.setTimeout(finish, 8000);
  }


  /* ----------------------------------------------------------- Scroll state */
  function initScrollState() {
    const header = $('.navbar-wrapper');
    const toTop = $('#back-to-top');
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (toTop) toTop.classList.toggle('show', y > 400);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();

    if (toTop) {
      toTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      });
    }
  }


  /* -------------------------------------------------------------------- Nav */
  function initNav() {
    // Smooth scrolling and the sticky-header offset are now pure CSS
    // (scroll-behavior + scroll-padding-top), which also keeps the URL hash
    // and keyboard focus correct. JS only needs to close the mobile menu.
    const menu = $('#navbarNav');

    if (menu) {
      menu.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link || !menu.classList.contains('show')) return;
        if (!link.hash || link.pathname !== window.location.pathname) return;

        // Use Bootstrap's API so aria-expanded and the toggler stay in sync
        // (removing the `show` class by hand left the toggler needing two clicks).
        const Collapse = window.bootstrap && window.bootstrap.Collapse;
        if (Collapse) Collapse.getOrCreateInstance(menu).hide();
      });
    }

    // Scroll-spy with IntersectionObserver instead of a scroll listener that
    // re-queried the DOM for every section on every scroll event.
    const items = $$('.navbar-nav .nav-link')
      .map((link) => ({
        link,
        id: link.pathname === window.location.pathname ? link.hash.slice(1) : '',
      }))
      .map((item) => ({ ...item, section: item.id ? document.getElementById(item.id) : null }))
      .filter((item) => item.section);

    if (!items.length || !('IntersectionObserver' in window)) return;

    const setActive = (id) => {
      items.forEach(({ link, id: itemId }) => {
        const active = itemId === id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });   // a thin band across the middle of the viewport

    items.forEach(({ section }) => observer.observe(section));
  }


  /* ----------------------------------------------------------------- Reveal */
  /**
   * Keeps the existing `.animate__animated .animate__fadeInUp` markup working.
   * Before, the animation class was already on the element, so it played on
   * page load while still off-screen and nobody saw it. Now the animation class
   * is held back until the element scrolls into view.
   */
  function initReveal() {
    const elements = $$('.animate__animated');
    if (!elements.length || reduceMotion.matches || !('IntersectionObserver' in window)) return;

    const MODIFIER = /^animate__(animated|delay|slow|slower|fast|faster|infinite|repeat)/;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.opacity = '';
        el.classList.add(el.dataset.animation);
        observer.unobserve(el);
      });
    }, { threshold: 0.1 });

    elements.forEach((el) => {
      const animation = Array.from(el.classList).find((c) => c.startsWith('animate__') && !MODIFIER.test(c));
      if (!animation) return;
      el.dataset.animation = animation;
      el.classList.remove(animation);
      el.style.opacity = '0';
      observer.observe(el);
    });
  }


  /* ----------------------------------------------------------------- Footer */
  function initFooter() {
    const year = String(new Date().getFullYear());
    $$('[data-year]').forEach((el) => { el.textContent = year; });

    const toggle = $('[data-social-toggle]');
    const panel = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
    if (!toggle || !panel) return;

    const label = $('.site-social-toggle-label', toggle);

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
      if (label) label.textContent = open ? 'Show fewer' : 'Show more';
    });
  }


  /* ----------------------------------------------------------- Contact form */
  function initContactForm() {
    const form = $('#contact form');
    if (!form) return;

    const button = $('button[type="submit"]', form);
    const buttonText = button && $('.btn-label', button);
    const spinner = button && $('.spinner-border', button);
    const idleText = buttonText ? buttonText.textContent : '';

    const setSending = (sending) => {
      if (!button) return;
      button.disabled = sending;
      if (buttonText) buttonText.textContent = sending ? 'Sending…' : idleText;
      if (spinner) spinner.classList.toggle('d-none', !sending);
      form.dataset.sending = sending ? '1' : '';
    };

    form.addEventListener('submit', (event) => {
      if (form.dataset.sending) {            // double-click guard
        event.preventDefault();
        return;
      }

      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        form.classList.add('was-validated');
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      setSending(true);
    });

    // Back/forward cache can restore the page with the button still disabled
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) setSending(false);
    });
  }


  /* --------------------------------------------------------------- Projects */
  /**
   *  1. Reveal: cards that enter the viewport together open in a staggered wave.
   *  2. Tilt: a subtle pointer-driven tilt and image parallax (mouse only).
   *  3. Filter: tag chips are built from the cards' own tags; changing the
   *     filter fades out non-matches and glides the rest into place (FLIP).
   *
   * Progressive enhancement: without JS, or with reduced motion, the grid is
   * simply shown as-is.
   */
  function initProjects() {
    const section = document.getElementById('projects');
    if (!section) return;

    const grid = $('.projects-grid', section);
    const filterBar = $('.project-filters', section);
    const status = $('.project-status', section);
    const items = $$('.project-item', section);
    if (!grid || !items.length) return;

    const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const STAGGER = 90;      // ms between cards that reveal together
    const MAX_FILTERS = 8;   // most-used tags shown as chips
    const MIN_MATCHES = 2;   // a tag needs at least this many projects to become a chip

    const clamp = (value, min = -1, max = 1) => Math.min(max, Math.max(min, value));

    initProjectReveal();
    initProjectTilt();
    initProjectFilters();

    /* ---------- 1. Reveal ---------- */
    function initProjectReveal() {
      if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

      section.classList.add('is-enhanced');

      const observer = new IntersectionObserver((entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => items.indexOf(a.target) - items.indexOf(b.target))
          .forEach((entry, i) => {
            entry.target.style.setProperty('--d', `${i * STAGGER}ms`);
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

      items.forEach((item) => observer.observe(item));
    }

    /* ---------- 2. Tilt + parallax ---------- */
    function initProjectTilt() {
      if (reduceMotion.matches || !finePointer.matches) return;

      items.forEach((item) => {
        const card = $('.project-card', item);
        if (!card) return;

        let frame = 0;
        const setPointer = (x, y) => {
          card.style.setProperty('--px', x.toFixed(3));
          card.style.setProperty('--py', y.toFixed(3));
        };

        card.addEventListener('pointermove', (event) => {
          if (event.pointerType !== 'mouse') return;

          // Measure the untransformed wrapper so tilt can't feed back into itself
          const rect = item.getBoundingClientRect();
          const x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1);
          const y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1);

          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => setPointer(x, y));
        });

        card.addEventListener('pointerleave', () => {
          cancelAnimationFrame(frame);
          setPointer(0, 0);
        });
      });
    }

    /* ---------- 3. Filters ---------- */
    function initProjectFilters() {
      if (!filterBar) return;

      const ALL = '__all__';

      // Index every project's tags (case-insensitive, counted once per project)
      const tagInfo = new Map();                       // key -> { label, count }
      const records = items.map((el) => {
        const keys = new Set();
        const badges = $$('.project-tags .badge', el);

        badges.forEach((badge) => {
          const label = badge.textContent.trim();
          const key = label.toLowerCase();
          if (!key) return;

          badge.dataset.tag = key;
          if (keys.has(key)) return;
          keys.add(key);

          const info = tagInfo.get(key) || { label, count: 0 };
          info.count += 1;
          tagInfo.set(key, info);
        });

        return { el, badges, keys };
      });

      // "In progress" banners aren't projects, so they don't count towards totals
      const total = records.filter(({ el }) => !el.classList.contains('is-soon')).length;

      // Only offer tags that actually narrow things down: 2+ projects, but not all of them
      const filters = Array.from(tagInfo.entries())
        .filter(([, info]) => info.count >= MIN_MATCHES && info.count < total)
        .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
        .slice(0, MAX_FILTERS);

      if (!filters.length) return;

      // Build the chips (textContent only, so tag text can never inject markup)
      const pill = document.createElement('span');
      pill.className = 'filter-pill';
      pill.setAttribute('aria-hidden', 'true');

      const chips = new Map();
      const addChip = (key, label, count) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'project-filter';
        chip.setAttribute('aria-pressed', 'false');

        const text = document.createElement('span');
        text.textContent = label;

        const number = document.createElement('span');
        number.className = 'filter-count';
        number.textContent = count;

        chip.append(text, number);
        chip.addEventListener('click', () => applyFilter(key));
        chips.set(key, chip);
        return chip;
      };

      filterBar.append(
        pill,
        addChip(ALL, 'All', total),
        ...filters.map(([key, info]) => addChip(key, info.label, info.count))
      );
      filterBar.hidden = false;

      let active = ALL;
      let runId = 0;
      chips.get(ALL).setAttribute('aria-pressed', 'true');

      function movePill(instant) {
        const chip = chips.get(active);
        if (!chip) return;

        pill.classList.toggle('is-instant', Boolean(instant));
        pill.style.width = `${chip.offsetWidth}px`;
        pill.style.height = `${chip.offsetHeight}px`;
        pill.style.transform = `translate(${chip.offsetLeft}px, ${chip.offsetTop}px)`;

        if (instant) {
          void pill.offsetWidth;               // commit the jump before re-enabling transitions
          pill.classList.remove('is-instant');
        }
        filterBar.classList.add('is-ready');
      }

      function syncUI(announce) {
        chips.forEach((chip, key) => chip.setAttribute('aria-pressed', String(key === active)));
        movePill(false);

        records.forEach(({ badges }) => {
          badges.forEach((badge) => {
            badge.classList.toggle('is-match', active !== ALL && badge.dataset.tag === active);
          });
        });

        if (status && announce) {
          status.textContent = active === ALL
            ? `Showing all ${total} projects`
            : `Showing ${tagInfo.get(active).count} of ${total} projects tagged ${tagInfo.get(active).label}`;
        }
      }

      async function applyFilter(key) {
        if (key === active) return;
        active = key;
        syncUI(true);

        const matches = (record) => key === ALL || record.keys.has(key);
        const run = ++runId;
        const canAnimate = !reduceMotion.matches
          && typeof Element.prototype.animate === 'function'
          && typeof Element.prototype.getAnimations === 'function';

        if (!canAnimate) {
          records.forEach((record) => { record.el.hidden = !matches(record); });
          return;
        }

        // A new click supersedes any animation still in flight
        records.forEach(({ el }) => el.getAnimations().forEach((animation) => animation.cancel()));

        const visible = records.filter((record) => !record.el.hidden);
        const leaving = visible.filter((record) => !matches(record));
        const staying = visible.filter(matches);
        const entering = records.filter((record) => record.el.hidden && matches(record));

        // Hold the grid's height so the page below doesn't jump while cards leave
        grid.style.transition = 'none';
        grid.style.minHeight = `${grid.offsetHeight}px`;

        // 1. Fade out the cards that no longer match
        if (leaving.length) {
          await Promise.all(leaving.map(({ el }) => el.animate(
            [
              { opacity: 1, transform: 'scale(1)' },
              { opacity: 0, transform: 'scale(0.94)' },
            ],
            { duration: 220, easing: 'ease-in', fill: 'forwards' }
          ).finished.catch(() => {})));

          if (run !== runId) return;
        }

        // 2. FLIP: measure, change layout, then animate from old position to new
        const first = new Map(staying.map((record) => [record, record.el.getBoundingClientRect()]));

        leaving.forEach(({ el }) => {
          el.getAnimations().forEach((animation) => animation.cancel());
          el.hidden = true;
        });
        entering.forEach(({ el }) => { el.hidden = false; });

        staying.forEach((record) => {
          const before = first.get(record);
          const after = record.el.getBoundingClientRect();
          const dx = before.left - after.left;
          const dy = before.top - after.top;
          if (!dx && !dy) return;

          record.el.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
            { duration: 650, easing: EASE }
          );
        });

        entering.forEach(({ el }, i) => {
          el.animate(
            [
              { opacity: 0, transform: 'scale(0.94)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 520, delay: 140 + i * 70, easing: EASE, fill: 'backwards' }
          );
        });

        // 3. Let the grid ease to its new height, then clean up
        void grid.offsetHeight;
        grid.style.transition = `min-height 600ms ${EASE}`;
        grid.style.minHeight = '0px';

        window.setTimeout(() => {
          if (run !== runId) return;
          grid.style.transition = '';
          grid.style.minHeight = '';
        }, 700);
      }

      // Position the highlight once layout, fonts and wrapping have settled
      requestAnimationFrame(() => movePill(true));
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => movePill(true));
      }
      if ('ResizeObserver' in window) {
        new ResizeObserver(() => movePill(true)).observe(filterBar);
      } else {
        window.addEventListener('resize', () => movePill(true));
      }
    }
  }


  /* --------------------------------------------------------- Project detail */
  function initProjectDetail() {
    const page = $('[data-project-detail]');
    if (!page) return;

    // 1. Reading progress (thin bar at the very top of the viewport)
    const bar = $('.pd-progress', page);
    if (bar) {
      let ticking = false;
      const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        bar.style.setProperty('--pd-progress', ratio.toFixed(4));
        ticking = false;
      };
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      }, { passive: true });
      window.addEventListener('resize', update, { passive: true });
      update();
    }

    if (!('IntersectionObserver' in window)) return;

    // 2. Table of contents: highlight the section being read
    const links = $$('.pd-toc a', page);
    const targets = links
      .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
      .filter((item) => item.section);

    if (targets.length) {
      const setActive = (id) => {
        targets.forEach(({ link, section }) => {
          const on = section.id === id;
          link.classList.toggle('is-active', on);
          if (on) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      };

      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: '-20% 0px -65% 0px' });

      targets.forEach(({ section }) => spy.observe(section));
      setActive(targets[0].section.id);
    }

    // 3. "How it works": connectors draw in once as the steps scroll into view
    const flow = $('.pd-flow', page);
    if (flow && !reduceMotion.matches) {
      flow.classList.add('is-enhanced');
      const drawer = new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        flow.classList.add('is-in');
        observer.disconnect();
      }, { threshold: 0.3 });
      drawer.observe(flow);
    }
  }


  /* ------------------------------------------------------------------ Start */
  const modules = [
    initTheme, initPreloader, initScrollState, initNav,
    initReveal, initFooter, initContactForm, initProjects, initProjectDetail,
  ];

  const start = () => {
    modules.forEach((module) => {
      try { module(); } catch (error) { console.error(`[main.js] ${module.name} failed:`, error); }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
