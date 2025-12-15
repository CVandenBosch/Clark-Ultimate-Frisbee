const urlParams = new URLSearchParams(window.location.search);
const tournamentId = urlParams.get('tournament_id');

let IS_LOGGED_IN = false;

$.get('/get-current-user').done(res => {
    if (res.data && res.data.username) {
        IS_LOGGED_IN = true;
    }
});

function formatDate(d) {
    return new Date(d).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}



$(document).ready(function () {
    const editLink = document.querySelector('.footer-team-link');
    editLink.href = `/editTournamentDetails?tournament_id=${tournamentId}`;

    $.getJSON('/get-tournament-by-id', { tournament_id: tournamentId })
        .done(function (res) {
            const tournament = res.data;
            $('#tournament-name').text(tournament.name);
            $('#tournament-date').text(
                formatDate(new Date(tournament.dateStart)) +
                (tournament.dateEnd ? ' → ' + formatDate(new Date(tournament.dateEnd)) : '')
            );

            $('#attending-list').empty();
            $('#not-attending-list').empty();
            $('#drivers-list').empty();

            let totalAttending = 0;
            let totalJoans = 0;
            let totalHearts = 0;
            let totalDrivers = 0;

            tournament.players.forEach(p => {
                // Attending / Not Attending
                if (p.attending) {
                    totalAttending++;
                    if (p.isHeart) totalHearts++;
                    else totalJoans++;

                    $('#attending-list').append(`
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${p.name}</span>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-warning text-dark rounded-pill">
                                ${p.isHeart ? 'Heart' : 'Joan'}
                            </span>
                            ${IS_LOGGED_IN ? `<button class="btn btn-danger btn-sm remove-player" data-player-id="${p._id}"> ✕</button>` : ''}
                        </div>
                    </li>
                    `);


                } else {
                    $('#not-attending-list').append(`
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${p.name}
                <span class="badge bg-warning text-dark rounded-pill">${p.isHeart ? 'Heart' : 'Joan'}</span>
            </li>
        `);
                }

                // Drivers
                if (p.canDrive) {
                    totalDrivers++;
                    $('#drivers-list').append(`
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${p.name}
                <span class="badge bg-warning text-dark rounded-pill">Seats: ${p.numSpots}</span>
            </li>
        `);
                }
            });

            $('#stats-total-attending').text(totalAttending);
            $('#stats-total-hearts').text(totalHearts);
            $('#stats-total-joans').text(totalJoans);
            $('#stats-total-drivers').text(totalDrivers);
        })
});

$('#attending-list').on('click', '.remove-player', function () {
    const playerId = $(this).data('player-id');

    if (!confirm('Are you sure you want to remove this player from the tournament?')) {
        return;
    }

    $.ajax({
        url: '/remove-player-from-tournament',
        method: 'POST',
        data: {
            tournamentId: tournamentId,
            playerId: playerId
        }
    })
        .done(() => {
            location.reload();
        })
        .fail(() => {
            alert('You must be logged in to do this.');
        });
});



