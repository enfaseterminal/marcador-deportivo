/**
 * /js/futbol-sala.js - VERSIÓN CORREGIDA
 * Marcador Profesional con todas las correcciones
 */

// 1. ESTADO INICIAL
const INITIAL_STATE = {
    team1: { 
        name: "EQUIPO LOCAL", 
        score: 0, 
        fouls: 0, 
        timeouts: 1, 
        yellowCards: {},
        blueCards: {},
        timeoutsUsed: 0
    },
    team2: { 
        name: "EQUIPO VISITANTE", 
        score: 0, 
        fouls: 0, 
        timeouts: 1, 
        yellowCards: {},
        blueCards: {},
        timeoutsUsed: 0
    },
    currentPeriod: 1,
    timeRemaining: 20 * 60,
    isRunning: false,
    location: "No especificada",
    events: [],
    matchEnded: false,
    isTimeoutActive: false,
    timeoutTeam: null
};

// 2. VARIABLES GLOBALES
window.currentMatch = JSON.parse(localStorage.getItem('futsal_match')) || {...INITIAL_STATE};
window.matchHistory = JSON.parse(localStorage.getItem('futsal_history')) || [];
let timerInterval = null;
let pendingCard = null;
let timeoutTimer = null;

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
    
    // Ubicación
    document.getElementById('current-location').textContent = m.location;
    
    // Periodo
    renderPeriodText();
    
    // Timer
    updateTimerDisplay();
    
    // Botón de play/pause
    const startBtn = document.getElementById('start-pause-btn');
    const icon = startBtn.querySelector('i');
    
    if (m.isTimeoutActive) {
        icon.className = 'fas fa-clock';
        startBtn.disabled = true;
    } else {
        startBtn.disabled = false;
        icon.className = m.isRunning ? 'fas fa-pause' : 'fas fa-play';
    }
    
    // Lista de eventos
    renderEvents();
}

function renderPeriodText() {
    const periods = ["", "1º TIEMPO", "2º TIEMPO", "PRÓRROGA 1", "PRÓRROGA 2", "FINAL"];
    const periodEl = document.getElementById('period-text');
    if (periodEl) {
        periodEl.textContent = periods[window.currentMatch.currentPeriod] || "FINAL";
    }
}

