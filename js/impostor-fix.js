// [file name]: impostor/js/impostor-fix.js
// Correcciones críticas para el juego del impostor

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== IMPOSTOR FIX INICIADO ===');
    
    // 1. Forzar que solo la pantalla de configuración sea visible
    setTimeout(function() {
        const allScreens = document.querySelectorAll('.game-screen');
        const setupScreen = document.getElementById('setup-screen');
        
        console.log('Total de pantallas encontradas:', allScreens.length);
        
        // Ocultar todas
        allScreens.forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        
        // Mostrar solo setup
        if (setupScreen) {
            setupScreen.classList.add('active');
            setupScreen.style.display = 'block';
            console.log('Pantalla de configuración activada');
        }
        
        // 2. Asegurar que el historial esté dentro de la pantalla de configuración
        const historyPanel = document.querySelector('.history-panel');
        if (historyPanel && !setupScreen.contains(historyPanel)) {
            // Mover el historial dentro de setup-screen si no está
            setupScreen.appendChild(historyPanel);
            console.log('Historial movido dentro de pantalla de configuración');
        }
        
        // 3. Verificar que los botones de configuración existan
        const playerCountInput = document.getElementById('playerCount');
        const impostorCountInput = document.getElementById('impostorCount');
        
        if (!playerCountInput) {
            console.error('ERROR: No se encontró playerCount');
            alert('Error crítico: No se puede configurar el juego. Recarga la página.');
            return;
        }
        
        console.log('Controles encontrados:', {
            playerCount: !!playerCountInput,
            impostorCount: !!impostorCountInput,
            startButton: !!document.getElementById('start-game')
        });
        
    }, 100);
    
    // 4. Monitorear cambios en la visibilidad de pantallas
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('game-screen')) {
                    console.log('Cambio en pantalla:', target.id, 
                               'active:', target.classList.contains('active'),
                               'display:', window.getComputedStyle(target).display);
                }
            }
        });
    });
    
    // Observar todas las pantallas
    document.querySelectorAll('.game-screen').forEach(screen => {
        observer.observe(screen, { attributes: true });
    });
    
    console.log('=== IMPOSTOR FIX COMPLETADO ===');
});

// Función de emergencia para resetear la vista
window.resetImpostorView = function() {
    console.log('RESET FORZADO DE VISTA');
    
    const allScreens = document.querySelectorAll('.game-screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    const setupScreen = document.getElementById('setup-screen');
    if (setupScreen) {
        setupScreen.classList.add('active');
        setupScreen.style.display = 'block';
    }
    
    // También resetear el juego si existe
    if (window.impostorGame) {
        window.impostorGame.gameState = 'setup';
        window.impostorGame.players = [];
        window.impostorGame.impostors = [];
    }
    
    alert('Vista resetada. La pantalla de configuración debería ser visible ahora.');
};
