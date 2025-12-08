// Variables globales
let currentMatch = {
    team1: {
        name: "Equipo Local",
        score: 0,
        sets: 0
    },
    team2: {
        name: "Equipo Visitante",
        score: 0,
        sets: 0
    },
    currentSet: 1,
    maxSets: 5,
    startTime: new Date(),
    setHistory: [],
    gameType: 'voleibol' // 'voleibol' o 'minivoley'
};

let matchHistory = [];
let editingTeam = null;

// Elementos DOM comunes
let clockEl, dateEl;
let team1NameEl, team1ScoreEl, team1SetsEl, team1AddBtn, team1RemoveBtn;
let team2NameEl, team2ScoreEl, team2SetsEl, team2AddBtn, team2RemoveBtn;
let newSetBtn, resetMatchBtn, saveMatchBtn, clearHistoryBtn;
let shareWhatsappBtn, shareResultsBtn;
let historyListEl, currentSetEl, targetScoreEl, totalSetsEl;
let teamNameModal, teamNameInput, cancelEditBtn, saveNameBtn;
let shareModal, shareTextEl, copyTextBtn, shareNativeBtn, closeShareBtn;
let backHomeBtn;

// Función para inicializar elementos del DOM (para scoreboard.html)
function initScoreboardElements() {
    // Elementos del DOM para scoreboard.html
    clockEl = document.getElementById('clock');
    dateEl = document.getElementById('date');
    
    team1NameEl = document.getElementById('team1-name');
    team1ScoreEl = document.getElementById('team1-score');
    team1SetsEl = document.getElementById('team1-sets');
    team1AddBtn = document.getElementById('team1-add');
    team1RemoveBtn = document.getElementById('team1-remove');

    team2NameEl = document.getElementById('team2-name');
    team2ScoreEl = document.getElementById('team2-score');
    team2SetsEl = document.getElementById('team2-sets');
    team2AddBtn = document.getElementById('team2-add');
    team2RemoveBtn = document.getElementById('team2-remove');

    newSetBtn = document.getElementById('new-set');
    resetMatchBtn = document.getElementById('reset-match');
    saveMatchBtn = document.getElementById('save-match');
    clearHistoryBtn = document.getElementById('clear-history');
    shareWhatsappBtn = document.getElementById('share-whatsapp');
    shareResultsBtn = document.getElementById('share-results');

    historyListEl = document.getElementById('history-list');
    currentSetEl = document.getElementById('current-set');
    targetScoreEl = document.getElementById('target-score');
    totalSetsEl = document.getElementById('total-sets');

    teamNameModal = document.getElementById('team-name-modal');
    teamNameInput = document.getElementById('team-name-input');
    cancelEditBtn = document.getElementById('cancel-edit');
    saveNameBtn = document.getElementById('save-name');

    shareModal = document.getElementById('share-modal');
    shareTextEl = document.getElementById('share-text');
    copyTextBtn = document.getElementById('copy-text');
    shareNativeBtn = document.getElementById('share-native');
    closeShareBtn = document.getElementById('close-share');
    
    backHomeBtn = document.getElementById('back-home');
}

// Función para inicializar elementos del DOM (para index.html)
function initHomeElements() {
    // Elementos del DOM para index.html
    clockEl = document.getElementById('clock');
    dateEl = document.getElementById('date');
    clearHistoryBtn = document.getElementById('clear-history');
    historyListEl = document.getElementById('history-list');
    
    const startVolleyballBtn = document.getElementById('start-volleyball');
    const startMinivolleyballBtn = document.getElementById('start-minivolleyball');
    
    if (startVolleyballBtn) {
        startVolleyballBtn.addEventListener('click', () => {
            localStorage.setItem('gameType', 'voleibol');
            window.location.href = 'scoreboard.html';
        });
    }
    
    if (startMinivolleyballBtn) {
        startMinivolleyballBtn.addEventListener('click', () => {
            localStorage.setItem('gameType', 'minivoley');
            window.location.href = 'scoreboard.html';
        });
    }
}

// Función para obtener el puntaje objetivo según el set actual
function getTargetScore() {
    const gameType = currentMatch.gameType || localStorage.getItem('gameType') || 'voleibol';
    
    if (gameType === 'minivoley') {
        // Minivoley: sets 1-2 a 25, set 3 a 15
        return currentMatch.currentSet <= 2 ? 25 : 15;
    } else {
        // Voleibol: sets 1-4 a 25, set 5 a 15
        return currentMatch.currentSet <= 4 ? 25 : 15;
    }
}

