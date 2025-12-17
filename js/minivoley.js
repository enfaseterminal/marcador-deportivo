// /js/minivoley.js
// Configuración específica de minivoleibol
window.sportName = "Minivoleibol";
window.sportUrl = "https://www.ligaescolar.es/minivoley/";

// Variables específicas
window.currentMatch = {
    team1: { name: "Equipo Local", score: 0, sets: 0 },
    team2: { name: "Equipo Visitante", score: 0, sets: 0 },
    currentSet: 1,
    maxSets: 3, // Cambiado a 3 sets para minivoleibol
    startTime: new Date(),
    setHistory: [],
    winner: null,
    location: "No especificada"
};

window.matchHistory = [];
window.editingTeam = null;
window.savingMatchAfterWin = false;
window.setWonInProgress = false;
window.matchWonInProgress = false;

// Función específica para obtener puntaje objetivo (siempre 25 en minivoleibol)
function getTargetScore() {
    return 25; // Todos los sets son a 25 puntos en minivoleibol
}

// Función específica para verificar victoria en set
function checkSetWin() {
    if (window.setWonInProgress || window.matchWonInProgress) return false;
    
    const targetScore = getTargetScore();
    const score1 = window.currentMatch.team1.score;
    const score2 = window.currentMatch.team2.score;
    
    const team1Wins = score1 >= targetScore && score1 - score2 >= 2;
    const team2Wins = score2 >= targetScore && score2 - score1 >= 2;
    
    if (team1Wins || team2Wins) {
        window.setWonInProgress = true;
        
        if (team1Wins) {
            window.currentMatch.team1.sets++;
            window.currentMatch.setHistory.push({
                set: window.currentMatch.currentSet,
                team1: score1,
                team2: score2,
                winner: window.currentMatch.team1.name
            });
            if (window.common?.showNotification) {
                window.common.showNotification(`${window.currentMatch.team1.name} gana el set ${window.currentMatch.currentSet} (${score1}-${score2})`);
            }
        } else {
            window.currentMatch.team2.sets++;
            window.currentMatch.setHistory.push({
                set: window.currentMatch.currentSet,
                team1: score1,
                team2: score2,
                winner: window.currentMatch.team2.name
            });
            if (window.common?.showNotification) {
                window.common.showNotification(`${window.currentMatch.team2.name} gana el set ${window.currentMatch.currentSet} (${score1}-${score2})`);
            }
        }
        
        setTimeout(() => {
            checkMatchCompletion();
            window.setWonInProgress = false;
        }, 100);
        
        return true;
    }
    return false;
}

// Función específica para verificar si se ha completado el partido (todos los sets jugados)
function checkMatchCompletion() {
    // En minivoleibol, se juegan los 3 sets siempre
    if (window.currentMatch.currentSet === window.currentMatch.maxSets) {
        // Último set completado, determinar ganador del partido
        window.matchWonInProgress = true;
        
        // Determinar ganador del partido (mejor de 3)
        let winner;
        let winnerMessage;
        
        if (window.currentMatch.team1.sets > window.currentMatch.team2.sets) {
            winner = window.currentMatch.team1.name;
            window.currentMatch.winner = 'team1';
            winnerMessage = `${winner} ha ganado el partido ${window.currentMatch.team1.sets}-${window.currentMatch.team2.sets}`;
        } else if (window.currentMatch.team2.sets > window.currentMatch.team1.sets) {
            winner = window.currentMatch.team2.name;
            window.currentMatch.winner = 'team2';
            winnerMessage = `${winner} ha ganado el partido ${window.currentMatch.team2.sets}-${window.currentMatch.team1.sets}`;
        } else {
            // Empate (1-1-1 o 2-1 pero con diferencia de sets)
            winner = "Empate";
            window.currentMatch.winner = 'draw';
            winnerMessage = `¡Empate! ${window.currentMatch.team1.name} ${window.currentMatch.team1.sets}-${window.currentMatch.team2.sets} ${window.currentMatch.team2.name}`;
        }
        
        // Bloquear todos los botones de puntuación
        if (window.common?.disableScoreButtons) window.common.disableScoreButtons();
        
        // Mostrar mensaje de finalización del partido
        if (window.common?.showNotification) {
            window.common.showNotification(`${winnerMessage} (Partido completado)`, 'success');
        }
        
        // Mostrar celebración solo si hay un ganador (no empate)
        if (window.currentMatch.winner !== 'draw' && typeof showCelebration === 'function') {
            showCelebration();
        }
        
        // Preparar para guardar el partido automáticamente después de un breve retraso
        setTimeout(() => {
            window.savingMatchAfterWin = true;
            if (window.modalManager?.openSaveMatchModal) window.modalManager.openSaveMatchModal();
            window.matchWonInProgress = false;
        }, 2000);
        
        return true;
    } else {
        // Pasar al siguiente set después de un breve retraso
        setTimeout(() => {
            startNewSet();
        }, 1500);
        return false;
    }
}

