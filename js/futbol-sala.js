// /js/futbol-sala.js
// Marcador completo para fútbol sala con cronómetro y prórroga

// Variables globales específicas de fútbol sala
window.currentMatch = {
    team1: { 
        name: "Equipo Local", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: []
    },
    team2: { 
        name: "Equipo Visitante", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: []
    },
    currentPeriod: 1, // 1 = Primer tiempo, 2 = Segundo tiempo, 3 = Prórroga 1, 4 = Prórroga 2
    totalPeriods: 2,
    overtimePeriods: 2,
    isOvertime: false,
    periodDuration: 20 * 60, // 20 minutos en segundos
    overtimeDuration: 5 * 60, // 5 minutos en segundos para prórroga
    timeRemaining: 20 * 60,
    timerRunning: false,
    timerInterval: null,
    startTime: new Date(),
    matchStatus: 'NOT_STARTED', // NOT_STARTED, RUNNING, PAUSED, FINISHED
    winner: null,
    location: "No especificada",
    events: []
};

window.matchHistory = [];
window.editingTeam = null;
window.savingMatchAfterWin = false;

// Configuración específica del deporte
window.sportName = "Fútbol Sala";
window.sportUrl = "https://www.ligaescolar.es/futbol-sala/";

// ========== FUNCIONES PRINCIPALES ==========

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando fútbol sala...');
    
    // Cargar datos guardados
    loadFromCookies();
    
    // Inicializar la interfaz
    updateDisplay();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Configurar funciones globales
    window.generateShareText = generateShareText;
    window.saveToCookies = saveToCookies;
    window.loadFromCookies = loadFromCookies;
    
    console.log("Fútbol sala inicializado correctamente");
});

// Configurar todos los event listeners
function setupEventListeners() {
    // Controles de tiempo
    document.getElementById('start-timer').addEventListener('click', startTimer);
    document.getElementById('pause-timer').addEventListener('click', pauseTimer);
    document.getElementById('reset-timer').addEventListener('click', resetTimer);
    document.getElementById('next-period').addEventListener('click', nextPeriod);
    
    // Controles de goles
    document.getElementById('team1-add-goal').addEventListener('click', () => addGoal('team1'));
    document.getElementById('team1-remove-goal').addEventListener('click', () => removeGoal('team1'));
    document.getElementById('team2-add-goal').addEventListener('click', () => addGoal('team2'));
    document.getElementById('team2-remove-goal').addEventListener('click', () => removeGoal('team2'));
    
    // Controles de faltas y timeouts
    document.getElementById('team1-foul').addEventListener('click', () => addFoul('team1'));
    document.getElementById('team2-foul').addEventListener('click', () => addFoul('team2'));
    document.getElementById('team1-timeout').addEventListener('click', () => useTimeout('team1'));
    document.getElementById('team2-timeout').addEventListener('click', () => useTimeout('team2'));
    
    // Controles del partido
    document.getElementById('activate-overtime').addEventListener('click', activateOvertime);
    document.getElementById('reset-match').addEventListener('click', resetMatch);
    document.getElementById('save-match').addEventListener('click', () => window.modalManager.openSaveMatchModal());
    
    // Compartir
    document.getElementById('share-results').addEventListener('click', window.common.openShareCurrentModal);
    document.getElementById('share-history').addEventListener('click', window.common.openShareHistoryModal);
    document.getElementById('share-whatsapp').addEventListener('click', window.common.shareToWhatsapp);
    
    // Ubicación
    document.getElementById('save-location').addEventListener('click', saveLocation);
    document.getElementById('match-location-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveLocation();
    });
    
    // Nombres de equipos
    document.getElementById('team1-name').addEventListener('click', () => window.common.openTeamNameModal('team1'));
    document.getElementById('team2-name').addEventListener('click', () => window.common.openTeamNameModal('team2'));
}

// Actualizar la interfaz
function updateDisplay() {
    // Actualizar nombres de equipos
    document.getElementById('team1-name').textContent = window.currentMatch.team1.name;
    document.getElementById('team2-name').textContent = window.currentMatch.team2.name;
    
    // Actualizar marcador de goles
    document.getElementById('team1-score').textContent = window.currentMatch.team1.score;
    document.getElementById('team2-score').textContent = window.currentMatch.team2.score;
    
    // Actualizar timeouts y faltas
    document.getElementById('team1-timeouts').textContent = window.currentMatch.team1.timeouts;
    document.getElementById('team2-timeouts').textContent = window.currentMatch.team2.timeouts;
    document.getElementById('team1-fouls').textContent = window.currentMatch.team1.fouls;
    document.getElementById('team2-fouls').textContent = window.currentMatch.team2.fouls;
    
    // Actualizar información del periodo
    updatePeriodDisplay();
    
    // Actualizar estado del partido
    updateMatchStatus();
    
    // Actualizar cronómetro
    updateTimerDisplay();
    
    // Actualizar historial de eventos
    renderEvents();
    
    // Guardar cambios
    saveToCookies();
}

