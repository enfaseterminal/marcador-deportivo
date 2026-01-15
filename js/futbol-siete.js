/**
 * /futbol-siete/futbol-siete.js
 * Marcador Profesional para Fútbol 7
 * Reglas FIFA modificadas para fútbol 7
 */

// 1. ESTADO INICIAL - FÚTBOL 7
const INITIAL_STATE = {
    team1: { 
        name: "EQUIPO LOCAL", 
        score: 0, 
        fouls: 0,
        corners: 0,
        throwins: 0,
        yellowCards: {},
        redCards: {},
        // Estadísticas avanzadas
        shotsOnTarget: 0,
        shotsOffTarget: 0,
        offsides: 0
    },
    team2: { 
        name: "EQUIPO VISITANTE", 
        score: 0, 
        fouls: 0,
        corners: 0,
        throwins: 0,
        yellowCards: {},
        redCards: {},
        shotsOnTarget: 0,
        shotsOffTarget: 0,
        offsides: 0
    },
    currentPeriod: 1,           // 1: Primer tiempo, 2: Segundo tiempo, 3: FINAL
    timeRemaining: 25 * 60,    // 25 minutos en segundos
    isRunning: false,
    location: "No especificada",
    events: [],
    matchEnded: false,
    startTime: null,
    endTime: null,
    totalDuration: 0
};

// 2. VARIABLES GLOBALES
window.currentMatch = JSON.parse(localStorage.getItem('futbol7_match')) || {...INITIAL_STATE};
window.matchHistory = JSON.parse(localStorage.getItem('futbol7_history')) || [];
let timerInterval = null;
let pendingCard = null;

// 3. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fútbol 7 - Inicializando...');
    
    // Asegurar que existan las propiedades de estadísticas
    if (!window.currentMatch.team1.shotsOnTarget) window.currentMatch.team1.shotsOnTarget = 0;
    if (!window.currentMatch.team1.shotsOffTarget) window.currentMatch.team1.shotsOffTarget = 0;
    if (!window.currentMatch.team1.offsides) window.currentMatch.team1.offsides = 0;
    if (!window.currentMatch.team2.shotsOnTarget) window.currentMatch.team2.shotsOnTarget = 0;
    if (!window.currentMatch.team2.shotsOffTarget) window.currentMatch.team2.shotsOffTarget = 0;
    if (!window.currentMatch.team2.offsides) window.currentMatch.team2.offsides = 0;
    
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
    if (window.currentMatch.isRunning) {
        startTimer();
    }
});

// 4. FUNCIONES DE RENDERIZADO
function renderAll() {
    const m = window.currentMatch;
    
    // Nombres y Marcador
    document.getElementById('team1-name-display').textContent = m.team1.name;
    document.getElementById('team2-name-display').textContent = m.team2.name;
    document.getElementById('team1-score').textContent = m.team1.score;
    document.getElementById('team2-score').textContent = m.team2.score;
    
    // Estadísticas básicas
    document.getElementById('team1-fouls').textContent = m.team1.fouls;
    document.getElementById('team2-fouls').textContent = m.team2.fouls;
    document.getElementById('team1-corners').textContent = m.team1.corners;
    document.getElementById('team2-corners').textContent = m.team2.corners;
    document.getElementById('team1-throwins').textContent = m.team1.throwins;
    document.getElementById('team2-throwins').textContent = m.team2.throwins;
    
    // Estadísticas avanzadas
    document.getElementById('team1-shots').textContent = m.team1.shotsOnTarget;
    document.getElementById('team2-shots').textContent = m.team2.shotsOnTarget;
    document.getElementById('team1-offtarget').textContent = m.team1.shotsOffTarget;
    document.getElementById('team2-offtarget').textContent = m.team2.shotsOffTarget;
    document.getElementById('team1-offside').textContent = m.team1.offsides;
    document.getElementById('team2-offside').textContent = m.team2.offsides;
    
    // Ubicación
    document.getElementById('current-location').textContent = m.location;
    
    // Periodo
    renderPeriodText();
    
    // Timer
    updateTimerDisplay();
    
    // Botón de play/pause
    const startBtn = document.getElementById('start-pause-btn');
    const icon = startBtn.querySelector('i');
    
    startBtn.disabled = false;
    startBtn.title = m.isRunning ? 'Pausar' : 'Iniciar';
    icon.className = m.isRunning ? 'fas fa-pause' : 'fas fa-play';
    
    // Lista de eventos
    renderEvents();
}

