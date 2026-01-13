// /js/futbol-sala.js - VERSIÓN CORREGIDA
// Marcador completo para fútbol sala con cronómetro, prórroga y sistema de tarjetas

// Variables globales específicas de fútbol sala
window.currentMatch = {
    team1: { 
        name: "Equipo Local", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: [],
        yellowCards: [], // Array de objetos {player: número, reason: string, time: string, period: number}
        blueCards: [],   // Array de objetos {player: número, reason: string, time: string, period: number, fromDoubleYellow: boolean}
        expulsions: []   // Array de objetos {player: número, reason: string, time: string, period: number}
    },
    team2: { 
        name: "Equipo Visitante", 
        score: 0,
        timeouts: 1,
        fouls: 0,
        foulHistory: [],
        yellowCards: [],
        blueCards: [],
        expulsions: []
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
window.pendingCard = null; // {team: 'team1/team2', type: 'yellow/blue'}

// Configuración específica del deporte
window.sportName = "Fútbol Sala";
window.sportUrl = "https://www.ligaescolar.es/futbol-sala/";

// ========== FUNCIONES PRINCIPALES ==========

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando fútbol sala con sistema de tarjetas...');
    
    // Inicializar common.js primero
    if (window.common && window.common.initCommonEventListeners) {
        window.common.initCommonEventListeners();
    }
    
    // Inicializar modal manager
    if (window.modalManager && window.modalManager.initModalEventListeners) {
        window.modalManager.initModalEventListeners();
    }
    
    // Cargar datos guardados
    loadFromCookies();
    
    // Inicializar la interfaz
    updateDisplay();
    
    // Configurar event listeners específicos
    setupEventListeners();
    
    // Configurar funciones globales
    window.generateShareText = generateShareText;
    window.generateHistoryText = generateHistoryText;
    window.saveToCookies = saveToCookies;
    window.loadFromCookies = loadFromCookies;
    window.saveLocation = saveLocation;
    
    console.log("Fútbol sala inicializado correctamente");
});