// Actualizar información del periodo
function updatePeriodDisplay() {
    let periodText = '';
    let periodNumber = window.currentMatch.currentPeriod;
    
    if (!window.currentMatch.isOvertime) {
        periodText = periodNumber === 1 ? '1° Tiempo' : '2° Tiempo';
    } else {
        if (periodNumber === 3) periodText = 'Prórroga 1';
        else if (periodNumber === 4) periodText = 'Prórroga 2';
        else periodText = 'Prórroga';
    }
    
    document.getElementById('current-period').textContent = periodText;
    document.getElementById('period-info').textContent = periodText;
    
    // Actualizar estado de prórroga
    document.getElementById('overtime-status').textContent = window.currentMatch.isOvertime ? 'Sí' : 'No';
}

// Actualizar estado del partido
function updateMatchStatus() {
    let statusText = '';
    let statusColor = '';
    
    switch(window.currentMatch.matchStatus) {
        case 'NOT_STARTED':
            statusText = 'No iniciado';
            statusColor = '#95a5a6';
            break;
        case 'RUNNING':
            statusText = 'En curso';
            statusColor = '#2ecc71';
            break;
        case 'PAUSED':
            statusText = 'Pausado';
            statusColor = '#f39c12';
            break;
        case 'FINISHED':
            statusText = 'Finalizado';
            statusColor = '#e74c3c';
            break;
    }
    
    document.getElementById('match-status').textContent = statusText;
    document.getElementById('match-status').style.color = statusColor;
}

// Actualizar cronómetro
function updateTimerDisplay() {
    const minutes = Math.floor(window.currentMatch.timeRemaining / 60);
    const seconds = window.currentMatch.timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Actualizar en todos los lugares
    document.getElementById('main-timer').textContent = timeString;
    document.getElementById('match-timer').textContent = timeString;
    
    // Aplicar estilos según el estado
    const mainTimer = document.getElementById('main-timer');
    mainTimer.classList.remove('timer-running', 'timer-paused', 'timer-finished');
    
    if (window.currentMatch.matchStatus === 'RUNNING') {
        mainTimer.classList.add('timer-running');
    } else if (window.currentMatch.matchStatus === 'PAUSED') {
        mainTimer.classList.add('timer-paused');
    } else if (window.currentMatch.matchStatus === 'FINISHED') {
        mainTimer.classList.add('timer-finished');
    }
}

// Iniciar cronómetro
function startTimer() {
    if (window.currentMatch.matchStatus === 'FINISHED') return;
    
    if (window.currentMatch.matchStatus === 'NOT_STARTED') {
        // Primer inicio del partido
        window.currentMatch.startTime = new Date();
        window.currentMatch.matchStatus = 'RUNNING';
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'match_start',
            description: 'Partido iniciado'
        });
    } else {
        window.currentMatch.matchStatus = 'RUNNING';
    }
    
    window.currentMatch.timerInterval = setInterval(() => {
        if (window.currentMatch.timeRemaining > 0) {
            window.currentMatch.timeRemaining--;
            updateTimerDisplay();
            
            // Verificar si el tiempo se acabó
            if (window.currentMatch.timeRemaining === 0) {
                endPeriod();
            }
        }
    }, 1000);
    
    updateDisplay();
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification('Cronómetro iniciado');
    }
}

// Pausar cronómetro
function pauseTimer() {
    if (window.currentMatch.matchStatus !== 'RUNNING') return;
    
    clearInterval(window.currentMatch.timerInterval);
    window.currentMatch.matchStatus = 'PAUSED';
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'timer_pause',
        description: 'Tiempo pausado'
    });
    
    updateDisplay();
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification('Cronómetro pausado', 'warning');
    }
}

