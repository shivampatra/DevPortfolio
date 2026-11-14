/**
 * Main JavaScript file for the portfolio website
 */
document.addEventListener('DOMContentLoaded', function() {
    // Preloader handling
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', function() {
        setTimeout(function() {
            preloader.classList.add('fade-out');
            setTimeout(function() {
                preloader.style.display = 'none';
            }, 500);
        }, 1000);
    });

    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-bs-theme', savedTheme);
    }
    
    themeToggle.addEventListener('click', function() {
        if (htmlElement.getAttribute('data-bs-theme') === 'dark') {
            htmlElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            htmlElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Back to top button
    const backToTopBtn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    navbarCollapse.classList.remove('show');
                }
            }
        });
    });

    // Active navigation link highlighting
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavLink() {
        const scrollPosition = window.pageYOffset + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavLink);
    
    // Initialize animations
    initializeAnimations();
});

// Initialize animations
function initializeAnimations() {
    // Animate on scroll
    const animatedElements = document.querySelectorAll('.animate__animated');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const animationClass = entry.target.classList.contains('animate__fadeInUp') ? 'animate__fadeInUp' : 'animate__fadeIn';
                entry.target.classList.add(animationClass);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
    
    // Project card hover effects
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.querySelector('.project-overlay').style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', function() {
            this.querySelector('.project-overlay').style.opacity = '0';
        });
    });
    
    // Tech item hover effects
    const techItems = document.querySelectorAll('.tech-item');
    
    techItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.classList.add('tech-hover');
        });
        
        item.addEventListener('mouseleave', function() {
            this.classList.remove('tech-hover');
        });
    });
}





// ========================= Project section JS code (2nd version) =======================================

/**
 * Projects section
 *  1. Reveal: cards that enter the viewport together open in a staggered wave.
 *  2. Tilt: a subtle pointer-driven tilt and image parallax (mouse only).
 *  3. Filter: tag chips are built from the cards' own tags; changing the
 *     filter fades out non-matches and glides the rest into place (FLIP).
 *
 * Progressive enhancement: without JS, or with reduced motion, the grid is
 * simply shown as-is.
 */
document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('projects');
    if (!section) return;

    const grid = section.querySelector('.projects-grid');
    const filterBar = section.querySelector('.project-filters');
    const status = section.querySelector('.project-status');
    const items = Array.from(section.querySelectorAll('.project-item'));
    if (!grid || !items.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const STAGGER = 90;       // ms between cards that reveal together
    const MAX_FILTERS = 8;    // most-used tags shown as chips

    const clamp = (value, min = -1, max = 1) => Math.min(max, Math.max(min, value));

    initReveal();
    initTilt();
    initFilters();

    /* ---------- 1. Reveal ---------- */
    function initReveal() {
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
    function initTilt() {
        if (reduceMotion.matches || !finePointer.matches) return;

        items.forEach((item) => {
            const card = item.querySelector('.project-card');
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
    function initFilters() {
        if (!filterBar) return;

        const ALL = '__all__';

        // Index every project's tags (case-insensitive, counted once per project)
        const tagInfo = new Map();                        // key -> { label, count }
        const records = items.map((el) => {
            const keys = new Set();
            const badges = Array.from(el.querySelectorAll('.project-tags .badge'));

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

        // Skip tags every project shares: filtering by them changes nothing
        const filters = Array.from(tagInfo.entries())
            .filter(([, info]) => info.count < records.length)
            .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
            .slice(0, MAX_FILTERS);

        if (!filters.length) return;

        // Build the chips (textContent only, so tag text can never inject markup)
        const pill = document.createElement('span');
        pill.className = 'filter-pill';
        pill.setAttribute('aria-hidden', 'true');

        const chips = new Map();
        const addChip = (key, label, count) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'project-filter';
            button.setAttribute('aria-pressed', 'false');

            const text = document.createElement('span');
            text.textContent = label;

            const number = document.createElement('span');
            number.className = 'filter-count';
            number.textContent = count;

            button.append(text, number);
            button.addEventListener('click', () => applyFilter(key));
            chips.set(key, button);
            return button;
        };

        filterBar.append(
            pill,
            addChip(ALL, 'All', records.length),
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
                void pill.offsetWidth;            // commit the jump before re-enabling transitions
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
                const total = records.length;
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
            const canAnimate = !reduceMotion.matches && typeof Element.prototype.animate === 'function';

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
});
