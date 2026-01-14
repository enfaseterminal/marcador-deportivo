/**
 * /js/futbol-sala.js - VERSIÓN MEJORADA COMPLETA
 * Marcador Profesional con todas las mejoras solicitadas
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
    totalDuration: 0
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
            // Tiempo agotado
            clearInterval(timerInterval);
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
        // Fin del segundo tiempo - verificar empate
        if (m.team1.score === m.team2.score) {
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
        } else {
            finishMatch();
        }
    } else if (m.currentPeriod < 5) {
        // Prórroga
        m.currentPeriod++;
        
        if (m.currentPeriod === 5) {
            // Segunda prórroga terminada
            finishMatch();
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

// 7. ACCIONES DE JUEGO
function addGoal(team) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    teamObj.score++;
    
    // Registrar evento
    logEvent("GOL", `⚽ Gol de ${teamObj.name}`, team);
    
    // Efecto visual en el marcador
    const scoreEl = document.getElementById(`${team}-score`);
    if (scoreEl) {
        scoreEl.style.transform = 'scale(1.2)';
        setTimeout(() => scoreEl.style.transform = 'scale(1)', 300);
    }
    
    // Verificar si es un gol de la victoria
    if (m.currentPeriod >= 5) { // En final o prórroga
        checkForWinner();
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

function addFoul(team) {
    const m = window.currentMatch;
    const teamObj = m[team];
    
    teamObj.fouls++;
    
    // Registrar evento
    logEvent("FALTA", `⚠️ Falta de ${teamObj.name} (Total: ${teamObj.fouls})`, team);
    
    // Notificación especial en la 6ta falta
    if (teamObj.fouls === 6) {
        showNotification(`¡${teamObj.name} tiene 6 faltas! Penalty doble en la siguiente.`, 'warning');
    }
    
    saveState();
    renderAll();
}

// 8. SISTEMA DE TARJETAS MEJORADO
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
        // Contar amarillas por jugador
        teamObj.yellowCards[playerNum] = (teamObj.yellowCards[playerNum] || 0) + 1;
        
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
        logEvent("EXPULSIÓN", `🟦 Tarjeta azul para dorsal ${playerNum}`, team);
        showNotification(`🟦 Tarjeta azul (expulsión) para dorsal ${playerNum}`, 'error');
    }
    
    closeModal('card-modal');
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
        </div>
    `).join('');
}

// 10. FINALIZACIÓN DE PARTIDO Y CELEBRACIÓN
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
    if (m.team1.score > m.team2.score) {
        winner = { team: 'team1', name: m.team1.name };
    } else if (m.team2.score > m.team1.score) {
        winner = { team: 'team2', name: m.team2.name };
    }
    
    if (winner) {
        // Mostrar notificación de victoria
        showNotification(`🏆 ¡${winner.name} GANA EL PARTIDO!`, 'success');
        
        // Lanzar celebración
        if (typeof showCelebration === 'function') {
            setTimeout(() => showCelebration(), 500);
        }
        
        // Preguntar si guardar en historial
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

function checkForWinner() {
    const m = window.currentMatch;
    
    // Solo verificar ganador en periodos finales
    if (m.currentPeriod >= 5 && !m.matchEnded) {
        if (m.team1.score !== m.team2.score) {
            finishMatch();
        }
    }
}

// 11. SISTEMA DE HISTORIAL MEJORADO
function saveMatchToHistory() {
    const m = window.currentMatch;
    
    const matchData = {
        id: Date.now(),
        team1: { ...m.team1 },
        team2: { ...m.team2 },
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
        events: [...m.events].slice(0, 10) // Solo primeros 10 eventos
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
        <div class="history-item" onclick="loadMatchFromHistory(${match.id})">
            <div class="history-teams">
                ${match.team1.name} vs ${match.team2.name}
            </div>
            <div class="history-score">
                ${match.score}
            </div>
            <div class="history-info">
                <div><i class="fas fa-calendar"></i> ${match.date}</div>
                <div class="history-location"><i class="fas fa-map-marker-alt"></i> ${match.location}</div>
                ${match.duration ? `<div class="history-duration"><i class="fas fa-clock"></i> ${match.duration} min</div>` : ''}
            </div>
        </div>
    `).join('');
}

function loadMatchFromHistory(matchId) {
    const match = window.matchHistory.find(m => m.id === matchId);
    if (!match) return;
    
    if (confirm('¿Cargar este partido? Se perderá el progreso actual.')) {
        window.currentMatch = {
            ...INITIAL_STATE,
            team1: { ...match.team1 },
            team2: { ...match.team2 },
            location: match.location,
            events: [...match.events]
        };
        
        saveState();
        renderAll();
        showNotification('Partido cargado desde historial', 'success');
    }
}

function clearMatchHistory() {
    if (window.matchHistory.length === 0) {
        showNotification('El historial ya está vacío', 'info');
        return;
    }
    
    if (confirm('¿Estás seguro de borrar todo el historial? Esta acción no se puede deshacer.')) {
        window.matchHistory = [];
        localStorage.removeItem('futsal_history');
        renderMatchHistory();
        showNotification('Historial borrado', 'success');
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

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.style.display = 'none';
}

// 13. FUNCIONES DE UTILIDAD
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
window.useTimeout = useTimeout;
window.openCardModal = openCardModal;
window.processCard = processCard;
window.closeModal = closeModal;
window.editTeamName = editTeamName;
window.openShareModal = openShareModal;
window.openShareHistoryModal = openShareHistoryModal;
window.copyShareText = copyShareText;
window.shareViaNative = shareViaNative;
window.shareToWhatsapp = shareToWhatsapp;
window.closeShareModal = closeShareModal;
window.clearMatchHistory = clearMatchHistory;
window.forceSave = forceSave;
window.saveMatchToHistory = saveMatchToHistory;
window.loadMatchFromHistory = loadMatchFromHistory;

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