// Reiniciar cronómetro del periodo actual
function resetTimer() {
    if (window.currentMatch.matchStatus === 'RUNNING') {
        clearInterval(window.currentMatch.timerInterval);
    }
    
    // Restablecer tiempo según el periodo actual
    if (window.currentMatch.isOvertime) {
        window.currentMatch.timeRemaining = window.currentMatch.overtimeDuration;
    } else {
        window.currentMatch.timeRemaining = window.currentMatch.periodDuration;
    }
    
    window.currentMatch.matchStatus = 'PAUSED';
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'timer_reset',
        description: 'Tiempo reiniciado'
    });
    
    updateDisplay();
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification('Tiempo reiniciado');
    }
}

// Pasar al siguiente periodo
function nextPeriod() {
    if (window.currentMatch.matchStatus === 'RUNNING') {
        clearInterval(window.currentMatch.timerInterval);
    }
    
    if (window.currentMatch.currentPeriod < window.currentMatch.totalPeriods) {
        // Pasar al siguiente periodo normal
        window.currentMatch.currentPeriod++;
        window.currentMatch.timeRemaining = window.currentMatch.periodDuration;
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'period_end',
            description: `Final del ${window.currentMatch.currentPeriod-1}° tiempo`
        });
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Iniciando ${window.currentMatch.currentPeriod}° tiempo`);
        }
    } else if (!window.currentMatch.isOvertime && window.currentMatch.currentPeriod === window.currentMatch.totalPeriods) {
        // Verificar si hay empate para prórroga
        if (window.currentMatch.team1.score === window.currentMatch.team2.score) {
            if (confirm('¡Empate! ¿Activar prórroga?')) {
                activateOvertime();
                return;
            }
        }
        
        // Finalizar partido si no hay prórroga
        endMatch();
        return;
    } else if (window.currentMatch.isOvertime) {
        // Manejar periodos de prórroga
        const overtimePeriod = window.currentMatch.currentPeriod - window.currentMatch.totalPeriods;
        
        if (overtimePeriod < window.currentMatch.overtimePeriods) {
            window.currentMatch.currentPeriod++;
            window.currentMatch.timeRemaining = window.currentMatch.overtimeDuration;
            
            window.currentMatch.events.push({
                time: getCurrentTime(),
                type: 'overtime_period_end',
                description: `Final de prórroga ${overtimePeriod}`
            });
            
            if (window.common && window.common.showNotification) {
                window.common.showNotification(`Iniciando prórroga ${overtimePeriod + 1}`);
            }
        } else {
            // Fin de la prórroga
            endMatch();
            return;
        }
    }
    
    window.currentMatch.matchStatus = 'PAUSED';
    updateDisplay();
}

// Finalizar periodo automáticamente cuando el tiempo llega a 0
function endPeriod() {
    clearInterval(window.currentMatch.timerInterval);
    
    const periodName = window.currentMatch.isOvertime ? 
        `prórroga ${window.currentMatch.currentPeriod - window.currentMatch.totalPeriods}` : 
        `${window.currentMatch.currentPeriod}° tiempo`;
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'period_end_auto',
        description: `${periodName} finalizado`
    });
    
    // Verificar si es el último periodo
    if (!window.currentMatch.isOvertime && window.currentMatch.currentPeriod === window.currentMatch.totalPeriods) {
        // Verificar empate para prórroga
        if (window.currentMatch.team1.score === window.currentMatch.team2.score) {
            if (window.common && window.common.showNotification) {
                window.common.showNotification('¡Empate! Puedes activar la prórroga', 'info');
            }
            window.currentMatch.matchStatus = 'PAUSED';
        } else {
            endMatch();
        }
    } else if (window.currentMatch.isOvertime && 
               (window.currentMatch.currentPeriod - window.currentMatch.totalPeriods) === window.currentMatch.overtimePeriods) {
        endMatch();
    } else {
        window.currentMatch.matchStatus = 'PAUSED';
    }
    
    updateDisplay();
}

// Finalizar partido
function endMatch() {
    clearInterval(window.currentMatch.timerInterval);
    window.currentMatch.matchStatus = 'FINISHED';
    
    // Determinar ganador
    let winner;
    if (window.currentMatch.team1.score > window.currentMatch.team2.score) {
        winner = window.currentMatch.team1.name;
        window.currentMatch.winner = 'team1';
    } else if (window.currentMatch.team2.score > window.currentMatch.team1.score) {
        winner = window.currentMatch.team2.name;
        window.currentMatch.winner = 'team2';
    } else {
        winner = "Empate";
        window.currentMatch.winner = 'draw';
    }
    
    // Bloquear controles
    document.querySelectorAll('.btn, .btn-icon').forEach(btn => {
        if (!btn.id.includes('share') && !btn.id.includes('save') && !btn.id.includes('history')) {
            btn.disabled = true;
            btn.classList.add('disabled');
        }
    });
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'match_end',
        description: `Partido finalizado. Ganador: ${winner}`
    });
    
    if (window.common && window.common.showNotification) {
        if (winner === 'Empate') {
            window.common.showNotification('¡Partido finalizado! Resultado: Empate', 'info');
        } else {
            window.common.showNotification(`¡Partido finalizado! Ganador: ${winner}`, 'success');
        }
    }
    
    // Mostrar celebración si hay ganador (no empate)
    if (window.currentMatch.winner !== 'draw' && typeof window.showCelebration === 'function') {
        window.showCelebration();
    }
    
    // Preparar para guardar el partido
    setTimeout(() => {
        window.savingMatchAfterWin = true;
        if (window.modalManager && window.modalManager.openSaveMatchModal) {
            window.modalManager.openSaveMatchModal();
        }
    }, 2000);
    
    updateDisplay();
}

// Activar prórroga
function activateOvertime() {
    if (window.currentMatch.isOvertime) return;
    
    window.currentMatch.isOvertime = true;
    window.currentMatch.currentPeriod = window.currentMatch.totalPeriods + 1;
    window.currentMatch.timeRemaining = window.currentMatch.overtimeDuration;
    window.currentMatch.matchStatus = 'PAUSED';
    
    // Resetear timeouts para prórroga (normalmente 1 por equipo en prórroga)
    window.currentMatch.team1.timeouts = 1;
    window.currentMatch.team2.timeouts = 1;
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'overtime_start',
        description: 'Prórroga activada'
    });
    
    updateDisplay();
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification('¡Prórroga activada! 2 tiempos de 5 minutos', 'success');
    }
}

// Añadir gol
function addGoal(team) {
    if (window.currentMatch.matchStatus === 'FINISHED') return;
    
    const teamObj = window.currentMatch[team];
    teamObj.score++;
    
    const scorer = prompt(`¿Quién anotó el gol para ${teamObj.name}? (Opcional)`, '');
    const goalDescription = scorer ? `Gol de ${scorer}` : 'Gol anotado';
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'goal',
        team: team,
        description: `${goalDescription} - ${teamObj.name}: ${teamObj.score}`
    });
    
    updateDisplay();
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification(`¡Gol! ${teamObj.name}: ${teamObj.score}`);
    }
    
    // Verificar si hay ganador automático (en prórroga con gol de oro)
    if (window.currentMatch.isOvertime && 
        window.currentMatch.team1.score !== window.currentMatch.team2.score &&
        window.currentMatch.matchStatus === 'RUNNING') {
        
        // Gol de oro: partido termina inmediatamente
        setTimeout(() => {
            endMatch();
        }, 1000);
    }
}

// Remover gol
function removeGoal(team) {
    if (window.currentMatch.matchStatus === 'FINISHED') return;
    
    const teamObj = window.currentMatch[team];
    if (teamObj.score > 0) {
        teamObj.score--;
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'goal_removed',
            team: team,
            description: `Gol removido - ${teamObj.name}: ${teamObj.score}`
        });
        
        updateDisplay();
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Gol removido. ${teamObj.name}: ${teamObj.score}`, 'warning');
        }
    }
}

