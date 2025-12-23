// js/main.js - Archivo principal para la página de inicio

document.addEventListener('DOMContentLoaded', function() {
    console.log('Liga Escolar - Página principal cargada');
    
    // Inicializar el reloj (si clock.js no lo hace automáticamente)
    initializeClock();
    
    // Añadir eventos a las tarjetas "próximamente"
    const comingSoonCards = document.querySelectorAll('.sport-card.coming-soon');
    comingSoonCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('¡Próximamente! Esta funcionalidad estará disponible pronto.', 'info');
        });
    });
    
    // Añadir efecto de carga suave a las tarjetas
    const sportCards = document.querySelectorAll('.sport-card');
    sportCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
});

function initializeClock() {
    // Esta función es redundante si clock.js ya lo hace
    // Pero asegura que el reloj funcione incluso si clock.js falla
    if (typeof updateClock === 'function') {
        // Si clock.js ya tiene esta función, la usamos
        updateClock();
        setInterval(updateClock, 1000);
    } else {
        // Si no, creamos una versión básica
        function updateClockBasic() {
            const now = new Date();
            const clockElement = document.getElementById('clock');
            const dateElement = document.getElementById('date');
            
            if (clockElement) {
                const timeString = now.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
                clockElement.textContent = timeString;
            }
            
            if (dateElement) {
                const dateString = now.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                dateElement.textContent = dateString;
            }
        }
        
        updateClockBasic();
        setInterval(updateClockBasic, 1000);
    }
}

function showNotification(message, type = 'success') {
    // Crear notificación si no existe
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Configurar notificación
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span id="notification-text">${message}</span>
    `;
    
    // Añadir clase de tipo
    notification.className = 'notification';
    if (type !== 'success') {
        notification.classList.add(type);
    }
    
    // Mostrar notificación
    notification.style.display = 'flex';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.style.display = 'none';
            notification.style.animation = '';
        }, 300);
    }, 3000);
}

// Añadir estilos para la animación de fade-in
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .fade-in {
        animation: fadeIn 0.5s ease forwards;
        opacity: 0;
    }
`;
document.head.appendChild(style);
