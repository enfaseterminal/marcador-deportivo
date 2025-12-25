// /js/domino.js - VERSIÓN CORREGIDA COMPLETA

// Variables globales específicas de dominó
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

// Configuración específica del deporte
window.sportName = "Dominó";
window.sportUrl = "https://www.ligaescolar.es/domino/";

// ========== FUNCIONES PRINCIPALES ==========

// Función para actualizar la interfaz
function updateDisplay() {
    console.log("Actualizando display...");
    
    // Actualizar nombres de equipos y jugadores
    const team1NameEl = document.getElementById('team1-name');
    const team2NameEl = document.getElementById('team2-name');
    const team1PlayersEl = document.getElementById('team1-players');
    const team2PlayersEl = document.getElementById('team2-players');
    
    if (team1NameEl) team1NameEl.textContent = window.currentMatch.team1.name;
    if (team2NameEl) team2NameEl.textContent = window.currentMatch.team2.name;
    if (team1PlayersEl) team1PlayersEl.textContent = `${window.currentMatch.team1.players[0]} & ${window.currentMatch.team1.players[1]}`;
    if (team2PlayersEl) team2PlayersEl.textContent = `${window.currentMatch.team2.players[0]} & ${window.currentMatch.team2.players[1]}`;
    
    // Actualizar puntuaciones
    document.getElementById('team1-current-score').textContent = window.currentMatch.team1.currentScore;
    document.getElementById('team2-current-score').textContent = window.currentMatch.team2.currentScore;
    
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
    
    // Añadir estilos visuales
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
    
    [applyMaxPointsBtn, applyBestOfBtn].forEach(btn => {
        if (btn) {
            if (isDisabled) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }
        }
    });
}

// Función para actualizar configuración (puntos objetivo y mejor de)
function updateMaxPoints() {
    const maxPointsInput = document.getElementById('max-points');
    if (!maxPointsInput) return;
    
    const newMaxPoints = parseInt(maxPointsInput.value);
    if (newMaxPoints >= 50 && newMaxPoints <= 500) {
        window.currentMatch.maxPoints = newMaxPoints;
        updateDisplay();
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Puntos objetivo: ${newMaxPoints}`);
        }
        
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
    }
}

function updateBestOf() {
    const bestOfSelect = document.getElementById('best-of');
    if (!bestOfSelect) return;
    
    const newBestOf = parseInt(bestOfSelect.value);
    if (newBestOf >= 1 && newBestOf <= 9) {
        window.currentMatch.bestOf = newBestOf;
        updateDisplay();
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Mejor de ${newBestOf} partidas`);
        }
        
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
    }
}

// Función para renderizar sumas recientes de puntos
function renderRecentSums() {
    const team1SumsEl = document.getElementById('team1-recent-sums');
    const team2SumsEl = document.getElementById('team2-recent-sums');
    
    if (team1SumsEl) {
        team1SumsEl.innerHTML = '';
        const recentSums = window.currentMatch.team1.recentSums.slice(-5);
        if (recentSums.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'empty-sums';
            emptyEl.textContent = 'No hay sumas recientes';
            team1SumsEl.appendChild(emptyEl);
        } else {
            recentSums.forEach(sum => {
                const sumEl = document.createElement('div');
                sumEl.className = 'recent-sum-item-mobile';
                sumEl.innerHTML = `
                    <span class="sum-points-mobile">+${sum.points}</span>
                    <span class="sum-time">${sum.time}</span>
                `;
                team1SumsEl.appendChild(sumEl);
            });
        }
    }
    
    if (team2SumsEl) {
        team2SumsEl.innerHTML = '';
        const recentSums = window.currentMatch.team2.recentSums.slice(-5);
        if (recentSums.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'empty-sums';
            emptyEl.textContent = 'No hay sumas recientes';
            team2SumsEl.appendChild(emptyEl);
        } else {
            recentSums.forEach(sum => {
                const sumEl = document.createElement('div');
                sumEl.className = 'recent-sum-item-mobile';
                sumEl.innerHTML = `
                    <span class="sum-points-mobile">+${sum.points}</span>
                    <span class="sum-time">${sum.time}</span>
                `;
                team2SumsEl.appendChild(sumEl);
            });
        }
    }
}

