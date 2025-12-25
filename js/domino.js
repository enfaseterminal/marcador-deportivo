// /js/domino.js - VERSIÓN CORREGIDA PARA NUEVO DISEÑO

// Variables globales específicas de dominó - SIN CAMBIOS
window.currentMatch = {
    team1: { 
        name: "Pareja 1", 
        players: ["Jugador 1", "Jugador 2"],
        currentScore: 0,
        totalScore: 0,
        gamesWon: 0,
        scoreHistory: [],
        recentSums: []
    },
    team2: { 
        name: "Pareja 2", 
        players: ["Jugador 3", "Jugador 4"],
        currentScore: 0,
        totalScore: 0,
        gamesWon: 0,
        scoreHistory: [],
        recentSums: []
    },
    currentGame: 1,
    maxPoints: 200,
    bestOf: 3,
    startTime: new Date(),
    gameHistory: [],
    winner: null,
    location: "No especificada",
    matchCompleted: false,
    matchStarted: false
};

window.matchHistory = [];
window.editingTeam = null;
window.savingMatchAfterWin = false;
window.gameInProgress = true;

window.sportName = "Dominó";
window.sportUrl = "https://www.ligaescolar.es/domino/";

// Función para actualizar la interfaz - CORREGIDA
function updateDisplay() {
    // Actualizar nombres de equipos y jugadores
    const team1Name = document.getElementById('team1-name');
    const team2Name = document.getElementById('team2-name');
    const team1Players = document.getElementById('team1-players');
    const team2Players = document.getElementById('team2-players');
    
    if (team1Name) team1Name.textContent = window.currentMatch.team1.name;
    if (team2Name) team2Name.textContent = window.currentMatch.team2.name;
    if (team1Players) team1Players.textContent = `${window.currentMatch.team1.players[0]} & ${window.currentMatch.team1.players[1]}`;
    if (team2Players) team2Players.textContent = `${window.currentMatch.team2.players[0]} & ${window.currentMatch.team2.players[1]}`;
    
    // Actualizar puntuaciones
    document.getElementById('team1-current-score').textContent = window.currentMatch.team1.currentScore;
    document.getElementById('team2-current-score').textContent = window.currentMatch.team2.currentScore;
    document.getElementById('team1-total-score').textContent = window.currentMatch.team1.totalScore;
    document.getElementById('team2-total-score').textContent = window.currentMatch.team2.totalScore;
    
    // Actualizar partidas ganadas
    document.getElementById('team1-games').textContent = window.currentMatch.team1.gamesWon;
    document.getElementById('team2-games').textContent = window.currentMatch.team2.gamesWon;
    
    // Actualizar información del juego
    document.getElementById('current-game').textContent = window.currentMatch.currentGame;
    document.getElementById('max-games').textContent = window.currentMatch.bestOf;
    document.getElementById('target-points').textContent = window.currentMatch.maxPoints;
    
    // Calcular y mostrar diferencia
    const diff = Math.abs(window.currentMatch.team1.currentScore - window.currentMatch.team2.currentScore);
    document.getElementById('points-difference').textContent = diff;
    
    // Resaltar equipo que va ganando
    const team1El = document.getElementById('team1-mobile');
    const team2El = document.getElementById('team2-mobile');
    
    if (team1El && team2El) {
        team1El.classList.remove('winning');
        team2El.classList.remove('winning');
        
        if (window.currentMatch.team1.currentScore > window.currentMatch.team2.currentScore) {
            team1El.classList.add('winning');
        } else if (window.currentMatch.team2.currentScore > window.currentMatch.team1.currentScore) {
            team2El.classList.add('winning');
        }
    }
    
    // Actualizar ubicación
    const currentLocationEl = document.getElementById('current-location');
    if (currentLocationEl) {
        currentLocationEl.textContent = window.currentMatch.location;
    }
    
    // Actualizar historial de partidas
    renderGameHistory();
    
    // Actualizar historial de sumas de puntos
    renderRecentSums();
    
    // Bloquear controles de configuración si la partida ha comenzado
    updateConfigControls();
    
    // Verificar si se ha ganado la partida actual
    checkGameWin();
}

