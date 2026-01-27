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