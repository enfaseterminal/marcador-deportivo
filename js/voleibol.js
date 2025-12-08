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
let isProcessing = false; // Bandera para evitar procesamientos simultáneos

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
    // Elementos DOM
    const elements = {
        team1Name: document.getElementById('team1-name'),
        team1Score: document.getElementById('team1-score'),
        team1Sets: document.getElementById('team1-sets'),
        team1AddBtn: document.getElementById('team1-add'),
        team1RemoveBtn: document.getElementById('team1-remove'),
        
        team2Name: document.getElementById('team2-name'),
        team2Score: document.getElementById('team2-score'),
        team2Sets: document.getElementById('team2-sets'),
        team2AddBtn: document.getElementById('team2-add'),
        team2RemoveBtn: document.getElementById('team2-remove'),
        
        newSetBtn: document.getElementById('new-set'),
        resetMatchBtn: document.getElementById('reset-match'),
        saveMatchBtn: document.getElementById('save-match'),
        clearHistoryBtn: document.getElementById('clear-history'),
        shareWhatsappBtn: document.getElementById('share-whatsapp'),
        shareResultsBtn: document.getElementById('share-results'),
        
        historyList: document.getElementById('history-list'),
        currentSetEl: document.getElementById('current-set'),
        targetScoreEl: document.getElementById('target-score'),
        totalSetsEl: document.getElementById('total-sets'),
        setsSelectEl: document.getElementById('sets-select'),
        ligaLinkEl: document.getElementById('liga-link'),
        
        teamNameModal: document.getElementById('team-name-modal'),
        teamNameInput: document.getElementById('team-name-input'),
        cancelEditBtn: document.getElementById('cancel-edit'),
        saveNameBtn: document.getElementById('save-name'),
        
        shareModal: document.getElementById('share-modal'),
        shareTextEl: document.getElementById('share-text'),
        copyTextBtn: document.getElementById('copy-text'),
        shareNativeBtn: document.getElementById('share-native'),
        closeShareBtn: document.getElementById('close-share')
    };

    // Función para obtener el puntaje objetivo según el set actual
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
        
        if (elements.totalSetsEl) elements.totalSetsEl.textContent = currentMatch.maxSets;
        renderCurrentMatch();
        saveToCookies();
    }

    // Función para verificar si se ha ganado el set (SIMPLIFICADA)
    function checkSetWin() {
        const targetScore = getTargetScore();
        const score1 = currentMatch.team1.score;
        const score2 = currentMatch.team2.score;
        
        let setWon = false;
        let winner = null;
        
        if (score1 >= targetScore && score1 - score2 >= 2) {
            setWon = true;
            winner = 'team1';
        } else if (score2 >= targetScore && score2 - score1 >= 2) {
            setWon = true;
            winner = 'team2';
        }
        
        return { setWon, winner };
    }

    // Función para procesar la victoria de un set
    function processSetWin(winner) {
        if (isProcessing) return;
        isProcessing = true;
        
        // Incrementar set del equipo ganador
        currentMatch[winner].sets++;
        
        // Guardar resultado del set
        currentMatch.setHistory.push({
            set: currentMatch.currentSet,
            team1: currentMatch.team1.score,
            team2: currentMatch.team2.score,
            winner: currentMatch[winner].name,
            targetScore: getTargetScore()
        });
        
        renderCurrentMatch();
        saveToCookies();
        
        // Verificar si se ganó el partido
        const matchWon = checkMatchWin();
        
        if (!matchWon) {
            // Pasar al siguiente set después de un breve retraso
            setTimeout(() => {
                currentMatch.currentSet++;
                currentMatch.team1.score = 0;
                currentMatch.team2.score = 0;
                isProcessing = false;
                renderCurrentMatch();
                saveToCookies();
            }, 1500);
        } else {
            isProcessing = false;
        }
    }

    // Función para verificar si se ha ganado el partido (SIMPLIFICADA)
    function checkMatchWin() {
        let matchWon = false;
        
        if (currentMatch.config.alwaysPlayAllSets) {
            // Para 3 sets: se juegan todos los sets siempre
            if (currentMatch.currentSet >= currentMatch.maxSets) {
                matchWon = true;
            }
        } else {
            // Para 5 sets: gana al conseguir 3 sets
            const setsToWin = currentMatch.config.setsToWin;
            if (currentMatch.team1.sets >= setsToWin || currentMatch.team2.sets >= setsToWin) {
                matchWon = true;
            }
        }
        
        if (matchWon) {
            setTimeout(() => {
                let winner;
                if (currentMatch.team1.sets > currentMatch.team2.sets) {
                    winner = currentMatch.team1.name;
                } else if (currentMatch.team2.sets > currentMatch.team1.sets) {
                    winner = currentMatch.team2.name;
                } else {
                    winner = "Empate";
                }
                
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
    }

    // Función principal para actualizar puntuación (SIMPLIFICADA)
    function updateScore(team, change) {
        if (isProcessing) return;
        
        currentMatch[team].score += change;
        
        if (currentMatch[team].score < 0) {
            currentMatch[team].score = 0;
        }
        
        const setResult = checkSetWin();
        
        if (setResult.setWon) {
            processSetWin(setResult.winner);
        } else {
            renderCurrentMatch();
            saveToCookies();
        }
    }

    function startNewSet() {
        if (isProcessing) return;
        
        if (currentMatch.currentSet >= currentMatch.maxSets) {
            alert("Ya se está jugando el último set.");
            return;
        }
        
        if (currentMatch.team1.score > 0 || currentMatch.team2.score > 0) {
            if (!confirm("Hay puntos en juego. ¿Forzar fin del set actual y comenzar nuevo set?")) {
                return;
            }
            
            // Determinar ganador del set actual por puntaje
            let winner = null;
            if (currentMatch.team1.score > currentMatch.team2.score) {
                winner = 'team1';
            } else if (currentMatch.team2.score > currentMatch.team1.score) {
                winner = 'team2';
            } else {
                alert("El set está empatado. No se puede asignar a ningún equipo.");
                return;
            }
            
            currentMatch.setHistory.push({
                set: currentMatch.currentSet,
                team1: currentMatch.team1.score,
                team2: currentMatch.team2.score,
                winner: currentMatch[winner].name,
                targetScore: getTargetScore(),
                forced: true
            });
            
            currentMatch[winner].sets++;
            
            const matchWon = checkMatchWin();
            
            if (!matchWon) {
                currentMatch.currentSet++;
                currentMatch.team1.score = 0;
                currentMatch.team2.score = 0;
                renderCurrentMatch();
                saveToCookies();
            }
        } else {
            currentMatch.currentSet++;
            renderCurrentMatch();
            saveToCookies();
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
            isProcessing = false;
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
        elements.teamNameInput.value = currentMatch[team].name;
        elements.teamNameModal.style.display = 'flex';
    }

    function closeTeamNameModal() {
        elements.teamNameModal.style.display = 'none';
        editingTeam = null;
    }

    function saveTeamName() {
        if (editingTeam && elements.teamNameInput.value.trim() !== '') {
            currentMatch[editingTeam].name = elements.teamNameInput.value.trim();
            renderCurrentMatch();
            saveToCookies();
        }
        closeTeamNameModal();
    }

    // Funciones de renderizado
    function renderCurrentMatch() {
        if (elements.team1Name) elements.team1Name.textContent = currentMatch.team1.name;
        if (elements.team2Name) elements.team2Name.textContent = currentMatch.team2.name;
        
        if (elements.team1Score) elements.team1Score.textContent = currentMatch.team1.score;
        if (elements.team2Score) elements.team2Score.textContent = currentMatch.team2.score;
        
        renderSets(elements.team1Sets, currentMatch.team1.sets);
        renderSets(elements.team2Sets, currentMatch.team2.sets);
        
        if (elements.currentSetEl) elements.currentSetEl.textContent = currentMatch.currentSet;
        if (elements.totalSetsEl) elements.totalSetsEl.textContent = currentMatch.maxSets;
        if (elements.targetScoreEl) elements.targetScoreEl.textContent = getTargetScore();
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
        if (!elements.historyList) return;
        
        elements.historyList.innerHTML = '';
        
        if (matchHistory.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-history';
            emptyMessage.innerHTML = '<i class="fas fa-clipboard-list fa-2x"></i><p>No hay partidos guardados. ¡Juega y guarda algunos partidos!</p>';
            elements.historyList.appendChild(emptyMessage);
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
            
            elements.historyList.appendChild(historyItem);
        });
    }

    // Funciones para compartir
    function generateShareText() {
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        const tipoPartido = currentMatch.config.totalSets === 3 ? "Liga Infantil (3 sets)" : "Competitivo (5 sets)";
        const setsToWin = currentMatch.config.setsToWin;
        const ligaLink = elements.ligaLinkEl ? elements.ligaLinkEl.value : "https://www.ligaescolar.es/voleibol/";
        
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
        if (elements.shareTextEl) {
            elements.shareTextEl.textContent = generateShareText();
        }
        if (elements.shareModal) {
            elements.shareModal.style.display = 'flex';
        }
    }

    function closeShareModal() {
        if (elements.shareModal) {
            elements.shareModal.style.display = 'none';
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
                url: elements.ligaLinkEl ? elements.ligaLinkEl.value : window.location.href
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
        if (elements.team1AddBtn) elements.team1AddBtn.addEventListener('click', () => updateScore('team1', 1));
        if (elements.team1RemoveBtn) elements.team1RemoveBtn.addEventListener('click', () => updateScore('team1', -1));
        if (elements.team2AddBtn) elements.team2AddBtn.addEventListener('click', () => updateScore('team2', 1));
        if (elements.team2RemoveBtn) elements.team2RemoveBtn.addEventListener('click', () => updateScore('team2', -1));
        
        // Event listeners para los nombres de equipos (edición)
        if (elements.team1Name) elements.team1Name.addEventListener('click', () => openTeamNameModal('team1'));
        if (elements.team2Name) elements.team2Name.addEventListener('click', () => openTeamNameModal('team2'));
        
        // Event listeners para los controles del partido
        if (elements.newSetBtn) elements.newSetBtn.addEventListener('click', startNewSet);
        if (elements.resetMatchBtn) elements.resetMatchBtn.addEventListener('click', resetCurrentMatch);
        if (elements.saveMatchBtn) elements.saveMatchBtn.addEventListener('click', saveCurrentMatch);
        if (elements.clearHistoryBtn) elements.clearHistoryBtn.addEventListener('click', clearMatchHistory);
        
        // Event listeners para compartir
        if (elements.shareWhatsappBtn) elements.shareWhatsappBtn.addEventListener('click', shareToWhatsapp);
        if (elements.shareResultsBtn) elements.shareResultsBtn.addEventListener('click', openShareModal);
        
        // Event listeners para el modal de edición de nombres
        if (elements.cancelEditBtn) elements.cancelEditBtn.addEventListener('click', closeTeamNameModal);
        if (elements.saveNameBtn) elements.saveNameBtn.addEventListener('click', saveTeamName);
        
        // Event listeners para el modal de compartir
        if (elements.copyTextBtn) elements.copyTextBtn.addEventListener('click', copyShareText);
        if (elements.shareNativeBtn) elements.shareNativeBtn.addEventListener('click', shareViaNative);
        if (elements.closeShareBtn) elements.closeShareBtn.addEventListener('click', closeShareModal);
        
        // Configurar el selector de sets
        if (elements.setsSelectEl) {
            elements.setsSelectEl.value = currentMatch.config.totalSets.toString();
            elements.setsSelectEl.addEventListener('change', function() {
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
if (document.getElementById('team1-score')) {
    document.addEventListener('DOMContentLoaded', initVolleyballScoreboard);
}