// Función para actualizar controles de configuración
function updateConfigControls() {
    const maxPointsInput = document.getElementById('max-points');
    const bestOfSelect = document.getElementById('best-of');
    const applyMaxPointsBtn = document.getElementById('apply-max-points');
    const applyBestOfBtn = document.getElementById('apply-best-of');
    
    const hasStarted = window.currentMatch.matchStarted || 
                      window.currentMatch.team1.currentScore > 0 || 
                      window.currentMatch.team2.currentScore > 0 ||
                      window.currentMatch.gameHistory.length > 0;
    
    const isDisabled = hasStarted || window.currentMatch.matchCompleted;
    
    if (maxPointsInput) maxPointsInput.disabled = isDisabled;
    if (bestOfSelect) bestOfSelect.disabled = isDisabled;
    if (applyMaxPointsBtn) applyMaxPointsBtn.disabled = isDisabled;
    if (applyBestOfBtn) applyBestOfBtn.disabled = isDisabled;
    
    // Añadir clases visuales
    [maxPointsInput, bestOfSelect].forEach(input => {
        if (input) {
            if (isDisabled) {
                input.classList.add('disabled-input');
                input.style.opacity = '0.6';
                input.style.cursor = 'not-allowed';
            } else {
                input.classList.remove('disabled-input');
                input.style.opacity = '1';
                input.style.cursor = input.type === 'number' ? 'text' : 'pointer';
            }
        }
    });
}

// Las demás funciones (addPoints, removeLastPoints, checkGameWin, checkMatchWin, 
// startNewGame, endCurrentGame, resetCurrentGame, renderGameHistory, renderRecentSums,
// updateConfig, generateShareText, saveToCookies, loadFromCookies, openTeamEditModal,
// saveTeamEdit) se mantienen IGUALES como en tu archivo original.

// Solo necesitas asegurarte de que en checkMatchWin, startNewGame y resetCurrentMatch
// los selectores de botones sean correctos:

// En checkMatchWin():
window.gameInProgress = false;
// Bloquear botones de puntuación
document.querySelectorAll('.btn-add, .btn-remove, .points-input-mobile').forEach(btn => {
    btn.disabled = true;
    btn.classList.add('disabled');
});

// En startNewGame():
document.querySelectorAll('.btn-add, .btn-remove, .points-input-mobile').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('disabled');
});

// En resetCurrentMatch():
// Lo mismo que startNewGame

// FUNCIONES PARA COMPARTIR - AÑADIR AL FINAL, ANTES DE LA INICIALIZACIÓN

function shareCurrentMatch() {
    const text = generateShareText();
    openShareModal(text, "Partida Actual");
}

function shareMatchHistory() {
    const text = generateHistoryText();
    openShareModal(text, "Historial de Encuentros");
}

function generateHistoryText() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    
    let text = `📊 HISTORIAL DE DOMINÓ 🎲\n`;
    text += `📅 ${dateStr}\n\n`;
    
    if (window.matchHistory.length === 0) {
        text += `No hay encuentros guardados.\n\n`;
    } else {
        text += `=== ENCUENTROS GUARDADOS ===\n\n`;
        
        window.matchHistory.forEach((match, index) => {
            const matchDate = new Date(match.timestamp).toLocaleDateString();
            text += `ENCUENTRO ${index + 1}\n`;
            text += `Fecha: ${matchDate}\n`;
            text += `${match.team1.name} ${match.team1.gamesWon} - ${match.team2.gamesWon} ${match.team2.name}\n`;
            if (match.location && match.location !== "No especificada") {
                text += `📍 ${match.location}\n`;
            }
            if (match.duration) {
                text += `⏱️ ${match.duration} minutos\n`;
            }
            text += `\n---\n\n`;
        });
    }
    
    text += `📱 Generado con Marcador de Dominó - Liga Escolar\n`;
    text += `🔗 ${window.sportUrl}`;
    
    return text;
}

function openShareModal(text, title = "Compartir") {
    const modal = document.getElementById('share-modal');
    const shareTextEl = document.getElementById('share-text');
    const modalTitle = modal.querySelector('h2');
    
    if (modal && shareTextEl) {
        if (modalTitle) modalTitle.textContent = title;
        shareTextEl.textContent = text;
        modal.style.display = 'flex';
    }
}

function shareViaWhatsApp() {
    const shareText = generateShareText();
    const encodedText = encodeURIComponent(shareText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification("Compartiendo por WhatsApp...");
    }
}

