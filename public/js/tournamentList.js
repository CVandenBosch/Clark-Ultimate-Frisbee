function formatDate(d) {
    return new Date(d).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}


function get_tournament_object(tournament, idx) {
    const currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    const start = new Date(tournament.dateStart);
    start.setHours(0,0,0,0);
    const end = tournament.dateEnd ? new Date(tournament.dateEnd) : null;

    const isOld = currentDate > start;

    const dateText = end
        ? `${formatDate(start)} → ${formatDate(end)}`
        : formatDate(start);

    const itemClass = isOld ? "list-group-item-old" : "list-group-item-new";

    if (isOld) {
        return `
        <li class="list-group-item d-flex justify-content-between align-items-center ${itemClass}">
            <div>
                <h5 class="mb-1">${tournament.name}</h5>
                <small class="text-muted">${dateText}</small>
            </div>
            <button class="btn btn-outline-secondary show-results-btn" data-id="${tournament._id}">
                Show Results
            </button>
        </li>`;
    } else {
        return `
        <li class="list-group-item d-flex justify-content-between align-items-center ${itemClass}">
            <div>
                <h5 class="mb-1">${tournament.name}</h5>
                <small class="text-muted">${dateText}</small>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-primary signup-button" data-id="${tournament._id}">
                    Sign Up
                </button>
                <button class="btn btn-outline-secondary show-details-btn" data-id="${tournament._id}">
                    Show Details
                </button>
            </div>
        </li>`;
    }
}

function showList(tournaments) {
    $('#tournament_list').empty();
    tournaments.forEach((tournament, idx) => {
        $('#tournament_list').append(get_tournament_object(tournament, idx));
    });
    $('.signup-button').on('click', function () {
        const tournament_id = $(this).data('id');
        console.log(tournament_id);
        location.href = '/tournamentSignUp?tournament_id=' + tournament_id;
    });
    $('.show-details-btn').on('click', function () {
        const tournament_id = $(this).data('id');
        console.log(tournament_id);
        location.href = '/tournamentDetails?tournament_id=' + tournament_id;
    });
    $('.show-results-btn').on('click', function () {
        const tournament_id = $(this).data('id');
        console.log(tournament_id);
        location.href = '/tournamentResults?tournament_id=' + tournament_id;
    });
}

function filterAndSortTournaments() {
    $.getJSON('/get-sorted-tournaments', {
        search_key: $('#search_box').val(),
        type: currentType,
        sortOrder: currentSort
    }).done(function (data) {
        console.log(data);
        showList(data.data);
    });
}

let currentType = "all";
let currentSort = "desc";


filterAndSortTournaments();


document.querySelectorAll(".filter-option").forEach(item => {
    item.addEventListener("click", () => {
        currentType = item.dataset.value;
        document.getElementById("filterLabel").innerText = item.innerText;
        filterAndSortTournaments();
    });
});


document.querySelectorAll(".sort-option").forEach(item => {
    item.addEventListener("click", () => {
        currentSort = item.dataset.value;
        document.getElementById("sortText").textContent = item.innerText;
        filterAndSortTournaments();
    });
});

