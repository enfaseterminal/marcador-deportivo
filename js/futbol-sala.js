// /js/futbol-sala.js - VERSIÓN PRO COMPLETA
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

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    if (typeof setupEditableNames === 'function') setupEditableNames();
    updateDisplay();
    renderEvents(); 
});

// --- FUNCIONES CORE (RELOJ Y MARCADOR) ---
function updateDisplay() {
    document.getElementById('team1-score').textContent = window.currentMatch.team1.score;
    document.getElementById('team2-score').textContent = window.currentMatch.team2.score;
    document.getElementById('team1-name').textContent = window.currentMatch.team1.name;
    document.getElementById('team2-name').textContent = window.currentMatch.team2.name;
    // Actualizar también faltas y tiempos si existen los IDs
    if(document.getElementById('fouls-1')) document.getElementById('fouls-1').textContent = window.currentMatch.team1.fouls;
    if(document.getElementById('fouls-2')) document.getElementById('fouls-2').textContent = window.currentMatch.team2.fouls;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const min = Math.floor(window.currentMatch.timeRemaining / 60);
    const sec = window.currentMatch.timeRemaining % 60;
    const timerEl = document.getElementById('main-timer');
    if (timerEl) timerEl.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (window.timerInterval) return;
    window.timerInterval = setInterval(() => {
        if (window.currentMatch.timeRemaining > 0) {
            window.currentMatch.timeRemaining--;
            updateTimerDisplay();
        } else {
            pauseTimer();
            logEvent('system', '¡Tiempo agotado!', null);
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(window.timerInterval);
    window.timerInterval = null;
}

// --- REGISTRO DE EVENTOS ---
function logEvent(type, description, team) {
    const time = document.getElementById('main-timer')?.textContent || "00:00";
    const period = window.currentMatch.isOvertime ? 'Prórroga' : `T${window.currentMatch.currentPeriod}`;
    
    window.currentMatch.events.unshift({
        time,
        period,
        type,
        description,
        teamName: team ? (window.currentMatch[team]?.name || "") : "Sistema"
    });
    renderEvents();
}

function renderEvents() {
    const list = document.getElementById('events-list');
    if (!list) return;
    list.innerHTML = window.currentMatch.events.map(ev => `
        <div class="event-item">
            <span class="event-time">[${ev.period} - ${ev.time}]</span>
            <strong>${ev.teamName}:</strong> ${ev.description}
        </div>
    `).join('');
}

// --- LÓGICA DE GOLES (Definida para ser sobreescrita luego o usada directamente) ---
window.addGoal = function(team) {
    window.currentMatch[team].score++;
    logEvent('goal', '¡GOOOOL!', team);
    if (typeof celebrate === 'function') celebrate();
    updateDisplay();
};

// --- LÓGICA DE TARJETAS ---
function openCardModal(team, type) {
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
    
    if (type === 'yellow') {
        const previousYellow = window.currentMatch[team].yellowCards.find(c => c.player === player);
        if (previousYellow) {
            window.currentMatch[team].blueCards.push({ player, reason: "Doble Amarilla" });
            logEvent('blue-card', `🟦 Tarjeta Azul (Doble Amarilla) - Jugador #${player}`, team);
        } else {
            window.currentMatch[team].yellowCards.push({ player });
            logEvent('yellow-card', `🟨 Tarjeta Amarilla - Jugador #${player}`, team);
        }
    } else {
        window.currentMatch[team].blueCards.push({ player });
        logEvent('blue-card', `🟦 Tarjeta Azul - Jugador #${player}`, team);
    }
    updateDisplay();
    closeCardModal();
    document.getElementById('card-player-number').value = '';
}

// --- LISTENERS ---
function setupEventListeners() {
    document.getElementById('start-timer')?.addEventListener('click', startTimer);
    document.getElementById('pause-timer')?.addEventListener('click', pauseTimer);
    document.getElementById('add-goal-1')?.addEventListener('click', () => window.addGoal('team1'));
    document.getElementById('add-goal-2')?.addEventListener('click', () => window.addGoal('team2'));
    
    // Botones de tarjetas (Asegúrate de tener estos IDs en tu HTML)
    document.getElementById('yellow-card-1')?.addEventListener('click', () => openCardModal('team1', 'yellow'));
    document.getElementById('yellow-card-2')?.addEventListener('click', () => openCardModal('team2', 'yellow'));
    document.getElementById('blue-card-1')?.addEventListener('click', () => openCardModal('team1', 'blue'));
    document.getElementById('blue-card-2')?.addEventListener('click', () => openCardModal('team2', 'blue'));
    
    document.getElementById('save-card')?.addEventListener('click', saveCard);
    document.getElementById('cancel-card')?.addEventListener('click', closeCardModal);
    
    document.getElementById('save-match')?.addEventListener('click', saveMatch);
}

// --- GUARDAR Y COMPARTIR ---
function saveMatch() {
    const matchData = { ...window.currentMatch, timestamp: new Date().getTime(), sport: "Fútbol Sala" };
    let history = JSON.parse(localStorage.getItem('matchHistory') || '[]');
    history.unshift(matchData);
    localStorage.setItem('matchHistory', JSON.stringify(history.slice(0, 20)));
    if (typeof window.showNotification === 'function') window.showNotification("Partido guardado");
}
