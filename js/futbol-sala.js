// /js/futbol-sala.js
// Marcador completo para fútbol sala con cronómetro, prórroga y sistema de tarjetas

// Variables globales específicas de fútbol sala
window.currentMatch = {
    team1: { 
        name: "Equipo Local", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: [],
        yellowCards: [], // Array de objetos {player: número, reason: string, time: string, period: number}
        blueCards: [],   // Array de objetos {player: número, reason: string, time: string, period: number, fromDoubleYellow: boolean}
        expulsions: []   // Array de objetos {player: número, reason: string, time: string, period: number}
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
    currentPeriod: 1, // 1 = Primer tiempo, 2 = Segundo tiempo, 3 = Prórroga 1, 4 = Prórroga 2
    totalPeriods: 2,
    overtimePeriods: 2,
    isOvertime: false,
    periodDuration: 20 * 60, // 20 minutos en segundos
    overtimeDuration: 5 * 60, // 5 minutos en segundos para prórroga
    timeRemaining: 20 * 60,
    timerRunning: false,
    timerInterval: null,
    startTime: new Date(),
    matchStatus: 'NOT_STARTED', // NOT_STARTED, RUNNING, PAUSED, FINISHED
    winner: null,
    location: "No especificada",
    events: []
};

window.matchHistory = [];
window.editingTeam = null;
window.savingMatchAfterWin = false;
window.pendingCard = null; // {team: 'team1/team2', type: 'yellow/blue'}

// Configuración específica del deporte
window.sportName = "Fútbol Sala";
window.sportUrl = "https://www.ligaescolar.es/futbol-sala/";

// ========== FUNCIONES PRINCIPALES ==========

// Inicialización CORREGIDA - MÁS SIMPLE
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando fútbol sala con sistema de tarjetas...');
    
    // Cargar datos guardados
    loadFromCookies();
    
    // Inicializar la interfaz
    updateDisplay();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Configurar funciones globales
    window.generateShareText = generateShareText;
    window.saveToCookies = saveToCookies;
    window.loadFromCookies = loadFromCookies;
    
    console.log("Fútbol sala inicializado correctamente");
});

// Configurar todos los event listeners - VERSIÓN SIMPLIFICADA
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Controles de tiempo
    document.getElementById('start-timer').addEventListener('click', startTimer);
    document.getElementById('pause-timer').addEventListener('click', pauseTimer);
    document.getElementById('reset-timer').addEventListener('click', resetTimer);
    document.getElementById('next-period').addEventListener('click', nextPeriod);
    document.getElementById('finish-time').addEventListener('click', finishTime);
    
    // Controles de goles
    document.getElementById('team1-add-goal').addEventListener('click', () => addGoal('team1'));
    document.getElementById('team1-remove-goal').addEventListener('click', () => removeGoal('team1'));
    document.getElementById('team2-add-goal').addEventListener('click', () => addGoal('team2'));
    document.getElementById('team2-remove-goal').addEventListener('click', () => removeGoal('team2'));
    
    // Controles de tarjetas amarillas
    document.getElementById('team1-add-yellow').addEventListener('click', () => prepareCard('team1', 'yellow'));
    document.getElementById('team2-add-yellow').addEventListener('click', () => prepareCard('team2', 'yellow'));
    document.getElementById('team1-remove-yellow').addEventListener('click', () => removeLastCard('team1', 'yellow'));
    document.getElementById('team2-remove-yellow').addEventListener('click', () => removeLastCard('team2', 'yellow'));
    
    // Controles de tarjetas azules
    document.getElementById('team1-add-blue').addEventListener('click', () => prepareCard('team1', 'blue'));
    document.getElementById('team2-add-blue').addEventListener('click', () => prepareCard('team2', 'blue'));
    document.getElementById('team1-remove-blue').addEventListener('click', () => removeLastCard('team1', 'blue'));
    document.getElementById('team2-remove-blue').addEventListener('click', () => removeLastCard('team2', 'blue'));
    
    // Controles de faltas con corrección
    document.getElementById('team1-add-foul').addEventListener('click', () => addFoul('team1'));
    document.getElementById('team2-add-foul').addEventListener('click', () => addFoul('team2'));
    document.getElementById('team1-remove-foul').addEventListener('click', () => removeFoul('team1'));
    document.getElementById('team2-remove-foul').addEventListener('click', () => removeFoul('team2'));
    
    // Controles de timeouts con corrección
    document.getElementById('team1-add-timeout').addEventListener('click', () => useTimeout('team1'));
    document.getElementById('team2-add-timeout').addEventListener('click', () => useTimeout('team2'));
    document.getElementById('team1-remove-timeout').addEventListener('click', () => removeTimeout('team1'));
    document.getElementById('team2-remove-timeout').addEventListener('click', () => removeTimeout('team2'));
    
    // Controles del partido
    document.getElementById('activate-overtime').addEventListener('click', activateOvertime);
    document.getElementById('reset-match').addEventListener('click', resetMatch);
    document.getElementById('save-match').addEventListener('click', openSaveMatchModal);
    
    // Modal de tarjetas
    document.getElementById('cancel-card').addEventListener('click', cancelCard);
    document.getElementById('save-card').addEventListener('click', saveCard);
    
    // Ubicación
    document.getElementById('save-location').addEventListener('click', saveLocation);
    document.getElementById('match-location-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveLocation();
    });
    
    // Modal de guardar partido (si existe en este archivo, sino se maneja en modal-manager)
    const cancelSaveBtn = document.getElementById('cancel-save');
    const confirmSaveBtn = document.getElementById('confirm-save');
    const clearHistoryBtn = document.getElementById('clear-history');
    
    if (cancelSaveBtn) cancelSaveBtn.addEventListener('click', closeSaveMatchModal);
    if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', saveCurrentMatch);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearMatchHistory);
    
    console.log('Event listeners configurados');
}

