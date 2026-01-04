// /js/futbol-sala.js (VERSIÓN CORREGIDA - SOLO PARTE CRÍTICA MODIFICADA)

// Variables globales (mantener igual)
window.currentMatch = {
    team1: { 
        name: "Equipo Local", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: [],
        yellowCards: [],
        blueCards: [],
        expulsions: []
    },
    team2: { 
        name: "Equipo Visitante", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: [],
        yellowCards: [],
        blueCards: [],
        expulsions: []
    },
    currentPeriod: 1,
    totalPeriods: 2,
    overtimePeriods: 2,
    isOvertime: false,
    periodDuration: 20 * 60,
    overtimeDuration: 5 * 60,
    timeRemaining: 20 * 60,
    timerRunning: false,
    timerInterval: null,
    startTime: new Date(),
    matchStatus: 'NOT_STARTED',
    winner: null,
    location: "No especificada",
    events: []
};

window.matchHistory = [];
window.editingTeam = null;
window.savingMatchAfterWin = false;
window.pendingCard = null;

// Configuración específica del deporte
window.sportName = "Fútbol Sala";
window.sportUrl = "https://www.ligaescolar.es/futbol-sala/";

// CORRECCIÓN: Inicialización optimizada
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando fútbol sala con sistema de tarjetas...');
    
    // Cargar datos guardados
    loadFromCookies();
    
    // Configurar funciones globales
    window.generateShareText = generateShareText;
    window.saveToCookies = saveToCookies;
    window.loadFromCookies = loadFromCookies;
    
    // Inicializar event listeners comunes
    if (window.common && window.common.initCommonEventListeners) {
        window.common.initCommonEventListeners();
    }
    
    // Inicializar event listeners de modales
    if (window.modalManager && window.modalManager.initModalEventListeners) {
        window.modalManager.initModalEventListeners();
    }
    
    // Configurar event listeners específicos de fútbol sala
    setupEventListeners();
    
    // Inicializar la interfaz
    updateDisplay();
    
    console.log("Fútbol sala inicializado correctamente");
});

// Configurar event listeners específicos (mantener igual pero asegurar que no haya conflictos)
function setupEventListeners() {
    console.log('Configurando event listeners específicos...');
    
    // Controles de tiempo
    document.getElementById('start-timer')?.addEventListener('click', startTimer);
    document.getElementById('pause-timer')?.addEventListener('click', pauseTimer);
    document.getElementById('reset-timer')?.addEventListener('click', resetTimer);
    document.getElementById('next-period')?.addEventListener('click', nextPeriod);
    document.getElementById('finish-time')?.addEventListener('click', finishTime);
    
    // Controles de goles
    document.getElementById('team1-add-goal')?.addEventListener('click', () => addGoal('team1'));
    document.getElementById('team1-remove-goal')?.addEventListener('click', () => removeGoal('team1'));
    document.getElementById('team2-add-goal')?.addEventListener('click', () => addGoal('team2'));
    document.getElementById('team2-remove-goal')?.addEventListener('click', () => removeGoal('team2'));
    
    // Controles de tarjetas amarillas
    document.getElementById('team1-add-yellow')?.addEventListener('click', () => prepareCard('team1', 'yellow'));
    document.getElementById('team2-add-yellow')?.addEventListener('click', () => prepareCard('team2', 'yellow'));
    document.getElementById('team1-remove-yellow')?.addEventListener('click', () => removeLastCard('team1', 'yellow'));
    document.getElementById('team2-remove-yellow')?.addEventListener('click', () => removeLastCard('team2', 'yellow'));
    
    // Controles de tarjetas azules
    document.getElementById('team1-add-blue')?.addEventListener('click', () => prepareCard('team1', 'blue'));
    document.getElementById('team2-add-blue')?.addEventListener('click', () => prepareCard('team2', 'blue'));
    document.getElementById('team1-remove-blue')?.addEventListener('click', () => removeLastCard('team1', 'blue'));
    document.getElementById('team2-remove-blue')?.addEventListener('click', () => removeLastCard('team2', 'blue'));
    
    // Controles de faltas
    document.getElementById('team1-add-foul')?.addEventListener('click', () => addFoul('team1'));
    document.getElementById('team2-add-foul')?.addEventListener('click', () => addFoul('team2'));
    document.getElementById('team1-remove-foul')?.addEventListener('click', () => removeFoul('team1'));
    document.getElementById('team2-remove-foul')?.addEventListener('click', () => removeFoul('team2'));
    
    // Controles de timeouts
    document.getElementById('team1-add-timeout')?.addEventListener('click', () => useTimeout('team1'));
    document.getElementById('team2-add-timeout')?.addEventListener('click', () => useTimeout('team2'));
    document.getElementById('team1-remove-timeout')?.addEventListener('click', () => removeTimeout('team1'));
    document.getElementById('team2-remove-timeout')?.addEventListener('click', () => removeTimeout('team2'));
    
    // Controles del partido
    document.getElementById('activate-overtime')?.addEventListener('click', activateOvertime);
    document.getElementById('reset-match')?.addEventListener('click', resetMatch);
    document.getElementById('save-match')?.addEventListener('click', () => {
        if (window.modalManager && window.modalManager.openSaveMatchModal) {
            window.modalManager.openSaveMatchModal();
        }
    });
    
    // Modal de tarjetas
    document.getElementById('cancel-card')?.addEventListener('click', cancelCard);
    document.getElementById('save-card')?.addEventListener('click', saveCard);
    
    console.log('Event listeners específicos configurados');
}

// CORRECCIÓN: Añadir esta función para cerrar modales haciendo clic fuera
function setupModalClickOutside() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                // Limpiar variables si es necesario
                if (this.id === 'team-name-modal') {
                    window.editingTeam = null;
                }
                if (this.id === 'card-modal') {
                    window.pendingCard = null;
                }
            }
        });
    });
}

// Llamar a esta función después de DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupModalClickOutside, 100);
});

// EL RESTO DEL ARCHIVO PERMANECE IGUAL (todas las funciones de gestión del juego)
// ... (mantener todas las funciones existentes: updateDisplay, startTimer, etc.)