function updateTimerDisplay() {
    const m = window.currentMatch;
    const mins = Math.floor(m.timeRemaining / 60);
    const secs = m.timeRemaining % 60;
    const timerEl = document.getElementById('main-timer');
    
    if (timerEl) {
        timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// 4. LÓGICA DEL CRONÓMETRO
function toggleTimer() {
    const m = window.currentMatch;
    
    if (m.matchEnded || m.isTimeoutActive) return;
    
    m.isRunning = !m.isRunning;
    
    if (m.isRunning) {
        startTimer();
    } else {
        pauseTimer();
    }
    
    saveState();
    renderAll();
}

function startTimer() {
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const m = window.currentMatch;
        
        if (m.timeRemaining > 0) {
            m.timeRemaining--;
            updateTimerDisplay();
            
            if (m.timeRemaining % 30 === 0) {
                saveState();
            }
        } else {
            clearInterval(timerInterval);
            m.timeRemaining = 0;
            updateTimerDisplay();
            handlePeriodEnd();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    saveState();
}

function handlePeriodEnd() {
    const m = window.currentMatch;
    
    m.timeRemaining = 0;
    m.isRunning = false;
    updateTimerDisplay();
    
    // Verificar si hay ganador
    const scoreDiff = Math.abs(m.team1.score - m.team2.score);
    
    if (scoreDiff > 0 && m.currentPeriod >= 2) {
        // Hay ganador - FINALIZAR
        setTimeout(() => {
            finishMatch();
        }, 1000);
    } else if (m.currentPeriod < 2) {
        // Pasar al siguiente periodo
        m.currentPeriod++;
        m.timeRemaining = 20 * 60;
        
        saveState();
        renderAll();
        
        setTimeout(() => {
            if (confirm(`¿Preparado para el ${m.currentPeriod === 2 ? 'segundo tiempo' : 'prórroga'}?`)) {
                m.isRunning = true;
                startTimer();
                renderAll();
            }
        }, 1000);
    } else if (m.currentPeriod === 2 && scoreDiff === 0) {
        // Empate - preguntar por prórroga
        setTimeout(() => {
            if (confirm('¡Empate! ¿Deseas comenzar la prórroga?')) {
                m.currentPeriod = 3;
                m.timeRemaining = 5 * 60;
                m.isRunning = true;
                saveState();
                renderAll();
                startTimer();
            } else {
                finishMatch();
            }
        }, 1500);
    }
}

function nextPeriod() {
    const m = window.currentMatch;
    
    if (m.matchEnded) return;
    
    if (m.currentPeriod < 5) {
        if (confirm(`¿Avanzar al ${m.currentPeriod === 1 ? 'segundo tiempo' : m.currentPeriod === 2 ? 'prórroga' : 'siguiente periodo'}?`)) {
            m.currentPeriod++;
            m.timeRemaining = m.currentPeriod <= 2 ? 20 * 60 : 5 * 60;
            m.isRunning = false;
            clearInterval(timerInterval);
            
            saveState();
            renderAll();
            showNotification(`Periodo ${m.currentPeriod} listo`, 'info');
        }
    }
}

// 5. SISTEMA DE GOLES (FUNCIONES EXPORTADAS)
function addGoal(team) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    teamObj.score++;
    
    // Registrar evento
    logEvent("GOL", `⚽ Gol de ${teamObj.name}`, team);
    
    // Efecto visual
    const scoreEl = document.getElementById(`${team}-score`);
    if (scoreEl) {
        scoreEl.style.transform = 'scale(1.2)';
        setTimeout(() => scoreEl.style.transform = 'scale(1)', 300);
    }
    
    saveState();
    renderAll();
}

function changeScore(team, val) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    teamObj.score = Math.max(0, teamObj.score + val);
    
    if (val > 0) {
        logEvent("GOL", `⚽ Gol de ${teamObj.name}`, team);
    } else {
        logEvent("GOL_ANULADO", `❌ Gol anulado de ${teamObj.name}`, team);
    }
    
    saveState();
    renderAll();
}

// 6. SISTEMA DE FALTAS
function addFoul(team) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    teamObj.fouls++;
    
    logEvent("FALTA", `⚠️ Falta de ${teamObj.name} (Total: ${teamObj.fouls})`, team);
    
    if (teamObj.fouls === 6) {
        showNotification(`¡${teamObj.name} tiene 6 faltas! Penalty doble en la siguiente.`, 'warning');
    }
    
    saveState();
    renderAll();
}

function removeFoul(team) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    if (teamObj.fouls > 0) {
        teamObj.fouls--;
        
        logEvent("FALTA_CORREGIDA", `Falta eliminada de ${teamObj.name}`, team);
        saveState();
        renderAll();
        showNotification(`Falta eliminada de ${teamObj.name}`, 'info');
    } else {
        showNotification(`${teamObj.name} no tiene faltas para eliminar`, 'warning');
    }
}