// Función para añadir puntos a un equipo
function addPoints(team, points) {
    if (!window.currentMatch || !window.gameInProgress || window.currentMatch.matchCompleted) return;
    
    // Marcar que la partida ha comenzado
    if (!window.currentMatch.matchStarted) {
        window.currentMatch.matchStarted = true;
        updateConfigControls();
    }
    
    const teamObj = window.currentMatch[team];
    teamObj.currentScore += points;
    
    // Registrar en historial de puntuaciones
    teamObj.scoreHistory.push({
        points: points,
        timestamp: new Date().toLocaleTimeString(),
        game: window.currentMatch.currentGame
    });
    
    // Registrar en sumas recientes
    teamObj.recentSums.push({
        points: points,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        game: window.currentMatch.currentGame
    });
    
    // Mantener solo las últimas 10 sumas
    if (teamObj.recentSums.length > 10) {
        teamObj.recentSums = teamObj.recentSums.slice(-10);
    }
    
    // Actualizar total acumulado
    teamObj.totalScore += points;
    
    updateDisplay();
    
    // Guardar en cookies
    if (typeof window.saveToCookies === 'function') {
        window.saveToCookies();
    }
    
    // Mostrar notificación
    if (window.common && window.common.showNotification) {
        window.common.showNotification(`${teamObj.name} +${points} puntos`);
    }
}

// Función para restar puntos
function removeLastPoints(team) {
    if (!window.currentMatch || !window.gameInProgress || window.currentMatch.matchCompleted) return;
    
    const teamObj = window.currentMatch[team];
    if (teamObj.scoreHistory.length > 0) {
        const lastPoints = teamObj.scoreHistory.pop();
        teamObj.currentScore -= lastPoints.points;
        teamObj.totalScore -= lastPoints.points;
        
        // También remover de las sumas recientes si existe
        if (teamObj.recentSums.length > 0) {
            teamObj.recentSums.pop();
        }
        
        updateDisplay();
        
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Puntos removidos: ${lastPoints.points}`);
        }
    } else {
        if (window.common && window.common.showNotification) {
            window.common.showNotification("No hay puntos para remover", "warning");
        }
    }
}

// Función para verificar si se ha ganado la partida actual
function checkGameWin() {
    if (!window.gameInProgress || window.currentMatch.matchCompleted) return false;
    
    const score1 = window.currentMatch.team1.currentScore;
    const score2 = window.currentMatch.team2.currentScore;
    const maxPoints = window.currentMatch.maxPoints;
    
    // Verificar si algún equipo alcanzó los puntos máximos
    if (score1 >= maxPoints || score2 >= maxPoints) {
        window.gameInProgress = false;
        
        // Determinar ganador de la partida
        let winner, loser, winnerScore, loserScore;
        
        if (score1 > score2) {
            winner = 'team1';
            loser = 'team2';
            winnerScore = score1;
            loserScore = score2;
            window.currentMatch.team1.gamesWon++;
        } else {
            winner = 'team2';
            loser = 'team1';
            winnerScore = score2;
            loserScore = score1;
            window.currentMatch.team2.gamesWon++;
        }
        
        // Guardar historial de la partida
        const gameResult = {
            game: window.currentMatch.currentGame,
            team1Score: score1,
            team2Score: score2,
            winner: window.currentMatch[winner].name,
            winnerScore: winnerScore,
            loserScore: loserScore,
            timestamp: new Date().toLocaleTimeString()
        };
        
        window.currentMatch.gameHistory.push(gameResult);
        
        // Mostrar notificación
        if (window.common && window.common.showNotification) {
            window.common.showNotification(
                `${window.currentMatch[winner].name} gana la partida ${window.currentMatch.currentGame} (${winnerScore}-${loserScore})`,
                'success'
            );
        }
        
        // Verificar si se ha ganado el encuentro
        setTimeout(() => {
            checkMatchWin();
        }, 1500);
        
        return true;
    }
    
    return false;
}

// Función para verificar si se ha ganado el encuentro
function checkMatchWin() {
    const gamesToWin = Math.ceil(window.currentMatch.bestOf / 2);
    
    if (window.currentMatch.team1.gamesWon >= gamesToWin || window.currentMatch.team2.gamesWon >= gamesToWin) {
        window.currentMatch.matchCompleted = true;
        
        // Determinar ganador del encuentro
        let winner;
        if (window.currentMatch.team1.gamesWon > window.currentMatch.team2.gamesWon) {
            winner = window.currentMatch.team1.name;
            window.currentMatch.winner = 'team1';
        } else {
            winner = window.currentMatch.team2.name;
            window.currentMatch.winner = 'team2';
        }
        
        // Bloquear botones de puntuación
        document.querySelectorAll('.btn-add, .btn-remove, .points-input-mobile').forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.classList.add('disabled');
            }
        });
        
        // Mostrar notificación de victoria
        if (window.common && window.common.showNotification) {
            window.common.showNotification(
                `¡${winner} ha ganado el encuentro! ${window.currentMatch.team1.gamesWon}-${window.currentMatch.team2.gamesWon}`,
                'success'
            );
        }
        
        // Mostrar celebración
        if (typeof window.showCelebration === 'function') {
            window.showCelebration();
        }
        
        // Preparar para guardar el encuentro automáticamente
        setTimeout(() => {
            window.savingMatchAfterWin = true;
            if (window.modalManager && window.modalManager.openSaveMatchModal) {
                window.modalManager.openSaveMatchModal();
            }
        }, 2000);
        
        return true;
    } else if (window.currentMatch.currentGame < window.currentMatch.bestOf) {
        // Preparar siguiente partida
        setTimeout(() => {
            if (window.common && window.common.showNotification) {
                window.common.showNotification(`Preparando partida ${window.currentMatch.currentGame + 1}...`);
            }
            
            // Resetear puntuación actual para nueva partida
            setTimeout(() => {
                startNewGame();
            }, 1000);
        }, 1000);
    }
    
    return false;
}

// Función para comenzar nueva partida
function startNewGame() {
    if (window.currentMatch.currentGame < window.currentMatch.bestOf) {
        window.currentMatch.currentGame++;
        window.currentMatch.team1.currentScore = 0;
        window.currentMatch.team2.currentScore = 0;
        
        // Limpiar sumas recientes para nueva partida
        window.currentMatch.team1.recentSums = [];
        window.currentMatch.team2.recentSums = [];
        
        window.gameInProgress = true;
        
        // Reactivar botones
        document.querySelectorAll('.btn-add, .btn-remove, .points-input-mobile').forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('disabled');
            }
        });
        
        updateDisplay();
        
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Comienza la partida ${window.currentMatch.currentGame}`);
        }
    }
}

