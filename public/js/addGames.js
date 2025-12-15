$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournament_id');
    $('#tournament-id').val(tournamentId);

    $.getJSON('/get-tournament-by-id', { tournament_id: tournamentId })
        .done(function (res) {
            const tournament = res.data
            $('#tournament-name').text(tournament.name + " Admin Add Games");
        });

    $('#games-container').append(`
            <div class="game-entry row g-3 mb-3 p-3 border rounded">
                <div class="col-md-4">
                    <input type="text" class="form-control" name="opposingTeamName" placeholder="Opposing Team Name" required>
                </div>
                <div class="col-md-2">
                    <input type="number" class="form-control" name="clarkScore" placeholder="Clark Score" required min="0">
                </div>
                <div class="col-md-2">
                    <input type="number" class="form-control" name="opposingTeamScore" placeholder="Opposing Score" required min="0">
                </div>
                <div class="col-md-2 d-flex align-items-center">
                    <button type="button" class="btn btn-danger remove-game-btn">Remove Game</button>
                </div>
            </div>
        `);
    $('#add-game-btn').on('click', function () {
        $('#games-container').append(`
            <div class="game-entry row g-3 mb-3 p-3 border rounded">
                <div class="col-md-4">
                    <input type="text" class="form-control" name="opposingTeamName" placeholder="Opposing Team Name" required>
                </div>
                <div class="col-md-2">
                    <input type="number" class="form-control" name="clarkScore" placeholder="Clark Score" required min="0">
                </div>
                <div class="col-md-2">
                    <input type="number" class="form-control" name="opposingTeamScore" placeholder="Opposing Score" required min="0">
                </div>
                <div class="col-md-2 d-flex align-items-center">
                    <button type="button" class="btn btn-danger remove-game-btn">Remove</button>
                </div>
            </div>
        `);
    });

    $(document).on('click', '.remove-game-btn', function () {
        $(this).closest('.game-entry').remove();
    });

    $('#games-form').on('submit', function (e) {
        e.preventDefault();

        const games = [];
        $('#games-container .game-entry').each(function () {
            const game = {
                opposingTeamName: $(this).find('input[name="opposingTeamName"]').val(),
                clarkScore: parseInt($(this).find('input[name="clarkScore"]').val(), 10),
                opposingTeamScore: parseInt($(this).find('input[name="opposingTeamScore"]').val(), 10)
            };
            games.push(game);
        });

        if (games.length === 0) {
            return alert("Please add at least one game.");
        }

        $.ajax({
            url: '/addGames',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ tournament_id: tournamentId, games }),
            success: function () {
                window.location.href = '/tournamentList';
            },
            error: function (err) {
                console.error(err);
            }
        });
    });
});
