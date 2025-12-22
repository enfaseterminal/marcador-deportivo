// /js/match-core.js
// Funciones básicas para manejar partidos

// Renderizar el partido actual
function renderCurrentMatch() {
    if (!window.currentMatch) return;
    
    const team1NameEl = document.getElementById('team1-name');
    const team1ScoreEl = document.getElementById('team1-score');
    const team1SetsEl = document.getElementById('team1-sets');
    const team2NameEl = document.getElementById('team2-name');
    const team2ScoreEl = document.getElementById('team2-score');
    const team2SetsEl = document.getElementById('team2-sets');
    const currentSetEl = document.getElementById('current-set');
    const maxSetsEl = document.getElementById('max-sets');
    const targetScoreEl = document.getElementById('target-score');
    const currentLocationEl = document.getElementById('current-location');
    
    // Actualizar nombres
    if (team1NameEl) team1NameEl.textContent = window.currentMatch.team1.name;
    if (team2NameEl) team2NameEl.textContent = window.currentMatch.team2.name;
    
    // Actualizar puntuaciones
    if (team1ScoreEl) team1ScoreEl.textContent = window.currentMatch.team1.score;
    if (team2ScoreEl) team2ScoreEl.textContent = window.currentMatch.team2.score;
    
    // Actualizar sets usando la función común renderSets
    if (team1SetsEl && typeof window.common?.renderSets === 'function') {
        window.common.renderSets(team1SetsEl, window.currentMatch.team1.sets, window.currentMatch.maxSets);
    }
    if (team2SetsEl && typeof window.common?.renderSets === 'function') {
        window.common.renderSets(team2SetsEl, window.currentMatch.team2.sets, window.currentMatch.maxSets);
    }
    
    // Actualizar información del set actual
    if (currentSetEl) currentSetEl.textContent = window.currentMatch.currentSet;
    if (maxSetsEl) maxSetsEl.textContent = window.currentMatch.maxSets;
    
    // Obtener puntaje objetivo (función específica del deporte)
    if (targetScoreEl && typeof window.getTargetScore === 'function') {
        targetScoreEl.textContent = window.getTargetScore();
    }
    
    // Actualizar ubicación
    if (currentLocationEl && window.currentMatch.location) {
        currentLocationEl.textContent = window.currentMatch.location;
    }
}

// Renderizar historial de partidos
function renderMatchHistory() {
    const historyListEl = document.getElementById('history-list');
    if (!historyListEl || !window.matchHistory) return;
    
    historyListEl.innerHTML = '';
    
    if (window.matchHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-history';
        emptyMessage.innerHTML = '<i class="fas fa-clipboard-list fa-2x"></i><p>No hay partidos guardados. ¡Juega y guarda algunos partidos!</p>';
        historyListEl.appendChild(emptyMessage);
        return;
    }
    
    window.matchHistory.forEach((match) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const teamsDiv = document.createElement('div');
        teamsDiv.className = 'history-teams';
        teamsDiv.textContent = `${match.team1.name} vs ${match.team2.name}`;
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'history-score';
        scoreDiv.textContent = `${match.team1.sets}-${match.team2.sets}`;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'history-info';
        infoDiv.innerHTML = `
            <div>${match.date}</div>
            <div class="history-location"><i class="fas fa-map-marker-alt"></i> ${match.location}</div>
            ${match.sport ? `<div class="history-sport"><i class="fas fa-volleyball-ball"></i> ${match.sport}</div>` : ''}
        `;
        
        historyItem.appendChild(teamsDiv);
        historyItem.appendChild(scoreDiv);
        historyItem.appendChild(infoDiv);
        
        historyListEl.appendChild(historyItem);
    });
}

// Reiniciar partido
function performReset() {
    if (!window.currentMatch) return;
    
    window.currentMatch.team1.score = 0;
    window.currentMatch.team2.score = 0;
    window.currentMatch.team1.sets = 0;
    window.currentMatch.team2.sets = 0;
    window.currentMatch.currentSet = 1;
    window.currentMatch.startTime = new Date();
    window.currentMatch.setHistory = [];
    window.currentMatch.winner = null;
    
    if (typeof window.setWonInProgress !== 'undefined') window.setWonInProgress = false;
    if (typeof window.matchWonInProgress !== 'undefined') window.matchWonInProgress = false;
    
    // Reactivar todos los botones
    if (typeof window.common?.enableScoreButtons === 'function') {
        window.common.enableScoreButtons();
    }
    
    renderCurrentMatch();
    
    if (typeof window.saveToCookies === 'function') {
        window.saveToCookies();
    }
    
    if (typeof window.showNotification === 'function') {
        window.showNotification("Partido reiniciado correctamente");
    }
}

function resetCurrentMatch() {
    if (!window.currentMatch) return;
    
    // Verificar si hay datos que perder
    if (window.currentMatch.team1.score > 0 || window.currentMatch.team2.score > 0 || 
        (window.currentMatch.setHistory && window.currentMatch.setHistory.length > 0)) {
        if (confirm("¿Estás seguro de que quieres reiniciar el partido? Se perderá el progreso actual.")) {
            performReset();
        }
    } else {
        performReset();
    }
}
// Función para renderizar historial de encuentros de dominó
function renderDominoMatchHistory() {
    const historyListEl = document.getElementById('history-list');
    if (!historyListEl || !window.matchHistory) return;
    
    historyListEl.innerHTML = '';
    
    if (window.matchHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-history';
        emptyMessage.innerHTML = '<i class="fas fa-clipboard-list fa-2x"></i><p>No hay encuentros guardados. ¡Juega y guarda algunos encuentros!</p>';
        historyListEl.appendChild(emptyMessage);
        return;
    }
    
    window.matchHistory.forEach((match) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const teamsDiv = document.createElement('div');
        teamsDiv.className = 'history-teams';
        teamsDiv.textContent = `${match.team1.name} vs ${match.team2.name}`;
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'history-score';
        scoreDiv.textContent = `${match.team1.gamesWon}-${match.team2.gamesWon}`;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'history-info';
        infoDiv.innerHTML = `
            <div>${match.date}</div>
            <div class="history-location"><i class="fas fa-map-marker-alt"></i> ${match.location}</div>
            ${match.duration ? `<div class="history-duration"><i class="fas fa-clock"></i> ${match.duration} minutos</div>` : ''}
            ${match.sport ? `<div class="history-sport"><i class="fas fa-th-large"></i> ${match.sport}</div>` : ''}
        `;
        
        historyItem.appendChild(teamsDiv);
        historyItem.appendChild(scoreDiv);
        historyItem.appendChild(infoDiv);
        
        historyListEl.appendChild(historyItem);
    });
}
// Exportar funciones
window.matchCore = {
    renderCurrentMatch,
    renderMatchHistory,
    performReset,
    resetCurrentMatch
};