// 7. TIEMPOS MUERTOS
function useTimeout(team) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    if (m.isTimeoutActive) {
        showNotification(`Ya hay un tiempo muerto activo`, 'warning');
        return;
    }
    
    if (teamObj.timeouts > 0) {
        // Pausar el cronómetro principal
        m.isRunning = false;
        m.isTimeoutActive = true;
        m.timeoutTeam = team;
        clearInterval(timerInterval);
        
        // Reducir tiempos muertos disponibles
        teamObj.timeouts--;
        
        // Registrar evento
        logEvent("TIME_OUT", `Tiempo muerto: ${teamObj.name}`, team);
        
        // Mostrar notificación
        showNotification(`⏱️ Tiempo muerto: ${teamObj.name} (60 segundos)`, 'info');
        
        // Configurar temporizador de 60 segundos
        let timeoutSeconds = 60;
        const timeoutDisplay = document.createElement('div');
        timeoutDisplay.id = 'timeout-display';
        timeoutDisplay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 2rem;
            font-weight: bold;
            z-index: 10000;
            text-align: center;
            border: 3px solid #3498db;
        `;
        timeoutDisplay.textContent = timeoutSeconds;
        document.body.appendChild(timeoutDisplay);
        
        // Contador regresivo
        timeoutTimer = setInterval(() => {
            timeoutSeconds--;
            timeoutDisplay.textContent = timeoutSeconds;
            
            if (timeoutSeconds <= 0) {
                endTimeout();
            }
        }, 1000);
        
        saveState();
        renderAll();
    } else {
        showNotification(`${teamObj.name} no tiene tiempos muertos disponibles`, 'warning');
    }
}

function recoverTimeout(team) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    if (teamObj.timeouts < 1) {
        teamObj.timeouts++;
        
        logEvent("TIMEOUT_RECUPERADO", `Tiempo muerto recuperado: ${teamObj.name}`, team);
        saveState();
        renderAll();
        showNotification(`Tiempo muerto recuperado para ${teamObj.name}`, 'success');
    } else {
        showNotification(`${teamObj.name} ya tiene todos sus tiempos muertos`, 'warning');
    }
}

function endTimeout() {
    const m = window.currentMatch;
    
    clearInterval(timeoutTimer);
    m.isTimeoutActive = false;
    m.timeoutTeam = null;
    
    // Eliminar display
    const timeoutDisplay = document.getElementById('timeout-display');
    if (timeoutDisplay) {
        timeoutDisplay.remove();
    }
    
    // Reactivar botón de inicio
    const startBtn = document.getElementById('start-pause-btn');
    if (startBtn) {
        startBtn.disabled = false;
    }
    
    showNotification('⏱️ Tiempo muerto finalizado', 'info');
    saveState();
    renderAll();
}

// 8. SISTEMA DE TARJETAS
function openCardModal(team, type) {
    pendingCard = { team, type };
    
    const modal = document.getElementById('card-modal');
    const title = document.getElementById('card-modal-title');
    const input = document.getElementById('card-player-number');
    
    if (modal && title && input) {
        const teamName = window.currentMatch[team].name;
        const cardName = type === 'yellow' ? 'AMARILLA' : 'AZUL';
        
        title.textContent = `Tarjeta ${cardName} - ${teamName}`;
        input.value = '';
        input.focus();
        modal.style.display = 'flex';
    }
}

function processCard() {
    if (!pendingCard) return;
    
    const input = document.getElementById('card-player-number');
    const playerNum = input.value.trim();
    
    if (!playerNum || playerNum < 1 || playerNum > 99) {
        showNotification('Introduce un número de dorsal válido (1-99)', 'error');
        return;
    }
    
    const { team, type } = pendingCard;
    const m = window.currentMatch;
    const teamObj = m[team];
    
    if (type === 'yellow') {
        teamObj.yellowCards[playerNum] = (teamObj.yellowCards[playerNum] || 0) + 1;
        
        if (teamObj.yellowCards[playerNum] === 2) {
            logEvent("EXPULSIÓN", `🟨🟨 2ª Amarilla -> 🟦 Azul para dorsal ${playerNum}`, team);
            showNotification(`¡Dorsal ${playerNum} expulsado por doble amarilla!`, 'error');
            teamObj.yellowCards[playerNum] = 0;
        } else {
            logEvent("TARJETA", `🟨 Amarilla para dorsal ${playerNum}`, team);
            showNotification(`🟨 Tarjeta amarilla para dorsal ${playerNum}`, 'warning');
        }
    } else {
        teamObj.blueCards[playerNum] = (teamObj.blueCards[playerNum] || 0) + 1;
        logEvent("EXPULSIÓN", `🟦 Tarjeta azul para dorsal ${playerNum}`, team);
        showNotification(`🟦 Tarjeta azul (expulsión) para dorsal ${playerNum}`, 'error');
    }
    
    closeModal('card-modal');
    saveState();
    renderAll();
}

function removeLastCard(team) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    // Buscar la última tarjeta amarilla
    const yellowPlayers = Object.keys(teamObj.yellowCards || {});
    const bluePlayers = Object.keys(teamObj.blueCards || {});
    
    if (bluePlayers.length > 0) {
        const lastPlayer = bluePlayers[bluePlayers.length - 1];
        if (teamObj.blueCards[lastPlayer] > 0) {
            teamObj.blueCards[lastPlayer]--;
            if (teamObj.blueCards[lastPlayer] <= 0) {
                delete teamObj.blueCards[lastPlayer];
            }
            logEvent("TARJETA_ELIMINADA", `Azul eliminada del dorsal ${lastPlayer}`, team);
            showNotification(`🟦 Tarjeta azul eliminada del dorsal ${lastPlayer}`, 'info');
        }
    } else if (yellowPlayers.length > 0) {
        const lastPlayer = yellowPlayers[yellowPlayers.length - 1];
        if (teamObj.yellowCards[lastPlayer] > 0) {
            teamObj.yellowCards[lastPlayer]--;
            if (teamObj.yellowCards[lastPlayer] <= 0) {
                delete teamObj.yellowCards[lastPlayer];
            }
            logEvent("TARJETA_ELIMINADA", `Amarilla eliminada del dorsal ${lastPlayer}`, team);
            showNotification(`🟨 Tarjeta amarilla eliminada del dorsal ${lastPlayer}`, 'info');
        }
    } else {
        showNotification(`${teamObj.name} no tiene tarjetas registradas`, 'warning');
        return;
    }
    
    saveState();
    renderAll();
}

// 9. SISTEMA DE EVENTOS
function logEvent(type, description, team) {
    const event = {
        timestamp: new Date().toISOString(),
        gameTime: document.getElementById('main-timer').textContent,
        period: window.currentMatch.currentPeriod,
        type,
        description,
        team
    };
    
    window.currentMatch.events.unshift(event);
    
    if (window.currentMatch.events.length > 50) {
        window.currentMatch.events = window.currentMatch.events.slice(0, 50);
    }
    
    renderEvents();
}

function renderEvents() {
    const list = document.getElementById('events-list');
    if (!list) return;
    
    const events = window.currentMatch.events;
    
    if (events.length === 0) {
        list.innerHTML = '<div class="empty-events">No hay sucesos registrados</div>';
        return;
    }
    
    list.innerHTML = events.map(e => `
        <div class="event-item ${e.team}">
            <span class="event-time">[${e.gameTime}]</span>
            <span class="event-desc">${e.description}</span>
        </div>
    `).join('');
}

// 10. FINALIZACIÓN DE PARTIDO
function finishMatch() {
    const m = window.currentMatch;
    
    m.matchEnded = true;
    m.isRunning = false;
    m.currentPeriod = 5;
    
    clearInterval(timerInterval);
    clearInterval(timeoutTimer);
    
    // Determinar ganador
    let winner = null;
    if (m.team1.score > m.team2.score) {
        winner = { team: 'team1', name: m.team1.name };
    } else if (m.team2.score > m.team1.score) {
        winner = { team: 'team2', name: m.team2.name };
    }
    
    if (winner) {
        showNotification(`🏆 ¡${winner.name} GANA EL PARTIDO!`, 'success');
        
        // Lanzar celebración
        if (typeof showCelebration === 'function') {
            setTimeout(() => showCelebration(), 500);
        }
        
        // Preguntar si guardar
        setTimeout(() => {
            if (confirm('¿Guardar partido en el historial?')) {
                saveMatchToHistory();
            }
        }, 2000);
    } else {
        showNotification('⚖️ ¡EMPATE!', 'info');
    }
    
    saveState();
    renderAll();
}

// 11. HISTORIAL
function saveMatchToHistory() {
    const m = window.currentMatch;
    
    const matchData = {
        id: Date.now(),
        team1: { name: m.team1.name, score: m.team1.score },
        team2: { name: m.team2.name, score: m.team2.score },
        score: `${m.team1.score}-${m.team2.score}`,
        location: m.location,
        date: new Date().toLocaleString('es-ES'),
        timestamp: new Date().toISOString()
    };
    
    window.matchHistory.unshift(matchData);
    
    if (window.matchHistory.length > 20) {
        window.matchHistory = window.matchHistory.slice(0, 20);
    }
    
    localStorage.setItem('futsal_history', JSON.stringify(window.matchHistory));
    renderMatchHistory();
    
    showNotification('✅ Partido guardado en historial', 'success');
}

function renderMatchHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    const history = window.matchHistory;
    
    if (history.length === 0) {
        list.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-clipboard-list fa-2x"></i>
                <p>No hay partidos guardados</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = history.map(match => `
        <div class="history-item">
            <div class="history-teams">
                ${match.team1.name} vs ${match.team2.name}
            </div>
            <div class="history-score">
                ${match.score}
            </div>
            <div class="history-info">
                <div><i class="fas fa-calendar"></i> ${match.date}</div>
                <div class="history-location"><i class="fas fa-map-marker-alt"></i> ${match.location}</div>
            </div>
        </div>
    `).join('');
}

function clearMatchHistory() {
    if (window.matchHistory.length === 0) {
        showNotification('El historial ya está vacío', 'info');
        return;
    }
    
    if (confirm('¿Estás seguro de borrar todo el historial?')) {
        window.matchHistory = [];
        localStorage.removeItem('futsal_history');
        renderMatchHistory();
        showNotification('Historial borrado', 'success');
    }
}

// 12. COMPARTIR
function openShareModal() {
    const modal = document.getElementById('share-modal');
    const textEl = document.getElementById('share-text');
    const titleEl = document.getElementById('share-modal-title');
    
    if (modal && textEl && titleEl) {
        titleEl.textContent = 'Compartir Resultado';
        textEl.textContent = generateShareText();
        modal.style.display = 'flex';
    }
}

function generateShareText() {
    const m = window.currentMatch;
    const now = new Date();
    
    return `⚽ RESULTADO FÚTBOL SALA ⚽

🏟️ ${m.team1.name} ${m.team1.score} - ${m.team2.score} ${m.team2.name}

📅 ${now.toLocaleDateString('es-ES')}
🕒 ${now.toLocaleTimeString('es-ES')}

📍 ${m.location}
⏱️ Periodo: ${m.currentPeriod}
📊 Faltas: ${m.team1.fouls} - ${m.team2.fouls}

📱 Generado con Marcador Fútbol Sala - Liga Escolar`;
}

function copyShareText() {
    const textEl = document.getElementById('share-text');
    if (!textEl) return;
    
    const text = textEl.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Texto copiado al portapapeles', 'success');
    }).catch(err => {
        console.error('Error al copiar:', err);
        showNotification('Error al copiar texto', 'error');
    });
}

function shareViaNative() {
    const textEl = document.getElementById('share-text');
    if (!textEl) return;
    
    const text = textEl.textContent;
    
    if (navigator.share) {
        navigator.share({
            title: 'Resultado Fútbol Sala',
            text: text,
            url: window.location.href
        }).catch(err => {
            console.error('Error al compartir:', err);
            copyShareText();
        });
    } else {
        copyShareText();
    }
}

function shareToWhatsapp() {
    const textEl = document.getElementById('share-text');
    if (!textEl) return;
    
    const text = encodeURIComponent(textEl.textContent);
    const url = `https://wa.me/?text=${text}`;
    
    window.open(url, '_blank');
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.style.display = 'none';
}

