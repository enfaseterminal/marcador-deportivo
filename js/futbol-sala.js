// /js/futbol-sala.js - VERSIÓN CORREGIDA
window.currentMatch = {
    team1: { name: "Equipo Local", score: 0, timeouts: 1, fouls: 0, yellowCards: [], blueCards: [], expulsions: [] },
    team2: { name: "Equipo Visitante", score: 0, timeouts: 1, fouls: 0, yellowCards: [], blueCards: [], expulsions: [] },
    currentPeriod: 1,
    timeRemaining: 20 * 60,
    timerRunning: false,
    isOvertime: false,
    startTime: new Date(),
    matchStatus: 'NOT_STARTED',
    location: "No especificada",
    events: []
};

window.pendingCard = null;
window.matchHistory = window.matchHistory || [];

document.addEventListener('DOMContentLoaded', function() {
    if (window.common && window.common.initCommonEventListeners) window.common.initCommonEventListeners();
    if (window.modalManager && window.modalManager.initModalEventListeners) window.modalManager.initModalEventListeners();
    
    setupEventListeners();
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
    addListener('finish-time', 'click', endPeriod);

    // Goles
    addListener('team1-add-goal', 'click', () => addGoal('team1'));
    addListener('team2-add-goal', 'click', () => addGoal('team2'));

    // TARJETAS (CORRECCIÓN AQUÍ)
    addListener('team1-add-yellow', 'click', () => prepareCard('team1', 'yellow'));
    addListener('team2-add-yellow', 'click', () => prepareCard('team2', 'yellow'));
    addListener('team1-add-blue', 'click', () => prepareCard('team1', 'blue'));
    addListener('team2-add-blue', 'click', () => prepareCard('team2', 'blue'));
    
    // Botones del Modal de Tarjetas (Lo que faltaba)
    addListener('save-card', 'click', saveCard);
    addListener('cancel-card', 'click', closeCardModal);

    // Faltas y Timeouts
    addListener('team1-add-foul', 'click', () => addFoul('team1'));
    addListener('team2-add-foul', 'click', () => addFoul('team2'));
    addListener('team1-add-timeout', 'click', () => useTimeout('team1'));
    addListener('team2-add-timeout', 'click', () => useTimeout('team2'));

    // Otros
    addListener('save-location', 'click', saveLocation);
    addListener('reset-match', 'click', resetMatch);
}

// --- GESTIÓN DE TARJETAS ---

function prepareCard(team, type) {
    window.pendingCard = { team, type };
    const modal = document.getElementById('card-modal');
    const title = document.getElementById('card-modal-title');
    const teamName = window.currentMatch[team].name;
    const typeName = type === 'yellow' ? 'AMARILLA' : 'AZUL';
    
    if (title) title.textContent = `Tarjeta ${typeName} - ${teamName}`;
    if (modal) modal.style.display = 'flex';
}

function closeCardModal() {
    const modal = document.getElementById('card-modal');
    if (modal) modal.style.display = 'none';
    window.pendingCard = null;
    document.getElementById('card-player-number').value = '';
    document.getElementById('card-reason').value = '';
}

function saveCard() {
    if (!window.pendingCard) return;
    
    const playerNum = document.getElementById('card-player-number').value || 'S/N';
    const reason = document.getElementById('card-reason').value || 'Falta reglamentaria';
    const { team, type } = window.pendingCard;
    const teamObj = window.currentMatch[team];
    const time = document.getElementById('match-timer').textContent;

    const card = { player: playerNum, reason, time, period: window.currentMatch.currentPeriod };

    if (type === 'yellow') {
        // Lógica de doble amarilla
        const prevYellow = teamObj.yellowCards.find(c => c.player === playerNum);
        teamObj.yellowCards.push(card);
        if (prevYellow) {
            registerExpulsion(team, playerNum, "Doble Amarilla", time);
        }
    } else {
        teamObj.blueCards.push(card);
        registerExpulsion(team, playerNum, "Tarjeta Azul", time);
    }

    logEvent(team, `Tarjeta ${type === 'yellow'?'Amarilla':'Azul'} - Jugador #${playerNum} (${reason})`);
    updateDisplay();
    closeCardModal();
}

function registerExpulsion(team, player, reason, time) {
    window.currentMatch[team].expulsions.push({ player, reason, time });
}

// --- FUNCIONES DE APOYO ---

function addGoal(team) {
    window.currentMatch[team].score++;
    logEvent(team, `¡GOL! (${window.currentMatch.team1.score} - ${window.currentMatch.team2.score})`);
    updateDisplay();
}

function addFoul(team) {
    window.currentMatch[team].fouls++;
    logEvent(team, `Falta cometida (${window.currentMatch[team].fouls})`);
    updateDisplay();
}

function logEvent(team, desc) {
    const time = document.getElementById('match-timer').textContent;
    window.currentMatch.events.unshift({ time, team, description: desc });
}

function updateDisplay() {
    document.getElementById('team1-score').textContent = window.currentMatch.team1.score;
    document.getElementById('team2-score').textContent = window.currentMatch.team2.score;
    document.getElementById('team1-yellow-cards').textContent = window.currentMatch.team1.yellowCards.length;
    document.getElementById('team2-yellow-cards').textContent = window.currentMatch.team2.yellowCards.length;
    document.getElementById('team1-blue-cards').textContent = window.currentMatch.team1.blueCards.length;
    document.getElementById('team2-blue-cards').textContent = window.currentMatch.team2.blueCards.length;
    document.getElementById('team1-fouls').textContent = window.currentMatch.team1.fouls;
    document.getElementById('team2-fouls').textContent = window.currentMatch.team2.fouls;
    renderEvents();
}

function renderEvents() {
    const list = document.getElementById('events-list');
    if (!list) return;
    list.innerHTML = window.currentMatch.events.map(e => `
        <div class="event-item">
            <strong>${e.time}</strong> - ${e.description}
        </div>
    `).join('');
}

// Lógica de Cronómetro Simplificada
function startTimer() { window.currentMatch.timerRunning = true; updateMatchStatus(); }
function pauseTimer() { window.currentMatch.timerRunning = false; updateMatchStatus(); }
function updateMatchStatus() { document.getElementById('match-status').textContent = window.currentMatch.timerRunning ? "En juego" : "Pausado"; }
function resetMatch() { if(confirm("¿Reiniciar partido?")) location.reload(); }
function endPeriod() { alert("Fin del periodo"); }
function saveLocation() { 
    const val = document.getElementById('match-location-input').value;
    window.currentMatch.location = val || "No especificada";
    document.getElementById('current-location').textContent = window.currentMatch.location;
}
