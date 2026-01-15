/**
 * /js/futbol-sala.js - VERSIÓN FINAL CORREGIDA
 * Marcador Profesional con todas las correcciones
 */

// 1. ESTADO INICIAL CON NORMATIVA AMF/FIFUSA
const INITIAL_STATE = {
    team1: { 
        name: "EQUIPO LOCAL", 
        score: 0, 
        fouls: 0, 
        timeouts: 1,
        timeoutsUsed: 0,
        // Sistema AMF/FIFUSA
        yellowCards: {},    // { dorsal: cantidad }
        blueCards: {},      // { dorsal: cantidad }
        redCards: {}        // { dorsal: true/false }
    },
    team2: { 
        name: "EQUIPO VISITANTE", 
        score: 0, 
        fouls: 0, 
        timeouts: 1,
        timeoutsUsed: 0,
        yellowCards: {},
        blueCards: {},
        redCards: {}
    },
    currentPeriod: 1,       // 1: T1, 2: T2, 3: P1, 4: P2, 5: FINAL
    timeRemaining: 20 * 60, // 20 minutos en segundos
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

// 3. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fútbol Sala - Inicializando...');
    
    // Inicializar arrays si no existen
    if (!window.currentMatch.team1.redCards) window.currentMatch.team1.redCards = {};
    if (!window.currentMatch.team2.redCards) window.currentMatch.team2.redCards = {};
    
    // Renderizar todo
    renderAll();
    renderMatchHistory();
    
    // Iniciar timer si estaba corriendo
    if (window.currentMatch.isRunning && !window.currentMatch.isTimeoutActive) {
        startTimer();
    }
    
    // Inicializar botones de PWA
    initPWAButton();
});

// 4. FUNCIONES DE RENDERIZADO
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
        startBtn.title = 'Tiempo muerto activo';
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
        if (m.timeRemaining <= 300 && m.currentPeriod <= 2) {
            timerEl.style.color = m.timeRemaining <= 60 ? '#e74c3c' : '#f39c12';
        } else if (m.timeRemaining <= 60 && m.currentPeriod >= 3) {
            timerEl.style.color = '#e74c3c';
        } else {
            timerEl.style.color = '#fdbb2d';
        }
    }
}

