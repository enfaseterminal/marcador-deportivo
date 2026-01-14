/**
 * /js/futbol-sala.js - VERSIÓN FINAL MEJORADA
 * Marcador Profesional con todas las correcciones solicitadas
 */

// 1. ESTADO INICIAL MEJORADO
const INITIAL_STATE = {
    team1: { 
        name: "EQUIPO LOCAL", 
        score: 0, 
        fouls: 0, 
        timeouts: 1, 
        yellowCards: {},
        blueCards: {},
        timeoutsUsed: 0,
        foulsHistory: []  // Para seguimiento de faltas
    },
    team2: { 
        name: "EQUIPO VISITANTE", 
        score: 0, 
        fouls: 0, 
        timeouts: 1, 
        yellowCards: {},
        blueCards: {},
        timeoutsUsed: 0,
        foulsHistory: []
    },
    currentPeriod: 1, // 1: T1, 2: T2, 3: P1, 4: P2, 5: FINAL
    timeRemaining: 20 * 60, // 20 minutos en segundos
    isRunning: false,
    location: "No especificada",
    events: [],
    matchEnded: false,
    isTimeoutActive: false,
    timeoutTeam: null,
    startTime: null,
    endTime: null,
    totalDuration: 0,
    cardHistory: []  // Historial detallado de tarjetas
};

// 2. VARIABLES GLOBALES
window.currentMatch = JSON.parse(localStorage.getItem('futsal_match')) || {...INITIAL_STATE};
window.matchHistory = JSON.parse(localStorage.getItem('futsal_history')) || [];
let timerInterval = null;
let pendingCard = null;
let timeoutTimer = null;

// 3. INICIALIZACIÓN MEJORADA
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fútbol Sala - Inicializando...');
    
    // Inicializar estado
    if (!window.currentMatch.startTime) {
        window.currentMatch.startTime = new Date().toISOString();
    }
    
    // Inicializar arrays si no existen
    if (!window.currentMatch.team1.foulsHistory) window.currentMatch.team1.foulsHistory = [];
    if (!window.currentMatch.team2.foulsHistory) window.currentMatch.team2.foulsHistory = [];
    if (!window.currentMatch.cardHistory) window.currentMatch.cardHistory = [];
    
    // Inicializar event listeners
    initEventListeners();
    
    // Renderizar todo
    renderAll();
    renderMatchHistory();
    
    // Iniciar timer si estaba corriendo
    if (window.currentMatch.isRunning && !window.currentMatch.isTimeoutActive) {
        startTimer();
    }
    
    // Configurar PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registrado:', reg))
            .catch(err => console.log('Error SW:', err));
    }
});

// 4. FUNCIONES DE RENDERIZADO MEJORADAS
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
        startBtn.title = 'Tiempo muerto activo';
        startBtn.disabled = true;
    } else {
        startBtn.disabled = false;
        startBtn.title = m.isRunning ? 'Pausar' : 'Iniciar';
        icon.className = m.isRunning ? 'fas fa-pause' : 'fas fa-play';
    }
    
    // Lista de eventos
    renderEvents();
    
    // Actualizar botones de corrección
    updateCorrectionButtons();
}

function renderPeriodText() {
    const periods = ["", "1º TIEMPO", "2º TIEMPO", "PRÓRROGA 1", "PRÓRROGA 2", "FINAL"];
    const periodEl = document.getElementById('period-text');
    if (periodEl) {
        periodEl.textContent = periods[window.currentMatch.currentPeriod] || "FINAL";
        
        // Añadir clase si es prórroga
        if (window.currentMatch.currentPeriod >= 3) {
            periodEl.style.color = '#ff9900';
            periodEl.style.fontWeight = 'bold';
        }
    }
}

