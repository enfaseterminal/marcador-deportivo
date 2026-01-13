// /js/futbol-sala.js - VERSIÓN DEFINITIVA UNIFICADA
window.currentMatch = {
    team1: { name: "Equipo Local", score: 0, timeouts: 1, fouls: 0, yellowCards: [], blueCards: [] },
    team2: { name: "Equipo Visitante", score: 0, timeouts: 1, fouls: 0, yellowCards: [], blueCards: [] },
    currentPeriod: 1,
    timeRemaining: 20 * 60,
    timerRunning: false,
    isOvertime: false,
    location: "No especificada",
    events: []
};

window.pendingCard = null;
window.timerInterval = null;

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando Fútbol Sala Pro...");
    setupEventListeners();
    setupEditableNames();
    updateDisplay();
    renderEvents();
});

// --- ACTUALIZAR PANTALLA ---
function updateDisplay() {
    // Marcadores
    document.getElementById('team1-score').textContent = window.currentMatch.team1.score;
    document.getElementById('team2-score').textContent = window.currentMatch.team2.score;
    
    // Nombres
    document.getElementById('team1-name').textContent = window.currentMatch.team1.name;
    document.getElementById('team2-name').textContent = window.currentMatch.team2.name;
    
    // Faltas
    if (document.getElementById('fouls-1')) document.getElementById('fouls-1').textContent = window.currentMatch.team1.fouls;
    if (document.getElementById('fouls-2')) document.getElementById('fouls-2').textContent = window.currentMatch.team2.fouls;
    
    // Tiempos Muertos
    if (document.getElementById('timeout-1')) document.getElementById('timeout-1').textContent = window.currentMatch.team1.timeouts;
    if (document.getElementById('timeout-2')) document.getElementById('timeout-2').textContent = window.currentMatch.team2.timeouts;
    
    updateTimerDisplay();
}

// --- FUNCIONES DE ACCIÓN ---
window.addGoal = function(team) {
    window.currentMatch[team].score++;
    logEvent('goal', '¡GOOOOL!', team);
    if (typeof celebrate === 'function') celebrate();
    updateDisplay();
};

window.addFoul = function(team) {
    if (window.currentMatch[team].fouls < 5) {
        window.currentMatch[team].fouls++;
        logEvent('foul', 'Falta cometida', team);
    } else {
        window.currentMatch[team].fouls++;
        logEvent('foul', '⚠️ ¡QUINTA FALTA! (Doble Penalti)', team);
    }
    updateDisplay();
};

window.useTimeout = function(team) {
    if (window.currentMatch[team].timeouts > 0) {
        window.currentMatch[team].timeouts--;
        logEvent('timeout', 'Tiempo Muerto solicitado', team);
        updateDisplay();
    } else {
        alert("No quedan tiempos muertos");
    }
};

// --- RELOJ ---
function startTimer() {
    if (window.timerInterval) return;
    window.timerInterval = setInterval(() => {
        if (window.currentMatch.timeRemaining > 0) {
            window.currentMatch.timeRemaining--;
            updateTimerDisplay();
        } else {
            pauseTimer();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(window.timerInterval);
    window.timerInterval = null;
}

function updateTimerDisplay() {
    const min = Math.floor(window.currentMatch.timeRemaining / 60);
    const sec = window.currentMatch.timeRemaining % 60;
    document.getElementById('main-timer').textContent = 
        `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// --- NOMBRES EDITABLES ---
function setupEditableNames() {
    ['team1-name', 'team2-name'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.cursor = 'pointer';
            el.onclick = function() {
                const newName = prompt("Nombre del equipo:", el.textContent);
                if (newName) {
                    const teamKey = id.startsWith('team1') ? 'team1' : 'team2';
                    window.currentMatch[teamKey].name = newName;
                    updateDisplay();
                }
            };
        }
    });
}

// --- TARJETAS ---
window.openCardModal = function(team, type) {
    window.pendingCard = { team, type };
    document.getElementById('card-modal').style.display = 'flex';
};

window.saveCard = function() {
    if (!window.pendingCard) return;
    const { team, type } = window.pendingCard;
    const player = document.getElementById('card-player-number').value || 'S/N';
    
    if (type === 'yellow') {
        window.currentMatch[team].yellowCards.push({ player });
        logEvent('yellow-card', `🟨 Tarjeta Amarilla - #${player}`, team);
    } else {
        window.currentMatch[team].blueCards.push({ player });
        logEvent('blue-card', `🟦 Tarjeta Azul - #${player}`, team);
    }
    
    document.getElementById('card-modal').style.display = 'none';
    document.getElementById('card-player-number').value = '';
    updateDisplay();
};

// --- EVENTOS ---
function logEvent(type, description, team) {
    const time = document.getElementById('main-timer').textContent;
    window.currentMatch.events.unshift({
        time,
        description,
        teamName: window.currentMatch[team]?.name || "Sistema"
    });
    renderEvents();
}

function renderEvents() {
    const list = document.getElementById('events-list');
    if (list) {
        list.innerHTML = window.currentMatch.events.map(ev => `
            <div class="event-item"><strong>[${ev.time}] ${ev.teamName}:</strong> ${ev.description}</div>
        `).join('');
    }
}

// --- ASIGNAR BOTONES ---
function setupEventListeners() {
    // Goles
    document.getElementById('add-goal-1')?.addEventListener('click', () => window.addGoal('team1'));
    document.getElementById('add-goal-2')?.addEventListener('click', () => window.addGoal('team2'));
    
    // Faltas
    document.getElementById('add-foul-1')?.addEventListener('click', () => window.addFoul('team1'));
    document.getElementById('add-foul-2')?.addEventListener('click', () => window.addFoul('team2'));
    
    // Tiempos Muertos
    document.getElementById('btn-timeout-1')?.addEventListener('click', () => window.useTimeout('team1'));
    document.getElementById('btn-timeout-2')?.addEventListener('click', () => window.useTimeout('team2'));

    // Tarjetas
    document.getElementById('yellow-card-1')?.addEventListener('click', () => window.openCardModal('team1', 'yellow'));
    document.getElementById('yellow-card-2')?.addEventListener('click', () => window.openCardModal('team2', 'yellow'));
    document.getElementById('blue-card-1')?.addEventListener('click', () => window.openCardModal('team1', 'blue'));
    document.getElementById('blue-card-2')?.addEventListener('click', () => window.openCardModal('team2', 'blue'));
    
    document.getElementById('save-card')?.addEventListener('click', window.saveCard);
    document.getElementById('cancel-card')?.addEventListener('click', () => document.getElementById('card-modal').style.display='none');

    // Timer
    document.getElementById('start-timer')?.addEventListener('click', startTimer);
    document.getElementById('pause-timer')?.addEventListener('click', pauseTimer);
}
