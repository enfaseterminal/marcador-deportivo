// /js/score-manager.js (VERSIÓN CORREGIDA)
// Gestión básica de puntuaciones

function updateScore(team, change) {
    if (!window.currentMatch) return;
    
    // Solo permitir actualizar si no estamos procesando una victoria
    if ((typeof window.setWonInProgress !== 'undefined' && window.setWonInProgress) ||
        (typeof window.matchWonInProgress !== 'undefined' && window.matchWonInProgress) ||
        window.currentMatch.winner) {
        return;
    }
    
    // Aplicar el cambio
    window.currentMatch[team].score += change;
    
    // Asegurarse de que el marcador no sea negativo
    if (window.currentMatch[team].score < 0) {
        window.currentMatch[team].score = 0;
    }
    
    // Verificar si se ganó el set después de actualizar el puntaje
    if (typeof window.checkSetWin === 'function') {
        const setWon = window.checkSetWin();
        
        // Si se ganó el set, bloquear botones temporalmente
        if (setWon && window.common && window.common.disableScoreButtons) {
            window.common.disableScoreButtons();
        }
    }
    
    // Renderizar normalmente usando matchCore
    if (window.matchCore && window.matchCore.renderCurrentMatch) {
        window.matchCore.renderCurrentMatch();
    }
    
    if (typeof window.saveToCookies === 'function') {
        window.saveToCookies();
    }
}

// Inicializar event listeners de puntuación
function initScoreEventListeners() {
    const team1AddBtn = document.getElementById('team1-add');
    const team1RemoveBtn = document.getElementById('team1-remove');
    const team2AddBtn = document.getElementById('team2-add');
    const team2RemoveBtn = document.getElementById('team2-remove');
    
    if (team1AddBtn) team1AddBtn.addEventListener('click', () => updateScore('team1', 1));
    if (team1RemoveBtn) team1RemoveBtn.addEventListener('click', () => updateScore('team1', -1));
    if (team2AddBtn) team2AddBtn.addEventListener('click', () => updateScore('team2', 1));
    if (team2RemoveBtn) team2RemoveBtn.addEventListener('click', () => updateScore('team2', -1));
}

// Exportar funciones
window.scoreManager = {
    updateScore,
    initScoreEventListeners
};
