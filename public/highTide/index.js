// public/highTide/index.js

const STATIC = '/static'; 
const IMG = '/img'; // adjust to where your schmeckle.gif and logos are

async function init() {
    const leaderboardContainer = document.getElementById('leaderboard');
    try {
        const res = await fetch('/highTide/api/leaderboard');
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            leaderboardContainer.innerHTML = `
                <p style="color: #EF4444; font-weight: bold;">
                    Session Expired. <br>
                    <a href="/" style="color: white; text-decoration: underline;">Click here to re-enter.</a>
                </p>`;
            return;
        }

        const data = await res.json();
        
        // --- SAFETY UPDATE: Default to TRUE if undefined ---
        let { leaderboard, showForm, winner } = data;
        
        if (showForm === undefined) showForm = true;
        if (!leaderboard) leaderboard = [];
        // --------------------------------------------------

        renderFormOrWinner(showForm, winner, leaderboard); 
        renderLeaderboard(leaderboard);

        // Only launch confetti if the game is over and we have a winner
        if (showForm === false && winner) {
            launchConfetti();
        }
    } catch (err) {
        console.error('Initialization error:', err);
        leaderboardContainer.innerHTML = '<p style="color: white;">Error connecting. Please refresh.</p>';
    }
}

// ---------- Form / Winner Banner ----------

function renderFormOrWinner(showForm, winner, leaderboard = []) {
    const container = document.getElementById('form-or-winner');
    if (!container) return;

    if (showForm || !winner) {
        
        // Extract just the array of names from the leaderboard data
        const playerNames = leaderboard.map(user => user.name).filter(Boolean);

        // 2. Inject Form (Notice the autocomplete-wrapper and empty list divs)
        container.innerHTML = `
        <form id="transfer-form" autocomplete="off">
            
            <div class="autocomplete-wrapper">
                <input type="text" id="person1" placeholder="Sender Name" required style="color:white;">
                <div id="person1-list" class="autocomplete-list"></div>
            </div>

            <input type="number" id="amount" inputmode="numeric" pattern="[0-9]*" placeholder="Amount" required style="color:white;">
            
            <div class="autocomplete-wrapper">
                <input type="text" id="person2" placeholder="Receiver Name" required style="color:white;">
                <div id="person2-list" class="autocomplete-list"></div>
            </div>

            <input type="text" id="reason" placeholder="Reason" maxlength="200" required style="color:white;">
            
            <div style="margin: 10px 0; text-align: center;">
                <label for="camera-input" style="
                    background: #F59E0B; color: black; padding: 10px 20px; 
                    border-radius: 20px; cursor: pointer; font-weight: 800; display: inline-block;
                    border: 2px solid #1B1A17;">
                    📸 Add Proof
                </label>
                <input type="file" id="camera-input" accept="image/*" capture="environment" style="display: none;">
                <div id="file-name" style="color: #ccc; font-size: 0.8em; margin-top: 5px;"></div>
            </div>

            <button type="submit" id="submit-btn">Complete Transfer</button>
        </form>
        <div id="form-message" style="margin-top:10px; font-weight: 600; min-height: 24px;"></div>
        `;

        // Attach Custom Autocomplete Logic to the inputs
        setupAutocomplete('person1', 'person1-list', playerNames);
        setupAutocomplete('person2', 'person2-list', playerNames);

        // Add listener for file selection to show name
        setTimeout(() => {
            const camInput = document.getElementById('camera-input');
            if(camInput) {
                camInput.addEventListener('change', (e) => {
                    if(e.target.files[0]) {
                        document.getElementById('file-name').textContent = "Selected: " + e.target.files[0].name;
                    }
                });
            }
        }, 100);

        document.getElementById('transfer-form').addEventListener('submit', handleTransfer);

    } else {
        // ... (Keep your existing winner display logic here) ...
        const wName = winner.toLowerCase();
        const displayName = wName === 'rbj' ? 'RBJ' : wName.charAt(0).toUpperCase() + wName.slice(1);

        container.innerHTML = `
            <div id="winner-box" style="
                background: linear-gradient(135deg, var(--gold), #F59E0B);
                color: #1B1A17; text-align: center; padding: 30px 20px;
                border-radius: 16px; box-shadow: 0 10px 25px rgba(251, 191, 36, 0.3);
                font-size: 1.3em; margin: 20px auto; width: 100%; max-width: 600px; box-sizing: border-box;
            ">
                🎉 Congratulations to <br>
                <span style="font-weight: 800; font-size: 1.6em; display: block; margin: 10px 0;">${displayName}</span>
                The 2025 Wootown High Tide Schmeckle Champion! 🏆
            </div>
        `;
    }
}

