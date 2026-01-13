// /js/futbol-sala.js - VERSIÓN CORREGIDA Y ROBUSTA
window.currentMatch = {
    team1: { name: "Equipo Local", score: 0, timeouts: 1, fouls: 0, yellowCards: [], blueCards: [], expulsions: [] },
    team2: { name: "Equipo Visitante", score: 0, timeouts: 1, fouls: 0, yellowCards: [], blueCards: [], expulsions: [] },
    currentPeriod: 1,
    timeRemaining: 20 * 60,
    timerRunning: false,
    isOvertime: false,
    matchStatus: 'NOT_STARTED',
    location: "No especificada",
    events: []
};

window.pendingCard = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando fútbol sala...');
    
    if (window.common && window.common.initCommonEventListeners) window.common.initCommonEventListeners();
    if (window.modalManager && window.modalManager.initModalEventListeners) window.modalManager.initModalEventListeners();
    
    // Configurar listeners primero
    setupEventListeners();
    // Luego actualizar pantalla (con seguridad)
    updateDisplay();
});

function setupEventListeners() {
    const addListener = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    };

    // Tiempo
    addListener('start-timer', 'click', startTimer);
    addListener('pause-timer', 'click', pauseTimer);
    addListener('reset-timer', 'click', resetTimer);
    
    // Goles
    addListener('team1-add-goal', 'click', () => addGoal('team1'));
    addListener('team2-add-goal', 'click', () => addGoal('team2'));

    // Tarjetas con modal
    addListener('team1-add-yellow', 'click', () => prepareCard('team1', 'yellow'));
    addListener('team2-add-yellow', 'click', () => prepareCard('team2', 'yellow'));
    addListener('team1-add-blue', 'click', () => prepareCard('team1', 'blue'));
    addListener('team2-add-blue', 'click', () => prepareCard('team2', 'blue'));
    
    addListener('save-card', 'click', saveCard);
    addListener('cancel-card', 'click', closeCardModal);

    // Faltas y Timeouts
    addListener('team1-add-foul', 'click', () => addFoul('team1'));
    addListener('team2-add-foul', 'click', () => addFoul('team2'));
    addListener('team1-add-timeout', 'click', () => useTimeout('team1'));
    addListener('team2-add-timeout', 'click', () => useTimeout('team2'));

    addListener('reset-match', 'click', () => { if(confirm("¿Reiniciar?")) location.reload(); });
}

function updateDisplay() {
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    safeSetText('team1-name', window.currentMatch.team1.name);
    safeSetText('team2-name', window.currentMatch.team2.name);
    safeSetText('team1-score', window.currentMatch.team1.score);
    safeSetText('team2-score', window.currentMatch.team2.score);
    safeSetText('team1-yellow-cards', window.currentMatch.team1.yellowCards.length);
    safeSetText('team2-yellow-cards', window.currentMatch.team2.yellowCards.length);
    safeSetText('team1-blue-cards', window.currentMatch.team1.blueCards.length);
    safeSetText('team2-blue-cards', window.currentMatch.team2.blueCards.length);
    safeSetText('team1-fouls', window.currentMatch.team1.fouls);
    safeSetText('team2-fouls', window.currentMatch.team2.fouls);
    safeSetText('team1-timeouts', window.currentMatch.team1.timeouts);
    safeSetText('team2-timeouts', window.currentMatch.team2.timeouts);
    
    updatePeriodDisplay();
    updateTimerDisplay();
}

function updatePeriodDisplay() {
    let pText = window.currentMatch.isOvertime ? 'Prórroga' : `${window.currentMatch.currentPeriod}° Tiempo`;
    const el1 = document.getElementById('current-period');
    const el2 = document.getElementById('period-info');
    const el3 = document.getElementById('overtime-status');
    
    if (el1) el1.textContent = pText;
    if (el2) el2.textContent = pText;
    if (el3) el3.textContent = window.currentMatch.isOvertime ? 'Sí' : 'No';
}

function updateTimerDisplay() {
    const m = Math.floor(window.currentMatch.timeRemaining / 60);
    const s = window.currentMatch.timeRemaining % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    const el1 = document.getElementById('main-timer');
    const el2 = document.getElementById('match-timer');
    if (el1) el1.textContent = timeStr;
    if (el2) el2.textContent = timeStr;
}

function prepareCard(team, type) {
    window.pendingCard = { team, type };
    const modal = document.getElementById('card-modal');
    if (modal) modal.style.display = 'flex';
}

function closeCardModal() {
    const modal = document.getElementById('card-modal');
    if (modal) modal.style.display = 'none';
}

function saveCard() {
    if (!window.pendingCard) return;
    const { team, type } = window.pendingCard;
    const player = document.getElementById('card-player-number').value || 'S/N';
    
    if (type === 'yellow') window.currentMatch[team].yellowCards.push({ player });
    else window.currentMatch[team].blueCards.push({ player });
    
    updateDisplay();
    closeCardModal();
}

function addGoal(team) { window.currentMatch[team].score++; updateDisplay(); }
function addFoul(team) { window.currentMatch[team].fouls++; updateDisplay(); }
function useTimeout(team) { if(window.currentMatch[team].timeouts > 0) { window.currentMatch[team].timeouts--; updateDisplay(); } }

function startTimer() { 
    if(window.timerInterval) return;
    window.currentMatch.matchStatus = 'RUNNING';
    window.timerInterval = setInterval(() => {
        if(window.currentMatch.timeRemaining > 0) {
            window.currentMatch.timeRemaining--;
            updateTimerDisplay();
        } else {
            clearInterval(window.timerInterval);
            window.timerInterval = null;
        }
    }, 1000);
    document.getElementById('match-status').textContent = "En juego";
}

function pauseTimer() {
    clearInterval(window.timerInterval);
    window.timerInterval = null;
    document.getElementById('match-status').textContent = "Pausado";
}
