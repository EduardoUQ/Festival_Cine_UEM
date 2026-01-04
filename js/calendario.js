
document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        height: 'auto',
        fixedWeekCount: false,

        headerToolbar: {
            left: 'prev',
            center: 'title',
            right: 'next'
        },

        events: [
            {
                title: 'Taller de Guion',
                start: '2024-12-05'
            },
            {
                title: 'Proyección Especial',
                start: '2024-12-12'
            },
            {
                title: 'Evento Urgente',
                start: '2024-12-15',
                classNames: ['urgent-event']
            }
        ],

        dateClick: function (info) {
            console.log('Fecha seleccionada:', info.dateStr);
            // Aquí luego cargas los detalles del día
        },

        eventClick: function (info) {
            console.log('Evento:', info.event.title);
            // Aquí puedes abrir modal o panel lateral
        }
    });

    calendar.render();
});