// 5. LÓGICA DEL CRONÓMETRO - CORREGIDA PARA FINALIZACIÓN
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
        } else {
            // TIEMPO AGOTADO - LLEGAR A CERO
            clearInterval(timerInterval);
            m.timeRemaining = 0;
            m.isRunning = false;
            updateTimerDisplay();
            
            // FINALIZAR PERIODO INMEDIATAMENTE
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
    
    // Asegurar que el tiempo está en 0
    m.timeRemaining = 0;
    m.isRunning = false;
    
    // Verificar qué periodo es
    if (m.currentPeriod < 2) {
        // Primer tiempo terminado
        m.currentPeriod++;
        showNotification(`¡Fin del primer tiempo!`, 'info');
        
        // Resetear tiempo para segundo tiempo
        m.timeRemaining = 20 * 60;
        
        saveState();
        renderAll();
        
        // Preguntar si continuar
        setTimeout(() => {
            if (confirm('¿Preparado para el segundo tiempo?')) {
                m.isRunning = true;
                startTimer();
                renderAll();
            }
        }, 1000);
        
    } else if (m.currentPeriod === 2) {
        // SEGUNDO TIEMPO TERMINADO - VERIFICAR GANADOR
        const scoreDiff = m.team1.score - m.team2.score;
        
        if (scoreDiff !== 0) {
            // HAY GANADOR - FINALIZAR PARTIDO INMEDIATAMENTE
            setTimeout(() => {
                finishMatch();
            }, 1000);
        } else {
            // EMPATE - PREGUNTAR PRÓRROGA
            setTimeout(() => {
                if (confirm('¡Empate! ¿Deseas comenzar la prórroga?')) {
                    m.currentPeriod = 3;
                    m.timeRemaining = 5 * 60;
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
        // PRÓRROGA - VERIFICAR GOL DE ORO
        const scoreDiff = m.team1.score - m.team2.score;
        
        if (scoreDiff !== 0) {
            // GOL EN PRÓRROGA - FINALIZAR INMEDIATAMENTE
            setTimeout(() => {
                finishMatch();
            }, 1000);
        } else {
            // Continuar prórroga
            m.currentPeriod++;
            
            if (m.currentPeriod === 5) {
                // SEGUNDA PRÓRROGA TERMINADA - FINALIZAR
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

// 6. SISTEMA DE GOLES (CORREGIDO)
function addGoal(team) {
    window.currentMatch[team].score++;
    
    // Registrar evento
    logEvent("GOL", `⚽ Gol de ${window.currentMatch[team].name}`, team);
    
    // Verificar si es gol de oro en prórroga
    const m = window.currentMatch;
    if (m.currentPeriod >= 3 && m.currentPeriod <= 4) {
        // Estamos en prórroga
        const otherTeam = team === 'team1' ? 'team2' : 'team1';
        if (m[team].score > m[otherTeam].score) {
            // Gol de oro - finalizar inmediatamente
            setTimeout(() => {
                finishMatch();
            }, 1000);
        }
    }
    
    saveState();
    renderAll();
}

function changeScore(team, val) {
    window.currentMatch[team].score = Math.max(0, window.currentMatch[team].score + val);
    
    if (val > 0) {
        logEvent("GOL", `⚽ Gol de ${window.currentMatch[team].name}`, team);
    } else {
        logEvent("GOL_ANULADO", `❌ Gol anulado de ${window.currentMatch[team].name}`, team);
    }
    
    saveState();
    renderAll();
}

// 7. SISTEMA DE FALTAS (SIMPLIFICADO)
function addFoul(team) {
    window.currentMatch[team].fouls++;
    
    // Registrar evento
    logEvent("FALTA", `⚠️ Falta de ${window.currentMatch[team].name} (Total: ${window.currentMatch[team].fouls})`, team);
    
    // Notificación especial en la 6ta falta
    if (window.currentMatch[team].fouls === 6) {
        showNotification(`¡${window.currentMatch[team].name} tiene 6 faltas! Penalty doble en la siguiente.`, 'warning');
    }
    
    saveState();
    renderAll();
}

function removeFoul(team) {
    if (window.currentMatch[team].fouls > 0) {
        window.currentMatch[team].fouls--;
        logEvent("FALTA_CORREGIDA", `Falta eliminada de ${window.currentMatch[team].name}`, team);
        saveState();
        renderAll();
        showNotification(`Falta eliminada de ${window.currentMatch[team].name}`, 'info');
    } else {
        showNotification(`${window.currentMatch[team].name} no tiene faltas para eliminar`, 'warning');
    }
}

// 8. TIEMPOS MUERTOS (SIMPLIFICADO)
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

// 9. SISTEMA DE TARJETAS AMF/FIFUSA (CORREGIDO)
function openCardModal(team, type) {
    pendingCard = { team, type };
    
    const modal = document.getElementById('card-modal');
    const title = document.getElementById('card-modal-title');
    const input = document.getElementById('card-player-number');
    
    if (modal && title && input) {
        const teamName = window.currentMatch[team].name;
        const cardNames = {
            'yellow': 'AMARILLA',
            'blue': 'AZUL (Expulsión Temporal)',
            'red': 'ROJA (Expulsión Definitiva)'
        };
        
        title.textContent = `Tarjeta ${cardNames[type]} - ${teamName}`;
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
    
    // Asegurar que los objetos existen
    if (!teamObj.yellowCards) teamObj.yellowCards = {};
    if (!teamObj.blueCards) teamObj.blueCards = {};
    if (!teamObj.redCards) teamObj.redCards = {};
    
    // NORMATIVA AMF/FIFUSA:
    switch(type) {
        case 'yellow':
            // Amarilla simple
            teamObj.yellowCards[playerNum] = (teamObj.yellowCards[playerNum] || 0) + 1;
            
            // Verificar si es la segunda amarilla -> Azul
            if (teamObj.yellowCards[playerNum] >= 2) {
                // 2 Amarillas = 1 Azul
                teamObj.yellowCards[playerNum] = 0;
                teamObj.blueCards[playerNum] = (teamObj.blueCards[playerNum] || 0) + 1;
                
                logEvent("EXPULSIÓN", `🟨🟨 2ª Amarilla -> 🟦 Azul para dorsal ${playerNum} (Expulsión temporal 2 min)`, team);
                showNotification(`🟦 Dorsal ${playerNum} expulsado temporalmente (2 min) por doble amarilla!`, 'warning');
            } else {
                logEvent("TARJETA", `🟨 Amarilla para dorsal ${playerNum}`, team);
                showNotification(`🟨 Tarjeta amarilla para dorsal ${playerNum}`, 'warning');
            }
            break;
            
        case 'blue':
            // Azul directa (expulsión temporal 2 min)
            teamObj.blueCards[playerNum] = (teamObj.blueCards[playerNum] || 0) + 1;
            
            // Verificar combinaciones:
            // 1. Si ya tiene amarilla -> Roja
            if (teamObj.yellowCards[playerNum] >= 1) {
                teamObj.yellowCards[playerNum] = 0;
                teamObj.blueCards[playerNum] = 0;
                teamObj.redCards[playerNum] = true;
                
                logEvent("EXPULSIÓN", `🟨+🟦 Amarilla + Azul -> 🟥 Roja para dorsal ${playerNum} (Expulsión definitiva)`, team);
                showNotification(`🟥 Dorsal ${playerNum} expulsado definitivamente (Amarilla + Azul)!`, 'error');
            }
            // 2. Si es la segunda azul -> Roja
            else if (teamObj.blueCards[playerNum] >= 2) {
                teamObj.blueCards[playerNum] = 0;
                teamObj.redCards[playerNum] = true;
                
                logEvent("EXPULSIÓN", `🟦🟦 2 Azules -> 🟥 Roja para dorsal ${playerNum} (Expulsión definitiva)`, team);
                showNotification(`🟥 Dorsal ${playerNum} expulsado definitivamente por dos azules!`, 'error');
            }
            // 3. Azul simple
            else {
                logEvent("EXPULSIÓN", `🟦 Azul para dorsal ${playerNum} (Expulsión temporal 2 min)`, team);
                showNotification(`🟦 Dorsal ${playerNum} expulsado temporalmente (2 minutos)`, 'warning');
            }
            break;
            
        case 'red':
            // Roja directa (expulsión definitiva)
            teamObj.redCards[playerNum] = true;
            
            // Limpiar otras tarjetas del mismo jugador
            if (teamObj.yellowCards[playerNum]) delete teamObj.yellowCards[playerNum];
            if (teamObj.blueCards[playerNum]) delete teamObj.blueCards[playerNum];
            
            logEvent("EXPULSIÓN", `🟥 Roja directa para dorsal ${playerNum} (Expulsión definitiva)`, team);
            showNotification(`🟥 Dorsal ${playerNum} expulsado definitivamente!`, 'error');
            break;
    }
    
    closeModal('card-modal');
    saveState();
    renderAll();
}

// 10. SISTEMA DE EVENTOS
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

// 11. FINALIZACIÓN DE PARTIDO (CORREGIDA)
function finishMatch() {
    const m = window.currentMatch;
    
    m.matchEnded = true;
    m.isRunning = false;
    m.currentPeriod = 5;
    
    clearInterval(timerInterval);
    clearInterval(timeoutTimer);
    
    // Eliminar display de timeout si existe
    const timeoutDisplay = document.getElementById('timeout-display');
    if (timeoutDisplay) {
        timeoutDisplay.remove();
    }
    
    // Determinar ganador
    let winner = null;
    if (m.team1.score > m.team2.score) {
        winner = { team: 'team1', name: m.team1.name, score: m.team1.score };
    } else if (m.team2.score > m.team1.score) {
        winner = { team: 'team2', name: m.team2.name, score: m.team2.score };
    }
    
    if (winner) {
        // Mostrar notificación de victoria
        showNotification(`🏆 ¡${winner.name} GANA EL PARTIDO! ${m.team1.score}-${m.team2.score}`, 'success');
        
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

// 12. HISTORIAL
function saveMatchToHistory() {
    const m = window.currentMatch;
    
    const matchData = {
        id: Date.now(),
        team1: { 
            name: m.team1.name,
            score: m.team1.score,
            fouls: m.team1.fouls
        },
        team2: { 
            name: m.team2.name,
            score: m.team2.score,
            fouls: m.team2.fouls
        },
        score: `${m.team1.score}-${m.team2.score}`,
        location: m.location,
        date: new Date().toLocaleString('es-ES'),
        timestamp: new Date().toISOString(),
        period: m.currentPeriod,
        winner: m.team1.score > m.team2.score ? m.team1.name : 
                m.team2.score > m.team1.score ? m.team2.name : 'Empate'
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
            </div>
        </div>
    `).join('');
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

// 13. COMPARTIR
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

// 14. FUNCIONES DE UTILIDAD
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
    window.currentMatch = {...INITIAL_STATE};
    
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

// 15. SISTEMA PWA - ACTUALIZACIÓN Y CACHÉ
function initPWAButton() {
    const pwaBtn = document.getElementById('pwa-update-btn');
    if (pwaBtn) {
        pwaBtn.addEventListener('click', updatePWA);
    }
}

async function updatePWA() {
    if ('serviceWorker' in navigator) {
        try {
            showNotification('Actualizando aplicación...', 'info');
            
            // Obtener registro del Service Worker
            const registration = await navigator.serviceWorker.getRegistration();
            
            if (registration) {
                // 1. Borrar toda la caché
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                
                // 2. Forzar actualización del Service Worker
                await registration.update();
                
                // 3. Desregistrar el Service Worker actual
                await registration.unregister();
                
                // 4. Recargar la página para registrar nuevo Service Worker
                showNotification('✅ Aplicación actualizada. Recargando...', 'success');
                setTimeout(() => {
                    location.reload(true); // true = forzar recarga desde servidor
                }, 1500);
            } else {
                showNotification('No hay Service Worker registrado', 'warning');
            }
        } catch (error) {
            console.error('Error al actualizar PWA:', error);
            showNotification('Error al actualizar la aplicación', 'error');
        }
    } else {
        showNotification('PWA no soportado en este navegador', 'warning');
    }
}

function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // Nueva versión disponible
                                showNotification('¡Nueva versión disponible!', 'info');
                                
                                // Mostrar botón de actualización
                                const updateBtn = document.getElementById('pwa-update-btn');
                                if (updateBtn) {
                                    updateBtn.style.display = 'flex';
                                }
                            }
                        }
                    });
                });
            }
        });
    }
}

// 16. INICIALIZACIÓN DE EVENT LISTENERS
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
    
    // Botones de corrección de faltas
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-foul')) {
            const team = e.target.dataset.team;
            removeFoul(team);
        }
    });
}

// 17. EXPORTAR FUNCIONES GLOBALES (IMPORTANTE PARA HTML)
window.toggleTimer = toggleTimer;
window.confirmReset = confirmReset;
window.nextPeriod = nextPeriod;
window.addGoal = addGoal;
window.changeScore = changeScore;
window.addFoul = addFoul;
window.removeFoul = removeFoul;
window.useTimeout = useTimeout;
window.openCardModal = openCardModal;
window.processCard = processCard;
window.closeModal = closeModal;
window.editTeamName = editTeamName;
window.openShareModal = openShareModal;
window.copyShareText = copyShareText;
window.shareViaNative = shareViaNative;
window.shareToWhatsapp = shareToWhatsapp;
window.closeShareModal = closeShareModal;
window.clearMatchHistory = clearMatchHistory;
window.forceSave = forceSave;
window.updatePWA = updatePWA;
window.saveMatchToHistory = saveMatchToHistory;

// Inicializar cuando se carga la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initEventListeners();
        renderAll();
        renderMatchHistory();
        checkForUpdates();
    });
} else {
    initEventListeners();
    renderAll();
    renderMatchHistory();
    checkForUpdates();
}