// Función para obtener el número máximo de sets
function getMaxSets() {
    const gameType = currentMatch.gameType || localStorage.getItem('gameType') || 'voleibol';
    return gameType === 'minivoley' ? 3 : 5;
}

// Función para actualizar el reloj
function updateClock() {
    if (!clockEl) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    clockEl.textContent = timeString;
    if (dateEl) dateEl.textContent = dateString;
}

// Función para verificar si se ha ganado el set
function checkSetWin() {
    const targetScore = getTargetScore();
    const score1 = currentMatch.team1.score;
    const score2 = currentMatch.team2.score;
    
    // Verificar si algún equipo alcanzó el puntaje objetivo con diferencia de 2
    if (score1 >= targetScore && score1 - score2 >= 2) {
        // Equipo 1 gana el set
        currentMatch.team1.sets++;
        
        // Guardar resultado del set
        currentMatch.setHistory.push({
            set: currentMatch.currentSet,
            team1: score1,
            team2: score2,
            winner: currentMatch.team1.name
        });
        
        checkMatchWin();
        return true;
    }
    
    if (score2 >= targetScore && score2 - score1 >= 2) {
        // Equipo 2 gana el set
        currentMatch.team2.sets++;
        
        // Guardar resultado del set
        currentMatch.setHistory.push({
            set: currentMatch.currentSet,
            team1: score1,
            team2: score2,
            winner: currentMatch.team2.name
        });
        
        checkMatchWin();
        return true;
    }
    
    return false;
}

// Función para verificar si se ha ganado el partido
function checkMatchWin() {
    const gameType = currentMatch.gameType || localStorage.getItem('gameType') || 'voleibol';
    const maxSets = getMaxSets();
    
    let setsToWin;
    if (gameType === 'minivoley') {
        // Minivoley: se juegan los 3 sets siempre, gana quien gane 2
        setsToWin = 2;
    } else {
        // Voleibol: mejor de 5 (3 sets para ganar)
        setsToWin = Math.ceil(maxSets / 2);
    }
    
    if (currentMatch.team1.sets >= setsToWin || currentMatch.team2.sets >= setsToWin) {
        // Determinar ganador
        let winner;
        
        if (currentMatch.team1.sets > currentMatch.team2.sets) {
            winner = currentMatch.team1.name;
        } else {
            winner = currentMatch.team2.name;
        }
        
        // Mostrar mensaje de victoria
        setTimeout(() => {
            alert(`¡${winner} ha ganado el partido! \n\nResultado final: ${currentMatch.team1.sets} - ${currentMatch.team2.sets}`);
            
            // En minivoley, continuar jugando todos los sets
            if (gameType === 'minivoley' && currentMatch.currentSet < maxSets) {
                // Continuar al siguiente set
                currentMatch.currentSet++;
                currentMatch.team1.score = 0;
                currentMatch.team2.score = 0;
                renderCurrentMatch();
                saveToCookies();
            } else {
                // Guardar el partido y reiniciar
                saveCurrentMatch();
                resetCurrentMatch();
            }
        }, 500);
        
        return true;
    } else {
        // Pasar al siguiente set
        setTimeout(() => {
            startNewSet();
        }, 1000);
        return false;
    }
}

// Funciones principales
function updateScore(team, change) {
    // Aplicar el cambio
    currentMatch[team].score += change;
    
    // Asegurarse de que el marcador no sea negativo
    if (currentMatch[team].score < 0) {
        currentMatch[team].score = 0;
    }
    
    // Verificar si se ganó el set después de actualizar el puntaje
    const setWon = checkSetWin();
    
    // Si no se ganó el set, renderizar normalmente
    if (!setWon) {
        renderCurrentMatch();
        saveToCookies();
    }
}

