// Variables globales para Minivoleibol
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
    maxSets: 3, // Cambiado a 3 sets para minivoleibol
    startTime: new Date(),
    // Para almacenar los puntos de cada set
    setHistory: [],
    winner: null,
    location: "No especificada"
};

let matchHistory = [];
let editingTeam = null;
let savingMatchAfterWin = false;

// Variables para controlar el estado del set
let setWonInProgress = false;
let matchWonInProgress = false;

// Elementos DOM
const team1NameEl = document.getElementById('team1-name');
const team1ScoreEl = document.getElementById('team1-score');
const team1SetsEl = document.getElementById('team1-sets');
const team1AddBtn = document.getElementById('team1-add');
const team1RemoveBtn = document.getElementById('team1-remove');

const team2NameEl = document.getElementById('team2-name');
const team2ScoreEl = document.getElementById('team2-score');
const team2SetsEl = document.getElementById('team2-sets');
const team2AddBtn = document.getElementById('team2-add');
const team2RemoveBtn = document.getElementById('team2-remove');

const newSetBtn = document.getElementById('new-set');
const resetMatchBtn = document.getElementById('reset-match');
const saveMatchBtn = document.getElementById('save-match');
const clearHistoryBtn = document.getElementById('clear-history');
const shareWhatsappBtn = document.getElementById('share-whatsapp');
const shareResultsBtn = document.getElementById('share-results');

const historyListEl = document.getElementById('history-list');
const currentSetEl = document.getElementById('current-set');
const targetScoreEl = document.getElementById('target-score');
const maxSetsEl = document.getElementById('max-sets');
const currentLocationEl = document.getElementById('current-location');
const matchLocationInput = document.getElementById('match-location-input');
const saveLocationBtn = document.getElementById('save-location');

const teamNameModal = document.getElementById('team-name-modal');
const teamNameInput = document.getElementById('team-name-input');
const cancelEditBtn = document.getElementById('cancel-edit');
const saveNameBtn = document.getElementById('save-name');

const saveMatchModal = document.getElementById('save-match-modal');
const saveMatchResultEl = document.getElementById('save-match-result');
const saveMatchLocationEl = document.getElementById('save-match-location');
const cancelSaveBtn = document.getElementById('cancel-save');
const confirmSaveBtn = document.getElementById('confirm-save');

const shareModal = document.getElementById('share-modal');
const shareTextEl = document.getElementById('share-text');
const copyTextBtn = document.getElementById('copy-text');
const shareNativeBtn = document.getElementById('share-native');
const closeShareBtn = document.getElementById('close-share');

const notificationEl = document.getElementById('notification');
const notificationTextEl = document.getElementById('notification-text');

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    notificationTextEl.textContent = message;
    notificationEl.className = `notification ${type}`;
    notificationEl.style.display = 'flex';
    
    setTimeout(() => {
        notificationEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notificationEl.style.display = 'none';
            notificationEl.style.animation = '';
        }, 300);
    }, 3000);
}

// Función para obtener el puntaje objetivo (25 puntos para todos los sets en minivoleibol)
function getTargetScore() {
    // En minivoleibol, todos los sets son a 25 puntos
    return 25;
}

// Funciones para manejar el estado de los botones
function disableScoreButtons() {
    team1AddBtn.disabled = true;
    team1RemoveBtn.disabled = true;
    team2AddBtn.disabled = true;
    team2RemoveBtn.disabled = true;
    
    // Añadir clase visual para indicar deshabilitado
    team1AddBtn.classList.add('disabled');
    team1RemoveBtn.classList.add('disabled');
    team2AddBtn.classList.add('disabled');
    team2RemoveBtn.classList.add('disabled');
}

function enableScoreButtons() {
    team1AddBtn.disabled = false;
    team1RemoveBtn.disabled = false;
    team2AddBtn.disabled = false;
    team2RemoveBtn.disabled = false;
    
    // Remover clase visual
    team1AddBtn.classList.remove('disabled');
    team1RemoveBtn.classList.remove('disabled');
    team2AddBtn.classList.remove('disabled');
    team2RemoveBtn.classList.remove('disabled');
}

