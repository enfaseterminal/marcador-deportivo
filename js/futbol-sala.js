// /js/futbol-sala.js - VERSIÓN CORREGIDA COMPLETA

// Variables globales extendidas con tarjetas
window.currentMatch = {
    team1: { 
        name: "Equipo Local", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: [],
        players: [],
        yellowCards: 0,
        blueCards: 0
    },
    team2: { 
        name: "Equipo Visitante", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: [],
        players: [],
        yellowCards: 0,
        blueCards: 0
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
    location: "No especificada",
    events: []
};

window.matchHistory = [];
window.editingTeam = null;
window.savingMatchAfterWin = false;
window.sportName = "Fútbol Sala";
window.sportUrl = window.location.href;

// ========== INICIALIZACIÓN DE JUGADORES ==========

function initializePlayers() {
    window.currentMatch.team1.players = [];
    window.currentMatch.team2.players = [];
    
    // 5 jugadores por equipo
    for (let i = 1; i <= 5; i++) {
        window.currentMatch.team1.players.push({
            id: `team1-player-${i}`,
            number: i,
            yellowCards: 0,
            blueCards: 0,
            isExpelled: false
        });
        
        window.currentMatch.team2.players.push({
            id: `team2-player-${i}`,
            number: i,
            yellowCards: 0,
            blueCards: 0,
            isExpelled: false
        });
    }
    
    // Resetear totales
    window.currentMatch.team1.yellowCards = 0;
    window.currentMatch.team1.blueCards = 0;
    window.currentMatch.team2.yellowCards = 0;
    window.currentMatch.team2.blueCards = 0;
}

// ========== FUNCIONES DE TARJETAS ==========

function addCard(teamId, playerId, cardType) {
    const team = window.currentMatch[teamId];
    const playerIndex = team.players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1) return;
    
    const player = team.players[playerIndex];
    
    if (player.isExpelled) {
        showNotification("Este jugador ya está expulsado", "warning");
        return;
    }
    
    if (cardType === 'yellow') {
        player.yellowCards++;
        team.yellowCards++;
        
        // 2 amarillas = 1 azul
        if (player.yellowCards >= 2) {
            const blueCardsToAdd = Math.floor(player.yellowCards / 2);
            player.blueCards += blueCardsToAdd;
            player.yellowCards = player.yellowCards % 2;
            player.isExpelled = true;
            team.blueCards += blueCardsToAdd;
            
            showNotification(`¡Jugador ${player.number} expulsado por doble amarilla!`, "warning");
        }
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'yellow_card',
            team: teamId,
            player: player.number,
            description: `Tarjeta amarilla para jugador ${player.number} (${team.name})`
        });
    } 
    else if (cardType === 'blue') {
        player.blueCards++;
        player.isExpelled = true;
        team.blueCards++;
        
        showNotification(`¡Jugador ${player.number} expulsado con tarjeta azul!`, "warning");
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'blue_card',
            team: teamId,
            player: player.number,
            description: `Tarjeta azul para jugador ${player.number} (${team.name}) - EXPULSADO`
        });
    }
    
    updateDisplay();
    saveToCookies();
}

function removeCard(teamId, playerId) {
    const team = window.currentMatch[teamId];
    const playerIndex = team.players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1) return;
    
    const player = team.players[playerIndex];
    
    // Si tiene tarjeta azul, quitar una azul primero
    if (player.blueCards > 0) {
        player.blueCards--;
        team.blueCards--;
        
        // Si tenía 1 azul y la quitamos, ya no está expulsado
        if (player.blueCards === 0) {
            player.isExpelled = false;
        }
        
        showNotification(`Tarjeta azul removida del jugador ${player.number}`, "info");
    }
    // Si no tiene azules pero tiene amarillas, quitar una amarilla
    else if (player.yellowCards > 0) {
        player.yellowCards--;
        team.yellowCards--;
        
        showNotification(`Tarjeta amarilla removida del jugador ${player.number}`, "info");
    }
    else {
        showNotification("Este jugador no tiene tarjetas", "info");
        return;
    }
    
    updateDisplay();
    saveToCookies();
}