// Configurar todos los event listeners específicos
function setupEventListeners() {
    console.log('Configurando event listeners de fútbol sala...');
    
    // Verificar que los elementos existen antes de agregar event listeners
    const addEventListenerSafe = (id, event, handler) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Elemento ${id} no encontrado para event listener`);
        }
    };
    
    // Controles de tiempo
    addEventListenerSafe('start-timer', 'click', startTimer);
    addEventListenerSafe('pause-timer', 'click', pauseTimer);
    addEventListenerSafe('reset-timer', 'click', resetTimer);
    addEventListenerSafe('next-period', 'click', nextPeriod);
    addEventListenerSafe('finish-time', 'click', endPeriod);
    
    // Controles de goles
    addEventListenerSafe('team1-add-goal', 'click', () => addGoal('team1'));
    addEventListenerSafe('team1-remove-goal', 'click', () => removeGoal('team1'));
    addEventListenerSafe('team2-add-goal', 'click', () => addGoal('team2'));
    addEventListenerSafe('team2-remove-goal', 'click', () => removeGoal('team2'));
    
    // Controles de tarjetas amarillas
    addEventListenerSafe('team1-add-yellow', 'click', () => prepareCard('team1', 'yellow'));
    addEventListenerSafe('team2-add-yellow', 'click', () => prepareCard('team2', 'yellow'));
    addEventListenerSafe('team1-remove-yellow', 'click', () => removeLastCard('team1', 'yellow'));
    addEventListenerSafe('team2-remove-yellow', 'click', () => removeLastCard('team2', 'yellow'));
    
    // Controles de tarjetas azules
    addEventListenerSafe('team1-add-blue', 'click', () => prepareCard('team1', 'blue'));
    addEventListenerSafe('team2-add-blue', 'click', () => prepareCard('team2', 'blue'));
    addEventListenerSafe('team1-remove-blue', 'click', () => removeLastCard('team1', 'blue'));
    addEventListenerSafe('team2-remove-blue', 'click', () => removeLastCard('team2', 'blue'));
    
    // Controles de faltas
    addEventListenerSafe('team1-add-foul', 'click', () => addFoul('team1'));
    addEventListenerSafe('team2-add-foul', 'click', () => addFoul('team2'));
    addEventListenerSafe('team1-remove-foul', 'click', () => removeFoul('team1'));
    addEventListenerSafe('team2-remove-foul', 'click', () => removeFoul('team2'));
    
    // Controles de timeouts
    addEventListenerSafe('team1-add-timeout', 'click', () => useTimeout('team1'));
    addEventListenerSafe('team2-add-timeout', 'click', () => useTimeout('team2'));
    addEventListenerSafe('team1-remove-timeout', 'click', () => removeTimeout('team1'));
    addEventListenerSafe('team2-remove-timeout', 'click', () => removeTimeout('team2'));
    
    // Controles del partido
    addEventListenerSafe('activate-overtime', 'click', activateOvertime);
    addEventListenerSafe('reset-match', 'click', resetMatch);
    
    // Ya no necesitamos esto aquí, lo maneja modal-manager.js
    // addEventListenerSafe('save-match', 'click', () => window.modalManager.openSaveMatchModal());
    
    // Borrar historial
    const clearHistoryBtn = document.getElementById('clear-history');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            if (confirm("¿Estás seguro de que quieres borrar todo el historial de fútbol sala?")) {
                window.matchHistory = [];
                saveToCookies();
                renderHistory();
                if (window.common && window.common.showNotification) {
                    window.common.showNotification("Historial borrado correctamente");
                }
            }
        });
    }
    
    console.log('Event listeners configurados correctamente');
}

// Actualizar la interfaz
function updateDisplay() {
    // Actualizar nombres de equipos
    const team1Name = document.getElementById('team1-name');
    const team2Name = document.getElementById('team2-name');
    if (team1Name) team1Name.textContent = window.currentMatch.team1.name;
    if (team2Name) team2Name.textContent = window.currentMatch.team2.name;
    
    // Actualizar marcador de goles
    document.getElementById('team1-score').textContent = window.currentMatch.team1.score;
    document.getElementById('team2-score').textContent = window.currentMatch.team2.score;
    
    // Actualizar tarjetas amarillas
    document.getElementById('team1-yellow-cards').textContent = window.currentMatch.team1.yellowCards.length;
    document.getElementById('team2-yellow-cards').textContent = window.currentMatch.team2.yellowCards.length;
    
    // Actualizar tarjetas azules
    document.getElementById('team1-blue-cards').textContent = window.currentMatch.team1.blueCards.length;
    document.getElementById('team2-blue-cards').textContent = window.currentMatch.team2.blueCards.length;
    
    // Actualizar timeouts y faltas
    document.getElementById('team1-timeouts').textContent = window.currentMatch.team1.timeouts;
    document.getElementById('team2-timeouts').textContent = window.currentMatch.team2.timeouts;
    document.getElementById('team1-fouls').textContent = window.currentMatch.team1.fouls;
    document.getElementById('team2-fouls').textContent = window.currentMatch.team2.fouls;
    
    // Actualizar ubicación
    document.getElementById('current-location').textContent = window.currentMatch.location;
    
    // Renderizar expulsiones
    renderExpulsions('team1');
    renderExpulsions('team2');
    
    // Actualizar información del periodo
    updatePeriodDisplay();
    
    // Actualizar estado del partido
    updateMatchStatus();
    
    // Actualizar cronómetro
    updateTimerDisplay();
    
    // Actualizar historial de eventos
    renderEvents();
    
    // Actualizar historial de partidos
    renderHistory();
    
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
    
    // Limpiar intervalo previo si existe
    if (window.currentMatch.timerInterval) {
        clearInterval(window.currentMatch.timerInterval);
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
    
    if (window.currentMatch.timerInterval) {
        clearInterval(window.currentMatch.timerInterval);
        window.currentMatch.timerInterval = null;
    }
    
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
    if (window.currentMatch.timerInterval) {
        clearInterval(window.currentMatch.timerInterval);
        window.currentMatch.timerInterval = null;
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
    if (window.currentMatch.timerInterval) {
        clearInterval(window.currentMatch.timerInterval);
        window.currentMatch.timerInterval = null;
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
    if (window.currentMatch.timerInterval) {
        clearInterval(window.currentMatch.timerInterval);
        window.currentMatch.timerInterval = null;
    }
    
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
    if (window.currentMatch.timerInterval) {
        clearInterval(window.currentMatch.timerInterval);
        window.currentMatch.timerInterval = null;
    }
    
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
        if (!btn.id.includes('share') && !btn.id.includes('save') && !btn.id.includes('history') && 
            !btn.id.includes('add-timeout') && !btn.id.includes('remove-timeout') &&
            !btn.id.includes('add-foul') && !btn.id.includes('remove-foul')) {
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

// Quitar falta
function removeFoul(team) {
    const teamObj = window.currentMatch[team];
    
    if (teamObj.fouls === 0) {
        if (window.common && window.common.showNotification) {
            window.common.showNotification("No hay faltas para quitar", "warning");
        }
        return;
    }
    
    teamObj.fouls--;
    
    // Quitar del historial si existe
    if (teamObj.foulHistory.length > 0) {
        teamObj.foulHistory.pop();
    }
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'foul_removed',
        team: team,
        description: `Falta removida - ${teamObj.name}: ${teamObj.fouls}`
    });
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification(`Falta removida. ${teamObj.name}: ${teamObj.fouls}`, 'info');
    }
    
    updateDisplay();
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

// Quitar timeout
function removeTimeout(team) {
    const teamObj = window.currentMatch[team];
    
    // En fútbol sala normalmente hay 1 timeout por equipo
    // Podemos permitir recuperarlo si se usó por error
    teamObj.timeouts++;
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'timeout_removed',
        team: team,
        description: `Timeout recuperado - ${teamObj.name} (ahora: ${teamObj.timeouts})`
    });
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification(`Timeout recuperado para ${teamObj.name}`, 'info');
    }
    
    updateDisplay();
}

// Preparar tarjeta (abrir modal)
function prepareCard(team, type) {
    window.pendingCard = { team: team, type: type };
    
    const cardModal = document.getElementById('card-modal');
    const modalTitle = document.getElementById('card-modal-title');
    
    if (type === 'yellow') {
        modalTitle.textContent = `Registrar Tarjeta Amarilla - ${window.currentMatch[team].name}`;
    } else {
        modalTitle.textContent = `Registrar Tarjeta Azul - ${window.currentMatch[team].name}`;
    }
    
    // Limpiar campos
    document.getElementById('player-number').value = '';
    document.getElementById('card-reason').value = '';
    
    cardModal.style.display = 'flex';
}

// Cancelar tarjeta
function cancelCard() {
    window.pendingCard = null;
    document.getElementById('card-modal').style.display = 'none';
}

// Guardar tarjeta
function saveCard() {
    if (!window.pendingCard) return;
    
    const playerNumber = document.getElementById('player-number').value.trim();
    const reason = document.getElementById('card-reason').value.trim();
    
    if (!playerNumber) {
        if (window.common && window.common.showNotification) {
            window.common.showNotification("Ingresa el número del jugador", "warning");
        }
        return;
    }
    
    const team = window.pendingCard.team;
    const type = window.pendingCard.type;
    const teamObj = window.currentMatch[team];
    const currentTime = getCurrentTime();
    
    // Crear objeto de tarjeta
    const card = {
        player: playerNumber,
        reason: reason || "Sin especificar",
        time: currentTime,
        period: window.currentMatch.currentPeriod
    };
    
    // Añadir a la colección correspondiente
    if (type === 'yellow') {
        teamObj.yellowCards.push(card);
        
        // Verificar si es la segunda amarilla para el mismo jugador
        const playerYellowCards = teamObj.yellowCards.filter(c => c.player === playerNumber);
        if (playerYellowCards.length === 2) {
            // Segunda amarilla = azul automática
            const blueCard = {
                player: playerNumber,
                reason: "Doble amarilla (2ª amarilla)",
                time: currentTime,
                period: window.currentMatch.currentPeriod,
                fromDoubleYellow: true
            };
            teamObj.blueCards.push(blueCard);
            
            // Registrar expulsión
            const expulsion = {
                player: playerNumber,
                reason: "Expulsión por doble amarilla",
                time: currentTime,
                period: window.currentMatch.currentPeriod
            };
            teamObj.expulsions.push(expulsion);
            
            // Evento
            window.currentMatch.events.push({
                time: currentTime,
                type: 'expulsion',
                team: team,
                description: `¡EXPULSIÓN! Jugador ${playerNumber} (2ª amarilla) - ${teamObj.name}`
            });
            
            if (window.common && window.common.showNotification) {
                window.common.showNotification(`¡Expulsión! Jugador ${playerNumber} (2ª amarilla)`, 'error');
            }
        }
        
        window.currentMatch.events.push({
            time: currentTime,
            type: 'yellow_card',
            team: team,
            description: `Tarjeta amarilla - Jugador ${playerNumber} - ${teamObj.name}`
        });
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Tarjeta amarilla - Jugador ${playerNumber}`, 'warning');
        }
    } else {
        // Tarjeta azul directa
        teamObj.blueCards.push(card);
        
        // Verificar si es la segunda azul para el mismo jugador
        const playerBlueCards = teamObj.blueCards.filter(c => c.player === playerNumber && !c.fromDoubleYellow);
        if (playerBlueCards.length === 2) {
            // Segunda azul = expulsión definitiva
            const expulsion = {
                player: playerNumber,
                reason: "Expulsión definitiva (2ª azul)",
                time: currentTime,
                period: window.currentMatch.currentPeriod
            };
            teamObj.expulsions.push(expulsion);
            
            window.currentMatch.events.push({
                time: currentTime,
                type: 'expulsion_definitive',
                team: team,
                description: `¡EXPULSIÓN DEFINITIVA! Jugador ${playerNumber} (2ª azul) - ${teamObj.name}`
            });
            
            if (window.common && window.common.showNotification) {
                window.common.showNotification(`¡Expulsión definitiva! Jugador ${playerNumber} (2ª azul)`, 'error');
            }
        } else {
            // Primera azul = expulsión temporal (2 minutos)
            const expulsion = {
                player: playerNumber,
                reason: "Expulsión temporal (2 min)",
                time: currentTime,
                period: window.currentMatch.currentPeriod
            };
            teamObj.expulsions.push(expulsion);
            
            window.currentMatch.events.push({
                time: currentTime,
                type: 'blue_card',
                team: team,
                description: `Tarjeta azul - Jugador ${playerNumber} - ${teamObj.name}`
            });
            
            if (window.common && window.common.showNotification) {
                window.common.showNotification(`Tarjeta azul - Jugador ${playerNumber} (2 min)`, 'info');
            }
        }
    }
    
    // Cerrar modal y actualizar
    cancelCard();
    updateDisplay();
    saveToCookies();
}