// Añadir falta
function addFoul(team) {
    if (window.currentMatch.matchStatus === 'FINISHED') return;
    
    const teamObj = window.currentMatch[team];
    teamObj.fouls++;
    
    // Registrar en historial de faltas
    const foulTime = getCurrentTime();
    teamObj.foulHistory.push({
        time: foulTime,
        period: window.currentMatch.currentPeriod
    });
    
    window.currentMatch.events.push({
        time: foulTime,
        type: 'foul',
        team: team,
        description: `Falta #${teamObj.fouls} - ${teamObj.name}`
    });
    
    updateDisplay();
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification(`Falta #${teamObj.fouls} para ${teamObj.name}`, 'warning');
    }
}

// Usar timeout
function useTimeout(team) {
    if (window.currentMatch.matchStatus === 'FINISHED') return;
    
    const teamObj = window.currentMatch[team];
    if (teamObj.timeouts > 0) {
        teamObj.timeouts--;
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'timeout',
            team: team,
            description: `Timeout usado - ${teamObj.name} (quedan: ${teamObj.timeouts})`
        });
        
        // Pausar automáticamente el cronómetro si está corriendo
        if (window.currentMatch.matchStatus === 'RUNNING') {
            pauseTimer();
        }
        
        updateDisplay();
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Timeout usado por ${teamObj.name}`, 'info');
        }
    } else {
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`${teamObj.name} no tiene más timeouts`, 'warning');
        }
    }
}

// Reiniciar partido completo
function resetMatch() {
    if (confirm("¿Reiniciar todo el partido? Se perderán todos los datos no guardados.")) {
        window.currentMatch = {
            team1: { 
                name: window.currentMatch.team1.name, 
                score: 0,
                timeouts: 1,
                fouls: 0,
                foulHistory: []
            },
            team2: { 
                name: window.currentMatch.team2.name, 
                score: 0,
                timeouts: 1,
                fouls: 0,
                foulHistory: []
            },
            currentPeriod: 1,
            totalPeriods: 2,
            overtimePeriods: 2,
            isOvertime: false,
            periodDuration: 20 * 60,
            overtimeDuration: 5 * 60,
            timeRemaining: 20 * 60,
            timerRunning: false,
            timerInterval: null,
            startTime: new Date(),
            matchStatus: 'NOT_STARTED',
            winner: null,
            location: window.currentMatch.location,
            events: []
        };
        
        // Reactivar controles
        document.querySelectorAll('.btn, .btn-icon').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });
        
        updateDisplay();
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification("Partido reiniciado correctamente");
        }
    }
}

// Renderizar eventos
function renderEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    
    eventsList.innerHTML = '';
    
    if (window.currentMatch.events.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.innerHTML = '<p>No hay eventos registrados</p>';
        eventsList.appendChild(emptyMessage);
        return;
    }
    
    // Mostrar los últimos 10 eventos (los más recientes primero)
    const recentEvents = window.currentMatch.events.slice().reverse().slice(0, 10);
    
    recentEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        
        // Color según el tipo de evento
        let borderColor = '#3498db'; // Azul por defecto
        if (event.type === 'goal') borderColor = '#2ecc71'; // Verde para goles
        if (event.type === 'foul') borderColor = '#e74c3c'; // Rojo para faltas
        if (event.type === 'timeout') borderColor = '#9b59b6'; // Morado para timeouts
        if (event.type === 'match_end') borderColor = '#f39c12'; // Naranja para final
        
        eventItem.style.borderLeftColor = borderColor;
        
        eventItem.innerHTML = `
            <div class="event-time">${event.time}</div>
            <div class="event-description">${event.description}</div>
        `;
        
        eventsList.appendChild(eventItem);
    });
}

// Obtener hora actual formateada
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Guardar ubicación
function saveLocation() {
    const locationInput = document.getElementById('match-location-input');
    if (!locationInput) return;
    
    const location = locationInput.value.trim();
    if (location) {
        window.currentMatch.location = location;
        updateDisplay();
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Ubicación guardada: ${location}`);
        }
        locationInput.value = '';
    }
}