// ---------- Custom Mobile Autocomplete Engine ----------
function setupAutocomplete(inputId, listId, namesArray) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    if (!input || !list) return;

    // Listen for typing on mobile keyboard
    input.addEventListener('input', () => {
        const val = input.value.toLowerCase().trim();
        list.innerHTML = ''; // Clear previous suggestions
        
        if (!val) {
            list.style.display = 'none';
            return;
        }

        // Find names that include the typed letters
        const matches = namesArray.filter(n => n.toLowerCase().includes(val));
        
        if (matches.length === 0) {
            list.style.display = 'none';
            return;
        }

        // Build the dropdown items
        matches.forEach(match => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.textContent = match.toLowerCase() === 'rbj' ? 'RBJ' : match.charAt(0).toUpperCase() + match.slice(1);
            
            // When user taps a name, fill the input and hide the list
            div.addEventListener('click', () => {
                input.value = div.textContent;
                list.style.display = 'none';
            });
            list.appendChild(div);
        });

        list.style.display = 'block';
    });

    // Hide the dropdown if they click anywhere else on the screen
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== list) {
            list.style.display = 'none';
        }
    });
}

// ---------- Transfer Form Handler ----------

async function handleTransfer(e) {
    e.preventDefault();
    
    // 1. Get UI Elements
    const msgEl = document.getElementById('form-message');
    const btn = document.getElementById('submit-btn');
    const fileInput = document.getElementById('camera-input');
    
    // 2. Immediate Validation: Check if file exists
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        msgEl.style.color = '#EF4444'; // Red
        msgEl.textContent = '❌ You gotta give proof you silly bee!';
        // Shake animation
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 500);
        return; 
    }

    // 3. Prepare for Upload
    msgEl.textContent = 'Compressing & Uploading...';
    msgEl.style.color = 'white';
    btn.disabled = true;

    // 4. Gather Data
    const person1 = document.getElementById('person1').value.trim();
    const amount  = document.getElementById('amount').value.trim();
    const person2 = document.getElementById('person2').value.trim();
    const reason  = document.getElementById('reason').value.trim();
    const originalFile = fileInput.files[0];

    // 5. Build Multipart Form Data
    const formData = new FormData();
    formData.append('person1', person1);
    formData.append('amount',  amount);
    formData.append('person2', person2);
    formData.append('reason',  reason);

    try {
        // 6. Resize on the phone (Saves bandwidth/costs)
        const resizedBlob = await resizeImage(originalFile);
        formData.append('photo', resizedBlob, 'proof.jpg');

        // 7. Execute Request
        const res = await fetch('/highTide/update_schmeckles', {
            method: 'POST',
            body: formData 
        });

        // 8. Handle Redirects (Session timeout check)
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("REDIRECTED");
        }

        const result = await res.json();

        if (!res.ok) {
            const messages = {
                deadline:           "❌ Too late!",
                invalid_input:      "❌ That's the wrong number!",
                user_not_found:     "❌ That bee is not in this hive",
                insufficient_funds: "❌ Not enough schmeckles.",
                no_proof_provided:  "❌ Gotta take a flick lowk",
                server_error:       "❌ Charlie prolly messed something up."
            };
            msgEl.style.color = '#EF4444';
            msgEl.textContent = messages[result.error] || '❌ Transfer failed.';
            btn.disabled = false;
            return;
        }

        // 9. Success Sequence
        msgEl.style.color = '#10B981'; // Green
        msgEl.textContent = '✅ Transfer successful!';
        e.target.reset(); // Clears form
        document.getElementById('file-name').textContent = ''; 
        btn.disabled = false;
        
        // Refresh the leaderboard visually
        if (typeof refreshLeaderboard === 'function') {
            await refreshLeaderboard();
        }

    } catch (err) {
        console.error("Transfer Error:", err);
        btn.disabled = false;
        if (err.message === "REDIRECTED") {
            msgEl.style.color = '#EF4444';
            msgEl.textContent = '❌ Session expired. Please refresh the page.';
        } else {
            msgEl.style.color = '#EF4444';
            msgEl.textContent = '❌ Network error. Try again.';
        }
    }
}