function updateTimerDisplay() {
    const m = window.currentMatch;
    const mins = Math.floor(m.timeRemaining / 60);
    const secs = m.timeRemaining % 60;
    const timerEl = document.getElementById('main-timer');
    
    if (timerEl) {
        timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        // Cambiar color si queda poco tiempo
        if (m.timeRemaining <= 300 && m.currentPeriod <= 2) { // 5 minutos
            timerEl.style.color = m.timeRemaining <= 60 ? '#e74c3c' : '#f39c12';
        } else if (m.timeRemaining <= 60 && m.currentPeriod >= 3) { // Prórroga
            timerEl.style.color = '#e74c3c';
        } else {
            timerEl.style.color = '#fdbb2d';
        }
    }
}

// 5. LÓGICA DEL CRONÓMETRO MEJORADA
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
            
            // Guardar cada 30 segundos
            if (m.timeRemaining % 30 === 0) {
                saveState();
            }
            
            // Notificación cuando quedan 5 minutos
            if (m.timeRemaining === 300 && m.currentPeriod <= 2) {
                showNotification('¡Quedan 5 minutos!', 'warning');
            }
            
            // Notificación cuando quedan 1 minuto
            if (m.timeRemaining === 60) {
                showNotification('¡Queda 1 minuto!', 'warning');
            }
        } else {
            // Tiempo agotado - LLEGAR A CERO Y FINALIZAR
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
    
    // Asegurar que el tiempo llegue a 0
    m.timeRemaining = 0;
    m.isRunning = false;
    updateTimerDisplay();
    
    // Determinar qué hacer según el periodo
    if (m.currentPeriod < 2) {
        // Pasar al siguiente periodo
        m.currentPeriod++;
        showNotification(`¡Fin del ${m.currentPeriod === 2 ? 'primer' : 'segundo'} tiempo!`, 'info');
        
        // Resetear tiempo para el próximo periodo
        m.timeRemaining = 20 * 60;
        
        // Guardar y renderizar
        saveState();
        renderAll();
        
        // Preguntar si quiere continuar
        setTimeout(() => {
            if (confirm(`¿Preparado para el ${m.currentPeriod === 2 ? 'segundo tiempo' : 'prórroga'}?`)) {
                m.isRunning = true;
                startTimer();
                renderAll();
            }
        }, 1000);
        
    } else if (m.currentPeriod === 2) {
        // Fin del segundo tiempo - verificar si hay ganador
        const scoreDiff = Math.abs(m.team1.score - m.team2.score);
        
        if (scoreDiff > 0) {
            // Hay un ganador - FINALIZAR PARTIDO INMEDIATAMENTE
            setTimeout(() => {
                finishMatch();
            }, 1000);
        } else {
            // Empate - preguntar por prórroga
            setTimeout(() => {
                if (confirm('¡Empate! ¿Deseas comenzar la prórroga?')) {
                    m.currentPeriod = 3;
                    m.timeRemaining = 5 * 60; // 5 minutos de prórroga
                    m.isRunning = true;
                    saveState();
                    renderAll();
                    startTimer();
                    showNotification('¡Comienza la prórroga!', 'info');
                } else {
                    finishMatch();
                }
            }, 1500);
        }
    } else if (m.currentPeriod < 5) {
        // Prórroga
        m.currentPeriod++;
        
        if (m.currentPeriod === 5) {
            // Segunda prórroga terminada - verificar si hay ganador
            setTimeout(() => {
                finishMatch();
            }, 1000);
        } else {
            // Segunda parte de la prórroga
            m.timeRemaining = 5 * 60;
            showNotification('Segunda parte de la prórroga', 'info');
            saveState();
            renderAll();
            
            setTimeout(() => {
                m.isRunning = true;
                startTimer();
                renderAll();
            }, 2000);
        }
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

// 6. FUNCIONES DE TIEMPOS MUERTOS MEJORADAS
function useTimeout(team) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    if (m.isTimeoutActive) {
        showNotification(`Ya hay un tiempo muerto activo (${m.timeoutTeam === 'team1' ? m.team1.name : m.team2.name})`, 'warning');
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
        teamObj.timeoutsUsed = (teamObj.timeoutsUsed || 0) + 1;
        
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
            padding: 30px;
            border-radius: 15px;
            font-size: 3rem;
            font-weight: bold;
            z-index: 10000;
            text-align: center;
            border: 5px solid #3498db;
            box-shadow: 0 0 30px rgba(52, 152, 219, 0.5);
        `;
        timeoutDisplay.textContent = timeoutSeconds;
        document.body.appendChild(timeoutDisplay);
        
        // Contador regresivo
        timeoutTimer = setInterval(() => {
            timeoutSeconds--;
            timeoutDisplay.textContent = timeoutSeconds;
            
            if (timeoutSeconds <= 10) {
                timeoutDisplay.style.color = '#e74c3c';
                timeoutDisplay.style.borderColor = '#e74c3c';
            }
            
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
    
    // Verificar si se pueden recuperar tiempos muertos (máximo 1 por periodo)
    if (teamObj.timeoutsUsed > 0 && teamObj.timeouts < 1) {
        teamObj.timeouts++;
        teamObj.timeoutsUsed--;
        
        logEvent("TIMEOUT_RECUPERADO", `Tiempo muerto recuperado: ${teamObj.name}`, team);
        saveState();
        renderAll();
        showNotification(`Tiempo muerto recuperado para ${teamObj.name}`, 'success');
    } else {
        showNotification(`No se puede recuperar tiempo muerto para ${teamObj.name}`, 'warning');
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

// 7. SISTEMA DE FALTAS MEJORADO (CON CORRECCIÓN)
function addFoul(team) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    teamObj.fouls++;
    
    // Guardar en historial de faltas
    teamObj.foulsHistory.push({
        time: document.getElementById('main-timer').textContent,
        period: m.currentPeriod,
        timestamp: new Date().toISOString()
    });
    
    // Registrar evento
    logEvent("FALTA", `⚠️ Falta de ${teamObj.name} (Total: ${teamObj.fouls})`, team);
    
    // Notificación especial en la 6ta falta
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
        
        // Quitar del historial si existe
        if (teamObj.foulsHistory.length > 0) {
            teamObj.foulsHistory.pop();
        }
        
        logEvent("FALTA_CORREGIDA", `Falta eliminada de ${teamObj.name}`, team);
        saveState();
        renderAll();
        showNotification(`Falta eliminada de ${teamObj.name}`, 'info');
    } else {
        showNotification(`${teamObj.name} no tiene faltas para eliminar`, 'warning');
    }
}

// 8. SISTEMA DE TARJETAS MEJORADO (CON CORRECCIÓN)
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
    
    const cardData = {
        id: Date.now(),
        team: team,
        type: type,
        player: playerNum,
        period: m.currentPeriod,
        time: document.getElementById('main-timer').textContent,
        timestamp: new Date().toISOString()
    };
    
    if (type === 'yellow') {
        // Contar amarillas por jugador
        teamObj.yellowCards[playerNum] = (teamObj.yellowCards[playerNum] || 0) + 1;
        
        // Guardar en historial
        m.cardHistory.push(cardData);
        
        if (teamObj.yellowCards[playerNum] === 2) {
            // Segunda amarilla = azul y expulsión
            logEvent("EXPULSIÓN", `🟨🟨 2ª Amarilla -> 🟦 Azul para dorsal ${playerNum}`, team);
            showNotification(`¡Dorsal ${playerNum} expulsado por doble amarilla!`, 'error');
            teamObj.yellowCards[playerNum] = 0; // Resetear contador
        } else {
            logEvent("TARJETA", `🟨 Amarilla para dorsal ${playerNum}`, team);
            showNotification(`🟨 Tarjeta amarilla para dorsal ${playerNum}`, 'warning');
        }
    } else {
        // Tarjeta azul directa
        teamObj.blueCards[playerNum] = (teamObj.blueCards[playerNum] || 0) + 1;
        
        // Guardar en historial
        m.cardHistory.push(cardData);
        
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
    
    // Buscar la última tarjeta del equipo
    const lastCardIndex = m.cardHistory.findIndex(card => 
        card.team === team && card.timestamp
    );
    
    if (lastCardIndex !== -1) {
        const lastCard = m.cardHistory[lastCardIndex];
        const playerNum = lastCard.player;
        
        if (lastCard.type === 'yellow') {
            if (teamObj.yellowCards[playerNum] > 0) {
                teamObj.yellowCards[playerNum]--;
                if (teamObj.yellowCards[playerNum] <= 0) {
                    delete teamObj.yellowCards[playerNum];
                }
                logEvent("TARJETA_ELIMINADA", `Amarilla eliminada del dorsal ${playerNum}`, team);
                showNotification(`🟨 Tarjeta amarilla eliminada del dorsal ${playerNum}`, 'info');
            }
        } else if (lastCard.type === 'blue') {
            if (teamObj.blueCards[playerNum] > 0) {
                teamObj.blueCards[playerNum]--;
                if (teamObj.blueCards[playerNum] <= 0) {
                    delete teamObj.blueCards[playerNum];
                }
                logEvent("TARJETA_ELIMINADA", `Azul eliminada del dorsal ${playerNum}`, team);
                showNotification(`🟦 Tarjeta azul eliminada del dorsal ${playerNum}`, 'info');
            }
        }
        
        // Eliminar del historial
        m.cardHistory.splice(lastCardIndex, 1);
        
        saveState();
        renderAll();
    } else {
        showNotification(`${teamObj.name} no tiene tarjetas registradas`, 'warning');
    }
}

// 9. SISTEMA DE EVENTOS
function logEvent(type, description, team) {
    const event = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        gameTime: document.getElementById('main-timer').textContent,
        period: window.currentMatch.currentPeriod,
        type,
        description,
        team
    };
    
    window.currentMatch.events.unshift(event);
    
    // Limitar a 50 eventos
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
            <button class="btn-remove-event" onclick="removeEvent(${e.id})" title="Eliminar evento">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removeEvent(eventId) {
    const eventIndex = window.currentMatch.events.findIndex(e => e.id === eventId);
    
    if (eventIndex !== -1) {
        const event = window.currentMatch.events[eventIndex];
        
        // Preguntar confirmación
        if (confirm(`¿Eliminar evento: "${event.description}"?`)) {
            window.currentMatch.events.splice(eventIndex, 1);
            saveState();
            renderEvents();
            showNotification('Evento eliminado', 'info');
        }
    }
}

// 10. FINALIZACIÓN DE PARTIDO Y CELEBRACIÓN MEJORADA
function finishMatch() {
    const m = window.currentMatch;
    
    m.matchEnded = true;
    m.isRunning = false;
    m.currentPeriod = 5;
    m.endTime = new Date().toISOString();
    
    clearInterval(timerInterval);
    clearInterval(timeoutTimer);
    
    // Calcular duración
    if (m.startTime && m.endTime) {
        const start = new Date(m.startTime);
        const end = new Date(m.endTime);
        m.totalDuration = Math.round((end - start) / 1000 / 60); // minutos
    }
    
    // Determinar ganador
    let winner = null;
    let winnerTeam = null;
    
    if (m.team1.score > m.team2.score) {
        winner = { team: 'team1', name: m.team1.name, score: m.team1.score };
        winnerTeam = 'team1';
    } else if (m.team2.score > m.team1.score) {
        winner = { team: 'team2', name: m.team2.name, score: m.team2.score };
        winnerTeam = 'team2';
    }
    
    if (winner) {
        // Mostrar notificación de victoria
        showNotification(`🏆 ¡${winner.name} GANA EL PARTIDO! ${m.team1.score}-${m.team2.score}`, 'success');
        
        // Lanzar celebración
        setTimeout(() => {
            if (typeof showCelebration === 'function') {
                showCelebration();
            }
        }, 500);
        
        // Preguntar si guardar en historial
        setTimeout(() => {
            if (confirm('¿Guardar partido en el historial?')) {
                saveMatchToHistory();
            }
        }, 2000);
    } else {
        showNotification('⚖️ ¡EMPATE!', 'info');
        
        // Preguntar si guardar empate
        setTimeout(() => {
            if (confirm('¿Guardar partido empatado en el historial?')) {
                saveMatchToHistory();
            }
        }, 2000);
    }
    
    saveState();
    renderAll();
}

// 11. SISTEMA DE HISTORIAL MEJORADO
function saveMatchToHistory() {
    const m = window.currentMatch;
    
    const matchData = {
        id: Date.now(),
        team1: { 
            name: m.team1.name,
            score: m.team1.score,
            fouls: m.team1.fouls,
            timeoutsUsed: m.team1.timeoutsUsed || 0
        },
        team2: { 
            name: m.team2.name,
            score: m.team2.score,
            fouls: m.team2.fouls,
            timeoutsUsed: m.team2.timeoutsUsed || 0
        },
        score: `${m.team1.score}-${m.team2.score}`,
        location: m.location,
        date: new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: new Date().toISOString(),
        duration: m.totalDuration || 0,
        period: m.currentPeriod,
        events: [...m.events].slice(0, 10), // Solo primeros 10 eventos
        winner: m.team1.score > m.team2.score ? m.team1.name : 
                m.team2.score > m.team1.score ? m.team2.name : 'Empate'
    };
    
    window.matchHistory.unshift(matchData);
    
    // Limitar a 20 partidos
    if (window.matchHistory.length > 20) {
        window.matchHistory = window.matchHistory.slice(0, 20);
    }
    
    // Guardar en localStorage
    localStorage.setItem('futsal_history', JSON.stringify(window.matchHistory));
    
    // Renderizar historial
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
                <p>No hay partidos guardados. ¡Juega y guarda algunos partidos!</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = history.map(match => `
        <div class="history-item">
            <div class="history-teams">
                ${match.team1.name} vs ${match.team2.name}
                ${match.winner !== 'Empate' ? `<span class="winner-badge">🏆 ${match.winner}</span>` : '<span class="draw-badge">⚖️ Empate</span>'}
            </div>
            <div class="history-score">
                ${match.score}
            </div>
            <div class="history-info">
                <div><i class="fas fa-calendar"></i> ${match.date}</div>
                <div class="history-location"><i class="fas fa-map-marker-alt"></i> ${match.location}</div>
                ${match.duration ? `<div class="history-duration"><i class="fas fa-clock"></i> ${match.duration} min</div>` : ''}
                <div class="history-actions">
                    <button class="btn-small" onclick="shareMatchFromHistory(${match.id})" title="Compartir">
                        <i class="fas fa-share"></i>
                    </button>
                    <button class="btn-small btn-danger" onclick="deleteMatchFromHistory(${match.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function shareMatchFromHistory(matchId) {
    const match = window.matchHistory.find(m => m.id === matchId);
    if (!match) return;
    
    const text = `📅 ${match.date}
🏟️ ${match.team1.name} ${match.score} ${match.team2.name}
📍 ${match.location}
${match.duration ? `⏱️ ${match.duration} minutos\n` : ''}
${match.winner !== 'Empate' ? `🏆 Ganador: ${match.winner}\n` : '⚖️ Resultado: Empate\n'}
📱 Liga Escolar - Fútbol Sala`;
    
    shareText(text);
}

function deleteMatchFromHistory(matchId) {
    const matchIndex = window.matchHistory.findIndex(m => m.id === matchId);
    
    if (matchIndex !== -1) {
        const match = window.matchHistory[matchIndex];
        
        if (confirm(`¿Eliminar partido: ${match.team1.name} ${match.score} ${match.team2.name}?`)) {
            window.matchHistory.splice(matchIndex, 1);
            localStorage.setItem('futsal_history', JSON.stringify(window.matchHistory));
            renderMatchHistory();
            showNotification('Partido eliminado del historial', 'success');
        }
    }
}

// 12. SISTEMA DE COMPARTIR MEJORADO
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

function openShareHistoryModal() {
    const modal = document.getElementById('share-modal');
    const textEl = document.getElementById('share-text');
    const titleEl = document.getElementById('share-modal-title');
    
    if (modal && textEl && titleEl) {
        titleEl.textContent = 'Compartir Historial';
        textEl.textContent = generateHistoryShareText();
        modal.style.display = 'flex';
    }
}

function generateShareText() {
    const m = window.currentMatch;
    const now = new Date();
    
    return `⚽ *RESULTADO FÚTBOL SALA* ⚽

🏟️ ${m.team1.name} ${m.team1.score} - ${m.team2.score} ${m.team2.name}

📅 ${now.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
})}
🕒 ${now.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
})}

📍 ${m.location}
⏱️ Periodo: ${m.currentPeriod <= 2 ? `${m.currentPeriod}º Tiempo` : `Prórroga ${m.currentPeriod-2}`}
📊 Faltas: ${m.team1.fouls} - ${m.team2.fouls}

📱 Generado con Marcador Fútbol Sala - Liga Escolar
🔗 ${window.location.href}`;
}

function generateHistoryShareText() {
    const history = window.matchHistory;
    const now = new Date();
    
    let text = `📊 *HISTORIAL FÚTBOL SALA* 📊

📅 ${now.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
})}
🕒 ${now.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
})}

Total partidos: ${history.length}

`;

    if (history.length === 0) {
        text += 'No hay partidos en el historial.';
    } else {
        history.forEach((match, index) => {
            text += `
🏆 PARTIDO ${index + 1}
${match.team1.name} ${match.score} ${match.team2.name}
📍 ${match.location}
📅 ${match.date}
${match.duration ? `⏱️ ${match.duration} minutos\n` : ''}
────────────
`;
        });
    }
    
    text += `

📱 Generado con Marcador Fútbol Sala - Liga Escolar
🔗 ${window.location.href}`;
    
    return text;
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
    const title = document.getElementById('share-modal-title').textContent;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: window.location.href
        }).then(() => {
            console.log('Compartido exitosamente');
        }).catch(err => {
            console.error('Error al compartir:', err);
            copyShareText(); // Fallback
        });
    } else {
        copyShareText(); // Fallback
    }
}