// Función específica para forzar el fin del set actual (para botón "Nuevo Set")
function forceEndCurrentSet() {
    const score1 = window.currentMatch.team1.score;
    const score2 = window.currentMatch.team2.score;
    
    // Determinar ganador del set basado en el puntaje actual
    let setWinner;
    if (score1 > score2) {
        window.currentMatch.team1.sets++;
        setWinner = window.currentMatch.team1.name;
    } else if (score2 > score1) {
        window.currentMatch.team2.sets++;
        setWinner = window.currentMatch.team2.name;
    } else {
        // Empate en puntos
        setWinner = "Ninguno (empate)";
    }
    
    // Guardar resultado del set
    window.currentMatch.setHistory.push({
        set: window.currentMatch.currentSet,
        team1: score1,
        team2: score2,
        winner: setWinner
    });
    
    if (window.common?.showNotification) {
        window.common.showNotification(`Set ${window.currentMatch.currentSet} finalizado: ${score1}-${score2} (Ganador: ${setWinner})`);
    }
    
    // Verificar si se ha completado el partido
    setTimeout(() => {
        checkMatchCompletion();
    }, 100);
}

// Función específica para nuevo set
function startNewSet() {
    if (window.currentMatch.currentSet < window.currentMatch.maxSets) {
        window.currentMatch.currentSet++;
        window.currentMatch.team1.score = 0;
        window.currentMatch.team2.score = 0;
        
        if (window.matchCore?.renderCurrentMatch) window.matchCore.renderCurrentMatch();
        if (window.saveToCookies) window.saveToCookies();
        if (window.common?.enableScoreButtons) window.common.enableScoreButtons();
        
        if (window.common?.showNotification) {
            window.common.showNotification(`Comienza el set ${window.currentMatch.currentSet} (Último: ${window.currentMatch.maxSets})`);
        }
    }
}