function renderPeriodText() {
    const periods = ["", "1º TIEMPO", "2º TIEMPO", "FINAL"];
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
        
        // Cambiar color si queda poco tiempo
        if (m.timeRemaining <= 300) { // 5 minutos
            timerEl.style.color = m.timeRemaining <= 60 ? '#e74c3c' : '#f39c12';
        } else {
            timerEl.style.color = '#f39c12';
        }
    }
}

// 5. LÓGICA DEL CRONÓMETRO
function toggleTimer() {
    const m = window.currentMatch;
    
    if (m.matchEnded) return;
    
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
            
            // Notificaciones
            if (m.timeRemaining === 300) { // 5 minutos
                showNotification('¡Quedan 5 minutos!', 'warning');
            }
            if (m.timeRemaining === 60) { // 1 minuto
                showNotification('¡Queda 1 minuto!', 'warning');
            }
        } else {
            // Tiempo agotado
            clearInterval(timerInterval);
            m.timeRemaining = 0;
            m.isRunning = false;
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
    
    // Asegurar tiempo en 0
    m.timeRemaining = 0;
    m.isRunning = false;
    
    if (m.currentPeriod < 2) {
        // Primer tiempo terminado
        m.currentPeriod++;
        showNotification(`¡Fin del primer tiempo!`, 'info');
        
        // Resetear tiempo para segundo tiempo
        m.timeRemaining = 25 * 60;
        
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
        // SEGUNDO TIEMPO TERMINADO - FINALIZAR PARTIDO
        setTimeout(() => {
            finishMatch();
        }, 1000);
    }
}

function nextPeriod() {
    const m = window.currentMatch;
    
    if (m.matchEnded) return;
    
    if (m.currentPeriod < 2) {
        if (confirm('¿Avanzar al segundo tiempo?')) {
            m.currentPeriod++;
            m.timeRemaining = 25 * 60;
            m.isRunning = false;
            clearInterval(timerInterval);
            
            saveState();
            renderAll();
            showNotification(`Segundo tiempo listo`, 'info');
        }
    } else if (m.currentPeriod === 2) {
        // Forzar finalización del partido
        if (confirm('¿Finalizar el partido ahora?')) {
            finishMatch();
        }
    }
}

// 6. SISTEMA DE GOLES
function addGoal(team) {
    window.currentMatch[team].score++;
    
    // Registrar evento
    logEvent("GOL", `⚽ Gol de ${window.currentMatch[team].name}`, team);
    
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
    window.currentMatch[team].score = Math.max(0, window.currentMatch[team].score + val);
    
    if (val > 0) {
        logEvent("GOL", `⚽ Gol de ${window.currentMatch[team].name}`, team);
    } else {
        logEvent("GOL_ANULADO", `❌ Gol anulado de ${window.currentMatch[team].name}`, team);
    }
    
    saveState();
    renderAll();
}