function startNewSet() {
    // Obtener el tipo de juego
    const gameType = currentMatch.gameType || localStorage.getItem('gameType') || 'voleibol';
    const maxSets = getMaxSets();
    
    // Solo permitir nuevo set si el actual no está en juego o si se forcea
    if (currentMatch.team1.score > 0 || currentMatch.team2.score > 0) {
        if (!confirm("Hay puntos en juego. ¿Forzar fin del set actual y comenzar nuevo set?")) {
            return;
        }
        
        // Determinar ganador del set actual por puntaje
        if (currentMatch.team1.score > currentMatch.team2.score) {
            currentMatch.team1.sets++;
        } else if (currentMatch.team2.score > currentMatch.team1.score) {
            currentMatch.team2.sets++;
        } else {
            // Empate, no se asigna set
            alert("El set está empatado. No se puede asignar a ningún equipo.");
            return;
        }
        
        // Verificar si con este set se ganó el partido
        if (!checkMatchWin()) {
            // Si no se ganó el partido, continuar al siguiente set
            // Pero en minivoley, solo continuar si no hemos llegado al máximo de sets
            if (currentMatch.currentSet < maxSets) {
                currentMatch.currentSet++;
                currentMatch.team1.score = 0;
                currentMatch.team2.score = 0;
                renderCurrentMatch();
                saveToCookies();
            }
        }
    } else {
        // Si no hay puntos, simplemente incrementar el set si no hemos llegado al máximo
        if (currentMatch.currentSet < maxSets) {
            currentMatch.currentSet++;
            renderCurrentMatch();
            saveToCookies();
        } else {
            alert("Ya se ha alcanzado el número máximo de sets.");
        }
    }
}

function resetCurrentMatch() {
    if (confirm("¿Estás seguro de que quieres reiniciar el partido? Se perderá el progreso actual.")) {
        currentMatch.team1.score = 0;
        currentMatch.team2.score = 0;
        currentMatch.team1.sets = 0;
        currentMatch.team2.sets = 0;
        currentMatch.currentSet = 1;
        currentMatch.startTime = new Date();
        currentMatch.setHistory = [];
        
        // Cargar el tipo de juego actual
        const gameType = localStorage.getItem('gameType') || 'voleibol';
        currentMatch.gameType = gameType;
        currentMatch.maxSets = getMaxSets();
        
        renderCurrentMatch();
        saveToCookies();
    }
}

function saveCurrentMatch() {
    // Solo guardar si hay al menos un set ganado
    if (currentMatch.team1.sets === 0 && currentMatch.team2.sets === 0) {
        alert("No se puede guardar un partido sin sets ganados.");
        return;
    }
    
    const now = new Date();
    const matchData = {
        team1: {...currentMatch.team1},
        team2: {...currentMatch.team2},
        currentSet: currentMatch.currentSet,
        setHistory: [...currentMatch.setHistory],
        gameType: currentMatch.gameType || localStorage.getItem('gameType') || 'voleibol',
        date: now.toLocaleString(),
        timestamp: now.getTime(),
        duration: Math.round((now - currentMatch.startTime) / 1000 / 60) // Duración en minutos
    };
    
    matchHistory.unshift(matchData);
    
    // Mantener solo los últimos 20 partidos
    if (matchHistory.length > 20) {
        matchHistory = matchHistory.slice(0, 20);
    }
    
    renderMatchHistory();
    saveToCookies();
    
    alert("Partido guardado correctamente en el historial.");
}

function clearMatchHistory() {
    if (confirm("¿Estás seguro de que quieres borrar todo el historial de partidos?")) {
        matchHistory = [];
        renderMatchHistory();
        saveToCookies();
    }
}

function openTeamNameModal(team) {
    editingTeam = team;
    teamNameInput.value = currentMatch[team].name;
    teamNameModal.style.display = 'flex';
}

function closeTeamNameModal() {
    teamNameModal.style.display = 'none';
    editingTeam = null;
}

function saveTeamName() {
    if (editingTeam && teamNameInput.value.trim() !== '') {
        currentMatch[editingTeam].name = teamNameInput.value.trim();
        renderCurrentMatch();
        saveToCookies();
    }
    closeTeamNameModal();
}

// Funciones de renderizado
function renderCurrentMatch() {
    if (!team1NameEl) return;
    
    // Actualizar nombres
    team1NameEl.textContent = currentMatch.team1.name;
    team2NameEl.textContent = currentMatch.team2.name;
    
    // Actualizar puntuaciones
    team1ScoreEl.textContent = currentMatch.team1.score;
    team2ScoreEl.textContent = currentMatch.team2.score;
    
    // Actualizar sets
    renderSets(team1SetsEl, currentMatch.team1.sets);
    renderSets(team2SetsEl, currentMatch.team2.sets);
    
    // Actualizar información del set actual
    currentSetEl.textContent = currentMatch.currentSet;
    targetScoreEl.textContent = getTargetScore();
    
    // Actualizar el número total de sets
    if (totalSetsEl) {
        totalSetsEl.textContent = getMaxSets();
    }
}

