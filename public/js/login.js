const urlParams = new URLSearchParams(window.location.search);
const redirect = urlParams.get('redirect') || '/';
document.getElementById('redirectTo').value = redirect;