// Función para verificar si se ha ganado el set
function checkSetWin() {
    // Si ya estamos procesando una victoria en el set, no hacer nada
    if (setWonInProgress || matchWonInProgress) {
        return false;
    }
    
    const targetScore = getTargetScore();
    const score1 = currentMatch.team1.score;
    const score2 = currentMatch.team2.score;
    
    // Verificar si algún equipo alcanzó el puntaje objetivo con diferencia de 2
    const team1Wins = score1 >= targetScore && score1 - score2 >= 2;
    const team2Wins = score2 >= targetScore && score2 - score1 >= 2;
    
    if (team1Wins || team2Wins) {
        setWonInProgress = true;
        
        // Determinar ganador del set
        if (team1Wins) {
            currentMatch.team1.sets++;
            
            // Guardar resultado del set
            currentMatch.setHistory.push({
                set: currentMatch.currentSet,
                team1: score1,
                team2: score2,
                winner: currentMatch.team1.name
            });
            
            showNotification(`${currentMatch.team1.name} gana el set ${currentMatch.currentSet} (${score1}-${score2})`);
        } else {
            currentMatch.team2.sets++;
            
            // Guardar resultado del set
            currentMatch.setHistory.push({
                set: currentMatch.currentSet,
                team1: score1,
                team2: score2,
                winner: currentMatch.team2.name
            });
            
            showNotification(`${currentMatch.team2.name} gana el set ${currentMatch.currentSet} (${score1}-${score2})`);
        }
        
        // Verificar si se ha completado el partido (todos los sets jugados)
        setTimeout(() => {
            checkMatchCompletion();
            setWonInProgress = false;
        }, 100);
        
        return true;
    }
    
    return false;
}

// Función para verificar si se ha completado el partido (todos los sets jugados)
function checkMatchCompletion() {
    // En minivoleibol, se juegan los 3 sets siempre
    if (currentMatch.currentSet === currentMatch.maxSets) {
        // Último set completado, determinar ganador del partido
        matchWonInProgress = true;
        
        // Determinar ganador del partido (mejor de 3)
        let winner;
        let winnerMessage;
        
        if (currentMatch.team1.sets > currentMatch.team2.sets) {
            winner = currentMatch.team1.name;
            currentMatch.winner = 'team1';
            winnerMessage = `${winner} ha ganado el partido ${currentMatch.team1.sets}-${currentMatch.team2.sets}`;
        } else if (currentMatch.team2.sets > currentMatch.team1.sets) {
            winner = currentMatch.team2.name;
            currentMatch.winner = 'team2';
            winnerMessage = `${winner} ha ganado el partido ${currentMatch.team2.sets}-${currentMatch.team1.sets}`;
        } else {
            // Empate (1-1-1 o 2-1 pero con diferencia de sets)
            winner = "Empate";
            currentMatch.winner = 'draw';
            winnerMessage = `¡Empate! ${currentMatch.team1.name} ${currentMatch.team1.sets}-${currentMatch.team2.sets} ${currentMatch.team2.name}`;
        }
        
        // Bloquear todos los botones de puntuación
        disableScoreButtons();
        
        // Mostrar mensaje de finalización del partido
        showNotification(`${winnerMessage} (Partido completado)`, 'success');
        
        // Mostrar celebración solo si hay un ganador (no empate)
        if (currentMatch.winner !== 'draw' && typeof showCelebration === 'function') {
            showCelebration();
        }
        
        // Preparar para guardar el partido automáticamente después de un breve retraso
        setTimeout(() => {
            savingMatchAfterWin = true;
            openSaveMatchModal();
            matchWonInProgress = false;
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos guardados
    loadFromCookies();
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
    newSetBtn.addEventListener('click', () => {
        if (currentMatch.team1.score === 0 && currentMatch.team2.score === 0) {
            showNotification("No hay puntos en el set actual. Agrega puntos antes de comenzar un nuevo set.", "warning");
        } else {
            // En minivoleibol, permitir avanzar manualmente solo si no es el último set
            if (currentMatch.currentSet < currentMatch.maxSets) {
                // Forzar el fin del set actual y guardar resultado
                forceEndCurrentSet();
            } else {
                showNotification("Ya se han jugado todos los sets del partido.", "warning");
            }
        }
    });
    
    resetMatchBtn.addEventListener('click', resetCurrentMatch);
    saveMatchBtn.addEventListener('click', () => {
        if (currentMatch.setHistory.length === 0 && currentMatch.team1.score === 0 && currentMatch.team2.score === 0) {
            showNotification("No hay sets completados ni puntos para guardar.", "warning");
        } else {
            openSaveMatchModal();
        }
    });
    
    clearHistoryBtn.addEventListener('click', clearMatchHistory);
    
    // Event listener para guardar ubicación
    saveLocationBtn.addEventListener('click', saveLocation);
    matchLocationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveLocation();
        }
    });
    
    // Event listeners para exportación y compartir
    shareWhatsappBtn.addEventListener('click', shareToWhatsapp);
    shareResultsBtn.addEventListener('click', openShareModal);
    
    // Event listeners para el modal de edición de nombres
    cancelEditBtn.addEventListener('click', closeTeamNameModal);
    saveNameBtn.addEventListener('click', saveTeamName);
    
    // Event listeners para el modal de guardar partido
    cancelSaveBtn.addEventListener('click', closeSaveMatchModal);
    confirmSaveBtn.addEventListener('click', saveCurrentMatch);
    
    // Event listeners para el modal de compartir
    copyTextBtn.addEventListener('click', copyShareText);
    shareNativeBtn.addEventListener('click', shareViaNative);
    closeShareBtn.addEventListener('click', closeShareModal);
});

