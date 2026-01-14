/**
 * /js/futbol-sala.js
 * Marcador Profesional con lógica de expulsiones y persistencia
 */

// 1. ESTADO INICIAL
const INITIAL_STATE = {
    team1: { name: "Local", score: 0, fouls: 0, timeouts: 1, yellowCards: {} },
    team2: { name: "Visitante", score: 0, fouls: 0, timeouts: 1, yellowCards: {} },
    currentPeriod: 1, // 1: T1, 2: T2, 3: P1, 4: P2
    timeRemaining: 20 * 60,
    isRunning: false,
    location: "Pabellón Municipal",
    events: [],
    matchEnded: false
};

window.currentMatch = JSON.parse(localStorage.getItem('futsal_match')) || {...INITIAL_STATE};
let timerInterval = null;
let pendingCard = null; // {team, type}

// 2. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    if (window.currentMatch.isRunning) {
        startTimerLogic();
    }
});

// 3. FUNCIONES DE RENDERIZADO
function renderAll() {
    const m = window.currentMatch;
    
    // Nombres y Marcador
    document.getElementById('team1-name-display').textContent = m.team1.name;
    document.getElementById('team2-name-display').textContent = m.team2.name;
    document.getElementById('team1-score').textContent = m.team1.score;
    document.getElementById('team2-score').textContent = m.team2.score;
    
    // Faltas y Tiempos Muertos
    document.getElementById('team1-fouls').textContent = m.team1.fouls;
    document.getElementById('team2-fouls').textContent = m.team2.fouls;
    document.getElementById('team1-timeouts').textContent = m.team1.timeouts;
    document.getElementById('team2-timeouts').textContent = m.team2.timeouts;
    
    // Ubicación y Periodo
    document.getElementById('current-location').textContent = m.location;
    renderPeriodText();
    
    // Reloj
    updateTimerDisplay();
    
    // Lista de eventos
    renderEvents();
    
    // Controles de botones
    const startBtn = document.getElementById('start-pause-btn');
    startBtn.innerHTML = m.isRunning ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

function renderPeriodText() {
    const texts = ["", "1º TIEMPO", "2º TIEMPO", "PRÓRROGA 1", "PRÓRROGA 2", "FINALIZADO"];
    document.getElementById('period-text').textContent = texts[window.currentMatch.currentPeriod];
}

function updateTimerDisplay() {
    const mins = Math.floor(window.currentMatch.timeRemaining / 60);
    const secs = window.currentMatch.timeRemaining % 60;
    document.getElementById('main-timer').textContent = 
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 4. LÓGICA DEL CRONÓMETRO
function toggleTimer() {
    if (window.currentMatch.matchEnded) return;
    
    window.currentMatch.isRunning = !window.currentMatch.isRunning;
    if (window.currentMatch.isRunning) {
        startTimerLogic();
    } else {
        clearInterval(timerInterval);
    }
    saveState();
    renderAll();
}

function startTimerLogic() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (window.currentMatch.timeRemaining > 0) {
            window.currentMatch.timeRemaining--;
            if (window.currentMatch.timeRemaining % 5 === 0) saveState(); // Guardado frecuente
            updateTimerDisplay();
        } else {
            handlePeriodEnd();
        }
    }, 1000);
}

function handlePeriodEnd() {
    window.currentMatch.isRunning = false;
    clearInterval(timerInterval);
    showNotification("¡Fin del periodo!", "warning");
    saveState();
    renderAll();
}

function nextPeriod() {
    if (window.currentMatch.currentPeriod >= 5) return;

    // Lógica de prórroga si hay empate al final del T2
    if (window.currentMatch.currentPeriod === 2) {
        if (window.currentMatch.team1.score === window.currentMatch.team2.score) {
            if (confirm("¿Empate detectado. Empezar prórroga?")) {
                window.currentMatch.currentPeriod = 3;
                window.currentMatch.timeRemaining = 5 * 60; // 5 min de prórroga
            } else {
                finishMatch();
            }
        } else {
            finishMatch();
        }
    } else {
        window.currentMatch.currentPeriod++;
        window.currentMatch.timeRemaining = window.currentMatch.currentPeriod > 2 ? 5 * 60 : 20 * 60;
    }
    
    saveState();
    renderAll();
}

// 5. ACCIONES DE JUEGO
function addGoal(team) {
    window.currentMatch[team].score++;
    logEvent("GOL", `Gol de ${window.currentMatch[team].name}`, team);
    saveState();
    renderAll();
}

function changeScore(team, val) {
    window.currentMatch[team].score = Math.max(0, window.currentMatch[team].score + val);
    saveState();
    renderAll();
}

function addFoul(team) {
    window.currentMatch[team].fouls++;
    logEvent("FALTA", `Falta cometida por ${window.currentMatch[team].name}`, team);
    if(window.currentMatch[team].fouls >= 6) {
        showNotification("¡Sexta falta! Doble Penalti.", "warning");
    }
    saveState();
    renderAll();
}

