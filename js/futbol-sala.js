// /js/futbol-sala.js - VERSIÓN DEFINITIVA CORREGIDA
window.currentMatch = {
    team1: { name: "Equipo Local", score: 0, timeouts: 1, fouls: 0, yellowCards: [], blueCards: [] },
    team2: { name: "Equipo Visitante", score: 0, timeouts: 1, fouls: 0, yellowCards: [], blueCards: [] },
    currentPeriod: 1,
    timeRemaining: 20 * 60,
    timerRunning: false,
    isOvertime: false,
    matchStatus: 'NOT_STARTED',
    events: []
};

window.pendingCard = null;
window.timerInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Fútbol sala: Inicializando sistema...');
    
    // Configurar todos los botones
    setupEventListeners();
    
    // Activar edición de nombres
    setupEditableNames();
    
    // Primera actualización de la pantalla
    updateDisplay();
});

function setupEventListeners() {
    const addListener = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    };

    // --- CONTROLES DE TIEMPO ---
    addListener('start-timer', 'click', startTimer);
    addListener('pause-timer', 'click', pauseTimer);
    addListener('reset-timer', 'click', resetTimer);
    addListener('next-period', 'click', nextPeriod);
    
    // --- GOLES ---
    addListener('team1-add-goal', 'click', () => addGoal('team1'));
    addListener('team2-add-goal', 'click', () => addGoal('team2'));

    // --- TARJETAS (AÑADIR) ---
    addListener('team1-add-yellow', 'click', () => prepareCard('team1', 'yellow'));
    addListener('team2-add-yellow', 'click', () => prepareCard('team2', 'yellow'));
    addListener('team1-add-blue', 'click', () => prepareCard('team1', 'blue'));
    addListener('team2-add-blue', 'click', () => prepareCard('team2', 'blue'));

    // --- TARJETAS (RESTAR) ---
    addListener('team1-remove-yellow', 'click', () => removeCard('team1', 'yellow'));
    addListener('team2-remove-yellow', 'click', () => removeCard('team2', 'yellow'));
    addListener('team1-remove-blue', 'click', () => removeCard('team1', 'blue'));
    addListener('team2-remove-blue', 'click', () => removeCard('team2', 'blue'));
    
    // --- MODAL DE TARJETAS ---
    addListener('save-card', 'click', saveCard);
    addListener('cancel-card', 'click', closeCardModal);

    // --- FALTAS Y TIMEOUTS ---
    addListener('team1-add-foul', 'click', () => addFoul('team1'));
    addListener('team2-add-foul', 'click', () => addFoul('team2'));
    addListener('team1-add-timeout', 'click', () => useTimeout('team1'));
    addListener('team2-add-timeout', 'click', () => useTimeout('team2'));

    // --- REINICIAR TODO ---
    addListener('reset-match', 'click', () => {
        if(confirm("¿Seguro que quieres reiniciar todo el partido?")) location.reload();
    });
}

// Permitir cambiar nombres al hacer clic
function setupEditableNames() {
    ['team1-name', 'team2-name'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.cursor = "pointer";
            el.addEventListener('click', function() {
                const teamKey = id.includes('team1') ? 'team1' : 'team2';
                const newName = prompt("Nombre del equipo:", window.currentMatch[teamKey].name);
                if (newName) {
                    window.currentMatch[teamKey].name = newName;
                    updateDisplay();
                }
            });
        }
    });
}

// --- ACTUALIZACIÓN DE PANTALLA ---
function updateDisplay() {
    const safeSet = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    safeSet('team1-name', window.currentMatch.team1.name);
    safeSet('team2-name', window.currentMatch.team2.name);
    safeSet('team1-score', window.currentMatch.team1.score);
    safeSet('team2-score', window.currentMatch.team2.score);
    safeSet('team1-yellow-cards', window.currentMatch.team1.yellowCards.length);
    safeSet('team2-yellow-cards', window.currentMatch.team2.yellowCards.length);
    safeSet('team1-blue-cards', window.currentMatch.team1.blueCards.length);
    safeSet('team2-blue-cards', window.currentMatch.team2.blueCards.length);
    safeSet('team1-fouls', window.currentMatch.team1.fouls);
    safeSet('team2-fouls', window.currentMatch.team2.fouls);
    safeSet('team1-timeouts', window.currentMatch.team1.timeouts);
    safeSet('team2-timeouts', window.currentMatch.team2.timeouts);
    
    const pText = window.currentMatch.isOvertime ? 'Prórroga' : `${window.currentMatch.currentPeriod}° Tiempo`;
    safeSet('current-period', pText);
    safeSet('period-info', pText);
    
    updateTimerDisplay();
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

// --- FUNCIONES DE TIEMPO ---
function startTimer() { 
    if(window.timerInterval) return;
    window.timerInterval = setInterval(() => {
        if(window.currentMatch.timeRemaining > 0) {
            window.currentMatch.timeRemaining--;
            updateTimerDisplay();
        } else {
            pauseTimer();
            alert("¡Fin del tiempo!");
        }
    }, 1000);
    const status = document.getElementById('match-status');
    if(status) status.textContent = "En juego";
}

function pauseTimer() {
    clearInterval(window.timerInterval);
    window.timerInterval = null;
    const status = document.getElementById('match-status');
    if(status) status.textContent = "Pausado";
}

function resetTimer() {
    pauseTimer();
    window.currentMatch.timeRemaining = 20 * 60;
    updateTimerDisplay();
}

function nextPeriod() {
    pauseTimer();
    if (window.currentMatch.currentPeriod < 2) {
        window.currentMatch.currentPeriod++;
        window.currentMatch.timeRemaining = 20 * 60;
    } else if (!window.currentMatch.isOvertime) {
        if(confirm("¿Pasar a Prórroga?")) {
            window.currentMatch.isOvertime = true;
            window.currentMatch.timeRemaining = 5 * 60;
        }
    }
    updateDisplay();
}

// --- ACCIONES DE JUEGO ---
function addGoal(team) { window.currentMatch[team].score++; updateDisplay(); }
function addFoul(team) { window.currentMatch[team].fouls++; updateDisplay(); }
function useTimeout(team) { 
    if(window.currentMatch[team].timeouts > 0) {
        window.currentMatch[team].timeouts--;
        updateDisplay();
    }
}

// --- GESTIÓN DE TARJETAS ---
function prepareCard(team, type) {
    window.pendingCard = { team, type };
    const modal = document.getElementById('card-modal');
    const title = document.getElementById('card-modal-title');
    if (title) title.textContent = `Tarjeta ${type === 'yellow' ? 'AMARILLA' : 'AZUL'}`;
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
    document.getElementById('card-player-number').value = '';
}

function removeCard(team, type) {
    if (type === 'yellow') window.currentMatch[team].yellowCards.pop();
    else window.currentMatch[team].blueCards.pop();
    updateDisplay();
}