function resetCards() {
    if (confirm('¿Reiniciar todas las tarjetas del partido?')) {
        initializePlayers();
        updateDisplay();
        showNotification("Tarjetas reiniciadas correctamente", "success");
    }
}

// ========== RENDERIZADO DE TARJETAS ==========

function renderPlayersCards() {
    renderTeamPlayersCards('team1', 'team1-players-cards');
    renderTeamPlayersCards('team2', 'team2-players-cards');
    updateCardsSummary();
}

function renderTeamPlayersCards(teamId, containerId) {
    const team = window.currentMatch[teamId];
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    container.innerHTML = '';
    
    team.players.forEach(player => {
        const playerCard = createPlayerCard(player, teamId);
        container.appendChild(playerCard);
    });
}

function createPlayerCard(player, teamId) {
    const div = document.createElement('div');
    div.className = 'player-card-item';
    if (player.isExpelled) {
        div.classList.add('expelled');
        div.style.opacity = '0.7';
    }
    
    div.innerHTML = `
        <div class="player-info">
            <div class="player-number">${player.number}</div>
            <div class="player-cards-display">
                <span class="card-count yellow">
                    <i class="fas fa-square"></i> ${player.yellowCards}
                </span>
                <span class="card-count blue">
                    <i class="fas fa-square"></i> ${player.blueCards}
                </span>
            </div>
        </div>
        <div class="player-controls">
            <button class="card-btn yellow" onclick="addCard('${teamId}', '${player.id}', 'yellow')" ${player.isExpelled ? 'disabled' : ''}>
                +A
            </button>
            <button class="card-btn blue" onclick="addCard('${teamId}', '${player.id}', 'blue')" ${player.isExpelled ? 'disabled' : ''}>
                +Z
            </button>
            <button class="card-btn remove" onclick="removeCard('${teamId}', '${player.id}')">
                <i class="fas fa-undo"></i>
            </button>
        </div>
    `;
    
    return div;
}

function updateCardsSummary() {
    const team1Yellow = document.getElementById('team1-yellow-total');
    const team1Blue = document.getElementById('team1-blue-total');
    const team2Yellow = document.getElementById('team2-yellow-total');
    const team2Blue = document.getElementById('team2-blue-total');
    
    if (team1Yellow) team1Yellow.textContent = window.currentMatch.team1.yellowCards;
    if (team1Blue) team1Blue.textContent = window.currentMatch.team1.blueCards;
    if (team2Yellow) team2Yellow.textContent = window.currentMatch.team2.yellowCards;
    if (team2Blue) team2Blue.textContent = window.currentMatch.team2.blueCards;
}

// ========== FUNCIONES DE TIMEOUTS CORREGIDAS ==========

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
        
        if (window.currentMatch.matchStatus === 'RUNNING') {
            pauseTimer();
        }
        
        updateDisplay();
        showNotification(`Timeout usado por ${teamObj.name}`, "info");
    } else {
        showNotification(`${teamObj.name} no tiene más timeouts`, "warning");
    }
}

function removeTimeout(team) {
    const teamObj = window.currentMatch[team];
    
    // Aumentar timeouts (máximo 1 por tiempo)
    if (teamObj.timeouts < 1) {
        teamObj.timeouts++;
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'timeout_removed',
            team: team,
            description: `Timeout recuperado - ${teamObj.name} (ahora: ${teamObj.timeouts})`
        });
        
        updateDisplay();
        showNotification(`Timeout recuperado para ${teamObj.name}`, "info");
    } else {
        showNotification(`${teamObj.name} ya tiene todos sus timeouts`, "info");
    }
}

// ========== FUNCIONES DE FALTAS CORREGIDAS ==========

