function formatDate(d) {
    return new Date(d).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournament_id');
    const editLink = document.querySelector('.footer-team-link');
    editLink.href = '/addGames?tournament_id=' + tournamentId;

    $.getJSON('/get-tournament-by-id', { tournament_id: tournamentId })
        .done(function (res) {
            if (res.message !== "success" || !res.data) return alert("Tournament not found");

            const tournament = res.data;
            $('#tournament-name').text(tournament.name);
            $('#tournament-date').text(formatDate(new Date(tournament.dateStart)) + (tournament.dateEnd ? ' → ' + formatDate(new Date(tournament.dateEnd)) : ''));

            if (tournament.players && tournament.players.length > 0) {
                $('#player-list').empty();
                tournament.players
                    .filter(p => p.attending)
                    .forEach(p => {
                        $('#player-list').append(`
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                ${p.name}
                                <span class="badge bg-warning text-dark rounded-pill">${p.isHeart ? 'Heart' : 'Joan'}</span>
                            </li>
                        `);
                    });
                $('#player-header').show();
            } else {
                $('#player-header').closest('h2').hide();
            }

            if ($('#game-list').length) {
                $('#game-list').empty();
                tournament.games.forEach(g => {
                    $('#game-list').append(`
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>Clark vs ${g.opposingTeamName}</span>
                            <span>${g.clarkScore} – ${g.opposingTeamScore}</span>
                        </li>
                    `);

                });
            }
        });
});