// Generar texto para compartir
function generateShareText() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const duration = Math.round((new Date() - window.currentMatch.startTime) / 1000 / 60);
    
    let text = `⚽ MARCADOR DE FÚTBOL SALA ⚽\n`;
    text += `📅 ${dateStr} 🕒 ${timeStr}\n\n`;
    text += `=== PARTIDO ACTUAL ===\n`;
    text += `${window.currentMatch.team1.name} vs ${window.currentMatch.team2.name}\n\n`;
    text += `📊 MARCADOR:\n`;
    text += `${window.currentMatch.team1.name}: ${window.currentMatch.team1.score} goles\n`;
    text += `${window.currentMatch.team2.name}: ${window.currentMatch.team2.score} goles\n\n`;
    
    text += `⏱️ TIEMPO: ${formatTime(window.currentMatch.timeRemaining)}\n`;
    text += `📈 PERIODO: ${document.getElementById('current-period').textContent}\n`;
    text += `📊 ESTADO: ${document.getElementById('match-status').textContent}\n`;
    
    if (window.currentMatch.isOvertime) {
        text += `🔄 PRÓRROGA: Sí\n`;
    }
    
    text += `\n📋 ESTADÍSTICAS:\n`;
    text += `Faltas: ${window.currentMatch.team1.name} (${window.currentMatch.team1.fouls}) - ${window.currentMatch.team2.name} (${window.currentMatch.team2.fouls})\n`;
    text += `Timeouts restantes: ${window.currentMatch.team1.name} (${window.currentMatch.team1.timeouts}) - ${window.currentMatch.team2.name} (${window.currentMatch.team2.timeouts})\n\n`;
    
    text += `📍 Ubicación: ${window.currentMatch.location}\n`;
    text += `⏱️ Duración: ${duration} minutos\n\n`;
    
    if (window.currentMatch.events.length > 0) {
        text += `=== EVENTOS RECIENTES ===\n`;
        const recentEvents = window.currentMatch.events.slice(-5);
        recentEvents.forEach(event => {
            text += `[${event.time}] ${event.description}\n`;
        });
        text += `\n`;
    }
    
    if (window.currentMatch.winner) {
        text += `=== RESULTADO FINAL ===\n`;
        if (window.currentMatch.winner === 'draw') {
            text += `¡EMPATE! ${window.currentMatch.team1.score}-${window.currentMatch.team2.score}\n`;
        } else {
            const winnerName = window.currentMatch.winner === 'team1' ? window.currentMatch.team1.name : window.currentMatch.team2.name;
            text += `🏆 GANADOR: ${winnerName} (${window.currentMatch.team1.score}-${window.currentMatch.team2.score})\n`;
        }
        text += `\n`;
    }
    
    if (window.matchHistory.length > 0) {
        text += `=== ÚLTIMOS PARTIDOS (FÚTBOL SALA) ===\n`;
        const recentMatches = window.matchHistory.slice(0, 3);
        recentMatches.forEach((match, index) => {
            const matchDate = new Date(match.timestamp).toLocaleDateString();
            text += `${index + 1}. ${match.team1.name} ${match.team1.score}-${match.team2.score} ${match.team2.name}`;
            if (match.location && match.location !== "No especificada") {
                text += ` (${match.location})`;
            }
            text += `\n`;
        });
    }
    
    text += `\n📱 Generado con Marcador de Fútbol Sala - Liga Escolar`;
    text += `\n🔗 Más info: ${window.sportUrl}`;
    
    return text;
}

