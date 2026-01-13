// /js/futbol-sala.js - VERSIÓN PRO CON EVENTOS Y GUARDADO
window.currentMatch = {
    team1: { name: "Equipo Local", score: 0, timeouts: 1, fouls: 0, yellowCards: [], blueCards: [] },
    team2: { name: "Equipo Visitante", score: 0, timeouts: 1, fouls: 0, yellowCards: [], blueCards: [] },
    currentPeriod: 1,
    timeRemaining: 20 * 60,
    timerRunning: false,
    isOvertime: false,
    location: "No especificada",
    events: [] // Historial de lo que pasa en el partido
};

window.pendingCard = null;
window.timerInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupEditableNames();
    updateDisplay();
    renderEvents(); // Cargar eventos al inicio
});

// --- REGISTRO DE EVENTOS ---
function logEvent(type, description, team) {
    const time = document.getElementById('main-timer').textContent;
    const period = window.currentMatch.isOvertime ? 'Prórroga' : `T${window.currentMatch.currentPeriod}`;
    
    window.currentMatch.events.unshift({
        time,
        period,
        type,
        description,
        teamName: window.currentMatch[team]?.name || ""
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

// --- LÓGICA DE TARJETAS (Doble Amarilla) ---
function saveCard() {
    if (!window.pendingCard) return;
    const { team, type } = window.pendingCard;
    const player = document.getElementById('card-player-number').value || 'S/N';
    
    if (type === 'yellow') {
        // Verificar si ya tiene una amarilla
        const previousYellow = window.currentMatch[team].yellowCards.find(c => c.player === player);
        
        if (previousYellow) {
            // Doble amarilla -> Se convierte en AZUL automáticamente
            window.currentMatch[team].blueCards.push({ player, reason: "Doble Amarilla" });
            logEvent('blue-card', `🟦 Tarjeta Azul (Doble Amarilla) - Jugador #${player}`, team);
            if (typeof window.showNotification === 'function') {
                window.showNotification(`¡Doble amarilla! Azul para el #${player}`, "warning");
            }
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

// --- FUNCIONES DE GUARDADO Y COMPARTIR ---
function saveMatch() {
    const matchData = {
        ...window.currentMatch,
        timestamp: new Date().getTime(),
        sport: "Fútbol Sala"
    };
    
    let history = JSON.parse(localStorage.getItem('matchHistory') || '[]');
    history.unshift(matchData);
    localStorage.setItem('matchHistory', JSON.stringify(history.slice(0, 20))); // Guardar últimos 20
    
    if (typeof window.showNotification === 'function') {
        window.showNotification("Partido guardado en el historial");
    }
}

function shareMatch() {
    const m = window.currentMatch;
    const text = `⚽ *Resultado Fútbol Sala* ⚽\n` +
                 `━━━━━━━━━━━━━━━━\n` +
                 `${m.team1.name} *${m.score1} - ${m.score2}* ${m.team2.name}\n` +
                 `📍 Lugar: ${m.location}\n` +
                 `⏱️ Finalizado en: ${m.isOvertime ? 'Prórroga' : 'Tiempo reglamentario'}\n` +
                 `━━━━━━━━━━━━━━━━\n` +
                 `vía ligaescolar.es`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Re-vincular las funciones de gol para que registren eventos
const originalAddGoal = addGoal;
window.addGoal = function(team) {
    window.currentMatch[team].score++;
    logEvent('goal', '¡GOOOOL!', team);
    if (typeof celebrate === 'function') celebrate();
    updateDisplay();
};