function addFoul(team) {
    if (window.currentMatch.matchStatus === 'FINISHED') return;
    
    const teamObj = window.currentMatch[team];
    teamObj.fouls++;
    
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
    
    // Alerta en la quinta falta
    if (teamObj.fouls === 5) {
        showNotification(`¡${teamObj.name} ha cometido 5 faltas!`, "warning");
    }
    
    updateDisplay();
    showNotification(`Falta #${teamObj.fouls} para ${teamObj.name}`, "warning");
}

function removeFoul(team) {
    const teamObj = window.currentMatch[team];
    if (teamObj.fouls > 0) {
        teamObj.fouls--;
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'foul_removed',
            team: team,
            description: `Falta removida - ${teamObj.name} (ahora: ${teamObj.fouls})`
        });
        
        updateDisplay();
        showNotification(`Falta removida. ${teamObj.name}: ${teamObj.fouls} faltas`, "info");
    }
}

// ========== FUNCIONES DE DISPLAY ==========

function updatePeriodDisplay() {
    const currentPeriodEl = document.getElementById('current-period');
    const periodInfoEl = document.getElementById('period-info');
    const matchStatusEl = document.getElementById('match-status');
    
    if (currentPeriodEl) {
        if (window.currentMatch.isOvertime) {
            currentPeriodEl.textContent = `Prórroga ${window.currentMatch.currentPeriod}`;
        } else {
            currentPeriodEl.textContent = `${window.currentMatch.currentPeriod}° Tiempo`;
        }
    }
    
    if (periodInfoEl) {
        if (window.currentMatch.isOvertime) {
            periodInfoEl.textContent = `Prórroga ${window.currentMatch.currentPeriod}`;
        } else {
            periodInfoEl.textContent = `${window.currentMatch.currentPeriod}° Tiempo`;
        }
    }
    
    if (matchStatusEl) {
        switch(window.currentMatch.matchStatus) {
            case 'NOT_STARTED':
                matchStatusEl.textContent = 'No iniciado';
                break;
            case 'RUNNING':
                matchStatusEl.textContent = 'En juego';
                break;
            case 'PAUSED':
                matchStatusEl.textContent = 'Pausado';
                break;
            case 'FINISHED':
                matchStatusEl.textContent = 'Finalizado';
                break;
            default:
                matchStatusEl.textContent = 'Desconocido';
        }
    }
}

function updateTimerDisplay() {
    const mainTimerEl = document.getElementById('main-timer');
    const matchTimerEl = document.getElementById('match-timer');
    
    if (!mainTimerEl && !matchTimerEl) return;
    
    const minutes = Math.floor(window.currentMatch.timeRemaining / 60);
    const seconds = window.currentMatch.timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (mainTimerEl) mainTimerEl.textContent = timeString;
    if (matchTimerEl) matchTimerEl.textContent = timeString;
}

function updateMatchStatus() {
    // Esta función ya se maneja en updatePeriodDisplay
}