// CORRECCIÓN: Modal de nombres - Usar funciones simples
function openTeamNameModal(team) {
    window.editingTeam = team;
    
    const modal = document.getElementById('team-name-modal');
    const input = document.getElementById('team-name-input');
    
    if (!modal || !input) return;
    
    // Obtener nombre actual
    input.value = window.currentMatch[team].name;
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Enfocar input
    setTimeout(() => input.focus(), 100);
}

function closeTeamNameModal() {
    const modal = document.getElementById('team-name-modal');
    if (modal) modal.style.display = 'none';
    window.editingTeam = null;
}

function saveTeamName() {
    const input = document.getElementById('team-name-input');
    
    if (!input || !window.editingTeam) return;
    
    const newName = input.value.trim();
    if (newName) {
        window.currentMatch[window.editingTeam].name = newName;
        updateDisplay();
        showNotification(`Nombre cambiado a: ${newName}`);
    }
    
    closeTeamNameModal();
}

// CORRECCIÓN: Modal de guardar partido
function openSaveMatchModal() {
    const modal = document.getElementById('save-match-modal');
    const resultEl = document.getElementById('save-match-result');
    const locationEl = document.getElementById('save-match-location');
    const durationEl = document.getElementById('save-match-duration');
    
    if (!modal || !resultEl || !locationEl) return;
    
    // Mostrar información actual
    resultEl.textContent = `${window.currentMatch.team1.name} ${window.currentMatch.team1.score} - ${window.currentMatch.team2.score} ${window.currentMatch.team2.name}`;
    locationEl.textContent = window.currentMatch.location;
    
    // Calcular duración
    const now = new Date();
    const duration = Math.round((now - window.currentMatch.startTime) / 1000 / 60);
    if (durationEl) {
        durationEl.textContent = `${duration} minutos`;
    }
    
    modal.style.display = 'flex';
}

function closeSaveMatchModal() {
    const modal = document.getElementById('save-match-modal');
    if (modal) modal.style.display = 'none';
}

function saveCurrentMatch() {
    const confirmBtn = document.getElementById('confirm-save');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Guardando...';
    }
    
    const now = new Date();
    const duration = Math.round((now - window.currentMatch.startTime) / 1000 / 60);
    
    const matchData = {
        team1: {...window.currentMatch.team1},
        team2: {...window.currentMatch.team2},
        currentPeriod: window.currentMatch.currentPeriod,
        isOvertime: window.currentMatch.isOvertime,
        matchStatus: window.currentMatch.matchStatus,
        winner: window.currentMatch.winner,
        location: window.currentMatch.location,
        date: now.toLocaleString(),
        timestamp: now.getTime(),
        duration: duration,
        events: [...window.currentMatch.events],
        sport: window.sportName
    };
    
    // Inicializar historial si no existe
    if (!Array.isArray(window.matchHistory)) {
        window.matchHistory = [];
    }
    
    window.matchHistory.unshift(matchData);
    
    // Mantener solo los últimos 20
    if (window.matchHistory.length > 20) {
        window.matchHistory = window.matchHistory.slice(0, 20);
    }
    
    // Guardar en cookies
    saveToCookies();
    
    // Cerrar modal
    closeSaveMatchModal();
    
    // Restaurar botón
    if (confirmBtn) {
        setTimeout(() => {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Guardar Partido';
        }, 1000);
    }
    
    // Mostrar notificación
    showNotification("Partido guardado en el historial");
    
    // Si se guardaba después de victoria, reiniciar
    if (window.savingMatchAfterWin) {
        setTimeout(() => {
            resetMatch();
            window.savingMatchAfterWin = false;
        }, 1000);
    }
}

function clearMatchHistory() {
    if (confirm("¿Borrar todo el historial de partidos?")) {
        window.matchHistory = [];
        saveToCookies();
        showNotification("Historial borrado");
    }
}

