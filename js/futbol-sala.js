// /js/futbol-sala-completo.js
// Marcador completo para fútbol sala con control de tarjetas amarillas/azules

// Variables globales extendidas
window.currentMatch = {
    team1: { 
        name: "Equipo Local", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: [],
        players: [], // Nuevo: array de jugadores
        yellowCards: 0, // Total de amarillas
        blueCards: 0   // Total de azules
    },
    team2: { 
        name: "Equipo Visitante", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: [],
        players: [], // Nuevo: array de jugadores
        yellowCards: 0, // Total de amarillas
        blueCards: 0   // Total de azules
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

// Configuración específica
window.sportName = "Fútbol Sala";
window.sportUrl = "https://www.ligaescolar.es/futbol-sala/";

// ========== INICIALIZACIÓN DE JUGADORES ==========

function initializePlayers() {
    // Inicializar 5 jugadores por equipo
    window.currentMatch.team1.players = [];
    window.currentMatch.team2.players = [];
    
    // Jugadores equipo local (1-5)
    for (let i = 1; i <= 5; i++) {
        window.currentMatch.team1.players.push({
            id: `team1-player-${i}`,
            number: i,
            yellowCards: 0,
            blueCards: 0,
            isExpelled: false
        });
    }
    
    // Jugadores equipo visitante (6-10)
    for (let i = 1; i <= 5; i++) {
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
        
        // Verificar si acumula 2 amarillas
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
    
    // Actualizar interfaz y guardar
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
    
    // Actualizar interfaz y guardar
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
    document.getElementById('team1-yellow-total').textContent = window.currentMatch.team1.yellowCards;
    document.getElementById('team1-blue-total').textContent = window.currentMatch.team1.blueCards;
    document.getElementById('team2-yellow-total').textContent = window.currentMatch.team2.yellowCards;
    document.getElementById('team2-blue-total').textContent = window.currentMatch.team2.blueCards;
}

// ========== FUNCIONES PRINCIPALES ACTUALIZADAS ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando fútbol sala completo...');
    
    // Inicializar jugadores
    initializePlayers();
    
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
    
    console.log("Fútbol sala con tarjetas inicializado correctamente");
});

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
    document.getElementById('save-match').addEventListener('click', () => window.modalManager?.openSaveMatchModal());
    
    // Compartir
    document.getElementById('share-results').addEventListener('click', window.common?.openShareCurrentModal || openShareCurrentModal);
    document.getElementById('share-history').addEventListener('click', window.common?.openShareHistoryModal || openShareHistoryModal);
    document.getElementById('share-whatsapp').addEventListener('click', window.common?.shareToWhatsapp || shareToWhatsapp);
    
    // Ubicación
    document.getElementById('save-location').addEventListener('click', saveLocation);
    document.getElementById('match-location-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveLocation();
    });
    
    // Nombres de equipos
    document.getElementById('team1-name').addEventListener('click', () => window.common?.openTeamNameModal('team1') || openTeamNameModal('team1'));
    document.getElementById('team2-name').addEventListener('click', () => window.common?.openTeamNameModal('team2') || openTeamNameModal('team2'));
}

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
    
    const elements = ['current-period', 'period-info'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = periodText;
    });
}

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
    
    const statusEl = document.getElementById('match-status');
    if (statusEl) {
        statusEl.textContent = statusText;
        statusEl.style.color = statusColor;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(window.currentMatch.timeRemaining / 60);
    const seconds = window.currentMatch.timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Actualizar en todos los lugares
    const mainTimer = document.getElementById('main-timer');
    const matchTimer = document.getElementById('match-timer');
    
    if (mainTimer) mainTimer.textContent = timeString;
    if (matchTimer) matchTimer.textContent = timeString;
    
    // Aplicar estilos según el estado
    if (mainTimer) {
        mainTimer.classList.remove('timer-running', 'timer-paused', 'timer-finished');
        
        if (window.currentMatch.matchStatus === 'RUNNING') {
            mainTimer.classList.add('timer-running');
        } else if (window.currentMatch.matchStatus === 'PAUSED') {
            mainTimer.classList.add('timer-paused');
        } else if (window.currentMatch.matchStatus === 'FINISHED') {
            mainTimer.classList.add('timer-finished');
        }
    }
}

// ========== FUNCIONES DE TIEMPO (se mantienen igual) ==========

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