// 13. UTILIDADES
function editTeamName(teamKey) {
    const currentName = window.currentMatch[teamKey].name;
    const newName = prompt('Nuevo nombre del equipo:', currentName);
    
    if (newName && newName.trim() !== '') {
        window.currentMatch[teamKey].name = newName.trim();
        saveState();
        renderAll();
        showNotification(`Nombre cambiado a: ${newName}`, 'success');
    }
}

function confirmReset() {
    if (confirm('¿Estás seguro de reiniciar el partido?')) {
        resetMatch();
    }
}

function resetMatch() {
    window.currentMatch = {...INITIAL_STATE};
    
    clearInterval(timerInterval);
    clearInterval(timeoutTimer);
    
    const timeoutDisplay = document.getElementById('timeout-display');
    if (timeoutDisplay) timeoutDisplay.remove();
    
    localStorage.removeItem('futsal_match');
    renderAll();
    
    showNotification('Partido reiniciado', 'info');
}

function forceSave() {
    saveMatchToHistory();
}

function saveState() {
    localStorage.setItem('futsal_match', JSON.stringify(window.currentMatch));
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const text = document.getElementById('notification-text');
    
    if (!notification || !text) return;
    
    notification.className = `notification ${type} show`;
    text.textContent = message;
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            notification.className = 'notification';
            notification.style.animation = '';
        }, 300);
    }, 3000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// 14. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fútbol Sala - Inicializando...');
    
    // Inicializar event listeners
    initEventListeners();
    
    // Renderizar todo
    renderAll();
    renderMatchHistory();
    
    // Iniciar timer si estaba corriendo
    if (window.currentMatch.isRunning && !window.currentMatch.isTimeoutActive) {
        startTimer();
    }
});