function renderEvents() {
    const eventsListEl = document.getElementById('events-list');
    if (!eventsListEl) return;
    
    eventsListEl.innerHTML = '';
    
    const recentEvents = window.currentMatch.events.slice(-10);
    
    if (recentEvents.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-history';
        emptyMessage.textContent = 'No hay eventos registrados.';
        eventsListEl.appendChild(emptyMessage);
        return;
    }
    
    recentEvents.reverse().forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = 'event-item';
        
        let icon = 'fa-circle';
        let color = '#3498db';
        
        switch(event.type) {
            case 'goal':
                icon = 'fa-futbol';
                color = '#2ecc71';
                break;
            case 'foul':
                icon = 'fa-exclamation-triangle';
                color = '#e74c3c';
                break;
            case 'timeout':
                icon = 'fa-clock';
                color = '#f39c12';
                break;
            case 'yellow_card':
                icon = 'fa-square';
                color = '#FFD700';
                break;
            case 'blue_card':
                icon = 'fa-square';
                color = '#2196F3';
                break;
            case 'match_start':
                icon = 'fa-play';
                color = '#2ecc71';
                break;
            case 'timer_pause':
                icon = 'fa-pause';
                color = '#f39c12';
                break;
            case 'timer_reset':
                icon = 'fa-redo-alt';
                color = '#3498db';
                break;
            case 'foul_removed':
                icon = 'fa-undo';
                color = '#3498db';
                break;
            case 'timeout_removed':
                icon = 'fa-undo';
                color = '#f39c12';
                break;
            case 'period_change':
                icon = 'fa-forward';
                color = '#9b59b6';
                break;
            case 'period_end':
                icon = 'fa-stop';
                color = '#e74c3c';
                break;
            case 'overtime_start':
                icon = 'fa-plus-circle';
                color = '#e67e22';
                break;
        }
        
        eventEl.innerHTML = `
            <div class="event-time">${event.time}</div>
            <div class="event-icon" style="color: ${color};">
                <i class="fas ${icon}"></i>
            </div>
            <div class="event-description">${event.description}</div>
        `;
        
        eventsListEl.appendChild(eventEl);
    });
}

// ========== FUNCIONES DE PERIODO Y TIEMPO EXTRA ==========

function nextPeriod() {
    if (window.currentMatch.currentPeriod >= window.currentMatch.totalPeriods) {
        activateOvertime();
    } else {
        window.currentMatch.currentPeriod++;
        window.currentMatch.timeRemaining = window.currentMatch.periodDuration;
        
        // Resetear timeouts para el nuevo periodo
        window.currentMatch.team1.timeouts = 1;
        window.currentMatch.team2.timeouts = 1;
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'period_change',
            description: `Inicio del periodo ${window.currentMatch.currentPeriod}`
        });
        
        updateDisplay();
        showNotification(`Periodo ${window.currentMatch.currentPeriod} iniciado`);
    }
}

function endPeriod() {
    if (window.currentMatch.matchStatus !== 'RUNNING') return;
    
    clearInterval(window.currentMatch.timerInterval);
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'period_end',
        description: `Fin del periodo ${window.currentMatch.currentPeriod}`
    });
    
    if (window.currentMatch.currentPeriod >= window.currentMatch.totalPeriods) {
        window.currentMatch.matchStatus = 'FINISHED';
        
        if (window.currentMatch.team1.score === window.currentMatch.team2.score) {
            showNotification('¡Empate! Activa la prórroga si es necesario', 'info');
        } else {
            window.currentMatch.winner = window.currentMatch.team1.score > window.currentMatch.team2.score ? 'team1' : 'team2';
            showNotification(`¡Partido finalizado! Ganador: ${window.currentMatch[window.currentMatch.winner].name}`, 'success');
        }
    } else {
        window.currentMatch.matchStatus = 'PAUSED';
        showNotification(`Periodo ${window.currentMatch.currentPeriod} finalizado`, 'warning');
    }
    
    updateDisplay();
}

function activateOvertime() {
    if (window.currentMatch.matchStatus === 'FINISHED') return;
    
    window.currentMatch.isOvertime = true;
    window.currentMatch.currentPeriod = 1;
    window.currentMatch.timeRemaining = window.currentMatch.overtimeDuration;
    
    // Resetear timeouts para prórroga
    window.currentMatch.team1.timeouts = 1;
    window.currentMatch.team2.timeouts = 1;
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'overtime_start',
        description: '¡Prórroga activada!'
    });
    
    updateDisplay();
    showNotification('¡Prórroga activada! 2 tiempos de 5 minutos');
}

