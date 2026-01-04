// /js/futbol-sala.js
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
    
    // Inicializar event listeners comunes primero
    if (window.common && window.common.initCommonEventListeners) {
        window.common.initCommonEventListeners();
    }
    
    // Cargar datos guardados
    loadFromCookies();
    
    // Inicializar la interfaz
    updateDisplay();
    
    // Configurar event listeners específicos
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
    document.getElementById('finish-time').addEventListener('click', finishTime); // NUEVO BOTÓN
    
    // Controles de goles
    document.getElementById('team1-add-goal').addEventListener('click', () => addGoal('team1'));
    document.getElementById('team1-remove-goal').addEventListener('click', () => removeGoal('team1'));
    document.getElementById('team2-add-goal').addEventListener('click', () => addGoal('team2'));
    document.getElementById('team2-remove-goal').addEventListener('click', () => removeGoal('team2'));
    
    // Controles de tarjetas amarillas
    document.getElementById('team1-add-yellow').addEventListener('click', () => prepareCard('team1', 'yellow'));
    document.getElementById('team2-add-yellow').addEventListener('click', () => prepareCard('team2', 'yellow'));
    document.getElementById('team1-remove-yellow').addEventListener('click', () => removeLastCard('team1', 'yellow'));
    document.getElementById('team2-remove-yellow').addEventListener('click', () => removeLastCard('team2', 'yellow'));
    
    // Controles de tarjetas azules
    document.getElementById('team1-add-blue').addEventListener('click', () => prepareCard('team1', 'blue'));
    document.getElementById('team2-add-blue').addEventListener('click', () => prepareCard('team2', 'blue'));
    document.getElementById('team1-remove-blue').addEventListener('click', () => removeLastCard('team1', 'blue'));
    document.getElementById('team2-remove-blue').addEventListener('click', () => removeLastCard('team2', 'blue'));
    
    // Controles de faltas con corrección
    document.getElementById('team1-add-foul').addEventListener('click', () => addFoul('team1'));
    document.getElementById('team2-add-foul').addEventListener('click', () => addFoul('team2'));
    document.getElementById('team1-remove-foul').addEventListener('click', () => removeFoul('team1'));
    document.getElementById('team2-remove-foul').addEventListener('click', () => removeFoul('team2'));
    
    // Controles de timeouts con corrección
    document.getElementById('team1-add-timeout').addEventListener('click', () => useTimeout('team1'));
    document.getElementById('team2-add-timeout').addEventListener('click', () => useTimeout('team2'));
    document.getElementById('team1-remove-timeout').addEventListener('click', () => removeTimeout('team1'));
    document.getElementById('team2-remove-timeout').addEventListener('click', () => removeTimeout('team2'));
    
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
    
    // Nombres de equipos (usando la función común corregida)
    document.getElementById('team1-name').addEventListener('click', () => {
        window.editingTeam = 'team1';
        openTeamNameModal();
    });
    
    document.getElementById('team2-name').addEventListener('click', () => {
        window.editingTeam = 'team2';
        openTeamNameModal();
    });
    
    // Modal de tarjetas
    document.getElementById('cancel-card').addEventListener('click', cancelCard);
    document.getElementById('save-card').addEventListener('click', saveCard);
}

// NUEVA FUNCIÓN: Finalizar tiempo manualmente
function finishTime() {
    if (window.currentMatch.matchStatus === 'FINISHED') return;
    
    if (confirm("¿Finalizar el tiempo actual? Esto pasará al siguiente periodo o finalizará el partido si es el último.")) {
        // Si el cronómetro está corriendo, lo paramos
        if (window.currentMatch.matchStatus === 'RUNNING') {
            clearInterval(window.currentMatch.timerInterval);
        }
        
        // Poner el tiempo restante a 0
        window.currentMatch.timeRemaining = 0;
        
        // Añadir evento de finalización manual
        const periodName = window.currentMatch.isOvertime ? 
            `prórroga ${window.currentMatch.currentPeriod - window.currentMatch.totalPeriods}` : 
            `${window.currentMatch.currentPeriod}° tiempo`;
        
        window.currentMatch.events.push({
            time: getCurrentTime(),
            type: 'period_end_manual',
            description: `${periodName} finalizado manualmente`
        });
        
        // Llamar a la función que maneja el fin del periodo
        handlePeriodEnd();
    }
}

// Función mejorada para manejar el fin del periodo
function handlePeriodEnd() {
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
        // Última prórroga
        endMatch();
    } else {
        // No es el último periodo, pasar al siguiente
        if (window.currentMatch.currentPeriod < window.currentMatch.totalPeriods) {
            // Pasar al siguiente periodo normal
            window.currentMatch.currentPeriod++;
            window.currentMatch.timeRemaining = window.currentMatch.periodDuration;
        } else if (window.currentMatch.isOvertime) {
            // Pasar a la siguiente prórroga
            window.currentMatch.currentPeriod++;
            window.currentMatch.timeRemaining = window.currentMatch.overtimeDuration;
        }
        
        window.currentMatch.matchStatus = 'PAUSED';
        
        if (window.common && window.common.showNotification) {
            if (window.currentMatch.isOvertime) {
                const overtimeNum = window.currentMatch.currentPeriod - window.currentMatch.totalPeriods;
                window.common.showNotification(`Iniciando prórroga ${overtimeNum}`, 'info');
            } else {
                window.common.showNotification(`Iniciando ${window.currentMatch.currentPeriod}° tiempo`, 'info');
            }
        }
    }
    
    updateDisplay();
}

// CORRECCIÓN: Modal de edición de nombres
function openTeamNameModal() {
    const modal = document.getElementById('team-name-modal');
    const input = document.getElementById('team-name-input');
    
    if (!modal || !input) return;
    
    // Obtener el nombre actual del equipo
    if (window.editingTeam && window.currentMatch[window.editingTeam]) {
        input.value = window.currentMatch[window.editingTeam].name;
    }
    
    modal.style.display = 'flex';
}

// Actualizar la interfaz
function updateDisplay() {
    // Actualizar nombres de equipos
    document.getElementById('team1-name').textContent = window.currentMatch.team1.name;
    document.getElementById('team2-name').textContent = window.currentMatch.team2.name;
    
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
                clearInterval(window.currentMatch.timerInterval);
                
                const periodName = window.currentMatch.isOvertime ? 
                    `prórroga ${window.currentMatch.currentPeriod - window.currentMatch.totalPeriods}` : 
                    `${window.currentMatch.currentPeriod}° tiempo`;
                
                window.currentMatch.events.push({
                    time: getCurrentTime(),
                    type: 'period_end_auto',
                    description: `${periodName} finalizado`
                });
                
                handlePeriodEnd();
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
    if (window.currentMatch.winner
