$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournament_id');

    $('#tournament_id').val(tournamentId);

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