function nextPeriod() {
    if (window.currentMatch.matchStatus === 'RUNNING') {
        clearInterval(window.currentMatch.timerInterval);
    }
    
    if (window.currentMatch.currentPeriod < window.currentMatch.totalPeriods) {
        window.currentMatch.currentPeriod++;
        window.currentMatch.timeRemaining = window.currentMatch.periodDuration;
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'period_end',
            description: `Final del ${window.currentMatch.currentPeriod-1}° tiempo`
        });
        
        // Resetear timeouts para el nuevo tiempo
        window.currentMatch.team1.timeouts = 1;
        window.currentMatch.team2.timeouts = 1;
        
        showNotification(`Iniciando ${window.currentMatch.currentPeriod}° tiempo`);
    } else if (!window.currentMatch.isOvertime && window.currentMatch.currentPeriod === window.currentMatch.totalPeriods) {
        if (window.currentMatch.team1.score === window.currentMatch.team2.score) {
            if (confirm('¡Empate! ¿Activar prórroga?')) {
                activateOvertime();
                return;
            }
        }
        endMatch();
        return;
    } else if (window.currentMatch.isOvertime) {
        const overtimePeriod = window.currentMatch.currentPeriod - window.currentMatch.totalPeriods;
        
        if (overtimePeriod < window.currentMatch.overtimePeriods) {
            window.currentMatch.currentPeriod++;
            window.currentMatch.timeRemaining = window.currentMatch.overtimeDuration;
            
            window.currentMatch.events.push({
                time: getCurrentTime(),
                type: 'overtime_period_end',
                description: `Final de prórroga ${overtimePeriod}`
            });
            
            showNotification(`Iniciando prórroga ${overtimePeriod + 1}`);
        } else {
            endMatch();
            return;
        }
    }
    
    window.currentMatch.matchStatus = 'PAUSED';
    updateDisplay();
}

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
    
    if (!window.currentMatch.isOvertime && window.currentMatch.currentPeriod === window.currentMatch.totalPeriods) {
        if (window.currentMatch.team1.score === window.currentMatch.team2.score) {
            showNotification('¡Empate! Puedes activar la prórroga', 'info');
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

function endMatch() {
    clearInterval(window.currentMatch.timerInterval);
    window.currentMatch.matchStatus = 'FINISHED';
    
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
    
    // Deshabilitar controles
    document.querySelectorAll('.btn, .btn-icon, .card-btn').forEach(btn => {
        if (!btn.id || !btn.id.includes('share')) {
            btn.disabled = true;
            btn.classList.add('disabled');
        }
    });
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'match_end',
        description: `Partido finalizado. Ganador: ${winner}`
    });
    
    if (winner === 'Empate') {
        showNotification('¡Partido finalizado! Resultado: Empate', 'info');
    } else {
        showNotification(`¡Partido finalizado! Ganador: ${winner}`, 'success');
    }
    
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

// ========== FUNCIONES DE GOLES, FALTAS Y TIMEOUTS ==========

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
    
    // Gol de oro en prórroga
    if (window.currentMatch.isOvertime && 
        window.currentMatch.team1.score !== window.currentMatch.team2.score &&
        window.currentMatch.matchStatus === 'RUNNING') {
        
        setTimeout(() => {
            endMatch();
        }, 1000);
    }
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
        showNotification(`¡${teamObj.name} ha cometido 5 faltas!`, 'warning');
    }
    
    updateDisplay();
    showNotification(`Falta #${teamObj.fouls} para ${teamObj.name}`, 'warning');
}

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
        showNotification(`Timeout usado por ${teamObj.name}`, 'info');
    } else {
        showNotification(`${teamObj.name} no tiene más timeouts`, 'warning');
    }
}

function activateOvertime() {
    if (window.currentMatch.isOvertime) return;
    
    window.currentMatch.isOvertime = true;
    window.currentMatch.currentPeriod = window.currentMatch.totalPeriods + 1;
    window.currentMatch.timeRemaining = window.currentMatch.overtimeDuration;
    window.currentMatch.matchStatus = 'PAUSED';
    
    // Resetear timeouts para prórroga
    window.currentMatch.team1.timeouts = 1;
    window.currentMatch.team2.timeouts = 1;
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'overtime_start',
        description: 'Prórroga activada'
    });
    
    updateDisplay();
    showNotification('¡Prórroga activada! 2 tiempos de 5 minutos', 'success');
}

function resetMatch() {
    if (confirm("¿Reiniciar todo el partido? Se perderán todos los datos no guardados.")) {
        window.currentMatch = {
            team1: { 
                name: window.currentMatch.team1.name, 
                score: 0,
                timeouts: 1,
                fouls: 0,
                foulHistory: [],
                players: [],
                yellowCards: 0,
                blueCards: 0
            },
            team2: { 
                name: window.currentMatch.team2.name, 
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
            location: window.currentMatch.location,
            events: []
        };
        
        // Inicializar jugadores
        initializePlayers();
        
        // Reactivar controles
        document.querySelectorAll('.btn, .btn-icon, .card-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });
        
        updateDisplay();
        showNotification("Partido reiniciado correctamente");
    }
}

// ========== FUNCIONES DE RENDERIZADO ==========

function renderEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    
    eventsList.innerHTML = '';
    
    if (window.currentMatch.events.length === 0) {
        eventsList.innerHTML = '<div class="empty-message"><p>No hay eventos registrados</p></div>';
        return;
    }
    
    const recentEvents = window.currentMatch.events.slice().reverse().slice(0, 10);
    
    recentEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        
        let borderColor = '#3498db';
        if (event.type === 'goal') borderColor = '#2ecc71';
        if (event.type === 'foul') borderColor = '#e74c3c';
        if (event.type === 'timeout') borderColor = '#9b59b6';
        if (event.type === 'yellow_card') borderColor = '#FFD700';
        if (event.type === 'blue_card') borderColor = '#2196F3';
        if (event.type === 'match_end') borderColor = '#f39c12';
        
        eventItem.style.borderLeftColor = borderColor;
        eventItem.innerHTML = `
            <div class="event-time">${event.time}</div>
            <div class="event-description">${event.description}</div>
        `;
        
        eventsList.appendChild(eventItem);
    });
}