// ---------- Leaderboard Rendering ----------

function renderLeaderboard(leaderboard) {
    const container = document.getElementById('leaderboard');
    if (!container) return;
    container.innerHTML = '';

    leaderboard.forEach((item, index) => {
        const rank = index + 1;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'darktext';
        
        // Safety for name
        const name = item.name || "Unknown";
        const displayName = name.toLowerCase() === 'jd' ? 'JD' : name.charAt(0).toUpperCase() + name.slice(1);
        
        // If netChange isn't calculated yet, default to 0
        const netChange = item.netChange || 0; 
        const arrowColor = netChange > 0 ? '#10B981' : netChange < 0 ? '#EF4444' : '#94A3B8';
        const arrowIcon  = netChange > 0 ? 'up.png' : netChange < 0 ? 'down.png' : 'mid.png';
        const netSign    = netChange >= 0 ? '+' : '';

        container.innerHTML += `
            <a href="/highTide/user_detail?name=${item.name}" class="leaderboard-item ${rankClass}" style="text-decoration: none; cursor: pointer;">
                <div class="rank" style="display: flex; align-items: center; gap: 10px;">
                    <span style="opacity: 0.7; font-size: 0.9em;">#${rank}</span>
                    <span>${displayName}</span>
                </div>
                <div class="schmeckles" style="display: flex; align-items: center; gap: 12px; font-weight: 600;">
                    <span style="color:${arrowColor}; font-size: 0.85em; background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 4px;">
                        ${netSign}${netChange}
                        <img src="${STATIC}/${arrowIcon}" alt="" width="12" style="vertical-align:middle;">
                    </span>
                    <span style="font-size: 1.1em;">${item.balance}</span>
                    <img src="/img/schmeckle.gif" alt="" width="20" style="vertical-align:middle;">
                </div>
            </a>
        `;
    });
}

async function refreshLeaderboard() {
    try {
        const res = await fetch('/highTide/api/leaderboard');
        const data = await res.json();
        // Handle data wrapper
        const list = data.leaderboard || data; 
        renderLeaderboard(list);
    } catch (err) {
        console.error('Refresh failed:', err);
    }
}

// ---------- Countdown & Confetti ----------

function startCountdown(targetDate) {
    const el = document.getElementById('countdown');
    if (!el) return;
    const targetTime = new Date(targetDate).getTime();

    function update() {
        const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        el.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        if (remaining > 0) requestAnimationFrame(update);
        else el.textContent = "Time's up!";
    }
    update();
}

function launchConfetti() {
    if (typeof confetti !== 'undefined') {
        const duration = 5 * 1000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 3, spread: 70, origin: { y: 0.8 } });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}

// ---------- Image Resizer Utility ----------
function resizeImage(file, maxWidth = 800) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to compressed JPEG blob (0.7 quality)
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.7);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ---------- Initial Boot ----------

document.addEventListener('DOMContentLoaded', () => {
    startCountdown('March 10, 2026 23:59:56');
    init();
});