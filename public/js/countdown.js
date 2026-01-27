// SET YOUR TARGET DATE AND TIME HERE
// Format: 'YYYY-MM-DD HH:MM:SS' (24-hour format)
const TARGET_DATE = '2026-02-28 00:00:00';

// Local storage key to track if animation has played
const ANIMATION_PLAYED_KEY = 'countdown_animation_played';

let countdownInterval;
let animationHasPlayed = localStorage.getItem(ANIMATION_PLAYED_KEY) === 'true';

function updateCountdown() {
    const now = new Date().getTime();
    const targetTime = new Date(TARGET_DATE).getTime();
    const difference = targetTime - now;

    // If countdown is over
    if (difference <= 0) {
        clearInterval(countdownInterval);
        
        // Set all values to 00
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';

        // Play celebration animation only once
        if (!animationHasPlayed) {
            playCelebration();
            localStorage.setItem(ANIMATION_PLAYED_KEY, 'true');
            animationHasPlayed = true;
        }
        
        return;
    }

    // Calculate time units
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    // Update display with leading zeros
    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');

    // Add pulse animation to seconds
    const secondsElement = document.getElementById('seconds');
    secondsElement.style.transform = 'scale(1.1)';
    setTimeout(() => {
        secondsElement.style.transform = 'scale(1)';
    }, 100);
}

function playCelebration() {
    const celebrationElement = document.getElementById('celebration-animation');
    celebrationElement.classList.add('active');

    // Play sound if you want (optional)
    // const audio = new Audio('/sounds/celebration.mp3');
    // audio.play();

    // Hide celebration after 10 seconds and return to countdown
    setTimeout(() => {
        celebrationElement.classList.remove('active');
    }, 10000);
}

// Function to reset animation (for testing purposes - can be called from console)
function resetAnimation() {
    localStorage.removeItem(ANIMATION_PLAYED_KEY);
    animationHasPlayed = false;
    console.log('Animation reset! Reload the page to test.');
}

// Initialize countdown
document.addEventListener('DOMContentLoaded', function() {
    updateCountdown(); // Run immediately
    countdownInterval = setInterval(updateCountdown, 1000); // Update every second
});

// Add smooth transition to time values
document.addEventListener('DOMContentLoaded', function() {
    const timeValues = document.querySelectorAll('.time-value');
    timeValues.forEach(element => {
        element.style.transition = 'transform 0.1s ease';
    });
});