function resetMatch() {
    if (confirm('¿Reiniciar todo el partido? Se perderán todos los datos.')) {
        window.currentMatch.team1.score = 0;
        window.currentMatch.team2.score = 0;
        window.currentMatch.team1.fouls = 0;
        window.currentMatch.team2.fouls = 0;
        window.currentMatch.team1.foulHistory = [];
        window.currentMatch.team2.foulHistory = [];
        window.currentMatch.team1.timeouts = 1;
        window.currentMatch.team2.timeouts = 1;
        window.currentMatch.currentPeriod = 1;
        window.currentMatch.isOvertime = false;
        window.currentMatch.timeRemaining = window.currentMatch.periodDuration;
        window.currentMatch.matchStatus = 'NOT_STARTED';
        window.currentMatch.winner = null;
        window.currentMatch.events = [];
        
        if (window.currentMatch.timerInterval) {
            clearInterval(window.currentMatch.timerInterval);
            window.currentMatch.timerInterval = null;
        }
        
        // Reiniciar tarjetas
        initializePlayers();
        
        updateDisplay();
        showNotification('Partido reiniciado completamente', 'success');
    }
}

// ========== FUNCIONES DE CRONÓMETRO ==========

function startTimer() {
    if (window.currentMatch.matchStatus === 'FINISHED') return;
    
    if (window.currentMatch.matchStatus === 'NOT_STARTED') {
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
            
            if (window.currentMatch.timeRemaining === 0) {
                endPeriod();
            }
        }
    }, 1000);
    
    updateDisplay();
    showNotification('Cronómetro iniciado');
}

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
    showNotification('Cronómetro pausado', 'warning');
}

function resetTimer() {
    if (window.currentMatch.matchStatus === 'RUNNING') {
        clearInterval(window.currentMatch.timerInterval);
    }
    
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
    showNotification('Tiempo reiniciado');
}

// ========== FUNCIONES DE GOLES ==========

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
    showNotification(`¡Gol! ${teamObj.name}: ${teamObj.score}`);
}

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
        showNotification(`Gol removido. ${teamObj.name}: ${teamObj.score}`, 'warning');
    }
}

// ========== FUNCIONES UTILITARIAS ==========

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function showNotification(message, type = 'success') {
    if (window.common && window.common.showNotification) {
        window.common.showNotification(message, type);
    } else {
        // Fallback básico
        const notification = document.getElementById('notification');
        const text = document.getElementById('notification-text');
        
        if (notification && text) {
            text.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'flex';
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    notification.style.display = 'none';
                    notification.style.animation = '';
                }, 300);
            }, 3000);
        }
    }
}

// ========== FUNCIÓN PARA COMPARTIR ==========

function generateShareText() {
    if (!window.currentMatch) return '';
    
    let text = `⚽ RESULTADO DE FÚTBOL SALA ⚽\n\n`;
    text += `${window.currentMatch.team1.name} ${window.currentMatch.team1.score} - ${window.currentMatch.team2.score} ${window.currentMatch.team2.name}\n\n`;
    
    text += `📅 ${new Date().toLocaleDateString()}\n`;
    text += `🕒 ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n`;
    text += `📍 ${window.currentMatch.location}\n\n`;
    
    if (window.currentMatch.isOvertime) {
        text += `⚡ Prórroga: Periodo ${window.currentMatch.currentPeriod}\n`;
    } else {
        text += `⏱️ Periodo: ${window.currentMatch.currentPeriod}\n`;
    }
    
    text += `📊 Faltas: ${window.currentMatch.team1.fouls} - ${window.currentMatch.team2.fouls}\n`;
    text += `⏸️ Timeouts restantes: ${window.currentMatch.team1.timeouts} - ${window.currentMatch.team2.timeouts}\n`;
    text += `🟨 Tarjetas amarillas: ${window.currentMatch.team1.yellowCards} - ${window.currentMatch.team2.yellowCards}\n`;
    text += `🟦 Tarjetas azules: ${window.currentMatch.team1.blueCards} - ${window.currentMatch.team2.blueCards}\n`;
    
    text += `\n📱 Generado con Marcador de Fútbol Sala - Liga Escolar\n`;
    text += `🔗 ${window.location.href}`;
    
    return text;
}