function renderSets(container, setsWon) {
    if (!container) return;
    
    container.innerHTML = '';
    const maxSets = getMaxSets();
    
    for (let i = 0; i < maxSets; i++) {
        const setEl = document.createElement('div');
        setEl.className = 'set';
        if (i < setsWon) {
            setEl.classList.add('won');
        }
        setEl.textContent = i + 1;
        container.appendChild(setEl);
    }
}

function renderMatchHistory() {
    if (!historyListEl) return;
    
    historyListEl.innerHTML = '';
    
    if (matchHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-history';
        emptyMessage.innerHTML = '<i class="fas fa-clipboard-list fa-2x"></i><p>No hay partidos guardados. ¡Juega y guarda algunos partidos!</p>';
        historyListEl.appendChild(emptyMessage);
        return;
    }
    
    matchHistory.forEach((match, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const gameTypeBadge = document.createElement('span');
        gameTypeBadge.className = 'game-type-badge';
        gameTypeBadge.textContent = match.gameType === 'minivoley' ? 'Mini' : 'Voley';
        gameTypeBadge.style.backgroundColor = match.gameType === 'minivoley' ? 'var(--success-color)' : 'var(--primary-color)';
        gameTypeBadge.style.padding = '2px 8px';
        gameTypeBadge.style.borderRadius = '10px';
        gameTypeBadge.style.fontSize = '0.8rem';
        gameTypeBadge.style.marginRight = '10px';
        
        const teamsDiv = document.createElement('div');
        teamsDiv.className = 'history-teams';
        teamsDiv.appendChild(gameTypeBadge);
        teamsDiv.appendChild(document.createTextNode(`${match.team1.name} vs ${match.team2.name}`));
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'history-score';
        scoreDiv.textContent = `${match.team1.sets}-${match.team2.sets}`;
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'history-date';
        dateDiv.textContent = match.date;
        
        historyItem.appendChild(teamsDiv);
        historyItem.appendChild(scoreDiv);
        historyItem.appendChild(dateDiv);
        
        historyListEl.appendChild(historyItem);
    });
}

// Funciones para compartir
function generateShareText() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const gameType = currentMatch.gameType || localStorage.getItem('gameType') || 'voleibol';
    const gameName = gameType === 'minivoley' ? 'Minivoley' : 'Voleibol';
    const maxSets = getMaxSets();
    
    let text = `🏐 MARCADOR DE ${gameName.toUpperCase()} 🏐\n`;
    text += `📅 ${dateStr} 🕒 ${timeStr}\n\n`;
    text += `=== PARTIDO ACTUAL ===\n`;
    text += `${currentMatch.team1.name}: ${currentMatch.team1.score} puntos\n`;
    text += `${currentMatch.team2.name}: ${currentMatch.team2.score} puntos\n\n`;
    text += `Sets ganados:\n`;
    text += `${currentMatch.team1.name}: ${currentMatch.team1.sets}\n`;
    text += `${currentMatch.team2.name}: ${currentMatch.team2.sets}\n\n`;
    text += `Set actual: ${currentMatch.currentSet} de ${maxSets}\n`;
    text += `Puntos para ganar: ${getTargetScore()} (con diferencia de 2)\n\n`;
    
    if (currentMatch.setHistory.length > 0) {
        text += `=== HISTORIAL DE SETS ===\n`;
        currentMatch.setHistory.forEach(set => {
            text += `Set ${set.set}: ${set.team1}-${set.team2} (Ganador: ${set.winner})\n`;
        });
        text += `\n`;
    }
    
    text += `📱 Generado con Marcador de Voleibol\n`;
    text += `🌐 https://www.ligaescolar.es/voleibol/`;
    
    return text;
}

function openShareModal() {
    shareTextEl.textContent = generateShareText();
    shareModal.style.display = 'flex';
}

function closeShareModal() {
    shareModal.style.display = 'none';
}

function copyShareText() {
    const text = generateShareText();
    navigator.clipboard.writeText(text).then(() => {
        alert("Texto copiado al portapapeles. Puedes pegarlo en cualquier aplicación.");
    }).catch(err => {
        console.error('Error al copiar texto: ', err);
        alert("No se pudo copiar el texto. Intenta manualmente.");
    });
}

