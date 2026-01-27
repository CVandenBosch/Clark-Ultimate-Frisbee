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

    $('#tournament_id').val(tournamentId);

    $.getJSON('/get-tournament-by-id', { tournament_id: tournamentId })
        .done(function (res) {
            if (res.message !== "success" || !res.data) return alert("Tournament not found");

            const tournament = res.data;
            $('#tournament-name').text(tournament.name);
            $('#tournament-date').text(formatDate(new Date(tournament.dateStart)) + (tournament.dateEnd ? ' → ' + formatDate(new Date(tournament.dateEnd)) : ''));
        });

    $("#attending").on("change", function () {
        if ($(this).val() === "true") {
            $("#drive").show();
        } else {
            $("#drive").hide();
        }
    });

    $("#canDrive").on("change", function () {
        if ($(this).val() === "true") {
            $("#driveFields").show();
        } else {
            $("#driveFields").hide();
        }
    });

});