// 7. ESTADÍSTICAS BÁSICAS
function addFoul(team) {
    window.currentMatch[team].fouls++;
    logEvent("FALTA", `⚠️ Falta de ${window.currentMatch[team].name}`, team);
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

function addCorner(team) {
    window.currentMatch[team].corners++;
    logEvent("CÓRNER", `↪️ Córner para ${window.currentMatch[team].name}`, team);
    saveState();
    renderAll();
}

function removeCorner(team) {
    if (window.currentMatch[team].corners > 0) {
        window.currentMatch[team].corners--;
        logEvent("CÓRNER_CORREGIDO", `Córner eliminado de ${window.currentMatch[team].name}`, team);
        saveState();
        renderAll();
        showNotification(`Córner eliminado de ${window.currentMatch[team].name}`, 'info');
    } else {
        showNotification(`${window.currentMatch[team].name} no tiene córners para eliminar`, 'warning');
    }
}

function addThrowIn(team) {
    window.currentMatch[team].throwins++;
    logEvent("SAQUE_LATERAL", `📤 Saque lateral para ${window.currentMatch[team].name}`, team);
    saveState();
    renderAll();
}

function removeThrowIn(team) {
    if (window.currentMatch[team].throwins > 0) {
        window.currentMatch[team].throwins--;
        logEvent("SAQUE_CORREGIDO", `Saque lateral eliminado de ${window.currentMatch[team].name}`, team);
        saveState();
        renderAll();
        showNotification(`Saque lateral eliminado de ${window.currentMatch[team].name}`, 'info');
    } else {
        showNotification(`${window.currentMatch[team].name} no tiene saques laterales para eliminar`, 'warning');
    }
}

// 8. ESTADÍSTICAS AVANZADAS
function addShot(team, type) {
    if (type === 'ontarget') {
        window.currentMatch[team].shotsOnTarget++;
        logEvent("TIRO_A_PUERTA", `🎯 Tiro a puerta de ${window.currentMatch[team].name}`, team);
    } else {
        window.currentMatch[team].shotsOffTarget++;
        logEvent("TIRO_FUERA", `⛔ Tiro fuera de ${window.currentMatch[team].name}`, team);
    }
    saveState();
    renderAll();
}

function addOffside(team) {
    window.currentMatch[team].offsides++;
    logEvent("FUERA_DE_JUEGO", `🚨 Fuera de juego de ${window.currentMatch[team].name}`, team);
    saveState();
    renderAll();
}

// 9. SISTEMA DE TARJETAS (FIFA)
function openCardModal(team, type) {
    pendingCard = { team, type };
    
    const modal = document.getElementById('card-modal');
    const title = document.getElementById('card-modal-title');
    const input = document.getElementById('card-player-number');
    
    if (modal && title && input) {
        const teamName = window.currentMatch[team].name;
        const cardNames = {
            'yellow': 'AMARILLA',
            'red': 'ROJA'
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
    if (!teamObj.redCards) teamObj.redCards = {};
    
    if (type === 'yellow') {
        // Amarilla simple (FIFA: 2 amarillas = roja)
        teamObj.yellowCards[playerNum] = (teamObj.yellowCards[playerNum] || 0) + 1;
        
        // Verificar si es la segunda amarilla -> Roja
        if (teamObj.yellowCards[playerNum] >= 2) {
            // 2 Amarillas = 1 Roja
            teamObj.yellowCards[playerNum] = 0;
            teamObj.redCards[playerNum] = true;
            
            logEvent("EXPULSIÓN", `🟨🟨 2ª Amarilla -> 🟥 Roja para dorsal ${playerNum}`, team);
            showNotification(`🟥 Dorsal ${playerNum} expulsado por doble amarilla!`, 'error');
        } else {
            logEvent("TARJETA", `🟨 Amarilla para dorsal ${playerNum}`, team);
            showNotification(`🟨 Tarjeta amarilla para dorsal ${playerNum}`, 'warning');
        }
    } else {
        // Roja directa (expulsión definitiva)
        teamObj.redCards[playerNum] = true;
        
        // Limpiar amarillas del mismo jugador
        if (teamObj.yellowCards[playerNum]) delete teamObj.yellowCards[playerNum];
        
        logEvent("EXPULSIÓN", `🟥 Roja directa para dorsal ${playerNum} (Expulsión definitiva)`, team);
        showNotification(`🟥 Dorsal ${playerNum} expulsado definitivamente!`, 'error');
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

// 11. FINALIZACIÓN DE PARTIDO
function finishMatch() {
    const m = window.currentMatch;
    
    m.matchEnded = true;
    m.isRunning = false;
    m.currentPeriod = 3;
    m.endTime = new Date().toISOString();
    
    clearInterval(timerInterval);
    
    // Calcular duración
    if (m.startTime && m.endTime) {
        const start = new Date(m.startTime);
        const end = new Date(m.endTime);
        m.totalDuration = Math.round((end - start) / 1000 / 60); // minutos
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
            fouls: m.team1.fouls,
            corners: m.team1.corners
        },
        team2: { 
            name: m.team2.name,
            score: m.team2.score,
            fouls: m.team2.fouls,
            corners: m.team2.corners
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
        winner: m.team1.score > m.team2.score ? m.team1.name : 
                m.team2.score > m.team1.score ? m.team2.name : 'Empate'
    };
    
    window.matchHistory.unshift(matchData);
    
    if (window.matchHistory.length > 20) {
        window.matchHistory = window.matchHistory.slice(0, 20);
    }
    
    localStorage.setItem('futbol7_history', JSON.stringify(window.matchHistory));
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
        localStorage.removeItem('futbol7_history');
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
    
    let text = `⚽ RESULTADO FÚTBOL 7 ⚽

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
⏱️ Periodo: ${m.currentPeriod === 3 ? 'FINAL' : `${m.currentPeriod}º Tiempo`}

📊 ESTADÍSTICAS:
Faltas: ${m.team1.fouls} - ${m.team2.fouls}
Córners: ${m.team1.corners} - ${m.team2.corners}
Tiros a puerta: ${m.team1.shotsOnTarget} - ${m.team2.shotsOnTarget}

📱 Generado con Marcador Fútbol 7 - Liga Escolar`;
    
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
    
    if (navigator.share) {
        navigator.share({
            title: 'Resultado Fútbol 7',
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
    
    // Limpiar timer
    clearInterval(timerInterval);
    
    // Guardar y renderizar
    localStorage.removeItem('futbol7_match');
    renderAll();
    
    showNotification('Partido reiniciado', 'info');
}

function forceSave() {
    saveMatchToHistory();
}

function saveState() {
    localStorage.setItem('futbol7_match', JSON.stringify(window.currentMatch));
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

// 15. FUNCIONES PWA
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
                
                // 3. Recargar la página
                showNotification('✅ Aplicación actualizada. Recargando...', 'success');
                setTimeout(() => {
                    location.reload(true);
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
    
    // Botones de corrección dinámicos
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-foul')) {
            const team = e.target.dataset.team;
            removeFoul(team);
        }
        
        if (e.target.classList.contains('btn-remove-corner')) {
            const team = e.target.dataset.team;
            removeCorner(team);
        }
        
        if (e.target.classList.contains('btn-remove-throwin')) {
            const team = e.target.dataset.team;
            removeThrowIn(team);
        }
    });
    
    // Botón PWA
    const pwaBtn = document.getElementById('pwa-update-btn');
    if (pwaBtn) {
        pwaBtn.addEventListener('click', updatePWA);
    }
}

// 17. EXPORTAR FUNCIONES GLOBALES
window.toggleTimer = toggleTimer;
window.confirmReset = confirmReset;
window.nextPeriod = nextPeriod;
window.addGoal = addGoal;
window.changeScore = changeScore;
window.addFoul = addFoul;
window.removeFoul = removeFoul;
window.addCorner = addCorner;
window.removeCorner = removeCorner;
window.addThrowIn = addThrowIn;
window.removeThrowIn = removeThrowIn;
window.addShot = addShot;
window.addOffside = addOffside;
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
        renderAll();
        renderMatchHistory();
    });
} else {
    renderAll();
    renderMatchHistory();
}