function shareToWhatsapp() {
    const textEl = document.getElementById('share-text');
    if (!textEl) return;
    
    const text = encodeURIComponent(textEl.textContent);
    const url = `https://wa.me/?text=${text}`;
    
    window.open(url, '_blank');
}

function shareText(text) {
    const encodedText = encodeURIComponent(text);
    
    // Usar Web Share API si está disponible
    if (navigator.share) {
        navigator.share({
            title: 'Resultado Fútbol Sala',
            text: text,
            url: window.location.href
        }).catch(err => {
            console.error('Error al compartir:', err);
            // Fallback a WhatsApp
            window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        });
    } else {
        // Fallback: abrir menú con opciones
        const shareModal = document.createElement('div');
        shareModal.id = 'share-options-modal';
        shareModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;
        
        shareModal.innerHTML = `
            <div style="background: #2c3e50; padding: 30px; border-radius: 15px; max-width: 400px; width: 100%;">
                <h3 style="color: white; margin-bottom: 20px;">Compartir en:</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <button onclick="shareToApp('whatsapp', '${encodedText}')" style="background: #25D366; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer;">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button onclick="shareToApp('telegram', '${encodedText}')" style="background: #0088cc; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer;">
                        <i class="fab fa-telegram"></i> Telegram
                    </button>
                    <button onclick="shareToApp('twitter', '${encodedText}')" style="background: #1DA1F2; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer;">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                    <button onclick="shareToApp('email', '${encodedText}')" style="background: #EA4335; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-envelope"></i> Email
                    </button>
                </div>
                <button onclick="closeShareOptions()" style="margin-top: 20px; background: #7f8c8d; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; width: 100%;">
                    Cancelar
                </button>
            </div>
        `;
        
        document.body.appendChild(shareModal);
    }
}

