const startingYear = 2005;
const currentYear = new Date().getFullYear();
const yearsAsTeam = currentYear - startingYear;

document.getElementById('team-years').innerHTML = yearsAsTeam.toString();