const startingYear = 2005;
const currentYear = new Date().getFullYear();
const yearsAsTeam = currentYear - startingYear;

document.getElementById('team-years').innerHTML = yearsAsTeam.toString();

// Fetch and display number of practices per week
fetch('/get-schedule')
    .then(response => response.json())
    .then(data => {
        if (data.message === 'success' && data.data) {
            const numPractices = data.data.length;
            document.getElementById('practices-per-week').innerHTML = numPractices.toString();
        }
    })
    .catch(err => {
        console.error('Error fetching schedule:', err);
        // Default to 4 if there's an error
        document.getElementById('practices-per-week').innerHTML = '4';
    });

document.addEventListener('DOMContentLoaded', () => {
    const beeGif = document.getElementById('bee-gif');
    if (beeGif) {
        beeGif.addEventListener('click', async () => {
            const password = prompt("The wolf cries, the beez ____");
            if (!password) return;

            const res = await fetch('/api/hightide-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                window.location.href = "/highTide";
            } else {
                alert("It's two Zs prolly");
            }
        });
    }
});