function shareToApp(app, encodedText) {
    let url = '';
    
    switch(app) {
        case 'whatsapp':
            url = `https://wa.me/?text=${encodedText}`;
            break;
        case 'telegram':
            url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedText}`;
            break;
        case 'twitter':
            url = `https://twitter.com/intent/tweet?text=${encodedText}`;
            break;
        case 'email':
            url = `mailto:?subject=Resultado%20F%C3%BAtbol%20Sala&body=${encodedText}`;
            break;
    }
    
    if (url) {
        window.open(url, '_blank');
        closeShareOptions();
    }
}

function closeShareOptions() {
    const modal = document.getElementById('share-options-modal');
    if (modal) {
        modal.remove();
    }
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.style.display = 'none';
}

// 13. FUNCIONES DE CORRECCIÓN Y UTILIDAD
function updateCorrectionButtons() {
    // Mostrar/ocultar botones de corrección según el estado
    const m = window.currentMatch;
    
    // Actualizar botones de faltas
    document.querySelectorAll('.btn-remove-foul').forEach(btn => {
        const team = btn.dataset.team;
        btn.disabled = m[team].fouls <= 0;
    });
    
    // Actualizar botones de tiempos muertos
    document.querySelectorAll('.btn-recover-timeout').forEach(btn => {
        const team = btn.dataset.team;
        const timeoutsUsed = m[team].timeoutsUsed || 0;
        btn.disabled = timeoutsUsed <= 0 || m[team].timeouts >= 1;
    });
    
    // Actualizar botones de tarjetas
    document.querySelectorAll('.btn-remove-card').forEach(btn => {
        const team = btn.dataset.team;
        const hasYellowCards = Object.keys(m[team].yellowCards || {}).length > 0;
        const hasBlueCards = Object.keys(m[team].blueCards || {}).length > 0;
        btn.disabled = !hasYellowCards && !hasBlueCards;
    });
}

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
    if (confirm('¿Estás seguro de reiniciar el partido? Se perderán todos los datos.')) {
        resetMatch();
    }
}