// Función específica para generar texto para compartir
function generateShareText() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    
    let text = `🏐 MARCADOR DE MINIVOLEIBOL 🏐\n`;
    text += `📅 ${dateStr} 🕒 ${timeStr}\n\n`;
    text += `=== PARTIDO ACTUAL ===\n`;
    text += `${window.currentMatch.team1.name}: ${window.currentMatch.team1.score} puntos\n`;
    text += `${window.currentMatch.team2.name}: ${window.currentMatch.team2.score} puntos\n\n`;
    text += `Sets ganados (de 3):\n`;
    text += `${window.currentMatch.team1.name}: ${window.currentMatch.team1.sets}\n`;
    text += `${window.currentMatch.team2.name}: ${window.currentMatch.team2.sets}\n\n`;
    text += `Set actual: ${window.currentMatch.currentSet} de ${window.currentMatch.maxSets}\n`;
    text += `Puntos para ganar: ${getTargetScore()} (con diferencia de 2)\n`;
    text += `Reglas: Mejor de 3 sets (todos se juegan)\n\n`;
    text += `📍 Ubicación: ${window.currentMatch.location}\n\n`;
    
    if (window.currentMatch.setHistory.length > 0) {
        text += `=== HISTORIAL DE SETS ===\n`;
        window.currentMatch.setHistory.forEach(set => {
            text += `Set ${set.set}: ${set.team1}-${set.team2} (Ganador: ${set.winner})\n`;
        });
        text += `\n`;
    }
    
    if (window.currentMatch.winner) {
        text += `=== RESULTADO FINAL ===\n`;
        if (window.currentMatch.winner === 'draw') {
            text += `¡EMPATE! ${window.currentMatch.team1.sets}-${window.currentMatch.team2.sets}\n`;
        } else {
            const winnerName = window.currentMatch.winner === 'team1' ? window.currentMatch.team1.name : window.currentMatch.team2.name;
            text += `GANADOR: ${winnerName} (${window.currentMatch.team1.sets}-${window.currentMatch.team2.sets})\n`;
        }
        text += `\n`;
    }
    
    if (window.matchHistory.length > 0) {
        text += `=== ÚLTIMOS PARTIDOS (MINIVOLEIBOL) ===\n`;
        const recentMatches = window.matchHistory.slice(0, 3);
        recentMatches.forEach((match, index) => {
            const matchDate = new Date(match.timestamp).toLocaleDateString();
            text += `${index + 1}. ${match.team1.name} ${match.team1.sets}-${match.team2.sets} ${match.team2.name}`;
            if (match.location && match.location !== "No especificada") {
                text += ` (${match.location})`;
            }
            text += `\n`;
        });
    }
    
    text += `\n📱 Generado con Marcador de Minivoleibol - Liga Escolar`;
    text += `\n🔗 Más info: ${window.sportUrl}`;
    
    return text;
}

// Función específica para guardar en cookies
function saveToCookies() {
    const data = {
        currentMatch: window.currentMatch,
        matchHistory: window.matchHistory
    };
    if (window.storage?.saveToCookies) {
        window.storage.saveToCookies('minivoleyScoreboard', data);
    }
}

function loadFromCookies() {
    if (window.storage?.loadFromCookies) {
        const data = window.storage.loadFromCookies('minivoleyScoreboard');
        if (data) {
            window.currentMatch = data.currentMatch || window.currentMatch;
            window.matchHistory = data.matchHistory || window.matchHistory;
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos guardados
    loadFromCookies();
    
    // Inicializar funciones de módulos comunes
    if (window.matchCore?.renderCurrentMatch) window.matchCore.renderCurrentMatch();
    if (window.matchCore?.renderMatchHistory) window.matchCore.renderMatchHistory();
    
    // Inicializar event listeners
    if (window.scoreManager?.initScoreEventListeners) window.scoreManager.initScoreEventListeners();
    if (window.common?.initCommonEventListeners) window.common.initCommonEventListeners();
    if (window.modalManager?.initModalEventListeners) window.modalManager.initModalEventListeners();
    
    // Configurar el botón "Nuevo Set" específicamente para minivoleibol
    const newSetBtn = document.getElementById('new-set');
    if (newSetBtn) {
        newSetBtn.addEventListener('click', () => {
            if (window.currentMatch.team1.score === 0 && window.currentMatch.team2.score === 0) {
                if (window.common?.showNotification) {
                    window.common.showNotification("No hay puntos en el set actual. Agrega puntos antes de comenzar un nuevo set.", "warning");
                }
            } else {
                // En minivoleibol, permitir avanzar manualmente solo si no es el último set
                if (window.currentMatch.currentSet < window.currentMatch.maxSets) {
                    // Forzar el fin del set actual y guardar resultado
                    forceEndCurrentSet();
                } else {
                    if (window.common?.showNotification) {
                        window.common.showNotification("Ya se han jugado todos los sets del partido.", "warning");
                    }
                }
            }
        });
    }
    
    // Asignar funciones específicas al objeto global
    window.getTargetScore = getTargetScore;
    window.checkSetWin = checkSetWin;
    window.checkMatchCompletion = checkMatchCompletion;
    window.forceEndCurrentSet = forceEndCurrentSet;
    window.startNewSet = startNewSet;
    window.generateShareText = generateShareText;
    window.saveToCookies = saveToCookies;
    window.loadFromCookies = loadFromCookies;
    window.resetCurrentMatch = window.matchCore?.resetCurrentMatch;
    window.saveLocation = window.storage?.saveLocation;
});