// Función para forzar el fin del set actual (para botón "Nuevo Set")
function forceEndCurrentSet() {
    const score1 = currentMatch.team1.score;
    const score2 = currentMatch.team2.score;
    
    // Determinar ganador del set basado en el puntaje actual
    let setWinner;
    if (score1 > score2) {
        currentMatch.team1.sets++;
        setWinner = currentMatch.team1.name;
    } else if (score2 > score1) {
        currentMatch.team2.sets++;
        setWinner = currentMatch.team2.name;
    } else {
        // Empate en puntos
        setWinner = "Ninguno (empate)";
    }
    
    // Guardar resultado del set
    currentMatch.setHistory.push({
        set: currentMatch.currentSet,
        team1: score1,
        team2: score2,
        winner: setWinner
    });
    
    showNotification(`Set ${currentMatch.currentSet} finalizado: ${score1}-${score2} (Ganador: ${setWinner})`);
    
    // Verificar si se ha completado el partido
    setTimeout(() => {
        checkMatchCompletion();
    }, 100);
}

// Funciones principales
function updateScore(team, change) {
    // Solo permitir actualizar si no estamos procesando una victoria
    if (setWonInProgress || matchWonInProgress || currentMatch.winner) {
        return;
    }
    
    // Aplicar el cambio
    currentMatch[team].score += change;
    
    // Asegurarse de que el marcador no sea negativo
    if (currentMatch[team].score < 0) {
        currentMatch[team].score = 0;
    }
    
    // Verificar si se ganó el set después de actualizar el puntaje
    const setWon = checkSetWin();
    
    // Si se ganó el set, bloquear botones temporalmente
    if (setWon) {
        disableScoreButtons();
    }
    
    // Renderizar normalmente
    renderCurrentMatch();
    saveToCookies();
}

function startNewSet() {
    // Solo avanzar al siguiente set si no hemos alcanzado el máximo
    if (currentMatch.currentSet < currentMatch.maxSets) {
        currentMatch.currentSet++;
        currentMatch.team1.score = 0;
        currentMatch.team2.score = 0;
        renderCurrentMatch();
        saveToCookies();
        
        // Reactivar botones para el nuevo set
        enableScoreButtons();
        
        showNotification(`Comienza el set ${currentMatch.currentSet} (Último: ${currentMatch.maxSets})`);
    }
}

function resetCurrentMatch() {
    // Verificar si hay datos que perder
    if (currentMatch.team1.score > 0 || currentMatch.team2.score > 0 || currentMatch.setHistory.length > 0) {
        if (confirm("¿Estás seguro de que quieres reiniciar el partido? Se perderá el progreso actual.")) {
            performReset();
        }
    } else {
        performReset();
    }
}

