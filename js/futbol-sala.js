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

// FUNCIÓN PARA REMOVER TIMEOUT (corrección)
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

// ========== INICIALIZACIÓN ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando fútbol sala...');
    
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
    
    // Funciones para botones flotantes
    window.openHelpModal = openHelpModal;
    window.closeHelpModal = closeHelpModal;
    window.openRulesModal = openRulesModal;
    window.closeRulesModal = closeRulesModal;
    window.showUsageInstructions = showUsageInstructions;
    window.closeUsageModal = closeUsageModal;
    
    console.log("Fútbol sala con tarjetas inicializado correctamente");
});

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
    
    // Controles de faltas y timeouts (actualizados)
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
            openShareCurrentModal();
        }
    });
    
    document.getElementById('share-history').addEventListener('click', function() {
        if (window.common && window.common.openShareHistoryModal) {
            window.common.openShareHistoryModal();
        } else {
            openShareHistoryModal();
        }
    });
    
    document.getElementById('share-whatsapp').addEventListener('click', function() {
        if (window.common && window.common.shareToWhatsapp) {
            window.common.shareToWhatsapp();
        } else {
            shareToWhatsapp();
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
        } else {
            openTeamNameModal('team1');
        }
    });
    
    document.getElementById('team2-name').addEventListener('click', () => {
        if (window.common && window.common.openTeamNameModal) {
            window.common.openTeamNameModal('team2');
        } else {
            openTeamNameModal('team2');
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

// ========== FUNCIONES EXISTENTES (mantener compatibilidad) ==========

// Mantén todas las funciones que ya tenía tu archivo futbol-sala.js original
// Solo asegúrate de que no se dupliquen con las nuevas

// Añade esto al final del archivo para mantener compatibilidad:

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

// Si necesitas otras funciones de tu archivo original, cópialas aquí
// asegurándote de que no se dupliquen con las nuevas
