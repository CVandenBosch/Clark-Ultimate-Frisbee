// SET YOUR TARGET DATE AND TIME HERE
// Format: 'YYYY-MM-DD HH:MM:SS' (24-hour format)
const TARGET_DATE = '2026-02-28 00:00:00';

// ─────────────────────────────────────────────
// 🎬 SET YOUR GIF PATH HERE
// ─────────────────────────────────────────────
const GIF_SRC = '/img/celebration.gif';

// How long to show the celebration before auto-closing (ms)
const CELEBRATION_DURATION_MS = 15000;

// Number of frisbees flying around
const FRISBEE_COUNT = 18;

// If the page loads within this many ms after zero, still show the celebration
const LATE_LOAD_WINDOW_MS = 10000;

const targetTime = new Date(TARGET_DATE).getTime();
const loadTime   = new Date().getTime();

// True if: page loaded before zero, OR loaded within 10 seconds after zero
const eligibleForCelebration = loadTime <= targetTime + LATE_LOAD_WINDOW_MS;

let alreadyCelebrating = false;
let countdownInterval;
let frisbeeInterval = null;

function updateCountdown() {
    const now  = new Date().getTime();
    const diff = targetTime - now;

    if (diff <= 0) {
        clearInterval(countdownInterval);

        document.getElementById('days').textContent    = '00';
        document.getElementById('hours').textContent   = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';

        const title = document.querySelector('.countdown-title');
        if (title) title.textContent = 'HIGH TIDE IS HERE! 🥏';

        if (eligibleForCelebration && !alreadyCelebrating) {
            alreadyCelebrating = true;
            playCelebration();
        }

        return;
    }

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('days').textContent    = String(days).padStart(2, '0');
    document.getElementById('hours').textContent   = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');

    const secondsEl = document.getElementById('seconds');
    secondsEl.style.transform = 'scale(1.1)';
    setTimeout(() => { secondsEl.style.transform = 'scale(1)'; }, 100);
}

// ─────────────────────────────────────────────
// Frisbee particle system — 🥏 blue disc style
// ─────────────────────────────────────────────
function createFrisbee() {
    const frisbee = document.createElement('div');
    frisbee.classList.add('frisbee-particle');

    const size   = 55 + Math.random() * 35;
    const height = size * 0.28;

    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight;

    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    const vx    = Math.cos(angle) * speed;
    const vy    = Math.sin(angle) * speed;
    const spin  = (Math.random() - 0.5) * 7;
    const tiltX = (Math.random() - 0.5) * 35;

    frisbee.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${height}px;
        left: ${startX}px;
        top: ${startY}px;
        border-radius: 50%;
        background: radial-gradient(ellipse at 38% 30%,
            #a8d8ff 0%,
            #4aa8e8 25%,
            #1a78c2 55%,
            #0d4f8a 80%,
            #083460 100%
        );
        box-shadow:
            0 3px 10px rgba(0,0,0,0.45),
            inset 0 -3px 5px rgba(0,0,50,0.3),
            inset 2px -1px 0px rgba(255,255,255,0.55);
        pointer-events: none;
        z-index: 10000;
        transform: rotateX(${tiltX}deg);
        opacity: ${0.8 + Math.random() * 0.2};
    `;

    const ring = document.createElement('div');
    ring.style.cssText = `
        position: absolute;
        top: 10%;
        left: 8%;
        width: 84%;
        height: 80%;
        border-radius: 50%;
        border: ${Math.max(2, size * 0.04)}px solid rgba(255,255,255,0.45);
        box-sizing: border-box;
    `;
    frisbee.appendChild(ring);

    frisbee._x    = startX;
    frisbee._y    = startY;
    frisbee._vx   = vx;
    frisbee._vy   = vy;
    frisbee._spin = spin;
    frisbee._rot  = Math.random() * 360;
    frisbee._tilt = tiltX;
    frisbee._size = size;

    document.body.appendChild(frisbee);
    return frisbee;
}

function launchFrisbees() {
    const frisbees = [];
    for (let i = 0; i < FRISBEE_COUNT; i++) {
        frisbees.push(createFrisbee());
    }

    frisbeeInterval = setInterval(() => {
        frisbees.forEach(f => {
            f._x  += f._vx;
            f._y  += f._vy;
            f._rot += f._spin;

            if (f._x > window.innerWidth  + f._size) f._x = -f._size;
            if (f._x < -f._size)                      f._x = window.innerWidth + f._size;
            if (f._y > window.innerHeight + f._size)  f._y = -f._size;
            if (f._y < -f._size)                      f._y = window.innerHeight + f._size;

            f.style.left      = f._x + 'px';
            f.style.top       = f._y + 'px';
            f.style.transform = `rotateX(${f._tilt}deg) rotateZ(${f._rot}deg)`;
        });
    }, 16);

    return frisbees;
}

function stopFrisbees(frisbees) {
    clearInterval(frisbeeInterval);
    frisbees.forEach(f => f.remove());
}

function closeCelebration(frisbees) {
    document.getElementById('celebration-animation').classList.remove('active');
    stopFrisbees(frisbees);
}

function playCelebration() {
    const container    = document.getElementById('celebration-animation');
    const mediaWrapper = document.getElementById('celebration-media');

    mediaWrapper.innerHTML = '';

    const img = document.createElement('img');
    img.src   = GIF_SRC;
    img.alt   = 'Celebration!';
    mediaWrapper.appendChild(img);

    const caption = document.createElement('div');
    caption.className = 'gif-caption';
    caption.innerHTML = 'Thank you &nbsp; Thank you &nbsp; Thank you';
    mediaWrapper.appendChild(caption);

    const bar = document.getElementById('celebration-progress-bar');
    if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '100%';
        bar.offsetWidth;
        bar.style.transition = `width ${CELEBRATION_DURATION_MS}ms linear`;
        bar.style.width = '0%';
    }

    container.classList.add('active');

    const frisbees = launchFrisbees();

    const dismiss = () => {
        closeCelebration(frisbees);
        container.removeEventListener('click', dismiss);
    };
    container.addEventListener('click', dismiss);

    setTimeout(() => closeCelebration(frisbees), CELEBRATION_DURATION_MS);
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.time-value').forEach(el => {
        el.style.transition = 'transform 0.1s ease';
    });

    // If page loads after zero, show correct title
    if (loadTime >= targetTime) {
        const title = document.querySelector('.countdown-title');
        if (title) title.textContent = 'HIGH TIDE IS HERE! 🥏';
    }

    // If page loaded within the 10 second window after zero, fire immediately
    if (eligibleForCelebration && loadTime > targetTime && !alreadyCelebrating) {
        alreadyCelebrating = true;
        playCelebration();
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
});

// Dev helper — run in browser console to test:
// resetCountdownTest()
function resetCountdownTest() {
    alreadyCelebrating = false;
    clearInterval(countdownInterval);
    playCelebration();
    console.log('Test: celebration triggered.');
}