function performReset() {
    currentMatch.team1.score = 0;
    currentMatch.team2.score = 0;
    currentMatch.team1.sets = 0;
    currentMatch.team2.sets = 0;
    currentMatch.currentSet = 1;
    currentMatch.startTime = new Date();
    currentMatch.setHistory = [];
    currentMatch.winner = null;
    setWonInProgress = false;
    matchWonInProgress = false;
    
    // Reactivar todos los botones
    enableScoreButtons();
    
    renderCurrentMatch();
    saveToCookies();
    showNotification("Partido reiniciado correctamente");
}

function saveLocation() {
    const location = matchLocationInput.value.trim();
    if (location) {
        currentMatch.location = location;
        currentLocationEl.textContent = location;
        saveToCookies();
        showNotification(`Ubicación guardada: ${location}`);
        matchLocationInput.value = '';
    } else {
        showNotification("Por favor, ingresa una ubicación válida", "warning");
    }
}

function openSaveMatchModal() {
    // Mostrar el resultado en el modal
    saveMatchResultEl.textContent = `${currentMatch.team1.name} ${currentMatch.team1.sets} - ${currentMatch.team2.sets} ${currentMatch.team2.name}`;
    
    // Mostrar la ubicación
    saveMatchLocationEl.textContent = currentMatch.location;
    
    // Si se completó el partido, forzar guardado y ocultar botón cancelar
    if (savingMatchAfterWin) {
        cancelSaveBtn.style.display = 'none';
        // Mostrar mensaje explicativo
        const message = document.createElement('p');
        message.textContent = "Partido finalizado. Debes guardar para continuar.";
        message.style.color = '#4CAF50';
        message.style.marginTop = '10px';
        message.style.fontWeight = 'bold';
        
        // Asegurarse de que no se añada múltiples veces
        if (!document.querySelector('.force-save-message')) {
            message.className = 'force-save-message';
            saveMatchModal.querySelector('.modal-content').appendChild(message);
        }
    } else {
        cancelSaveBtn.style.display = 'block';
        // Remover mensaje si existe
        const existingMessage = document.querySelector('.force-save-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }
    
    // Mostrar el modal
    saveMatchModal.style.display = 'flex';
}

function closeSaveMatchModal() {
    // Si se completó el partido, no permitir cerrar el modal sin guardar
    if (savingMatchAfterWin) {
        showNotification("Debes guardar el partido para continuar.", "warning");
        return;
    }
    
    saveMatchModal.style.display = 'none';
    savingMatchAfterWin = false;
}

function saveCurrentMatch() {
    const now = new Date();
    const matchData = {
        team1: {...currentMatch.team1},
        team2: {...currentMatch.team2},
        currentSet: currentMatch.currentSet,
        setHistory: [...currentMatch.setHistory],
        winner: currentMatch.winner,
        location: currentMatch.location,
        date: now.toLocaleString(),
        timestamp: now.getTime(),
        duration: Math.round((now - currentMatch.startTime) / 1000 / 60), // Duración en minutos
        sport: "minivoleibol"
    };
    
    matchHistory.unshift(matchData);
    
    // Mantener solo los últimos 20 partidos
    if (matchHistory.length > 20) {
        matchHistory = matchHistory.slice(0, 20);
    }
    
    renderMatchHistory();
    saveToCookies();
    
    // Cerrar el modal
    saveMatchModal.style.display = 'none';
    
    // Restaurar botón cancelar
    cancelSaveBtn.style.display = 'block';
    
    // Remover mensaje si existe
    const existingMessage = document.querySelector('.force-save-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Mostrar notificación
    showNotification("Partido guardado correctamente en el historial");
    
    // Si se estaba guardando después de completar el partido, reiniciar
    if (savingMatchAfterWin) {
        setTimeout(() => {
            performReset();
            savingMatchAfterWin = false;
        }, 500);
    }
}

function clearMatchHistory() {
    if (confirm("¿Estás seguro de que quieres borrar todo el historial de partidos de minivoleibol?")) {
        matchHistory = [];
        renderMatchHistory();
        saveToCookies();
        showNotification("Historial de partidos borrado correctamente");
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
        showNotification(`Nombre cambiado a: ${currentMatch[editingTeam].name}`);
    }
    closeTeamNameModal();
}

// Funciones de renderizado
function renderCurrentMatch() {
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
    maxSetsEl.textContent = currentMatch.maxSets;
    targetScoreEl.textContent = getTargetScore();
    
    // Actualizar ubicación
    currentLocationEl.textContent = currentMatch.location;
}

function renderSets(container, setsWon) {
    container.innerHTML = '';
    for (let i = 0; i < currentMatch.maxSets; i++) {
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
            <div class="history-sport"><i class="fas fa-volleyball-ball"></i> Minivoleibol</div>
        `;
        
        historyItem.appendChild(teamsDiv);
        historyItem.appendChild(scoreDiv);
        historyItem.appendChild(infoDiv);
        
        historyListEl.appendChild(historyItem);
    });
}

// Funciones para compartir
function generateShareText() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    
    let text = `🏐 MARCADOR DE MINIVOLEIBOL 🏐\n`;
    text += `📅 ${dateStr} 🕒 ${timeStr}\n\n`;
    text += `=== PARTIDO ACTUAL ===\n`;
    text += `${currentMatch.team1.name}: ${currentMatch.team1.score} puntos\n`;
    text += `${currentMatch.team2.name}: ${currentMatch.team2.score} puntos\n\n`;
    text += `Sets ganados (de 3):\n`;
    text += `${currentMatch.team1.name}: ${currentMatch.team1.sets}\n`;
    text += `${currentMatch.team2.name}: ${currentMatch.team2.sets}\n\n`;
    text += `Set actual: ${currentMatch.currentSet} de ${currentMatch.maxSets}\n`;
    text += `Puntos para ganar: ${getTargetScore()} (con diferencia de 2)\n`;
    text += `Reglas: Mejor de 3 sets (todos se juegan)\n\n`;
    text += `📍 Ubicación: ${currentMatch.location}\n\n`;
    
    if (currentMatch.setHistory.length > 0) {
        text += `=== HISTORIAL DE SETS ===\n`;
        currentMatch.setHistory.forEach(set => {
            text += `Set ${set.set}: ${set.team1}-${set.team2} (Ganador: ${set.winner})\n`;
        });
        text += `\n`;
    }
    
    if (currentMatch.winner) {
        text += `=== RESULTADO FINAL ===\n`;
        if (currentMatch.winner === 'draw') {
            text += `¡EMPATE! ${currentMatch.team1.sets}-${currentMatch.team2.sets}\n`;
        } else {
            const winnerName = currentMatch.winner === 'team1' ? currentMatch.team1.name : currentMatch.team2.name;
            text += `GANADOR: ${winnerName} (${currentMatch.team1.sets}-${currentMatch.team2.sets})\n`;
        }
        text += `\n`;
    }
    
    if (matchHistory.length > 0) {
        text += `=== ÚLTIMOS PARTIDOS (MINIVOLEIBOL) ===\n`;
        const recentMatches = matchHistory.slice(0, 3);
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
    text += `\n🔗 Más info: https://www.ligaescolar.es/minivoley/`;
    
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
        showNotification("Texto copiado al portapapeles. Puedes pegarlo en cualquier aplicación.");
    }).catch(err => {
        console.error('Error al copiar texto: ', err);
        showNotification("No se pudo copiar el texto. Intenta manualmente.", "error");
    });
}

function shareViaNative() {
    const text = generateShareText();
    
    if (navigator.share) {
        navigator.share({
            title: 'Resultado de Minivoleibol - Liga Escolar',
            text: text,
            url: 'https://www.ligaescolar.es/minivoley/'
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
    
    document.cookie = `minivoleyScoreboard=${encodeURIComponent(jsonData)}; ${expires}; path=/`;
}

function loadFromCookies() {
    const cookies = document.cookie.split(';');
    let minivoleyScoreboardCookie = null;
    
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'minivoleyScoreboard') {
            minivoleyScoreboardCookie = value;
            break;
        }
    }
    
    if (minivoleyScoreboardCookie) {
        try {
            const data = JSON.parse(decodeURIComponent(minivoleyScoreboardCookie));
            currentMatch = data.currentMatch || currentMatch;
            matchHistory = data.matchHistory || matchHistory;
        } catch (e) {
            console.error('Error al cargar datos de cookies:', e);
        }
    }
}