// Función para finalizar partida manualmente
function endCurrentGame() {
    if (!window.gameInProgress || window.currentMatch.matchCompleted) return;
    
    const score1 = window.currentMatch.team1.currentScore;
    const score2 = window.currentMatch.team2.currentScore;
    
    if (score1 === 0 && score2 === 0) {
        if (window.common && window.common.showNotification) {
            window.common.showNotification("No hay puntos en la partida actual", "warning");
        }
        return;
    }
    
    // Determinar ganador manual (el que tenga más puntos)
    let winner, loser, winnerScore, loserScore;
    
    if (score1 > score2) {
        winner = 'team1';
        loser = 'team2';
        winnerScore = score1;
        loserScore = score2;
        window.currentMatch.team1.gamesWon++;
    } else if (score2 > score1) {
        winner = 'team2';
        loser = 'team1';
        winnerScore = score2;
        loserScore = score1;
        window.currentMatch.team2.gamesWon++;
    } else {
        // Empate - no se suma partida ganada a nadie
        if (window.common && window.common.showNotification) {
            window.common.showNotification("¡Empate! No se asigna partida ganada", "warning");
        }
        winner = null;
    }
    
    // Guardar historial de la partida
    const gameResult = {
        game: window.currentMatch.currentGame,
        team1Score: score1,
        team2Score: score2,
        winner: winner ? window.currentMatch[winner].name : "Empate",
        winnerScore: winnerScore,
        loserScore: loserScore,
        timestamp: new Date().toLocaleTimeString(),
        manualEnd: true
    };
    
    window.currentMatch.gameHistory.push(gameResult);
    
    if (window.common && window.common.showNotification) {
        if (winner) {
            window.common.showNotification(
                `Partida ${window.currentMatch.currentGame} finalizada: ${window.currentMatch[winner].name} gana (${winnerScore}-${loserScore})`
            );
        }
    }
    
    // Verificar si se ha ganado el encuentro
    setTimeout(() => {
        checkMatchWin();
    }, 100);
}

// Función para reiniciar partida actual
function resetCurrentGame() {
    if (window.currentMatch.team1.currentScore === 0 && window.currentMatch.team2.currentScore === 0) {
        if (window.common && window.common.showNotification) {
            window.common.showNotification("La partida ya está en 0-0", "warning");
        }
        return;
    }
    
    if (confirm("¿Reiniciar la partida actual? Se perderán los puntos no guardados.")) {
        window.currentMatch.team1.currentScore = 0;
        window.currentMatch.team2.currentScore = 0;
        window.currentMatch.team1.scoreHistory = [];
        window.currentMatch.team2.scoreHistory = [];
        window.currentMatch.team1.recentSums = [];
        window.currentMatch.team2.recentSums = [];
        
        updateDisplay();
        
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification("Partida reiniciada correctamente");
        }
    }
}