// Remover última tarjeta
function removeLastCard(team, type) {
    const teamObj = window.currentMatch[team];
    let cardArray, cardTypeName;
    
    if (type === 'yellow') {
        cardArray = teamObj.yellowCards;
        cardTypeName = 'amarilla';
    } else {
        cardArray = teamObj.blueCards;
        cardTypeName = 'azul';
    }
    
    if (cardArray.length === 0) {
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`No hay tarjetas ${cardTypeName}s para quitar`, 'warning');
        }
        return;
    }
    
    const removedCard = cardArray.pop();
    
    // Si era una tarjeta azul que venía de doble amarilla, también quitar la segunda amarilla
    if (type === 'blue' && removedCard.fromDoubleYellow) {
        // Buscar y quitar la segunda amarilla del mismo jugador
        const playerYellows = teamObj.yellowCards.filter(c => c.player === removedCard.player);
        if (playerYellows.length >= 2) {
            // Quitar la última amarilla de ese jugador
            for (let i = teamObj.yellowCards.length - 1; i >= 0; i--) {
                if (teamObj.yellowCards[i].player === removedCard.player) {
                    teamObj.yellowCards.splice(i, 1);
                    break;
                }
            }
        }
        
        // También quitar la expulsión correspondiente
        if (teamObj.expulsions.length > 0) {
            for (let i = teamObj.expulsions.length - 1; i >= 0; i--) {
                if (teamObj.expulsions[i].player === removedCard.player && 
                    teamObj.expulsions[i].reason.includes("doble amarilla")) {
                    teamObj.expulsions.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    // Si era una azul directa, quitar la expulsión correspondiente
    if (type === 'blue' && !removedCard.fromDoubleYellow) {
        if (teamObj.expulsions.length > 0) {
            for (let i = teamObj.expulsions.length - 1; i >= 0; i--) {
                if (teamObj.expulsions[i].player === removedCard.player && 
                    teamObj.expulsions[i].time === removedCard.time) {
                    teamObj.expulsions.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    window.currentMatch.events.push({
        time: getCurrentTime(),
        type: 'card_removed',
        team: team,
        description: `Tarjeta ${cardTypeName} removida - Jugador ${removedCard.player} - ${teamObj.name}`
    });
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification(`Tarjeta ${cardTypeName} removida - Jugador ${removedCard.player}`, 'info');
    }
    
    updateDisplay();
    saveToCookies();
}

// Renderizar expulsiones
function renderExpulsions(team) {
    const container = document.getElementById(`${team}-expulsions`);
    const teamObj = window.currentMatch[team];
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (teamObj.expulsions.length === 0) {
        return;
    }
    
    const title = document.createElement('div');
    title.className = 'expulsion-title';
    title.textContent = 'Expulsiones:';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    title.style.color = '#e74c3c';
    container.appendChild(title);
    
    teamObj.expulsions.forEach((expulsion, index) => {
        const item = document.createElement('div');
        item.className = 'expulsion-item';
        
        const playerSpan = document.createElement('span');
        playerSpan.className = 'expulsion-player';
        playerSpan.textContent = `#${expulsion.player}`;
        
        const reasonSpan = document.createElement('span');
        reasonSpan.className = 'expulsion-reason';
        reasonSpan.textContent = expulsion.reason;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'expulsion-time';
        timeSpan.textContent = expulsion.time;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-expulsion';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Quitar expulsión';
        removeBtn.onclick = () => removeExpulsion(team, index);
        
        item.appendChild(playerSpan);
        item.appendChild(reasonSpan);
        item.appendChild(timeSpan);
        item.appendChild(removeBtn);
        
        container.appendChild(item);
    });
}

// Quitar expulsión
function removeExpulsion(team, index) {
    const teamObj = window.currentMatch[team];
    
    if (index >= 0 && index < teamObj.expulsions.length) {
        const removed = teamObj.expulsions.splice(index, 1)[0];
        
        // Si era por doble amarilla, quitar también la tarjeta azul correspondiente
        if (removed.reason.includes("doble amarilla")) {
            for (let i = teamObj.blueCards.length - 1; i >= 0; i--) {
                if (teamObj.blueCards[i].player === removed.player && 
                    teamObj.blueCards[i].fromDoubleYellow) {
                    teamObj.blueCards.splice(i, 1);
                    break;
                }
            }
            
            // Y quitar la segunda amarilla
            let yellowCount = 0;
            for (let i = teamObj.yellowCards.length - 1; i >= 0; i--) {
                if (teamObj.yellowCards[i].player === removed.player) {
                    yellowCount++;
                    if (yellowCount === 2) {
                        teamObj.yellowCards.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        // Si era por tarjeta azul directa, quitar la tarjeta azul
        if (removed.reason.includes("azul")) {
            for (let i = teamObj.blueCards.length - 1; i >= 0; i--) {
                if (teamObj.blueCards[i].player === removed.player && 
                    !teamObj.blueCards[i].fromDoubleYellow &&
                    teamObj.blueCards[i].time === removed.time) {
                    teamObj.blueCards.splice(i, 1);
                    break;
                }
            }
        }
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'expulsion_removed',
            team: team,
            description: `Expulsión removida - Jugador ${removed.player} - ${teamObj.name}`
        });
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Expulsión removida - Jugador ${removed.player}`, 'info');
        }
        
        updateDisplay();
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
                foulHistory: [],
                yellowCards: [],
                blueCards: [],
                expulsions: []
            },
            team2: { 
                name: window.currentMatch.team2.name, 
                score: 0,
                timeouts: 1,
                fouls: 0,
                foulHistory: [],
                yellowCards: [],
                blueCards: [],
                expulsions: []
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
        if (event.type === 'foul' || event.type === 'foul_removed') borderColor = '#e74c3c'; // Rojo para faltas
        if (event.type === 'timeout' || event.type === 'timeout_removed') borderColor = '#9b59b6'; // Morado para timeouts
        if (event.type === 'yellow_card') borderColor = '#f1c40f'; // Amarillo para tarjetas amarillas
        if (event.type === 'blue_card') borderColor = '#3498db'; // Azul para tarjetas azules
        if (event.type === 'expulsion' || event.type === 'expulsion_definitive' || event.type === 'expulsion_removed') borderColor = '#e74c3c'; // Rojo para expulsiones
        if (event.type === 'match_end') borderColor = '#f39c12'; // Naranja para final
        
        eventItem.style.borderLeftColor = borderColor;
        
        eventItem.innerHTML = `
            <div class="event-time">${event.time}</div>
            <div class="event-description">${event.description}</div>
        `;
        
        eventsList.appendChild(eventItem);
    });
}

// Renderizar historial de partidos
function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (window.matchHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-history';
        emptyMessage.innerHTML = '<i class="fas fa-clipboard-list fa-2x"></i><p>No hay partidos guardados. ¡Juega y guarda algunos partidos!</p>';
        historyList.appendChild(emptyMessage);
        return;
    }
    
    window.matchHistory.forEach((match, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const teamsDiv = document.createElement('div');
        teamsDiv.className = 'history-teams';
        teamsDiv.textContent = `${match.team1.name} vs ${match.team2.name}`;
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'history-score';
        scoreDiv.textContent = `${match.team1.score} - ${match.team2.score}`;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'history-info';
        
        let infoHTML = `<div>${match.date || 'Sin fecha'}</div>`;
        if (match.location && match.location !== "No especificada") {
            infoHTML += `<div class="history-location"><i class="fas fa-map-marker-alt"></i> ${match.location}</div>`;
        }
        if (match.duration) {
            infoHTML += `<div class="history-duration"><i class="fas fa-clock"></i> ${match.duration} min</div>`;
        }
        if (match.isOvertime) {
            infoHTML += `<div class="history-overtime"><i class="fas fa-plus-circle"></i> Con prórroga</div>`;
        }
        
        infoDiv.innerHTML = infoHTML;
        
        historyItem.appendChild(teamsDiv);
        historyItem.appendChild(scoreDiv);
        historyItem.appendChild(infoDiv);
        
        historyList.appendChild(historyItem);
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
    text += `Timeouts restantes: ${window.currentMatch.team1.name} (${window.currentMatch.team1.timeouts}) - ${window.currentMatch.team2.name} (${window.currentMatch.team2.timeouts})\n`;
    text += `Tarjetas amarillas: ${window.currentMatch.team1.name} (${window.currentMatch.team1.yellowCards.length}) - ${window.currentMatch.team2.name} (${window.currentMatch.team2.yellowCards.length})\n`;
    text += `Tarjetas azules: ${window.currentMatch.team1.name} (${window.currentMatch.team1.blueCards.length}) - ${window.currentMatch.team2.name} (${window.currentMatch.team2.blueCards.length})\n\n`;
    
    // Mostrar expulsiones
    if (window.currentMatch.team1.expulsions.length > 0 || window.currentMatch.team2.expulsions.length > 0) {
        text += `⚠️ EXPULSIONES:\n`;
        window.currentMatch.team1.expulsions.forEach(exp => {
            text += `${window.currentMatch.team1.name}: Jugador #${exp.player} - ${exp.reason}\n`;
        });
        window.currentMatch.team2.expulsions.forEach(exp => {
            text += `${window.currentMatch.team2.name}: Jugador #${exp.player} - ${exp.reason}\n`;
        });
        text += `\n`;
    }
    
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
            
            // Asegurar que los arrays de tarjetas existan (para compatibilidad con versiones antiguas)
            if (!window.currentMatch.team1.yellowCards) window.currentMatch.team1.yellowCards = [];
            if (!window.currentMatch.team1.blueCards) window.currentMatch.team1.blueCards = [];
            if (!window.currentMatch.team1.expulsions) window.currentMatch.team1.expulsions = [];
            if (!window.currentMatch.team2.yellowCards) window.currentMatch.team2.yellowCards = [];
            if (!window.currentMatch.team2.blueCards) window.currentMatch.team2.blueCards = [];
            if (!window.currentMatch.team2.expulsions) window.currentMatch.team2.expulsions = [];
            
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
            
            // Mostrar tarjetas si existen
            if (match.team1.yellowCards && match.team2.yellowCards) {
                text += `Amarillas: ${match.team1.name} (${match.team1.yellowCards.length}) - ${match.team2.name} (${match.team2.yellowCards.length})\n`;
            }
            if (match.team1.blueCards && match.team2.blueCards) {
                text += `Azules: ${match.team1.name} (${match.team1.blueCards.length}) - ${match.team2.name} (${match.team2.blueCards.length})\n`;
            }
            
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