function copyToClipboard() {
    const shareTextEl = document.getElementById('share-text');
    if (!shareTextEl) return;
    
    const text = shareTextEl.textContent;
    navigator.clipboard.writeText(text).then(() => {
        if (window.common && window.common.showNotification) {
            window.common.showNotification("Texto copiado al portapapeles!");
        }
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

// Inicialización - MODIFICADA PARA INCLUIR BOTONES DE COMPARTIR
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando dominó...');
    
    // Cargar datos guardados
    loadFromCookies();
    
    // Configurar elementos de configuración
    const maxPointsInput = document.getElementById('max-points');
    const bestOfSelect = document.getElementById('best-of');
    const applyMaxPointsBtn = document.getElementById('apply-max-points');
    const applyBestOfBtn = document.getElementById('apply-best-of');
    
    if (maxPointsInput) {
        maxPointsInput.value = window.currentMatch.maxPoints;
        maxPointsInput.addEventListener('change', updateConfig);
    }
    
    if (applyMaxPointsBtn) {
        applyMaxPointsBtn.addEventListener('click', updateConfig);
    }
    
    if (bestOfSelect) {
        bestOfSelect.value = window.currentMatch.bestOf;
        bestOfSelect.addEventListener('change', updateConfig);
    }
    
    if (applyBestOfBtn) {
        applyBestOfBtn.addEventListener('click', updateConfig);
    }
    
    // Inicializar display
    updateDisplay();
    
    // Configurar botones de puntos personalizados
    const team1CustomBtn = document.getElementById('team1-add-custom');
    const team2CustomBtn = document.getElementById('team2-add-custom');
    const team1CustomInput = document.getElementById('team1-custom-points');
    const team2CustomInput = document.getElementById('team2-custom-points');
    
    if (team1CustomBtn && team1CustomInput) {
        team1CustomBtn.addEventListener('click', function() {
            const points = parseInt(team1CustomInput.value);
            if (points && points > 0 && points <= 100) {
                addPoints('team1', points);
                team1CustomInput.value = '';
            } else {
                if (window.common && window.common.showNotification) {
                    window.common.showNotification("Ingresa un valor entre 1 y 100", "warning");
                }
            }
        });
        
        team1CustomInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                team1CustomBtn.click();
            }
        });
    }
    
    if (team2CustomBtn && team2CustomInput) {
        team2CustomBtn.addEventListener('click', function() {
            const points = parseInt(team2CustomInput.value);
            if (points && points > 0 && points <= 100) {
                addPoints('team2', points);
                team2CustomInput.value = '';
            } else {
                if (window.common && window.common.showNotification) {
                    window.common.showNotification("Ingresa un valor entre 1 y 100", "warning");
                }
            }
        });
        
        team2CustomInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                team2CustomBtn.click();
            }
        });
    }
    
    // Configurar botones de restar puntos
    const team1RemoveBtn = document.getElementById('team1-remove-point');
    const team2RemoveBtn = document.getElementById('team2-remove-point');
    
    if (team1RemoveBtn) {
        team1RemoveBtn.addEventListener('click', function() {
            removeLastPoints('team1');
        });
    }
    
    if (team2RemoveBtn) {
        team2RemoveBtn.addEventListener('click', function() {
            removeLastPoints('team2');
        });
    }
    
    // Configurar botones de control del partido
    const endGameBtn = document.getElementById('end-game');
    const resetGameBtn = document.getElementById('reset-game');
    const saveMatchBtn = document.getElementById('save-match');
    const resetMatchBtn = document.getElementById('reset-match');
    
    if (endGameBtn) {
        endGameBtn.addEventListener('click', endCurrentGame);
    }
    
    if (resetGameBtn) {
        resetGameBtn.addEventListener('click', resetCurrentGame);
    }
    
    if (saveMatchBtn && window.modalManager && window.modalManager.openSaveMatchModal) {
        saveMatchBtn.addEventListener('click', window.modalManager.openSaveMatchModal);
    }
    
    if (resetMatchBtn) {
        resetMatchBtn.addEventListener('click', function() {
            if (confirm("¿Reiniciar todo el encuentro? Se perderán todos los datos no guardados.")) {
                window.resetCurrentMatch();
            }
        });
    }
    
    // Configurar edición de nombres de pareja
    document.querySelectorAll('.team-name-mobile').forEach((el, index) => {
        el.addEventListener('click', function() {
            openTeamEditModal(index === 0 ? 'team1' : 'team2');
        });
    });
    
    // Configurar botones del modal de edición
    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveNameBtn = document.getElementById('save-name');
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            const modal = document.getElementById('team-name-modal');
            if (modal) modal.style.display = 'none';
            window.editingTeam = null;
        });
    }
    
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', saveTeamEdit);
    }
    
    // Configurar botones de compartir
    const shareCurrentBtn = document.getElementById('share-current-match');
    const shareHistoryBtn = document.getElementById('share-match-history');
    const whatsappBtn = document.getElementById('share-whatsapp');
    
    if (shareCurrentBtn) {
        shareCurrentBtn.addEventListener('click', shareCurrentMatch);
    }
    
    if (shareHistoryBtn) {
        shareHistoryBtn.addEventListener('click', shareMatchHistory);
    }
    
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', shareViaWhatsApp);
    }
    
    // Configurar botones del modal de compartir
    const copyBtn = document.getElementById('copy-text');
    const shareNativeBtn = document.getElementById('share-native');
    const closeShareBtn = document.getElementById('close-share');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }
    
    if (shareNativeBtn) {
        shareNativeBtn.addEventListener('click', function() {
            if (navigator.share) {
                const shareTextEl = document.getElementById('share-text');
                if (shareTextEl) {
                    navigator.share({
                        title: 'Resultados de Dominó - Liga Escolar',
                        text: shareTextEl.textContent,
                        url: window.sportUrl
                    }).then(() => {
                        console.log('Compartido exitosamente');
                    }).catch(error => {
                        console.log('Error al compartir:', error);
                    });
                }
            }
        });
    }
    
    if (closeShareBtn) {
        closeShareBtn.addEventListener('click', function() {
            const modal = document.getElementById('share-modal');
            if (modal) modal.style.display = 'none';
        });
    }
    
    // Configurar botones de limpiar
    const clearRoundsBtn = document.getElementById('clear-rounds');
    const clearHistoryBtn = document.getElementById('clear-history');
    
    if (clearRoundsBtn) {
        clearRoundsBtn.addEventListener('click', function() {
            if (confirm("¿Borrar el historial de partidas del encuentro actual?")) {
                window.currentMatch.gameHistory = [];
                renderGameHistory();
                if (typeof window.saveToCookies === 'function') {
                    window.saveToCookies();
                }
                if (window.common && window.common.showNotification) {
                    window.common.showNotification("Historial de partidas borrado");
                }
            }
        });
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            if (confirm("¿Borrar todo el historial de encuentros guardados?")) {
                window.matchHistory = [];
                // Necesitamos una función para renderizar historial de dominó
                const historyListEl = document.getElementById('history-list');
                if (historyListEl) {
                    historyListEl.innerHTML = '<div class="empty-history"><i class="fas fa-clipboard-list fa-2x"></i><p>No hay encuentros guardados</p></div>';
                }
                if (typeof window.saveToCookies === 'function') {
                    window.saveToCookies();
                }
                if (window.common && window.common.showNotification) {
                    window.common.showNotification("Historial de encuentros borrado");
                }
            }
        });
    }
    
    // Configurar ubicación
    const saveLocationBtn = document.getElementById('save-location');
    const locationInput = document.getElementById('match-location-input');
    
    if (saveLocationBtn && locationInput) {
        saveLocationBtn.addEventListener('click', function() {
            const location = locationInput.value.trim();
            if (location) {
                window.currentMatch.location = location;
                updateDisplay();
                if (typeof window.saveToCookies === 'function') {
                    window.saveToCookies();
                }
                if (window.common && window.common.showNotification) {
                    window.common.showNotification(`Ubicación guardada: ${location}`);
                }
                locationInput.value = '';
            }
        });
        
        locationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveLocationBtn.click();
            }
        });
    }
    
    // Configurar funciones globales
    window.addPoints = addPoints;
    window.removeLastPoints = removeLastPoints;
    window.updateDisplay = updateDisplay;
    window.generateShareText = generateShareText;
    window.saveToCookies = saveToCookies;
    window.loadFromCookies = loadFromCookies;
    
    // Inicializar funciones de módulos comunes
    if (window.common && window.common.initCommonEventListeners) {
        window.common.initCommonEventListeners();
    }
    
    // Configurar función de reset del encuentro
    window.resetCurrentMatch = function() {
        window.currentMatch = {
            team1: { 
                name: "Pareja 1", 
                players: ["Jugador 1", "Jugador 2"],
                currentScore: 0,
                totalScore: 0,
                gamesWon: 0,
                scoreHistory: [],
                recentSums: []
            },
            team2: { 
                name: "Pareja 2", 
                players: ["Jugador 3", "Jugador 4"],
                currentScore: 0,
                totalScore: 0,
                gamesWon: 0,
                scoreHistory: [],
                recentSums: []
            },
            currentGame: 1,
            maxPoints: parseInt(document.getElementById('max-points').value) || 200,
            bestOf: parseInt(document.getElementById('best-of').value) || 3,
            startTime: new Date(),
            gameHistory: [],
            winner: null,
            location: window.currentMatch.location,
            matchCompleted: false,
            matchStarted: false
        };
        
        window.gameInProgress = true;
        
        // Reactivar botones
        document.querySelectorAll('.btn-add, .btn-remove, .points-input-mobile').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });
        
        updateDisplay();
        
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification("Encuentro reiniciado correctamente");
        }
    };
    
    console.log("Dominó modular inicializado correctamente");
});
