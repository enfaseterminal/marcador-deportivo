// Variables globales para el voleibol
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
    config: {
        totalSets: 5,
        setsToWin: 3,
        alwaysPlayAllSets: false
    }
};

let matchHistory = [];
let editingTeam = null;
let isProcessingSet = false; // Bandera para evitar procesamientos múltiples

// Configuración de sets
const SETS_CONFIG = {
    3: {
        setsToWin: 2,
        alwaysPlayAllSets: true,
        description: "Liga Infantil (3 sets, siempre se juegan todos)"
    },
    5: {
        setsToWin: 3,
        alwaysPlayAllSets: false,
        description: "Competitivo (5 sets, gana al conseguir 3)"
    }
};

// Inicialización del marcador de voleibol
function initVolleyballScoreboard() {
    // Elementos DOM específicos del voleibol
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
    const totalSetsEl = document.getElementById('total-sets');
    const setsSelectEl = document.getElementById('sets-select');
    const ligaLinkEl = document.getElementById('liga-link');

    const teamNameModal = document.getElementById('team-name-modal');
    const teamNameInput = document.getElementById('team-name-input');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveNameBtn = document.getElementById('save-name');

    const shareModal = document.getElementById('share-modal');
    const shareTextEl = document.getElementById('share-text');
    const copyTextBtn = document.getElementById('copy-text');
    const shareNativeBtn = document.getElementById('share-native');
    const closeShareBtn = document.getElementById('close-share');

    // Función para obtener el puntaje objetivo según el set actual y configuración
    function getTargetScore() {
        if (currentMatch.config.totalSets === 3) {
            return currentMatch.currentSet <= 2 ? 25 : 15;
        } else {
            return currentMatch.currentSet <= 4 ? 25 : 15;
        }
    }

    // Función para cambiar la configuración de sets
    function updateSetsConfig(totalSets) {
        const config = SETS_CONFIG[totalSets];
        
        currentMatch.config.totalSets = parseInt(totalSets);
        currentMatch.config.setsToWin = config.setsToWin;
        currentMatch.config.alwaysPlayAllSets = config.alwaysPlayAllSets;
        currentMatch.maxSets = parseInt(totalSets);
        
        if (currentMatch.team1.sets > currentMatch.maxSets) {
            currentMatch.team1.sets = currentMatch.maxSets;
        }
        if (currentMatch.team2.sets > currentMatch.maxSets) {
            currentMatch.team2.sets = currentMatch.maxSets;
        }
        
        if (totalSetsEl) totalSetsEl.textContent = currentMatch.maxSets;
        renderCurrentMatch();
        saveToCookies();
    }

    // Función para verificar si se ha ganado el set (CORREGIDA)
    function checkSetWin() {
        if (isProcessingSet) return false;
        
        const targetScore = getTargetScore();
        const score1 = currentMatch.team1.score;
        const score2 = currentMatch.team2.score;
        
        let setWon = false;
        let winnerTeam = null;
        
        if (score1 >= targetScore && score1 - score2 >= 2) {
            setWon = true;
            winnerTeam = 'team1';
        } else if (score2 >= targetScore && score2 - score1 >= 2) {
            setWon = true;
            winnerTeam = 'team2';
        }
        
        if (setWon) {
            isProcessingSet = true;
            
            // Incrementar set del equipo ganador
            currentMatch[winnerTeam].sets++;
            
            // Guardar resultado del set
            currentMatch.setHistory.push({
                set: currentMatch.currentSet,
                team1: score1,
                team2: score2,
                winner: currentMatch[winnerTeam].name,
                targetScore: targetScore
            });
            
            // Verificar si se ganó el partido
            const matchWon = checkMatchWin();
            
            if (!matchWon) {
                // Si no se ganó el partido, pasar al siguiente set después de un breve retraso
                setTimeout(() => {
                    currentMatch.currentSet++;
                    currentMatch.team1.score = 0;
                    currentMatch.team2.score = 0;
                    isProcessingSet = false;
                    renderCurrentMatch();
                    saveToCookies();
                }, 1500);
            }
            
            return true;
        }
        
        return false;
    }

    // Función para verificar si se ha ganado el partido (CORREGIDA)
    function checkMatchWin() {
        if (currentMatch.config.alwaysPlayAllSets) {
            // Para 3 sets: se juegan todos los sets siempre
            if (currentMatch.currentSet >= currentMatch.maxSets) {
                let winner;
                
                if (currentMatch.team1.sets > currentMatch.team2.sets) {
                    winner = currentMatch.team1.name;
                } else if (currentMatch.team2.sets > currentMatch.team1.sets) {
                    winner = currentMatch.team2.name;
                } else {
                    winner = "Empate";
                }
                
                setTimeout(() => {
                    if (winner !== "Empate") {
                        alert(`¡${winner} ha ganado el partido! \n\nResultado final: ${currentMatch.team1.sets} - ${currentMatch.team2.sets}`);
                    } else {
                        alert(`¡Empate! \n\nResultado final: ${currentMatch.team1.sets} - ${currentMatch.team2.sets}`);
                    }
                    
                    saveCurrentMatch();
                    resetCurrentMatch();
                }, 1000);
                
                return true;
            }
            return false;
        } else {
            // Para 5 sets: gana al conseguir 3 sets
            const setsToWin = currentMatch.config.setsToWin;
            
            if (currentMatch.team1.sets >= setsToWin || currentMatch.team2.sets >= setsToWin) {
                let winner;
                
                if (currentMatch.team1.sets > currentMatch.team2.sets) {
                    winner = currentMatch.team1.name;
                } else {
                    winner = currentMatch.team2.name;
                }
                
                setTimeout(() => {
                    alert(`¡${winner} ha ganado el partido! \n\nResultado final: ${currentMatch.team1.sets} - ${currentMatch.team2.sets}`);
                    
                    saveCurrentMatch();
                    resetCurrentMatch();
                }, 1000);
                
                return true;
            }
            return false;
        }
    }

    // Función principal para actualizar puntuación (CORREGIDA)
    function updateScore(team, change) {
        // Si ya se está procesando un set, ignorar nuevos puntos
        if (isProcessingSet) return;
        
        currentMatch[team].score += change;
        
        if (currentMatch[team].score < 0) {
            currentMatch[team].score = 0;
        }
        
        const setWon = checkSetWin();
        
        if (!setWon) {
            renderCurrentMatch();
            saveToCookies();
        }
    }

    function startNewSet() {
        // Si ya se está procesando un set, no hacer nada
        if (isProcessingSet) return;
        
        if (currentMatch.currentSet >= currentMatch.maxSets && currentMatch.config.alwaysPlayAllSets) {
            alert("Ya se están jugando todos los sets de la liga infantil.");
            return;
        }
        
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
                alert("El set está empatado. No se puede asignar a ningún equipo.");
                return;
            }
            
            currentMatch.setHistory.push({
                set: currentMatch.currentSet,
                team1: currentMatch.team1.score,
                team2: currentMatch.team2.score,
                winner: currentMatch.team1.score > currentMatch.team2.score ? currentMatch.team1.name : currentMatch.team2.name,
                targetScore: getTargetScore(),
                forced: true
            });
            
            // Verificar si con este set se ganó el partido
            if (!checkMatchWin()) {
                currentMatch.currentSet++;
                currentMatch.team1.score = 0;
                currentMatch.team2.score = 0;
                renderCurrentMatch();
                saveToCookies();
            }
        } else {
            if (currentMatch.currentSet < currentMatch.maxSets) {
                currentMatch.currentSet++;
                renderCurrentMatch();
                saveToCookies();
            } else {
                alert("Ya se está jugando el último set.");
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
            isProcessingSet = false;
            renderCurrentMatch();
            saveToCookies();
        }
    }

    function saveCurrentMatch() {
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
            config: {...currentMatch.config},
            date: now.toLocaleString(),
            timestamp: now.getTime(),
            duration: Math.round((now - currentMatch.startTime) / 1000 / 60)
        };
        
        matchHistory.unshift(matchData);
        
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
        if (team1NameEl) team1NameEl.textContent = currentMatch.team1.name;
        if (team2NameEl) team2NameEl.textContent = currentMatch.team2.name;
        
        if (team1ScoreEl) team1ScoreEl.textContent = currentMatch.team1.score;
        if (team2ScoreEl) team2ScoreEl.textContent = currentMatch.team2.score;
        
        renderSets(team1SetsEl, currentMatch.team1.sets);
        renderSets(team2SetsEl, currentMatch.team2.sets);
        
        if (currentSetEl) currentSetEl.textContent = currentMatch.currentSet;
        if (totalSetsEl) totalSetsEl.textContent = currentMatch.maxSets;
        if (targetScoreEl) targetScoreEl.textContent = getTargetScore();
    }

    function renderSets(container, setsWon) {
        if (!container) return;
        
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
            
            const teamsDiv = document.createElement('div');
            teamsDiv.className = 'history-teams';
            teamsDiv.textContent = `${match.team1.name} vs ${match.team2.name}`;
            
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'history-score';
            scoreDiv.textContent = `${match.team1.sets}-${match.team2.sets}`;
            
            const dateDiv = document.createElement('div');
            dateDiv.className = 'history-date';
            dateDiv.textContent = match.date;
            
            const typeDiv = document.createElement('div');
            typeDiv.className = 'history-date';
            typeDiv.textContent = match.config.totalSets === 3 ? " (3 sets)" : " (5 sets)";
            typeDiv.style.marginLeft = '10px';
            typeDiv.style.fontStyle = 'italic';
            
            historyItem.appendChild(teamsDiv);
            historyItem.appendChild(scoreDiv);
            historyItem.appendChild(dateDiv);
            historyItem.appendChild(typeDiv);
            
            historyListEl.appendChild(historyItem);
        });
    }

    // Funciones para compartir
    function generateShareText() {
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        const tipoPartido = currentMatch.config.totalSets === 3 ? "Liga Infantil (3 sets)" : "Competitivo (5 sets)";
        const setsToWin = currentMatch.config.setsToWin;
        const ligaLink = ligaLinkEl ? ligaLinkEl.value : "https://www.ligaescolar.es/voleibol/";
        
        let text = `🏐 MARCADOR DE VOLEIBOL 🏐\n`;
        text += `📅 ${dateStr} 🕒 ${timeStr}\n`;
        text += `📊 ${tipoPartido} - Gana al conseguir ${setsToWin} sets\n\n`;
        text += `=== PARTIDO ACTUAL ===\n`;
        text += `${currentMatch.team1.name}: ${currentMatch.team1.score} puntos\n`;
        text += `${currentMatch.team2.name}: ${currentMatch.team2.score} puntos\n\n`;
        text += `Sets ganados:\n`;
        text += `${currentMatch.team1.name}: ${currentMatch.team1.sets}\n`;
        text += `${currentMatch.team2.name}: ${currentMatch.team2.sets}\n\n`;
        text += `Set actual: ${currentMatch.currentSet} de ${currentMatch.maxSets}\n`;
        text += `Puntos para ganar: ${getTargetScore()} (con diferencia de 2)\n\n`;
        
        if (currentMatch.setHistory.length > 0) {
            text += `=== HISTORIAL DE SETS ===\n`;
            currentMatch.setHistory.forEach(set => {
                text += `Set ${set.set}: ${set.team1}-${set.team2} (Ganador: ${set.winner})\n`;
            });
            text += `\n`;
        }
        
        if (matchHistory.length > 0) {
            text += `=== ÚLTIMOS PARTIDOS ===\n`;
            const recentMatches = matchHistory.slice(0, 3);
            recentMatches.forEach((match, index) => {
                const matchDate = new Date(match.timestamp).toLocaleDateString();
                const matchType = match.config.totalSets === 3 ? "3s" : "5s";
                text += `${index + 1}. ${match.team1.name} ${match.team1.sets}-${match.team2.sets} ${match.team2.name} (${matchDate}, ${matchType})\n`;
            });
        }
        
        text += `\n🏆 Generado con Marcador de Voleibol\n`;
        text += `🔗 Más información: ${ligaLink}\n`;
        text += `🌐 Web oficial: https://www.ligaescolar.es`;
        
        return text;
    }

    function openShareModal() {
        if (shareTextEl) {
            shareTextEl.textContent = generateShareText();
        }
        if (shareModal) {
            shareModal.style.display = 'flex';
        }
    }

    function closeShareModal() {
        if (shareModal) {
            shareModal.style.display = 'none';
        }
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
                title: 'Resultado de Voleibol - Liga Escolar',
                text: text,
                url: ligaLinkEl ? ligaLinkEl.value : window.location.href
            }).then(() => {
                console.log('Contenido compartido exitosamente');
            }).catch((error) => {
                console.log('Error al compartir:', error);
            });
        } else {
            copyShareText();
        }
    }

    function shareToWhatsapp() {
        const text = generateShareText();
        const encodedText = encodeURIComponent(text);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        
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
    }

    // Inicialización del DOM
    function initEventListeners() {
        // Event listeners para los botones de puntuación
        if (team1AddBtn) team1AddBtn.addEventListener('click', () => updateScore('team1', 1));
        if (team1RemoveBtn) team1RemoveBtn.addEventListener('click', () => updateScore('team1', -1));
        if (team2AddBtn) team2AddBtn.addEventListener('click', () => updateScore('team2', 1));
        if (team2RemoveBtn) team2RemoveBtn.addEventListener('click', () => updateScore('team2', -1));
        
        // Event listeners para los nombres de equipos (edición)
        if (team1NameEl) team1NameEl.addEventListener('click', () => openTeamNameModal('team1'));
        if (team2NameEl) team2NameEl.addEventListener('click', () => openTeamNameModal('team2'));
        
        // Event listeners para los controles del partido
        if (newSetBtn) newSetBtn.addEventListener('click', startNewSet);
        if (resetMatchBtn) resetMatchBtn.addEventListener('click', resetCurrentMatch);
        if (saveMatchBtn) saveMatchBtn.addEventListener('click', saveCurrentMatch);
        if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearMatchHistory);
        
        // Event listeners para compartir
        if (shareWhatsappBtn) shareWhatsappBtn.addEventListener('click', shareToWhatsapp);
        if (shareResultsBtn) shareResultsBtn.addEventListener('click', openShareModal);
        
        // Event listeners para el modal de edición de nombres
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeTeamNameModal);
        if (saveNameBtn) saveNameBtn.addEventListener('click', saveTeamName);
        
        // Event listeners para el modal de compartir
        if (copyTextBtn) copyTextBtn.addEventListener('click', copyShareText);
        if (shareNativeBtn) shareNativeBtn.addEventListener('click', shareViaNative);
        if (closeShareBtn) closeShareBtn.addEventListener('click', closeShareModal);
        
        // Configurar el selector de sets
        if (setsSelectEl) {
            setsSelectEl.value = currentMatch.config.totalSets.toString();
            setsSelectEl.addEventListener('change', function() {
                if (confirm("¿Cambiar el número de sets? Se reiniciará el partido actual.")) {
                    updateSetsConfig(this.value);
                    resetCurrentMatch();
                } else {
                    this.value = currentMatch.config.totalSets.toString();
                }
            });
        }
    }

    // Inicialización principal
    loadFromCookies();
    
    // Actualizar configuración inicial
    if (currentMatch.config.totalSets) {
        updateSetsConfig(currentMatch.config.totalSets.toString());
    }
    
    renderCurrentMatch();
    renderMatchHistory();
    
    // Inicializar event listeners
    initEventListeners();
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    initVolleyballScoreboard();
});