function shareViaNative() {
    const text = generateShareText();
    
    if (navigator.share) {
        navigator.share({
            title: 'Resultado de Voleibol',
            text: text,
            url: window.location.href
        }).then(() => {
            console.log('Contenido compartido exitosamente');
        }).catch((error) => {
            console.log('Error al compartir:', error);
        });
    } else {
        // Fallback para navegadores que no soportan la Web Share API
        copyShareText();
    }
}

function shareToWhatsapp() {
    const text = generateShareText();
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    // Intentar abrir WhatsApp Web o la app
    window.open(whatsappUrl, '_blank');
}

// Funciones de almacenamiento con cookies
function saveToCookies() {
    const data = {
        currentMatch: currentMatch,
        matchHistory: matchHistory
    };
    
    const jsonData = JSON.stringify(data);
    const expirationDays = 30;
    const date = new Date();
    date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    
    document.cookie = `volleyballScoreboard=${encodeURIComponent(jsonData)}; ${expires}; path=/`;
}

function loadFromCookies() {
    const cookies = document.cookie.split(';');
    let volleyballScoreboardCookie = null;
    
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'volleyballScoreboard') {
            volleyballScoreboardCookie = value;
            break;
        }
    }
    
    if (volleyballScoreboardCookie) {
        try {
            const data = JSON.parse(decodeURIComponent(volleyballScoreboardCookie));
            currentMatch = data.currentMatch || currentMatch;
            matchHistory = data.matchHistory || matchHistory;
        } catch (e) {
            console.error('Error al cargar datos de cookies:', e);
        }
    }
    
    // Asegurarse de que el tipo de juego esté actualizado
    const gameType = localStorage.getItem('gameType') || 'voleibol';
    currentMatch.gameType = gameType;
    currentMatch.maxSets = getMaxSets();
}

// Inicialización para scoreboard.html
function initScoreboard() {
    // Iniciar reloj
    updateClock();
    setInterval(updateClock, 1000);
    
    // Cargar datos guardados
    loadFromCookies();
    
    // Configurar el tipo de juego
    const gameType = localStorage.getItem('gameType') || 'voleibol';
    currentMatch.gameType = gameType;
    currentMatch.maxSets = getMaxSets();
    
    renderCurrentMatch();
    renderMatchHistory();
    
    // Event listeners para los botones de puntuación
    team1AddBtn.addEventListener('click', () => updateScore('team1', 1));
    team1RemoveBtn.addEventListener('click', () => updateScore('team1', -1));
    team2AddBtn.addEventListener('click', () => updateScore('team2', 1));
    team2RemoveBtn.addEventListener('click', () => updateScore('team2', -1));
    
    // Event listeners para los nombres de equipos (edición)
    team1NameEl.addEventListener('click', () => openTeamNameModal('team1'));
    team2NameEl.addEventListener('click', () => openTeamNameModal('team2'));
    
    // Event listeners para los controles del partido
    newSetBtn.addEventListener('click', startNewSet);
    resetMatchBtn.addEventListener('click', resetCurrentMatch);
    saveMatchBtn.addEventListener('click', saveCurrentMatch);
    clearHistoryBtn.addEventListener('click', clearMatchHistory);
    
    // Event listeners para exportación y compartir
    shareWhatsappBtn.addEventListener('click', shareToWhatsapp);
    shareResultsBtn.addEventListener('click', openShareModal);
    
    // Event listeners para el modal de edición de nombres
    cancelEditBtn.addEventListener('click', closeTeamNameModal);
    saveNameBtn.addEventListener('click', saveTeamName);
    
    // Event listeners para el modal de compartir
    copyTextBtn.addEventListener('click', copyShareText);
    shareNativeBtn.addEventListener('click', shareViaNative);
    closeShareBtn.addEventListener('click', closeShareModal);
    
    // Event listener para volver al inicio
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
}

// Inicialización para index.html
function initHome() {
    // Iniciar reloj
    updateClock();
    setInterval(updateClock, 1000);
    
    // Cargar datos guardados
    loadFromCookies();
    renderMatchHistory();
    
    // Event listener para borrar historial
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearMatchHistory);
    }
}

// Inicialización principal
document.addEventListener('DOMContentLoaded', function() {
    // Detectar en qué página estamos
    const isScoreboardPage = document.getElementById('team1-score') !== null;
    const isHomePage = document.getElementById('start-volleyball') !== null;
    
    if (isScoreboardPage) {
        initScoreboardElements();
        initScoreboard();
    } else if (isHomePage) {
        initHomeElements();
        initHome();
    }
});