// Formatear tiempo (segundos a MM:SS)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Función específica para guardar en cookies
function saveToCookies() {
    const data = {
        currentMatch: window.currentMatch,
        matchHistory: window.matchHistory
    };
    
    if (window.storage && window.storage.saveToCookies) {
        window.storage.saveToCookies('futbolSalaScoreboard', data);
    }
}

function loadFromCookies() {
    if (window.storage && window.storage.loadFromCookies) {
        const data = window.storage.loadFromCookies('futbolSalaScoreboard');
        if (data) {
            window.currentMatch = data.currentMatch || window.currentMatch;
            window.matchHistory = data.matchHistory || window.matchHistory;
            
            // Restaurar el estado del cronómetro
            if (window.currentMatch.timerInterval) {
                clearInterval(window.currentMatch.timerInterval);
                window.currentMatch.timerInterval = null;
            }
            
            // Actualizar display
            setTimeout(updateDisplay, 100);
        }
    }
}

// Función para generar texto del historial
function generateHistoryText() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    
    let text = `📊 HISTORIAL DE FÚTBOL SALA ⚽\n`;
    text += `📅 ${dateStr}\n\n`;
    
    if (window.matchHistory.length === 0) {
        text += `No hay partidos guardados.\n\n`;
    } else {
        text += `=== PARTIDOS GUARDADOS ===\n\n`;
        
        window.matchHistory.forEach((match, index) => {
            const matchDate = new Date(match.timestamp).toLocaleDateString();
            text += `PARTIDO ${index + 1}\n`;
            text += `Fecha: ${matchDate}\n`;
            text += `${match.team1.name} ${match.team1.score} - ${match.team2.score} ${match.team2.name}\n`;
            if (match.location && match.location !== "No especificada") {
                text += `📍 ${match.location}\n`;
            }
            if (match.duration) {
                text += `⏱️ ${match.duration} minutos\n`;
            }
            if (match.isOvertime) {
                text += `🔄 Con prórroga\n`;
            }
            text += `\n---\n\n`;
        });
    }
    
    text += `📱 Generado con Marcador de Fútbol Sala - Liga Escolar\n`;
    text += `🔗 ${window.sportUrl}`;
    
    return text;
}

// Hacer funciones accesibles globalmente
window.generateHistoryText = generateHistoryText;
