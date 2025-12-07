// Función para actualizar el reloj
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    const clockElement = document.getElementById('clock');
    const dateElement = document.getElementById('date');
    
    if (clockElement) {
        clockElement.textContent = timeString;
    }
    
    if (dateElement) {
        dateElement.textContent = dateString;
    }
}

// Inicializar reloj si hay elementos en la página
document.addEventListener('DOMContentLoaded', function() {
    const clockElement = document.getElementById('clock');
    const dateElement = document.getElementById('date');
    
    if (clockElement && dateElement) {
        updateClock();
        setInterval(updateClock, 1000);
    }
});