// ========== FUNCIONES DE AYUDA ==========

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

// ========== FUNCIONES UTILITARIAS ==========

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function saveLocation() {
    const locationInput = document.getElementById('match-location-input');
    if (!locationInput) return;
    
    const location = locationInput.value.trim();
    if (location) {
        window.currentMatch.location = location;
        document.getElementById('current-location').textContent = location;
        updateDisplay();
        showNotification(`Ubicación guardada: ${location}`);
        locationInput.value = '';
    }
}

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
    text += `📈 PERIODO: ${document.getElementById('current-period')?.textContent || ''}\n`;
    text += `📊 ESTADO: ${document.getElementById('match-status')?.textContent || ''}\n`;
    
    text += `\n📋 ESTADÍSTICAS:\n`;
    text += `Faltas: ${window.currentMatch.team1.name} (${window.currentMatch.team1.fouls}) - ${window.currentMatch.team2.name} (${window.currentMatch.team2.fouls})\n`;
    text += `Timeouts: ${window.currentMatch.team1.name} (${window.currentMatch.team1.timeouts}) - ${window.currentMatch.team2.name} (${window.currentMatch.team2.timeouts})\n`;
    text += `Tarjetas Amarillas: ${window.currentMatch.team1.yellowCards} - ${window.currentMatch.team2.yellowCards}\n`;
    text += `Tarjetas Azules: ${window.currentMatch.team1.blueCards} - ${window.currentMatch.team2.blueCards}\n\n`;
    
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
    
    text += `📱 Generado con Marcador de Fútbol Sala - Liga Escolar`;
    text += `\n🔗 Más info: ${window.sportUrl}`;
    
    return text;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function showNotification(message, type = 'success') {
    // Usar common.js si está disponible, si no, crear notificación básica
    if (window.common && window.common.showNotification) {
        window.common.showNotification(message, type);
    } else {
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
        } else {
            alert(message);
        }
    }
}

function saveToCookies() {
    const data = {
        currentMatch: window.currentMatch,
        matchHistory: window.matchHistory
    };
    
    if (window.storage && window.storage.saveToCookies) {
        window.storage.saveToCookies('futbolSalaScoreboard', data);
    } else {
        // Fallback básico
        try {
            localStorage.setItem('futbolSalaScoreboard', JSON.stringify(data));
        } catch (e) {
            console.error('Error al guardar en localStorage:', e);
        }
    }
}

function loadFromCookies() {
    if (window.storage && window.storage.loadFromCookies) {
        const data = window.storage.loadFromCookies('futbolSalaScoreboard');
        if (data) {
            Object.assign(window.currentMatch, data.currentMatch || window.currentMatch);
            window.matchHistory = data.matchHistory || window.matchHistory;
            
            if (window.currentMatch.timerInterval) {
                clearInterval(window.currentMatch.timerInterval);
                window.currentMatch.timerInterval = null;
            }
            
            // Asegurar que los jugadores estén inicializados
            if (!window.currentMatch.team1.players || window.currentMatch.team1.players.length === 0) {
                initializePlayers();
            }
            
            setTimeout(updateDisplay, 100);
        }
    } else {
        // Fallback básico
        try {
            const saved = localStorage.getItem('futbolSalaScoreboard');
            if (saved) {
                const data = JSON.parse(saved);
                Object.assign(window.currentMatch, data.currentMatch || window.currentMatch);
                window.matchHistory = data.matchHistory || window.matchHistory;
                
                if (window.currentMatch.timerInterval) {
                    clearInterval(window.currentMatch.timerInterval);
                    window.currentMatch.timerInterval = null;
                }
                
                // Asegurar que los jugadores estén inicializados
                if (!window.currentMatch.team1.players || window.currentMatch.team1.players.length === 0) {
                    initializePlayers();
                }
                
                setTimeout(updateDisplay, 100);
            }
        } catch (e) {
            console.error('Error al cargar de localStorage:', e);
        }
    }
}

// Hacer funciones accesibles globalmente
window.addCard = addCard;
window.removeCard = removeCard;
window.resetCards = resetCards;
window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;
window.openRulesModal = openRulesModal;
window.closeRulesModal = closeRulesModal;
window.showUsageInstructions = showUsageInstructions;
window.closeUsageModal = closeUsageModal;
