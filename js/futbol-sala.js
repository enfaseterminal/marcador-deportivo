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
    
    // Configurar event listeners del modal de tarjetas
    setupCardModalListeners();
    
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

// Configurar event listeners del modal de tarjetas
function setupCardModalListeners() {
    console.log('Configurando event listeners del modal de tarjetas...');
    
    const cancelCardBtn = document.getElementById('cancel-card');
    const saveCardBtn = document.getElementById('save-card');
    
    if (cancelCardBtn) {
        // Remover event listeners previos para evitar duplicados
        const newCancelBtn = cancelCardBtn.cloneNode(true);
        cancelCardBtn.parentNode.replaceChild(newCancelBtn, cancelCardBtn);
        newCancelBtn.addEventListener('click', cancelCard);
        console.log('Event listener para cancel-card configurado');
    } else {
        console.warn('Botón cancel-card no encontrado');
    }
    
    if (saveCardBtn) {
        // Remover event listeners previos para evitar duplicados
        const newSaveBtn = saveCardBtn.cloneNode(true);
        saveCardBtn.parentNode.replaceChild(newSaveBtn, saveCardBtn);
        newSaveBtn.addEventListener('click', saveCard);
        console.log('Event listener para save-card configurado');
    } else {
        console.warn('Botón save-card no encontrado');
    }
    
    // También agregar event listener para cerrar el modal haciendo clic fuera
    const cardModal = document.getElementById('card-modal');
    if (cardModal) {
        cardModal.addEventListener('click', function(e) {
            if (e.target === this) {
                cancelCard();
            }
        });
        console.log('Event listener para cerrar modal al hacer clic fuera configurado');
    }
}

// Preparar tarjeta (abrir modal) - FUNCIÓN MODIFICADA
function prepareCard(team, type) {
    console.log(`Preparando tarjeta para ${team}, tipo: ${type}`);
    window.pendingCard = { team: team, type: type };
    
    const cardModal = document.getElementById('card-modal');
    const modalTitle = document.getElementById('card-modal-title');
    
    if (!cardModal || !modalTitle) {
        console.error('Modal de tarjetas no encontrado');
        return;
    }
    
    if (type === 'yellow') {
        modalTitle.textContent = `Registrar Tarjeta Amarilla - ${window.currentMatch[team].name}`;
    } else {
        modalTitle.textContent = `Registrar Tarjeta Azul - ${window.currentMatch[team].name}`;
    }
    
    // Limpiar campos
    document.getElementById('player-number').value = '';
    document.getElementById('card-reason').value = '';
    
    cardModal.style.display = 'flex';
    
    // Asegurarse de que los event listeners estén configurados
    setupCardModalListeners();
    
    console.log('Modal de tarjeta abierto');
}

// Cancelar tarjeta - FUNCIÓN MEJORADA
function cancelCard() {
    console.log('Cancelando tarjeta');
    window.pendingCard = null;
    const cardModal = document.getElementById('card-modal');
    if (cardModal) {
        cardModal.style.display = 'none';
    }
}

// Guardar tarjeta - FUNCIÓN MEJORADA
function saveCard() {
    console.log('Guardando tarjeta');
    if (!window.pendingCard) {
        console.warn('No hay tarjeta pendiente');
        return;
    }
    
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
    console.log('Tarjeta guardada exitosamente');
}

// Resto del código permanece igual...
// (Las funciones updateDisplay, startTimer, pauseTimer, etc., no han cambiado)
// Solo se muestran las funciones modificadas para el modal de tarjetas

// ... resto de las funciones existentes (updateDisplay, startTimer, pauseTimer, etc.) ...