function useTimeout(team) {
    if (window.currentMatch[team].timeouts > 0) {
        window.currentMatch[team].timeouts--;
        logEvent("T. MUERTO", `Tiempo muerto: ${window.currentMatch[team].name}`, team);
        saveState();
        renderAll();
        showNotification("Tiempo muerto solicitado");
    }
}

// 6. LÓGICA DE TARJETAS (REGLA SOLICITADA)
function openCardModal(team, type) {
    pendingCard = { team, type };
    document.getElementById('card-modal-title').textContent = 
        `Tarjeta ${type === 'yellow' ? 'AMARILLA' : 'AZUL'} - ${window.currentMatch[team].name}`;
    document.getElementById('card-modal').style.display = 'flex';
}

function processCard() {
    const playerNum = document.getElementById('card-player-number').value;
    if (!playerNum) return alert("Introduce el número del jugador");

    const { team, type } = pendingCard;
    const teamObj = window.currentMatch[team];

    if (type === 'yellow') {
        // Registrar amarilla
        teamObj.yellowCards[playerNum] = (teamObj.yellowCards[playerNum] || 0) + 1;
        
        if (teamObj.yellowCards[playerNum] >= 2) {
            // DOBLE AMARILLA = AZUL Y EXPULSIÓN
            logEvent("EXPULSIÓN", `2ª Amarilla -> Azul para el dorsal ${playerNum}`, team);
            showNotification(`¡Dorsal ${playerNum} expulsado por doble amarilla!`, "error");
            teamObj.yellowCards[playerNum] = 0; // Reset
        } else {
            logEvent("TARJETA", `Amarilla para dorsal ${playerNum}`, team);
        }
    } else {
        // AZUL DIRECTA
        logEvent("EXPULSIÓN", `Tarjeta Azul para dorsal ${playerNum}`, team);
        showNotification(`¡Dorsal ${playerNum} expulsado (Azul)!`, "error");
    }

    closeModal('card-modal');
    document.getElementById('card-player-number').value = "";
    saveState();
    renderAll();
}

// 7. PERSISTENCIA Y UTILIDADES
function saveState() {
    localStorage.setItem('futsal_match', JSON.stringify(window.currentMatch));
    // Backup en cookie por si acaso (expira en 1 día)
    document.cookie = "futsal_backup=" + encodeURIComponent(JSON.stringify(window.currentMatch)) + ";max-age=86400;path=/";
}

function logEvent(type, description, team) {
    const event = {
        time: document.getElementById('main-timer').textContent,
        period: window.currentMatch.currentPeriod,
        type,
        description,
        team
    };
    window.currentMatch.events.unshift(event); // Lo más nuevo arriba
}

function renderEvents() {
    const list = document.getElementById('events-list');
    list.innerHTML = window.currentMatch.events.map(e => `
        <div class="event-item ${e.team}">
            <span class="event-time">[${e.time}]</span>
            <span class="event-desc"><strong>${e.type}:</strong> ${e.description}</span>
        </div>
    `).join('');
}

function editTeamName(teamKey) {
    const newName = prompt("Nuevo nombre del equipo:", window.currentMatch[teamKey].name);
    if (newName) {
        window.currentMatch[teamKey].name = newName;
        saveState();
        renderAll();
    }
}

function editLocation() {
    const loc = prompt("Lugar del partido:", window.currentMatch.location);
    if (loc) {
        window.currentMatch.location = loc;
        saveState();
        renderAll();
    }
}

function finishMatch() {
    window.currentMatch.matchEnded = true;
    window.currentMatch.currentPeriod = 5;
    const winner = window.currentMatch.team1.score > window.currentMatch.team2.score ? 
                   window.currentMatch.team1.name : window.currentMatch.team2.name;
    
    if (window.currentMatch.team1.score !== window.currentMatch.team2.score) {
        showNotification(`¡FINAL! Ganador: ${winner}`, "success");
        if (typeof Celebration === 'function') {
            const confetti = new Celebration();
            confetti.init();
            confetti.start();
        }
    }
    saveState();
}

function confirmReset() {
    if (confirm("¿Estás seguro de reiniciar el partido? Se borrará todo.")) {
        localStorage.removeItem('futsal_match');
        window.currentMatch = {...INITIAL_STATE};
        location.reload();
    }
}

function shareResult() {
    const m = window.currentMatch;
    const text = `⚽ *Resultado Fútbol Sala* ⚽\n` +
                 `━━━━━━━━━━━━━━━━\n` +
                 `${m.team1.name} *${m.team1.score} - ${m.team2.score}* ${m.team2.name}\n` +
                 `📍 Lugar: ${m.location}\n` +
                 `⏱️ Periodo: ${m.currentPeriod}\n` +
                 `━━━━━━━━━━━━━━━━\n` +
                 `vía ligaescolar.es`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function showNotification(msg, type = 'success') {
    const n = document.getElementById('notification');
    n.textContent = msg;
    n.className = `notification show ${type}`;
    setTimeout(() => n.className = 'notification', 3000);
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}