// ========== COOKIES Y ALMACENAMIENTO ==========

function saveToCookies() {
    if (window.storage && window.storage.saveToCookies) {
        window.storage.saveToCookies('futbol_sala_current_match', window.currentMatch);
        window.storage.saveToCookies('futbol_sala_match_history', window.matchHistory);
    }
}

function loadFromCookies() {
    if (window.storage && window.storage.loadFromCookies) {
        const savedMatch = window.storage.loadFromCookies('futbol_sala_current_match');
        if (savedMatch) {
            window.currentMatch = savedMatch;
        }
        
        const savedHistory = window.storage.loadFromCookies('futbol_sala_match_history');
        if (savedHistory) {
            window.matchHistory = savedHistory;
        }
    }
}

// ========== ACTUALIZAR DISPLAY ==========

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
    
    // Actualizar tarjetas de jugadores
    renderPlayersCards();
    
    // Actualizar historial de eventos
    renderEvents();
    
    // Guardar cambios
    saveToCookies();
}

// ========== FUNCIONES DE MODALES DE AYUDA ==========

function openHelpModal() {
    document.getElementById('help-modal').style.display = 'flex';
}

function closeHelpModal() {
    document.getElementById('help-modal').style.display = 'none';
}

function openRulesModal() {
    closeHelpModal();
    document.getElementById('rules-modal').style.display = 'flex';
}

function closeRulesModal() {
    document.getElementById('rules-modal').style.display = 'none';
}

function showUsageInstructions() {
    closeHelpModal();
    document.getElementById('usage-modal').style.display = 'flex';
}

function closeUsageModal() {
    document.getElementById('usage-modal').style.display = 'none';
}

// ========== SETUP EVENT LISTENERS ==========

function setupEventListeners() {
    // Controles de tiempo
    const startTimerBtn = document.getElementById('start-timer');
    const pauseTimerBtn = document.getElementById('pause-timer');
    const resetTimerBtn = document.getElementById('reset-timer');
    const nextPeriodBtn = document.getElementById('next-period');
    
    if (startTimerBtn) startTimerBtn.addEventListener('click', startTimer);
    if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', pauseTimer);
    if (resetTimerBtn) resetTimerBtn.addEventListener('click', resetTimer);
    if (nextPeriodBtn) nextPeriodBtn.addEventListener('click', nextPeriod);
    
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
    document.getElementById('save-match').addEventListener('click', () => {
        if (window.modalManager && window.modalManager.openSaveMatchModal) {
            window.modalManager.openSaveMatchModal();
        } else {
            showNotification("Función de guardar no disponible", "warning");
        }
    });
    
    // Compartir
    document.getElementById('share-results').addEventListener('click', function() {
        if (window.common && window.common.openShareCurrentModal) {
            window.common.openShareCurrentModal();
        } else {
            if (window.modalManager && window.modalManager.openSaveMatchModal) {
                window.modalManager.openSaveMatchModal();
            }
        }
    });
    
    document.getElementById('share-history').addEventListener('click', function() {
        if (window.common && window.common.openShareHistoryModal) {
            window.common.openShareHistoryModal();
        }
    });
    
    document.getElementById('share-whatsapp').addEventListener('click', function() {
        if (window.common && window.common.shareToWhatsapp) {
            window.common.shareToWhatsapp();
        }
    });
    
    // Ubicación
    document.getElementById('save-location').addEventListener('click', saveLocation);
    document.getElementById('match-location-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveLocation();
    });
    
    // Nombres de equipos
    document.getElementById('team1-name').addEventListener('click', () => {
        if (window.common && window.common.openTeamNameModal) {
            window.common.openTeamNameModal('team1');
        }
    });
    
    document.getElementById('team2-name').addEventListener('click', () => {
        if (window.common && window.common.openTeamNameModal) {
            window.common.openTeamNameModal('team2');
        }
    });
    
    // Añadir botones para remover faltas y timeouts
    addRemoveButtons();
}