function resetMatch() {
    // Guardar partido actual en historial si tiene datos
    if (window.currentMatch.team1.score > 0 || window.currentMatch.team2.score > 0 || 
        window.currentMatch.events.length > 0) {
        if (confirm('¿Guardar partido actual en historial antes de reiniciar?')) {
            saveMatchToHistory();
        }
    }
    
    // Reiniciar estado
    window.currentMatch = {
        ...INITIAL_STATE,
        startTime: new Date().toISOString()
    };
    
    // Limpiar timers
    clearInterval(timerInterval);
    clearInterval(timeoutTimer);
    
    // Eliminar display de timeout si existe
    const timeoutDisplay = document.getElementById('timeout-display');
    if (timeoutDisplay) timeoutDisplay.remove();
    
    // Guardar y renderizar
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
    
    // Configurar notificación
    notification.className = `notification ${type} show`;
    text.textContent = message;
    
    // Mostrar por 3 segundos
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

// 14. INICIALIZACIÓN DE EVENT LISTENERS
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
    
    // Input de tarjeta
    const cardInput = document.getElementById('card-player-number');
    if (cardInput) {
        cardInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.querySelector('#card-modal .btn-confirm').click();
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
    
    // Botón flotante de ayuda
    const helpBtn = document.querySelector('.floating-help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', (e) => {
            if (!confirm('¿Salir del marcador para ver la ayuda?')) {
                e.preventDefault();
            }
        });
    }
}

// 15. EXPORTAR FUNCIONES GLOBALES
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
window.openShareHistoryModal = openShareHistoryModal;
window.copyShareText = copyShareText;
window.shareViaNative = shareViaNative;
window.shareToWhatsapp = shareToWhatsapp;
window.shareText = shareText;
window.shareToApp = shareToApp;
window.closeShareOptions = closeShareOptions;
window.closeShareModal = closeShareModal;
window.clearMatchHistory = clearMatchHistory;
window.forceSave = forceSave;
window.saveMatchToHistory = saveMatchToHistory;
window.shareMatchFromHistory = shareMatchFromHistory;
window.deleteMatchFromHistory = deleteMatchFromHistory;
window.removeEvent = removeEvent;

// Inicializar cuando se carga la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        renderAll();
        renderMatchHistory();
    });
} else {
    renderAll();
    renderMatchHistory();
}
