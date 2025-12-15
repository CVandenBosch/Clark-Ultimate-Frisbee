function get_schedule_object(schedule, idx) {
    return `
           <li class="list-group-item" style="background-color: background-color: rgba(255, 255, 255, 0.3);">
                <div class="row text-center ${idx % 2 === 0 ? 'even_row' : 'odd_row'}">
                    <div class="col-4"><strong>${schedule.day}</strong></div>
                    <div class="col-4">${schedule.time}</div>
                    <div class="col-4">${schedule.location}</div>
                </div>
           </li>
`
}

function toggleMap(mapId) {
    const mapContent = document.getElementById(mapId);
    const toggleIcon = document.getElementById(mapId.replace('-map', '-toggle'));

    mapContent.classList.toggle('show');
    toggleIcon.classList.toggle('rotated');
}

function showList(schedule) {
    $('#schedule_list').empty();
    schedule.forEach((schedule, idx) => {
        $('#schedule_list').append(get_schedule_object(schedule, idx));
    });
}

$.getJSON('/get-schedule')
    .done(data => {
        if(data.message === 'success') {
            showList(data.data);
        }
    });