/*
 * AETHER — Cinematic Experience Controller
 *
 * Navigation and scrolling
 * 3D camera synchronization
 * Section reveal animations
 * Cinematic loading
 * Energy mode interactions
 * Backend content and contact form
 */

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
).matches;

let world = null;
let animationPaused = reducedMotion;
let cameraFrame = null;

const loader = $('#loader');
const pauseButton = $('#pause');

const sections = $$('.chapter');

/* =========================================
   CINEMATIC LOADING SEQUENCE
========================================= */

function finishLoading() {

    const bar = $('#load-bar');
    const label = $('#load-label');

    if (bar) {
        bar.style.width = '100%';
    }

    if (label) {
        label.textContent = 'EXPERIENCE READY';
    }

    window.setTimeout(() => {

        loader?.classList.add('done');

        $$('.hero .reveal').forEach((element, index) => {

            if (reducedMotion) {
                element.classList.add('visible');
                return;
            }

            window.setTimeout(() => {
                element.classList.add('visible');
            }, index * 160);
        });

    }, reducedMotion ? 0 : 500);
}

/* =========================================
   INITIALIZE THREE.JS
========================================= */

async function initializeExperience() {

    try {

        if (!reducedMotion) {

            const testCanvas =
                document.createElement('canvas');

            const supported =
                testCanvas.getContext('webgl2') ||
                testCanvas.getContext('webgl');

            if (!supported) {
                throw new Error('WebGL is unavailable');
            }

            const { AetherScene } =
                await import('./scene.js');

            world = new AetherScene($('#world'));

            world.setScroll(getScrollProgress());

            if (animationPaused) {
                world.setPaused(true);
            }

        } else {

            document.body.classList.add('no-webgl');
            $('#world').hidden = true;
        }

    } catch (error) {

        console.warn('3D fallback:', error);

        document.body.classList.add('no-webgl');

        if ($('#world')) {
            $('#world').hidden = true;
        }

    } finally {

        finishLoading();

        updateNavigation();
        updateSectionState();
    }
}

/* =========================================
   SCROLL PROGRESS
========================================= */

function getScrollProgress() {

    const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight -
        window.innerHeight
    );

    return Math.min(
        1,
        Math.max(0, window.scrollY / maxScroll)
    );
}

function updateScroll() {

    cameraFrame = null;

    world?.setScroll(getScrollProgress());

    updateNavigation();
    updateSectionState();
    updateCinematicText();
}

function scheduleScrollUpdate() {

    if (cameraFrame !== null) {
        return;
    }

    cameraFrame = requestAnimationFrame(updateScroll);
}

window.addEventListener(
    'scroll',
    scheduleScrollUpdate,
    { passive: true }
);

window.addEventListener(
    'resize',
    scheduleScrollUpdate,
    { passive: true }
);

/* =========================================
   ANIMATED SECTION REVEALS
========================================= */

const revealObserver = new IntersectionObserver(
    entries => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) {
                return;
            }

            const element = entry.target;

            const section = element.closest('.chapter');

            if (section?.classList.contains('hero')) {
                return;
            }

            const group = section
                ? [...section.querySelectorAll('.reveal')]
                : [element];

            const index = group.indexOf(element);

            if (reducedMotion) {

                element.classList.add('visible');

            } else {

                window.setTimeout(() => {

                    element.classList.add('visible');

                }, Math.max(0, index) * 110);
            }

            revealObserver.unobserve(element);
        });
    },
    {
        threshold: 0.12,
        rootMargin: '0px 0px -5% 0px'
    }
);

$$('.reveal').forEach(element => {

    if (!element.closest('.hero')) {
        revealObserver.observe(element);
    }
});

/* =========================================
   ACTIVE SECTION TRACKING
========================================= */

function updateSectionState() {

    const middle = window.innerHeight * 0.5;

    let currentSection = sections[0];

    sections.forEach(section => {

        const rect = section.getBoundingClientRect();

        if (
            rect.top <= middle &&
            rect.bottom >= middle
        ) {
            currentSection = section;
        }
    });

    if (!currentSection) {
        return;
    }

    document.body.dataset.section = currentSection.id;

    sections.forEach(section => {
        section.classList.toggle(
            'is-active',
            section === currentSection
        );
    });
}

/* =========================================
   ANIMATED NAVIGATION
========================================= */

const navLinks = $$('.site-header nav a');