// Función para renderizar historial de partidas
function renderGameHistory() {
    const roundsListEl = document.getElementById('rounds-list');
    if (!roundsListEl) return;
    
    roundsListEl.innerHTML = '';
    
    if (window.currentMatch.gameHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.innerHTML = '<p>No hay partidas jugadas aún</p>';
        roundsListEl.appendChild(emptyMessage);
        return;
    }
    
    // Mostrar las últimas 5 partidas (las más recientes primero)
    const recentGames = window.currentMatch.gameHistory.slice().reverse().slice(0, 5);
    
    recentGames.forEach(game => {
        const roundItem = document.createElement('div');
        roundItem.className = 'round-item';
        
        roundItem.innerHTML = `
            <div class="round-number">P${game.game}</div>
            <div class="round-teams">${window.currentMatch.team1.name} vs ${window.currentMatch.team2.name}</div>
            <div class="round-score">${game.team1Score}-${game.team2Score}</div>
            <div class="round-winner">${game.winner}</div>
        `;
        
        roundsListEl.appendChild(roundItem);
    });
}

// Función para generar texto para compartir
function generateShareText() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const duration = Math.round((new Date() - window.currentMatch.startTime) / 1000 / 60);
    
    let text = `🎲 MARCADOR DE DOMINÓ 🎲\n`;
    text += `📅 ${dateStr} 🕒 ${timeStr}\n\n`;
    text += `=== ENCUENTRO ACTUAL ===\n`;
    text += `${window.currentMatch.team1.name} (${window.currentMatch.team1.players[0]} & ${window.currentMatch.team1.players[1]})\n`;
    text += `${window.currentMatch.team2.name} (${window.currentMatch.team2.players[0]} & ${window.currentMatch.team2.players[1]})\n\n`;
    text += `Partida Actual: ${window.currentMatch.currentGame} de ${window.currentMatch.bestOf}\n`;
    text += `Puntos objetivo: ${window.currentMatch.maxPoints}\n`;
    text += `Partidas ganadas:\n`;
    text += `${window.currentMatch.team1.name}: ${window.currentMatch.team1.gamesWon}\n`;
    text += `${window.currentMatch.team2.name}: ${window.currentMatch.team2.gamesWon}\n\n`;
    text += `Puntos en partida actual:\n`;
    text += `${window.currentMatch.team1.name}: ${window.currentMatch.team1.currentScore}\n`;
    text += `${window.currentMatch.team2.name}: ${window.currentMatch.team2.currentScore}\n\n`;
    text += `Puntos totales acumulados:\n`;
    text += `${window.currentMatch.team1.name}: ${window.currentMatch.team1.totalScore}\n`;
    text += `${window.currentMatch.team2.name}: ${window.currentMatch.team2.totalScore}\n\n`;
    text += `📍 Ubicación: ${window.currentMatch.location}\n`;
    text += `⏱️ Duración: ${duration} minutos\n\n`;
    
    if (window.currentMatch.gameHistory.length > 0) {
        text += `=== HISTORIAL DE PARTIDAS ===\n`;
        window.currentMatch.gameHistory.forEach(game => {
            text += `Partida ${game.game}: ${game.team1Score}-${game.team2Score} (Ganador: ${game.winner})\n`;
        });
        text += `\n`;
    }
    
    if (window.currentMatch.winner) {
        text += `=== GANADOR DEL ENCUENTRO ===\n`;
        const winnerName = window.currentMatch.winner === 'team1' ? window.currentMatch.team1.name : window.currentMatch.team2.name;
        text += `🏆 ${winnerName} (${window.currentMatch.team1.gamesWon}-${window.currentMatch.team2.gamesWon})\n\n`;
    }
    
    if (window.matchHistory.length > 0) {
        text += `=== ÚLTIMOS ENCUENTROS (DOMINÓ) ===\n`;
        const recentMatches = window.matchHistory.slice(0, 3);
        recentMatches.forEach((match, index) => {
            const matchDate = new Date(match.timestamp).toLocaleDateString();
            text += `${index + 1}. ${match.team1.name} ${match.team1.gamesWon}-${match.team2.gamesWon} ${match.team2.name}`;
            if (match.location && match.location !== "No especificada") {
                text += ` (${match.location})`;
            }
            text += `\n`;
        });
    }
    
    text += `\n📱 Generado con Marcador de Dominó - Liga Escolar`;
    text += `\n🔗 Más info: ${window.sportUrl}`;
    
    return text;
}

// Función para generar texto del historial
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