function initEventListeners() {
    // Guardar ubicación
    const saveLocationBtn = document.getElementById('save-location');
    const locationInput = document.getElementById('match-location-input');
    
    if (saveLocationBtn) {
        saveLocationBtn.addEventListener('click', () => {
            if (locationInput && locationInput.value.trim() !== '') {
                window.currentMatch.location = locationInput.value.trim();
                document.getElementById('current-location').textContent = window.currentMatch.location;
                locationInput.value = '';
                saveState();
                showNotification('Ubicación guardada', 'success');
            }
        });
    }
    
    if (locationInput) {
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveLocationBtn.click();
            }
        });
    }
    
    // Botones de corrección dinámicos
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-foul')) {
            const team = e.target.dataset.team;
            removeFoul(team);
        }
        
        if (e.target.classList.contains('btn-recover-timeout')) {
            const team = e.target.dataset.team;
            recoverTimeout(team);
        }
        
        if (e.target.classList.contains('btn-remove-card')) {
            const team = e.target.dataset.team;
            removeLastCard(team);
        }
    });
}

// 15. EXPORTAR FUNCIONES GLOBALES (IMPORTANTE!)
window.toggleTimer = toggleTimer;
window.confirmReset = confirmReset;
window.nextPeriod = nextPeriod;
window.addGoal = addGoal;
window.changeScore = changeScore;
window.addFoul = addFoul;
window.removeFoul = removeFoul;
window.recoverTimeout = recoverTimeout;
window.useTimeout = useTimeout;
window.openCardModal = openCardModal;
window.processCard = processCard;
window.removeLastCard = removeLastCard;
window.closeModal = closeModal;
window.editTeamName = editTeamName;
window.openShareModal = openShareModal;
window.copyShareText = copyShareText;
window.shareViaNative = shareViaNative;
window.shareToWhatsapp = shareToWhatsapp;
window.closeShareModal = closeShareModal;
window.clearMatchHistory = clearMatchHistory;
window.forceSave = forceSave;