function addRemoveButtons() {
    // Añadir botón para remover faltas
    const team1Controls = document.querySelector('#team1 .quick-controls');
    const team2Controls = document.querySelector('#team2 .quick-controls');
    
    if (team1Controls) {
        const removeFoulBtn1 = document.createElement('button');
        removeFoulBtn1.className = 'btn btn-small btn-remove-foul';
        removeFoulBtn1.innerHTML = '<i class="fas fa-undo"></i> Falta';
        removeFoulBtn1.onclick = () => removeFoul('team1');
        removeFoulBtn1.title = "Remover última falta";
        team1Controls.appendChild(removeFoulBtn1);
        
        const removeTimeoutBtn1 = document.createElement('button');
        removeTimeoutBtn1.className = 'btn btn-small btn-remove-timeout';
        removeTimeoutBtn1.innerHTML = '<i class="fas fa-undo"></i> Timeout';
        removeTimeoutBtn1.onclick = () => removeTimeout('team1');
        removeTimeoutBtn1.title = "Recuperar timeout";
        team1Controls.appendChild(removeTimeoutBtn1);
    }
    
    if (team2Controls) {
        const removeFoulBtn2 = document.createElement('button');
        removeFoulBtn2.className = 'btn btn-small btn-remove-foul';
        removeFoulBtn2.innerHTML = '<i class="fas fa-undo"></i> Falta';
        removeFoulBtn2.onclick = () => removeFoul('team2');
        removeFoulBtn2.title = "Remover última falta";
        team2Controls.appendChild(removeFoulBtn2);
        
        const removeTimeoutBtn2 = document.createElement('button');
        removeTimeoutBtn2.className = 'btn btn-small btn-remove-timeout';
        removeTimeoutBtn2.innerHTML = '<i class="fas fa-undo"></i> Timeout';
        removeTimeoutBtn2.onclick = () => removeTimeout('team2');
        removeTimeoutBtn2.title = "Recuperar timeout";
        team2Controls.appendChild(removeTimeoutBtn2);
    }
}

function saveLocation() {
    const matchLocationInput = document.getElementById('match-location-input');
    const currentLocationEl = document.getElementById('current-location');
    
    if (!matchLocationInput || !currentLocationEl) return;
    
    const location = matchLocationInput.value.trim();
    if (location) {
        window.currentMatch.location = location;
        currentLocationEl.textContent = location;
        
        saveToCookies();
        
        showNotification(`Ubicación guardada: ${location}`);
        matchLocationInput.value = '';
    } else {
        showNotification("Por favor, ingresa una ubicación válida", "warning");
    }
}

// ========== INICIALIZACIÓN ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando fútbol sala...');
    
    // Inicializar jugadores
    initializePlayers();
    
    // Configurar funciones globales
    window.generateShareText = generateShareText;
    window.saveToCookies = saveToCookies;
    window.loadFromCookies = loadFromCookies;
    
    // Cargar datos guardados
    loadFromCookies();
    
    // Inicializar la interfaz
    updateDisplay();
    
    // Configurar event listeners
    setupEventListeners();
    
    console.log("Fútbol sala con tarjetas inicializado correctamente");
});

// Hacer funciones accesibles globalmente
window.addCard = addCard;
window.removeCard = removeCard;
window.resetCards = resetCards;
window.addFoul = addFoul;
window.removeFoul = removeFoul;
window.useTimeout = useTimeout;
window.removeTimeout = removeTimeout;
window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;
window.openRulesModal = openRulesModal;
window.closeRulesModal = closeRulesModal;
window.showUsageInstructions = showUsageInstructions;
window.closeUsageModal = closeUsageModal;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;
window.nextPeriod = nextPeriod;
window.addGoal = addGoal;
window.removeGoal = removeGoal;
window.activateOvertime = activateOvertime;
window.resetMatch = resetMatch;
window.saveLocation = saveLocation;
