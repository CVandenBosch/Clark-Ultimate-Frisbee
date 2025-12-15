let practiceCount = 0;

function addPracticeCard() {
    practiceCount++;
    const container = document.getElementById('practicesContainer');

    const practiceCard = document.createElement('div');
    practiceCard.className = 'practice-card';
    practiceCard.id = `practice-${practiceCount}`;

    practiceCard.innerHTML = `
        <div class="practice-number">Practice #${practiceCount}</div>
        
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Day of the Week</label>
                <select class="form-select practice-day" required>
                    <option value="" selected disabled>Select a day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                </select>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Location</label>
                <select class="form-select practice-location" required>
                    <option value="" selected disabled>Select a location</option>
                    <option value="BGC">BGC</option>
                    <option value="Dolan Field House">Dolan Field House</option>
                </select>
            </div>
        </div>


        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Start Time</label>
                <input type="time" class="form-control practice-start" required>
            </div>

            <div class="col-md-6 mb-3">
                <label class="form-label">End Time</label>
                <input type="time" class="form-control practice-end" required>
            </div>
        </div>
    `;
    container.appendChild(practiceCard);
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
}

function getAllPractices() {
    const practices = [];
    const cards = document.querySelectorAll('.practice-card');

    cards.forEach(card => {
        const day = card.querySelector('.practice-day').value;
        const startTime = card.querySelector('.practice-start').value;
        const endTime = card.querySelector('.practice-end').value;
        const location = card.querySelector('.practice-location').value;

        if (day && startTime && endTime && location) {
            const formattedStart = formatTime(startTime);
            const formattedEnd = formatTime(endTime);
            practices.push({
                day,
                time: `${formattedStart}-${formattedEnd}`,
                location
            });
        }
    });

    return practices;
}

document.getElementById('addPracticeBtn').addEventListener('click', addPracticeCard);
document.getElementById('saveAllBtn').addEventListener('click', function() {
    const practices = getAllPractices();

    if (practices.length === 0) {
        alert('Please add at least one practice before saving!');
        return;
    }

    const saveBtn = this;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';

    fetch('/updateSchedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practices })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'success') {
            window.location.href = '/schedule';
        }
    })
    .catch(err => {
        console.error('Error saving schedule:', err);
    })
    .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save All Practices';
    });
});

addPracticeCard();