// Función para guardar en cookies
function saveToCookies() {
    const data = {
        currentMatch: window.currentMatch,
        matchHistory: window.matchHistory
    };
    
    if (window.storage && window.storage.saveToCookies) {
        window.storage.saveToCookies('dominoScoreboard', data);
    }
}

function loadFromCookies() {
    if (window.storage && window.storage.loadFromCookies) {
        const data = window.storage.loadFromCookies('dominoScoreboard');
        if (data) {
            window.currentMatch = data.currentMatch || window.currentMatch;
            window.matchHistory = data.matchHistory || window.matchHistory;
            
            // Inicializar arrays si no existen
            if (!window.currentMatch.team1.recentSums) window.currentMatch.team1.recentSums = [];
            if (!window.currentMatch.team2.recentSums) window.currentMatch.team2.recentSums = [];
            if (!window.currentMatch.matchStarted) window.currentMatch.matchStarted = false;
            
            // Determinar si la partida ha comenzado
            if (window.currentMatch.team1.currentScore > 0 || 
                window.currentMatch.team2.currentScore > 0 ||
                window.currentMatch.gameHistory.length > 0) {
                window.currentMatch.matchStarted = true;
            }
            
            // Restaurar estado del juego
            if (window.currentMatch.matchCompleted) {
                window.gameInProgress = false;
            }
        }
    }
}

// Función para abrir modal de edición de pareja
function openTeamEditModal(team) {
    const modal = document.getElementById('team-name-modal');
    const nameInput = document.getElementById('team-name-input');
    const player1Input = document.getElementById('player1-input');
    const player2Input = document.getElementById('player2-input');
    
    if (!modal || !nameInput || !player1Input || !player2Input) return;
    
    window.editingTeam = team;
    const teamObj = window.currentMatch[team];
    
    nameInput.value = teamObj.name;
    player1Input.value = teamObj.players[0] || '';
    player2Input.value = teamObj.players[1] || '';
    
    modal.style.display = 'flex';
}

// Función para guardar cambios de pareja
function saveTeamEdit() {
    const nameInput = document.getElementById('team-name-input');
    const player1Input = document.getElementById('player1-input');
    const player2Input = document.getElementById('player2-input');
    
    if (!nameInput || !player1Input || !player2Input || !window.editingTeam) return;
    
    const teamObj = window.currentMatch[window.editingTeam];
    teamObj.name = nameInput.value.trim() || teamObj.name;
    teamObj.players[0] = player1Input.value.trim() || teamObj.players[0];
    teamObj.players[1] = player2Input.value.trim() || teamObj.players[1];
    
    updateDisplay();
    
    if (typeof window.saveToCookies === 'function') {
        window.saveToCookies();
    }
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification(`Pareja ${teamObj.name} actualizada`);
    }
    
    // Cerrar modal
    const modal = document.getElementById('team-name-modal');
    if (modal) modal.style.display = 'none';
    window.editingTeam = null;
}

// Funciones para compartir
function shareCurrentMatch() {
    const text = generateShareText();
    openShareModal(text, "Partida Actual");
}

function shareMatchHistory() {
    const text = generateHistoryText();
    openShareModal(text, "Historial de Encuentros");
}

function openShareModal(text, title = "Compartir") {
    const modal = document.getElementById('share-modal');
    const shareTextEl = document.getElementById('share-text');
    const modalTitle = modal ? modal.querySelector('h2') : null;
    
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

// Función para reiniciar encuentro completo
function resetCurrentMatch() {
    if (confirm("¿Reiniciar todo el encuentro? Se perderán todos los datos no guardados.")) {
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
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('disabled');
            }
        });
        
        updateDisplay();
        
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification("Encuentro reiniciado correctamente");
        }
    }
}

// Inicialización
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
        maxPointsInput.addEventListener('change', updateMaxPoints);
    }
    
    if (applyMaxPointsBtn) {
        applyMaxPointsBtn.addEventListener('click', updateMaxPoints);
    }
    
    if (bestOfSelect) {
        bestOfSelect.value = window.currentMatch.bestOf;
        bestOfSelect.addEventListener('change', updateBestOf);
    }
    
    if (applyBestOfBtn) {
        applyBestOfBtn.addEventListener('click', updateBestOf);
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
        resetMatchBtn.addEventListener('click', resetCurrentMatch);
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
                const historyListEl = document.getElementById('history-list');
                if (historyListEl) {
                    historyListEl.innerHTML = '<div class="empty-message"><p>No hay encuentros guardados</p></div>';
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
    window.resetCurrentMatch = resetCurrentMatch;
    
    console.log("Dominó inicializado correctamente");
});