// NUEVA FUNCIÓN: Finalizar tiempo manualmente
function finishTime() {
    if (window.currentMatch.matchStatus === 'FINISHED') return;
    
    if (confirm("¿Finalizar el tiempo actual? Esto pasará al siguiente periodo.")) {
        // Parar cronómetro si está corriendo
        if (window.currentMatch.matchStatus === 'RUNNING') {
            clearInterval(window.currentMatch.timerInterval);
        }
        
        // Poner tiempo a 0
        window.currentMatch.timeRemaining = 0;
        
        // Registrar evento
        const periodName = window.currentMatch.isOvertime ? 
            `prórroga ${window.currentMatch.currentPeriod - window.currentMatch.totalPeriods}` : 
            `${window.currentMatch.currentPeriod}° tiempo`;
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'period_end_manual',
            description: `${periodName} finalizado manualmente`
        });
        
        // Manejar fin del periodo
        handlePeriodEnd();
    }
}

// Función para manejar fin del periodo
function handlePeriodEnd() {
    // Verificar si es el último periodo
    if (!window.currentMatch.isOvertime && window.currentMatch.currentPeriod === window.currentMatch.totalPeriods) {
        // Verificar empate para prórroga
        if (window.currentMatch.team1.score === window.currentMatch.team2.score) {
            showNotification('¡Empate! Puedes activar la prórroga', 'info');
            window.currentMatch.matchStatus = 'PAUSED';
        } else {
            endMatch();
        }
    } else if (window.currentMatch.isOvertime && 
               (window.currentMatch.currentPeriod - window.currentMatch.totalPeriods) === window.currentMatch.overtimePeriods) {
        endMatch();
    } else {
        // Pasar al siguiente periodo
        nextPeriod();
    }
    
    updateDisplay();
}

// Actualizar la interfaz
function updateDisplay() {
    // Actualizar nombres de equipos
    document.getElementById('team1-name').textContent = window.currentMatch.team1.name;
    document.getElementById('team2-name').textContent = window.currentMatch.team2.name;
    
    // Actualizar marcador de goles
    document.getElementById('team1-score').textContent = window.currentMatch.team1.score;
    document.getElementById('team2-score').textContent = window.currentMatch.team2.score;
    
    // Actualizar tarjetas amarillas
    document.getElementById('team1-yellow-cards').textContent = window.currentMatch.team1.yellowCards.length;
    document.getElementById('team2-yellow-cards').textContent = window.currentMatch.team2.yellowCards.length;
    
    // Actualizar tarjetas azules
    document.getElementById('team1-blue-cards').textContent = window.currentMatch.team1.blueCards.length;
    document.getElementById('team2-blue-cards').textContent = window.currentMatch.team2.blueCards.length;
    
    // Actualizar timeouts y faltas
    document.getElementById('team1-timeouts').textContent = window.currentMatch.team1.timeouts;
    document.getElementById('team2-timeouts').textContent = window.currentMatch.team2.timeouts;
    document.getElementById('team1-fouls').textContent = window.currentMatch.team1.fouls;
    document.getElementById('team2-fouls').textContent = window.currentMatch.team2.fouls;
    
    // Renderizar expulsiones
    renderExpulsions('team1');
    renderExpulsions('team2');
    
    // Actualizar información del periodo
    updatePeriodDisplay();
    
    // Actualizar estado del partido
    updateMatchStatus();
    
    // Actualizar cronómetro
    updateTimerDisplay();
    
    // Actualizar historial de eventos
    renderEvents();
    
    // Actualizar ubicación
    document.getElementById('current-location').textContent = window.currentMatch.location;
    
    // Guardar cambios
    saveToCookies();
}

// [MANTENER TODAS LAS FUNCIONES EXISTENTES SIN CAMBIAR]
// updatePeriodDisplay, updateMatchStatus, updateTimerDisplay, startTimer, pauseTimer,
// resetTimer, nextPeriod, endMatch, activateOvertime, addGoal, removeGoal,
// addFoul, removeFoul, useTimeout, removeTimeout, prepareCard, cancelCard, saveCard,
// removeLastCard, renderExpulsions, removeExpulsion, resetMatch, renderEvents,
// getCurrentTime, saveLocation, generateShareText, formatTime, saveToCookies,
// loadFromCookies, generateHistoryText

// [TODAS LAS FUNCIONES ANTERIORES SE MANTIENEN IGUAL, SOLO SE AÑADEN LAS CORRECCIONES ARRIBA]

// Función para mostrar notificaciones (si no existe en common.js)
function showNotification(message, type = 'success') {
    const notificationEl = document.getElementById('notification');
    const notificationTextEl = document.getElementById('notification-text');
    
    if (!notificationEl || !notificationTextEl) return;
    
    notificationTextEl.textContent = message;
    notificationEl.className = `notification ${type}`;
    notificationEl.style.display = 'flex';
    
    setTimeout(() => {
        notificationEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notificationEl.style.display = 'none';
            notificationEl.style.animation = '';
        }, 300);
    }, 3000);
}

// Asegurar que las funciones estén disponibles globalmente
window.openTeamNameModal = openTeamNameModal;
window.closeTeamNameModal = closeTeamNameModal;
window.saveTeamName = saveTeamName;
window.openSaveMatchModal = openSaveMatchModal;
window.closeSaveMatchModal = closeSaveMatchModal;
window.saveCurrentMatch = saveCurrentMatch;
window.clearMatchHistory = clearMatchHistory;
window.showNotification = showNotification;