function updateNavigation() {

    const position = window.scrollY +
        window.innerHeight * 0.45;

    let activeId = 'home';

    sections.forEach(section => {

        if (section.offsetTop <= position) {
            activeId = section.id;
        }
    });

    navLinks.forEach(link => {

        const active =
            link.getAttribute('href') === `#${activeId}`;

        link.classList.toggle('active', active);

        if (active) {
            link.setAttribute('aria-current', 'location');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

/* =========================================
   AETHER — CINEMATIC SCROLL TYPOGRAPHY
========================================= */

const cinematicHeadings = [
    ...document.querySelectorAll(
        '.chapter h1, .chapter h2'
    )
];

const cinematicMotion = !window.matchMedia(
    '(prefers-reduced-motion: reduce)'
).matches;

function updateCinematicText() {

    if (!cinematicMotion) return;

    const viewportHeight = window.innerHeight;

    cinematicHeadings.forEach(heading => {

        const rect = heading.getBoundingClientRect();

        // Position of the heading's center.
        const center = rect.top + rect.height / 2;

        // How far the heading is from the
        // visual center of the screen.
        const distance = Math.abs(
            center - viewportHeight * 0.5
        );

        // 0 means invisible, 1 means fully visible.
        const progress = Math.max(
            0,
            Math.min(
                1,
                1 - distance / (viewportHeight * 0.7)
            )
        );

        // Smooth the movement.
        const eased =
            progress * progress * (3 - 2 * progress);

        // Move upward as the heading appears.
        const offset = (1 - eased) * 70;

        // Blur disappears as the heading
        // approaches the center.
        const blur = (1 - eased) * 12;

        heading.style.setProperty(
            '--cinematic-opacity',
            eased.toFixed(3)
        );

        heading.style.setProperty(
            '--cinematic-offset',
            `${offset.toFixed(1)}px`
        );

        heading.style.setProperty(
            '--cinematic-blur',
            `${blur.toFixed(1)}px`
        );
    });
}

if (cinematicMotion) {

    document.body.classList.add(
        'cinematic-text-enabled'
    );

    updateCinematicText();
}

/* =========================================
   PAUSE AND RESUME
========================================= */

function updatePauseButton() {

    if (!pauseButton) {
        return;
    }

    pauseButton.setAttribute(
        'aria-pressed',
        String(animationPaused)
    );

    pauseButton.innerHTML = animationPaused
        ? '▶ <span>RESUME MOTION</span>'
        : 'Ⅱ <span>PAUSE MOTION</span>';
}

pauseButton?.addEventListener('click', () => {

    if (!world) {

        if (reducedMotion) {
            return;
        }

        return;
    }

    animationPaused = !animationPaused;

    world.setPaused(animationPaused);

    updatePauseButton();
});

updatePauseButton();

/* =========================================
   INTERACTIVE ENERGY MODES
========================================= */

const modeDescriptions = {
    pulse: 'PULSE — ENERGY STABLE',
    flux: 'FLUX — FIELD EXPANDING',
    void: 'VOID — LIGHT CONTAINED'
};

$$('.mode').forEach(button => {

    button.addEventListener('click', () => {

        const mode = button.dataset.mode;

        if (!Object.hasOwn(modeDescriptions, mode)) {
            return;
        }

        $$('.mode').forEach(other => {

            const active = other === button;

            other.classList.toggle('active', active);

            other.setAttribute(
                'aria-pressed',
                String(active)
            );
        });

        world?.setMode(mode);

        const status = $('#mode-status');

        if (status) {
            status.textContent = modeDescriptions[mode];
        }
    });
});

/* =========================================
   SPRING BOOT SHOWCASE CONTENT
========================================= */

async function loadShowcase() {

    try {

        const response = await fetch('/api/experience', {
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.artifacts)) {
            throw new Error('Invalid showcase response');
        }

        const grid = $('#artifact-grid');

        if (!grid) {
            return;
        }

        const cards = data.artifacts.map(item => {

            const card = document.createElement('article');
            card.className = 'artifact';

            const number = document.createElement('span');
            number.textContent =
                `${item.number} / ${item.category}`;

            const title = document.createElement('h3');
            title.textContent = item.title;

            const description = document.createElement('p');
            description.textContent = item.description;

            card.append(number, title, description);

            return card;
        });

        grid.replaceChildren(...cards);

    } catch (error) {

        console.info(
            'Using built-in showcase content:',
            error.message
        );
    }
}

/* =========================================
   CONTACT FORM
========================================= */

const contactToggle = $('#contact-toggle');
const contactForm = $('#contact-form');

contactToggle?.addEventListener('click', () => {

    if (!contactForm) {
        return;
    }

    contactForm.hidden = !contactForm.hidden;

    contactToggle.setAttribute(
        'aria-expanded',
        String(!contactForm.hidden)
    );

    if (!contactForm.hidden) {
        contactForm.querySelector('input')?.focus();
    }
});

contactForm?.addEventListener('submit', async event => {

    event.preventDefault();

    const status = $('#contact-status');

    const submitButton = contactForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    status.textContent = 'TRANSMITTING MESSAGE…';

    try {

        const data = Object.fromEntries(
            new FormData(contactForm)
        );

        const response = await fetch('/api/contact', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(data),

            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        status.textContent =
            'MESSAGE RECEIVED — SAVED ON SERVER. ' +
            'NO EMAIL HAS BEEN SENT.';

        console.info('Contact reference:', result.id);

        contactForm.reset();

    } catch (error) {

        console.error('Contact request failed:', error);

        status.textContent =
            'MESSAGE COULD NOT BE SENT. PLEASE TRY AGAIN.';

    } finally {

        submitButton.disabled = false;
    }
});

/* =========================================
   TAB VISIBILITY / PERFORMANCE
========================================= */

document.addEventListener('visibilitychange', () => {

    if (!world) {
        return;
    }

    if (document.hidden) {

        world.setPaused(true);

    } else {

        world.setPaused(animationPaused);
    }
});

/* =========================================
   START EXPERIENCE
========================================= */

loadShowcase();
initializeExperience();

/* =========================================
   AETHER — ATMOSPHERIC LIGHT STREAKS
========================================= */

function createCinematicAtmosphere() {

    // Prevent duplicate overlays.
    if (
        document.querySelector(
            '.aether-atmosphere'
        )
    ) {
        return;
    }

    const atmosphere =
        document.createElement('div');

    atmosphere.className =
        'aether-atmosphere';

    atmosphere.setAttribute(
        'aria-hidden',
        'true'
    );

    // Generate three animated light streaks.
    for (let i = 0; i < 3; i++) {

        const streak =
            document.createElement('span');

        streak.className =
            'aether-light-streak';

        atmosphere.appendChild(streak);
    }

    document.body.appendChild(atmosphere);
}

// Start the cinematic atmosphere.
createCinematicAtmosphere();
