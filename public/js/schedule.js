function get_schedule_object(schedule, idx) {
    return `
           <li class="rounded-lg px-4 py-3 ${idx % 2 === 0 ? 'bg-base-100/30' : 'bg-base-100/15'}">
                <div class="grid grid-cols-3 text-center">
                    <div><strong>${schedule.day}</strong></div>
                    <div>${schedule.time}</div>
                    <div>${schedule.location}</div>
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