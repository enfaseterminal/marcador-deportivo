// /js/voleibol.js
// Configuración específica de voleibol (versión modular) - VERSIÓN COMPLETA

// Variables globales específicas de voleibol
window.currentMatch = {
    team1: { name: "Equipo Local", score: 0, sets: 0 },
    team2: { name: "Equipo Visitante", score: 0, sets: 0 },
    currentSet: 1,
    maxSets: 5,
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

// Configuración específica del deporte
window.sportName = "Voleibol";
window.sportUrl = "https://www.ligaescolar.es/voleibol/";

// Función específica para obtener puntaje objetivo según el set actual
function getTargetScore() {
    // Los primeros 4 sets son a 25, el quinto set es a 15
    return window.currentMatch.currentSet <= 4 ? 25 : 15;
}

// Función específica para verificar victoria en set
function checkSetWin() {
    if (window.setWonInProgress || window.matchWonInProgress) return false;
    
    const targetScore = getTargetScore();
    const score1 = window.currentMatch.team1.score;
    const score2 = window.currentMatch.team2.score;
    
    // Verificar si algún equipo alcanzó el puntaje objetivo con diferencia de 2
    const team1Wins = score1 >= targetScore && score1 - score2 >= 2;
    const team2Wins = score2 >= targetScore && score2 - score1 >= 2;
    
    if (team1Wins || team2Wins) {
        window.setWonInProgress = true;
        
        // Determinar ganador
        if (team1Wins) {
            window.currentMatch.team1.sets++;
            
            // Guardar resultado del set
            window.currentMatch.setHistory.push({
                set: window.currentMatch.currentSet,
                team1: score1,
                team2: score2,
                winner: window.currentMatch.team1.name
            });
            
            if (window.common && window.common.showNotification) {
                window.common.showNotification(`${window.currentMatch.team1.name} gana el set ${window.currentMatch.currentSet} (${score1}-${score2})`);
            }
        } else {
            window.currentMatch.team2.sets++;
            
            // Guardar resultado del set
            window.currentMatch.setHistory.push({
                set: window.currentMatch.currentSet,
                team1: score1,
                team2: score2,
                winner: window.currentMatch.team2.name
            });
            
            if (window.common && window.common.showNotification) {
                window.common.showNotification(`${window.currentMatch.team2.name} gana el set ${window.currentMatch.currentSet} (${score1}-${score2})`);
            }
        }
        
        // Verificar si se ganó el partido
        setTimeout(() => {
            checkMatchWin();
            window.setWonInProgress = false;
        }, 100);
        
        return true;
    }
    
    return false;
}

// Función específica para verificar si se ha ganado el partido
function checkMatchWin() {
    const setsToWin = Math.ceil(window.currentMatch.maxSets / 2); // 3 de 5 sets
    
    if (window.currentMatch.team1.sets >= setsToWin || window.currentMatch.team2.sets >= setsToWin) {
        // Evitar múltiples ejecuciones
        if (window.matchWonInProgress) {
            return false;
        }
        
        window.matchWonInProgress = true;
        
        // Determinar ganador
        let winner;
        
        if (window.currentMatch.team1.sets > window.currentMatch.team2.sets) {
            winner = window.currentMatch.team1.name;
            window.currentMatch.winner = 'team1';
        } else {
            winner = window.currentMatch.team2.name;
            window.currentMatch.winner = 'team2';
        }
        
        // Bloquear todos los botones de puntuación inmediatamente
        if (window.common && window.common.disableScoreButtons) {
            window.common.disableScoreButtons();
        }
        
        // Mostrar mensaje de victoria con notificación
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`¡${winner} ha ganado el partido! ${window.currentMatch.team1.sets}-${window.currentMatch.team2.sets}`, 'success');
        }
        
        // Mostrar celebración
        if (typeof window.showCelebration === 'function') {
            window.showCelebration();
        }
        
        // Preparar para guardar el partido automáticamente después de un breve retraso
        setTimeout(() => {
            window.savingMatchAfterWin = true;
            if (window.modalManager && window.modalManager.openSaveMatchModal) {
                window.modalManager.openSaveMatchModal();
            }
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

// Función específica para nuevo set
function startNewSet() {
    // Solo avanzar al siguiente set si no hemos alcanzado el máximo
    if (window.currentMatch.currentSet < window.currentMatch.maxSets) {
        window.currentMatch.currentSet++;
        window.currentMatch.team1.score = 0;
        window.currentMatch.team2.score = 0;
        
        // Renderizar y guardar
        if (window.matchCore && window.matchCore.renderCurrentMatch) {
            window.matchCore.renderCurrentMatch();
        }
        
        if (window.saveToCookies) {
            window.saveToCookies();
        }
        
        // Reactivar botones para el nuevo set
        if (window.common && window.common.enableScoreButtons) {
            window.common.enableScoreButtons();
        }
        
        if (window.common && window.common.showNotification) {
            window.common.showNotification(`Comienza el set ${window.currentMatch.currentSet}`);
        }
    } else {
        if (window.common && window.common.showNotification) {
            window.common.showNotification("Ya se han jugado todos los sets del partido.", "warning");
        }
    }
}

// Función específica para forzar el fin del set actual (para minivoleibol)
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
    
    if (window.common && window.common.showNotification) {
        window.common.showNotification(`Set ${window.currentMatch.currentSet} finalizado: ${score1}-${score2} (Ganador: ${setWinner})`);
    }
    
    // Verificar si se ha completado el partido
    setTimeout(() => {
        checkMatchWin();
    }, 100);
}

// Función específica para generar texto para compartir
function generateShareText() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    
    let text = `🏐 MARCADOR DE VOLEIBOL 🏐\n`;
    text += `📅 ${dateStr} 🕒 ${timeStr}\n\n`;
    text += `=== PARTIDO ACTUAL ===\n`;
    text += `${window.currentMatch.team1.name}: ${window.currentMatch.team1.score} puntos\n`;
    text += `${window.currentMatch.team2.name}: ${window.currentMatch.team2.score} puntos\n\n`;
    text += `Sets ganados:\n`;
    text += `${window.currentMatch.team1.name}: ${window.currentMatch.team1.sets}\n`;
    text += `${window.currentMatch.team2.name}: ${window.currentMatch.team2.sets}\n\n`;
    text += `Set actual: ${window.currentMatch.currentSet} de ${window.currentMatch.maxSets}\n`;
    text += `Puntos para ganar: ${getTargetScore()} (con diferencia de 2)\n\n`;
    text += `📍 Ubicación: ${window.currentMatch.location}\n\n`;
    
    if (window.currentMatch.setHistory.length > 0) {
        text += `=== HISTORIAL DE SETS ===\n`;
        window.currentMatch.setHistory.forEach(set => {
            text += `Set ${set.set}: ${set.team1}-${set.team2} (Ganador: ${set.winner})\n`;
        });
        text += `\n`;
    }
    
    if (window.matchHistory.length > 0) {
        text += `=== ÚLTIMOS PARTIDOS ===\n`;
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
    
    text += `\n📱 Generado con Marcador de Voleibol`;
    text += `\n🔗 Más info: ${window.sportUrl}`;
    
    return text;
}

// Función específica para guardar en cookies
function saveToCookies() {
    const data = {
        currentMatch: window.currentMatch,
        matchHistory: window.matchHistory
    };
    
    if (window.storage && window.storage.saveToCookies) {
        window.storage.saveToCookies('volleyballScoreboard', data);
    }
}

function loadFromCookies() {
    if (window.storage && window.storage.loadFromCookies) {
        const data = window.storage.loadFromCookies('volleyballScoreboard');
        if (data) {
            window.currentMatch = data.currentMatch || window.currentMatch;
            window.matchHistory = data.matchHistory || window.matchHistory;
        }
    }
}

// INICIALIZACIÓN - VERSIÓN CORREGIDA (sin duplicados)
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando voleibol...');
    
    // Cargar datos guardados
    loadFromCookies();
    
    // Inicializar funciones de módulos comunes - SOLO UNA VEZ
    if (window.matchCore && window.matchCore.renderCurrentMatch) {
        window.matchCore.renderCurrentMatch();
    }
    if (window.matchCore && window.matchCore.renderMatchHistory) {
        window.matchCore.renderMatchHistory();
    }
    
    // INICIALIZAR EVENT LISTENERS UNA SOLA VEZ
    if (window.scoreManager && window.scoreManager.initScoreEventListeners) {
        window.scoreManager.initScoreEventListeners();
    }
    
    // Inicializar modalManager SOLO SI NO SE HA INICIALIZADO ANTES
    if (window.modalManager && window.modalManager.initModalEventListeners) {
        // Verificar si ya se inicializó mediante la bandera
        if (!window.modalManager.initialized) {
            window.modalManager.initModalEventListeners();
            window.modalManager.initialized = true;
        }
    }
    
    // Inicializar common SOLO SI NO SE HA INICIALIZADO ANTES
    if (window.common && window.common.initCommonEventListeners) {
        if (!window.common.initialized) {
            window.common.initCommonEventListeners();
            window.common.initialized = true;
        }
    }
    
    // Asignar funciones específicas al objeto global para que los módulos las puedan usar
    window.getTargetScore = getTargetScore;
    window.checkSetWin = checkSetWin;
    window.checkMatchWin = checkMatchWin;
    window.startNewSet = startNewSet;
    window.generateShareText = generateShareText;
    window.saveToCookies = saveToCookies;
    window.loadFromCookies = loadFromCookies;
    
    if (window.matchCore && window.matchCore.resetCurrentMatch) {
        window.resetCurrentMatch = window.matchCore.resetCurrentMatch;
    }
    
    if (window.storage && window.storage.saveLocation) {
        window.saveLocation = window.storage.saveLocation;
    }
    
    console.log("Voleibol modular inicializado correctamente");
});
