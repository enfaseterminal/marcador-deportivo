// Chinchón - Lógica del juego CORREGIDA CON BLOQUEO

class ChinchonGame {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.targetScore = 150;
        this.chinchonBonus = -20;
        this.roundHistory = [];
        this.savedMatches = [];
        this.gameStartTime = Date.now();
        this.editingPlayerIndex = null;
        this.gameStarted = false; // Nueva variable para controlar si la partida ha comenzado
        
        this.initElements();
        this.loadFromStorage();
        this.renderPlayers();
        this.updateUI();
        this.setupEventListeners();
        
        // Verificar si ya hay una partida en curso al cargar
        this.checkIfGameStarted();
        this.updateGameStatus();
    }

    initElements() {
        // Elementos de configuración
        this.playerCountSelect = document.getElementById('player-count');
        this.targetScoreSelect = document.getElementById('target-score');
        this.chinchonBonusSelect = document.getElementById('chinchon-bonus');
        
        // Botones de configuración
        this.applyPlayersBtn = document.getElementById('apply-players');
        this.applyTargetBtn = document.getElementById('apply-target');
        this.applyBonusBtn = document.getElementById('apply-bonus');
        
        // Contenedores
        this.playersContainer = document.getElementById('players-container');
        this.roundsBody = document.getElementById('rounds-body');
        this.savedMatchesContainer = document.getElementById('saved-matches');
        
        // Elementos de información
        this.currentRoundSpan = document.getElementById('current-round');
        this.displayTargetSpan = document.getElementById('display-target');
        this.currentLeaderSpan = document.getElementById('current-leader');
        this.gameDurationSpan = document.getElementById('game-duration');
        
        // Botones de acción
        this.newRoundBtn = document.getElementById('new-round');
        this.resetRoundBtn = document.getElementById('reset-round');
        this.resetGameBtn = document.getElementById('reset-game');
        this.saveGameBtn = document.getElementById('save-game');
        
        // Botones de compartir
        this.shareCurrentBtn = document.getElementById('share-current');
        this.shareHistoryBtn = document.getElementById('share-history');
        this.shareWhatsappBtn = document.getElementById('share-whatsapp');
        
        // Modales
        this.playerEditModal = document.getElementById('player-edit-modal');
        this.saveModal = document.getElementById('save-modal');
        this.shareModal = document.getElementById('share-modal');
        
        // Notificación
        this.notification = document.getElementById('notification');
    }

    checkIfGameStarted() {
        // Una partida se considera iniciada si:
        const hasRoundHistory = this.roundHistory.length > 0;
        const hasCurrentScores = this.players.some(p => p.roundScore > 0);
        const hasNonZeroTotal = this.players.some(p => p.totalScore > 0);
        
        if (hasRoundHistory || hasCurrentScores || hasNonZeroTotal) {
            this.gameStarted = true;
            this.lockConfiguration();
        }
    }

    lockConfiguration() {
        // Deshabilitar todos los controles de configuración
        this.playerCountSelect.disabled = true;
        this.targetScoreSelect.disabled = true;
        this.chinchonBonusSelect.disabled = true;
        this.applyPlayersBtn.disabled = true;
        this.applyTargetBtn.disabled = true;
        this.applyBonusBtn.disabled = true;
        
        // Cambiar estilos para indicar que están bloqueados
        const configControls = [
            this.playerCountSelect, this.targetScoreSelect, this.chinchonBonusSelect,
            this.applyPlayersBtn, this.applyTargetBtn, this.applyBonusBtn
        ];
        
        configControls.forEach(control => {
            if (control) {
                control.style.opacity = '0.6';
                control.style.cursor = 'not-allowed';
                control.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
        });
        
        // Añadir indicador visual
        const configSection = document.querySelector('.chinchon-config');
        if (configSection) {
            const existingLock = configSection.querySelector('.config-lock-indicator');
            if (!existingLock) {
                const lockIndicator = document.createElement('div');
                lockIndicator.className = 'config-lock-indicator';
                lockIndicator.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px; background: rgba(52, 152, 219, 0.2); border-radius: 6px; border-left: 4px solid #3498db;">
                        <i class="fas fa-lock" style="color: #3498db;"></i>
                        <span style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.8);">
                            Configuración bloqueada - La partida ha comenzado
                        </span>
                    </div>
                `;
                configSection.appendChild(lockIndicator);
            }
        }
        
        this.gameStarted = true;
        this.updateGameStatus();
    }

    unlockConfiguration() {
        // Habilitar todos los controles de configuración
        this.playerCountSelect.disabled = false;
        this.targetScoreSelect.disabled = false;
        this.chinchonBonusSelect.disabled = false;
        this.applyPlayersBtn.disabled = false;
        this.applyTargetBtn.disabled = false;
        this.applyBonusBtn.disabled = false;
        
        // Restaurar estilos
        const configControls = [
            this.playerCountSelect, this.targetScoreSelect, this.chinchonBonusSelect,
            this.applyPlayersBtn, this.applyTargetBtn, this.applyBonusBtn
        ];
        
        configControls.forEach(control => {
            if (control) {
                control.style.opacity = '1';
                control.style.cursor = 'pointer';
                control.style.backgroundColor = '';
            }
        });
        
        // Eliminar indicador de bloqueo
        const lockIndicator = document.querySelector('.config-lock-indicator');
        if (lockIndicator) {
            lockIndicator.remove();
        }
        
        this.gameStarted = false;
        this.updateGameStatus();
    }

    updateGameStatus() {
        const gameStatusInfo = document.getElementById('game-status-info');
        const gameStatusText = document.getElementById('game-status-text');
        
        if (!gameStatusInfo || !gameStatusText) return;
        
        if (this.gameStarted) {
            gameStatusInfo.style.display = 'block';
            gameStatusText.innerHTML = `
                <strong>Partida en curso:</strong> Ronda ${this.currentRound} - 
                Configuración bloqueada. Para cambiar ajustes, reinicia la partida.
            `;
            
            // Resaltar botón de reinicio
            const resetBtn = document.getElementById('reset-game');
            if (resetBtn) {
                resetBtn.classList.add('game-active');
            }
        } else {
            gameStatusInfo.style.display = 'none';
            
            const resetBtn = document.getElementById('reset-game');
            if (resetBtn) {
                resetBtn.classList.remove('game-active');
            }
        }
    }

    createDefaultPlayers(count) {
        this.players = [];
        const defaultNames = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'];
        
        for (let i = 0; i < count; i++) {
            this.players.push({
                id: i + 1,
                name: defaultNames[i] || `Jugador ${i + 1}`,
                totalScore: 0,
                roundScore: 0,
                roundsWon: 0,
                chinchons: 0,
                scores: [],
                hasChinchonCurrentRound: false
            });
        }
    }

    renderPlayers() {
        this.playersContainer.innerHTML = '';
        
        const sortedPlayers = [...this.players].sort((a, b) => a.totalScore - b.totalScore);
        
        sortedPlayers.forEach((player, index) => {
            const position = index + 1;
            const playerCard = this.createPlayerCard(player, position);
            this.playersContainer.appendChild(playerCard);
        });
        
        this.updatePlayerPositions();
    }

    createPlayerCard(player, position) {
        const card = document.createElement('div');
        card.className = `player-card ${this.getScoreClass(player.totalScore)}`;
        card.dataset.playerId = player.id;
        
        const hasChinchon = player.hasChinchonCurrentRound;
        
        if (hasChinchon) {
            card.classList.add('chinchon-achieved');
        }
        
        const chinchonBadge = hasChinchon ? 
            '<div class="chinchon-badge">CHINCHÓN!</div>' : '';
        
        let roundDisplay = player.roundScore;
        if (hasChinchon) {
            roundDisplay = '0 (Chinchón!)';
        }
        
        card.innerHTML = `
            ${chinchonBadge}
            <div class="player-header">
                <div class="player-name editable" data-player-id="${player.id}">
                    ${player.name}
                </div>
                <div class="player-position player-position-${position}">
                    ${position}°
                </div>
            </div>
            
            <div class="player-stats">
                <div class="stat-item">
                    <div class="stat-label">Puntuación Total</div>
                    <div class="stat-value total">${player.totalScore}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Ronda Actual</div>
                    <div class="stat-value round ${hasChinchon ? 'chinchon-value' : ''}">
                        ${roundDisplay}
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Rondas Ganadas</div>
                    <div class="stat-value">${player.roundsWon}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Chinchones</div>
                    <div class="stat-value">${player.chinchons}</div>
                </div>
            </div>
            
            <div class="points-controls">
                <input type="number" 
                       class="points-input" 
                       id="points-${player.id}" 
                       placeholder="Puntos ronda" 
                       min="0" 
                       max="100"
                       value="${player.roundScore !== 0 || !player.hasChinchonCurrentRound ? player.roundScore : ''}"
                       ${player.hasChinchonCurrentRound ? 'disabled' : ''}>
                <button class="btn-points btn-add" data-action="add" data-player-id="${player.id}" 
                        ${player.hasChinchonCurrentRound ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn-points btn-subtract" data-action="subtract" data-player-id="${player.id}"
                        ${player.hasChinchonCurrentRound ? 'disabled' : ''}>
                    <i class="fas fa-minus"></i>
                </button>
                <button class="btn-points btn-chinchon-special" data-action="chinchon" data-player-id="${player.id}" 
                        title="Marcar Chinchón" ${player.hasChinchonCurrentRound ? 'disabled style="opacity:0.5"' : ''}>
                    <i class="fas fa-crown"></i>
                </button>
            </div>
            
            <div style="margin-top: 10px; font-size: 0.8rem; color: rgba(255, 255, 255, 0.7);">
                <i class="fas fa-history"></i> Últimas rondas: 
                ${player.scores.slice(-3).map(score => 
                    `<span style="margin: 0 2px; ${score === 0 ? 'color: #9b59b6; font-weight: bold;' : ''}">${score === 0 ? 'Chinchón' : score}</span>`
                ).join(', ')}
            </div>
        `;
        
        return card;
    }

    getScoreClass(score) {
        if (score <= 50) return 'low-score';
        if (score <= 100) return 'medium-score';
        return 'high-score';
    }

    updatePlayerPositions() {
        const sortedPlayers = [...this.players].sort((a, b) => a.totalScore - b.totalScore);
        
        sortedPlayers.forEach((player, index) => {
            const position = index + 1;
            const playerCard = document.querySelector(`[data-player-id="${player.id}"] .player-position`);
            if (playerCard) {
                playerCard.className = `player-position player-position-${position}`;
                playerCard.textContent = `${position}°`;
            }
        });
    }

    addPoints(playerId, points, isChinchon = false) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        
        if (isChinchon) {
            // Es un chinchón
            player.roundScore = 0;
            player.hasChinchonCurrentRound = true;
            player.chinchons++;
            this.showNotification(`🎉 ${player.name} hizo CHINCHÓN!`, 'success');
        } else {
            // Son puntos normales
            if (points === undefined || points === null || points === '') {
                this.showNotification('Ingresa una cantidad de puntos válida', 'error');
                return;
            }
            
            const parsedPoints = parseInt(points);
            if (isNaN(parsedPoints) || parsedPoints < 0) {
                this.showNotification('Los puntos deben ser un número positivo', 'error');
                return;
            }
            
            player.roundScore = parsedPoints;
            player.hasChinchonCurrentRound = false;
            
            if (parsedPoints === 0) {
                this.showNotification(`${player.name} tiene 0 puntos en esta ronda`, 'info');
            }
        }
        
        // Si es el primer movimiento, bloquear configuración
        if (!this.gameStarted) {
            this.lockConfiguration();
        }
        
        this.renderPlayers();
        this.updateUI();
        this.saveToStorage();
        
        this.checkRoundCompletion();
    }

    checkRoundCompletion() {
        const allPlayersHaveScore = this.players.every(p => 
            p.roundScore !== null && p.roundScore !== undefined
        );
        
        if (allPlayersHaveScore) {
            this.newRoundBtn.disabled = false;
            this.newRoundBtn.style.opacity = '1';
            this.newRoundBtn.title = 'Comenzar nueva ronda';
        } else {
            this.newRoundBtn.disabled = true;
            this.newRoundBtn.style.opacity = '0.5';
            this.newRoundBtn.title = 'Faltan puntuaciones por añadir';
        }
    }

    newRound() {
        const incompletePlayers = this.players.filter(p => 
            p.roundScore === null || p.roundScore === undefined
        );
        
        if (incompletePlayers.length > 0) {
            const playerNames = incompletePlayers.map(p => p.name).join(', ');
            this.showNotification(`Faltan puntuaciones: ${playerNames}`, 'error');
            return;
        }

        // Si es la primera ronda y aún no se ha bloqueado la configuración, bloquearla
        if (!this.gameStarted) {
            this.lockConfiguration();
        }

        this.players.forEach(player => {
            player.totalScore += player.roundScore;
            player.scores.push(player.roundScore);
            
            player.roundScore = 0;
            player.hasChinchonCurrentRound = false;
        });

        const roundScores = this.players.map(p => ({
            id: p.id,
            name: p.name,
            score: p.scores[p.scores.length - 1],
            isChinchon: p.hasChinchonCurrentRound
        }));
        
        const minScore = Math.min(...roundScores.map(r => r.score));
        const roundWinners = roundScores.filter(r => r.score === minScore);
        
        const chinchonWinners = roundScores.filter(r => r.isChinchon);
        let roundWinnerName = 'Empate';
        
        if (chinchonWinners.length > 0) {
            roundWinnerName = chinchonWinners.map(w => w.name).join(' y ');
            chinchonWinners.forEach(winner => {
                const player = this.players.find(p => p.id === winner.id);
                if (player) player.roundsWon++;
            });
        } else if (roundWinners.length === 1) {
            const winner = this.players.find(p => p.id === roundWinners[0].id);
            winner.roundsWon++;
            roundWinnerName = winner.name;
        }

        const roundData = {
            round: this.currentRound,
            scores: roundScores.reduce((acc, curr) => {
                acc[curr.id] = {
                    points: curr.score,
                    isChinchon: curr.isChinchon
                };
                return acc;
            }, {}),
            winner: roundWinnerName
        };
        
        this.roundHistory.push(roundData);
        this.currentRound++;
        
        this.updateRoundHistory();
        this.renderPlayers();
        this.updateUI();
        this.saveToStorage();
        
        this.checkGameEnd();
        
        if (chinchonWinners.length > 0) {
            this.showNotification(`🎉 ${roundWinnerName} gana la ronda con CHINCHÓN!`, 'success');
        } else if (roundWinners.length === 1) {
            this.showNotification(`🏆 ${roundWinnerName} gana la ronda con ${minScore} puntos`, 'success');
        } else {
            this.showNotification(`🤝 Empate en la ronda con ${minScore} puntos`, 'info');
        }
    }

    checkGameEnd() {
        const playersOverTarget = this.players.filter(p => p.totalScore >= this.targetScore);
        if (playersOverTarget.length > 0) {
            const playersUnderTarget = this.players.filter(p => p.totalScore < this.targetScore);
            
            if (playersUnderTarget.length > 0) {
                const winner = [...playersUnderTarget].sort((a, b) => a.totalScore - b.totalScore)[0];
                this.showNotification(`🏆 ¡${winner.name} gana la partida con ${winner.totalScore} puntos!`, 'success');
                
                setTimeout(() => {
                    if (confirm('¿Quieres guardar esta partida?')) {
                        this.showSaveModal();
                    }
                }, 2000);
            }
        }
    }

    updateRoundHistory() {
        this.roundsBody.innerHTML = '';
        
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `<th>Ronda</th>${this.players.map(p => `<th>${p.name}</th>`).join('')}<th>Ganador</th>`;
        
        this.roundHistory.forEach(roundData => {
            const row = document.createElement('tr');
            
            const scores = Object.values(roundData.scores).map(s => s.points);
            const minScore = Math.min(...scores);
            const maxScore = Math.max(...scores);
            
            const cells = this.players.map(player => {
                const scoreData = roundData.scores[player.id];
                const score = scoreData.points;
                const isChinchon = scoreData.isChinchon;
                
                let cellClass = '';
                let cellContent = score;
                
                if (isChinchon) {
                    cellClass = 'chinchon-cell';
                    cellContent = '0★';
                } else if (score === minScore) {
                    cellClass = 'winner-cell';
                } else if (score === maxScore && score !== minScore) {
                    cellClass = 'loser-cell';
                }
                
                return `<td class="${cellClass}" title="${isChinchon ? 'Chinchón' : score + ' puntos'}">${cellContent}</td>`;
            }).join('');
            
            row.innerHTML = `
                <td>${roundData.round}</td>
                ${cells}
                <td>${roundData.winner}</td>
            `;
            
            this.roundsBody.appendChild(row);
        });
    }

    updateUI() {
        this.currentRoundSpan.textContent = this.currentRound;
        this.displayTargetSpan.textContent = this.targetScore;
        
        const sortedPlayers = [...this.players].sort((a, b) => a.totalScore - b.totalScore);
        if (sortedPlayers.length > 0) {
            const leader = sortedPlayers[0];
            this.currentLeaderSpan.textContent = `${leader.name} (${leader.totalScore} pts)`;
        } else {
            this.currentLeaderSpan.textContent = 'Ninguno';
        }
        
        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        this.gameDurationSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.checkRoundCompletion();
    }

    setupEventListeners() {
        // Configuración - con verificación de partida iniciada
        this.applyPlayersBtn.addEventListener('click', () => {
            if (this.gameStarted) {
                this.showNotification('No se puede cambiar el número de jugadores durante la partida', 'error');
                return;
            }
            
            const count = parseInt(this.playerCountSelect.value);
            this.createDefaultPlayers(count);
            this.renderPlayers();
            this.updateRoundHistory();
            this.showNotification(`${count} jugadores configurados`, 'success');
            this.saveToStorage();
        });

        this.applyTargetBtn.addEventListener('click', () => {
            if (this.gameStarted) {
                this.showNotification('No se puede cambiar el objetivo durante la partida', 'error');
                return;
            }
            
            this.targetScore = parseInt(this.targetScoreSelect.value);
            this.updateUI();
            this.showNotification(`Objetivo: ${this.targetScore} puntos`, 'success');
            this.saveToStorage();
        });

        this.applyBonusBtn.addEventListener('click', () => {
            if (this.gameStarted) {
                this.showNotification('No se puede cambiar el bonus durante la partida', 'error');
                return;
            }
            
            this.chinchonBonus = parseInt(this.chinchonBonusSelect.value);
            this.showNotification(`Bonus Chinchón: ${this.chinchonBonus} puntos`, 'success');
            this.saveToStorage();
        });

        // Acciones
        this.newRoundBtn.addEventListener('click', () => this.newRound());
        
        this.resetRoundBtn.addEventListener('click', () => {
            if (!confirm('¿Reiniciar la ronda actual? Los puntos de esta ronda se perderán.')) return;
            
            this.players.forEach(player => {
                player.roundScore = 0;
                player.hasChinchonCurrentRound = false;
            });
            
            this.renderPlayers();
            this.showNotification('Ronda actual reiniciada', 'success');
            this.saveToStorage();
        });
        
        this.resetGameBtn.addEventListener('click', () => {
            if (!confirm('¿Reiniciar toda la partida? Se perderán todos los datos y la configuración se desbloqueará.')) return;
            
            this.resetGame();
        });
        
        this.saveGameBtn.addEventListener('click', () => this.showSaveModal());

        // Eventos delegados para jugadores
        this.playersContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.classList.contains('player-name') || target.closest('.player-name')) {
                const playerId = parseInt(target.dataset.playerId || target.closest('.player-name').dataset.playerId);
                this.showEditModal(playerId);
            }
            
            if (target.classList.contains('btn-points') || target.closest('.btn-points')) {
                const button = target.classList.contains('btn-points') ? target : target.closest('.btn-points');
                const playerId = parseInt(button.dataset.playerId);
                const action = button.dataset.action;
                
                if (action === 'add') {
                    const input = document.getElementById(`points-${playerId}`);
                    const points = input.value;
                    this.addPoints(playerId, points, false);
                } else if (action === 'subtract') {
                    const input = document.getElementById(`points-${playerId}`);
                    const currentPoints = parseInt(input.value) || 0;
                    if (currentPoints > 0) {
                        input.value = currentPoints - 1;
                        this.addPoints(playerId, currentPoints - 1, false);
                    }
                } else if (action === 'chinchon') {
                    this.addPoints(playerId, 0, true);
                }
            }
        });

        this.playersContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('points-input')) {
                const playerId = parseInt(e.target.id.split('-')[1]);
                const points = e.target.value;
                this.addPoints(playerId, points, false);
            }
        });

        this.playersContainer.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('points-input') && e.key === 'Enter') {
                const playerId = parseInt(e.target.id.split('-')[1]);
                const points = e.target.value;
                this.addPoints(playerId, points, false);
            }
        });

        // Compartir
        this.shareCurrentBtn.addEventListener('click', () => this.shareCurrentGame());
        this.shareHistoryBtn.addEventListener('click', () => this.shareHistory());
        this.shareWhatsappBtn.addEventListener('click', () => this.shareWhatsApp());

        // Modales
        document.getElementById('cancel-edit')?.addEventListener('click', () => this.hideEditModal());
        document.getElementById('save-player')?.addEventListener('click', () => this.savePlayerName());
        document.getElementById('cancel-save')?.addEventListener('click', () => this.hideSaveModal());
        document.getElementById('confirm-save')?.addEventListener('click', () => this.saveMatch());
        
        document.getElementById('copy-text')?.addEventListener('click', () => this.copyShareText());
        document.getElementById('share-native')?.addEventListener('click', () => this.shareNative());
        document.getElementById('close-share')?.addEventListener('click', () => this.hideShareModal());
    }

    showEditModal(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        
        this.editingPlayerIndex = this.players.findIndex(p => p.id === playerId);
        document.getElementById('edit-player-name').value = player.name;
        this.playerEditModal.style.display = 'block';
    }

    hideEditModal() {
        this.playerEditModal.style.display = 'none';
        this.editingPlayerIndex = null;
    }

    savePlayerName() {
        if (this.editingPlayerIndex === null) return;
        
        const newName = document.getElementById('edit-player-name').value.trim();
        if (newName) {
            this.players[this.editingPlayerIndex].name = newName;
            this.renderPlayers();
            this.updateRoundHistory();
            this.saveToStorage();
            this.showNotification('Nombre actualizado', 'success');
        }
        
        this.hideEditModal();
    }

    showSaveModal() {
        const winner = [...this.players].sort((a, b) => a.totalScore - b.totalScore)[0];
        document.getElementById('save-game-result').textContent = 
            `🏆 Ganador: ${winner.name} con ${winner.totalScore} puntos`;
        
        const now = new Date();
        const defaultName = `Chinchón ${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        document.getElementById('save-game-name').value = defaultName;
        
        this.saveModal.style.display = 'block';
    }

    hideSaveModal() {
        this.saveModal.style.display = 'none';
    }

    saveMatch() {
        const matchName = document.getElementById('save-game-name').value.trim();
        if (!matchName) {
            this.showNotification('Ingresa un nombre para la partida', 'error');
            return;
        }

        const matchData = {
            id: Date.now(),
            name: matchName,
            date: new Date().toISOString(),
            players: this.players.map(p => ({
                name: p.name,
                totalScore: p.totalScore,
                roundsWon: p.roundsWon,
                chinchons: p.chinchons
            })),
            rounds: this.roundHistory.length,
            targetScore: this.targetScore,
            duration: this.gameDurationSpan.textContent
        };

        this.savedMatches.push(matchData);
        this.saveToStorage();
        this.showNotification('Partida guardada correctamente', 'success');
        this.updateSavedMatches();
        this.hideSaveModal();
    }

    updateSavedMatches() {
        this.savedMatchesContainer.innerHTML = '';
        
        if (this.savedMatches.length === 0) {
            this.savedMatchesContainer.innerHTML = '<div class="empty-message" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">No hay partidas guardadas</div>';
            return;
        }

        this.savedMatches.forEach(match => {
            const matchElement = document.createElement('div');
            matchElement.className = 'saved-match-item';
            matchElement.style.margin = '8px 0';
            matchElement.style.padding = '12px';
            matchElement.style.background = 'rgba(255, 255, 255, 0.05)';
            matchElement.style.borderRadius = '8px';
            matchElement.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            
            const winner = match.players.sort((a, b) => a.totalScore - b.totalScore)[0];
            const date = new Date(match.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            matchElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <strong style="font-size: 0.95rem;">${match.name}</strong>
                    <small style="opacity: 0.7; font-size: 0.8rem;">${date}</small>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                    <div>
                        <span style="color: #f39c12;">${match.rounds} rondas</span>
                        <span style="margin: 0 5px;">•</span>
                        <span style="color: #3498db;">${match.duration}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #2ecc71; font-weight: bold;">${winner.name}</div>
                        <small style="opacity: 0.7;">${winner.totalScore} pts</small>
                    </div>
                </div>
            `;
            
            this.savedMatchesContainer.appendChild(matchElement);
        });
    }

    resetGame() {
        this.createDefaultPlayers(this.players.length);
        this.currentRound = 1;
        this.roundHistory = [];
        this.savedMatches = [];
        this.gameStartTime = Date.now();
        this.gameStarted = false;
        
        this.unlockConfiguration();
        this.renderPlayers();
        this.updateRoundHistory();
        this.updateSavedMatches();
        this.updateUI();
        this.showNotification('Partida reiniciada. Configuración desbloqueada.', 'success');
        this.saveToStorage();
    }

    shareCurrentGame() {
        const sortedPlayers = [...this.players].sort((a, b) => a.totalScore - b.totalScore);
        const winner = sortedPlayers[0];
        
        let shareText = `🏆 CHINCHÓN - Partida Actual\n`;
        shareText += `══════════════════════════════\n`;
        shareText += `Ronda: ${this.currentRound} | Objetivo: ${this.targetScore}\n`;
        shareText += `Duración: ${this.gameDurationSpan.textContent}\n\n`;
        shareText += `CLASIFICACIÓN:\n`;
        
        sortedPlayers.forEach((player, index) => {
            shareText += `${index + 1}° ${player.name}: ${player.totalScore} puntos`;
            if (player.chinchons > 0) shareText += ` (${player.chinchons} Chinchón${player.chinchons > 1 ? 'es' : ''})`;
            shareText += '\n';
        });
        
        shareText += `\n🏅 Líder: ${winner.name} con ${winner.totalScore} puntos`;
        
        this.showShareModal(shareText);
    }

    shareHistory() {
        let shareText = `📊 CHINCHÓN - Historial de Partidas\n`;
        shareText += `══════════════════════════════════\n\n`;
        
        if (this.savedMatches.length === 0) {
            shareText += 'No hay partidas guardadas.';
        } else {
            this.savedMatches.forEach((match, index) => {
                const date = new Date(match.date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const winner = match.players.sort((a, b) => a.totalScore - b.totalScore)[0];
                
                shareText += `${index + 1}. ${match.name} (${date})\n`;
                shareText += `   Ganador: ${winner.name} (${winner.totalScore} pts)\n`;
                shareText += `   Rondas: ${match.rounds} | Duración: ${match.duration}\n\n`;
            });
        }
        
        this.showShareModal(shareText);
    }

    shareWhatsApp() {
        const sortedPlayers = [...this.players].sort((a, b) => a.totalScore - b.totalScore);
        let shareText = `*🏆 CHINCHÓN - Resultados Actuales*\n\n`;
        
        sortedPlayers.forEach((player, index) => {
            shareText += `${index + 1}° *${player.name}*: ${player.totalScore} puntos`;
            if (player.chinchons > 0) shareText += ` (${player.chinchons} Chinchón${player.chinchons > 1 ? 'es' : ''})`;
            shareText += '\n';
        });
        
        const winner = sortedPlayers[0];
        shareText += `\n*Líder:* ${winner.name} con ${winner.totalScore} puntos`;
        
        const encodedText = encodeURIComponent(shareText);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    }

    showShareModal(text) {
        document.getElementById('share-text').textContent = text;
        this.shareModal.style.display = 'block';
    }

    hideShareModal() {
        this.shareModal.style.display = 'none';
    }

    copyShareText() {
        const text = document.getElementById('share-text').textContent;
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Texto copiado al portapapeles', 'success');
        }).catch(err => {
            this.showNotification('Error al copiar el texto', 'error');
        });
    }

    shareNative() {
        const text = document.getElementById('share-text').textContent;
        
        if (navigator.share) {
            navigator.share({
                title: 'Resultados de Chinchón',
                text: text,
                url: window.location.href
            }).catch(err => {
                console.log('Error al compartir:', err);
            });
        } else {
            this.copyShareText();
        }
    }

    showNotification(message, type = 'info') {
        const notification = this.notification;
        const text = notification.querySelector('#notification-text');
        
        text.textContent = message;
        
        switch(type) {
            case 'success':
                notification.style.background = '#27ae60';
                break;
            case 'error':
                notification.style.background = '#e74c3c';
                break;
            case 'warning':
                notification.style.background = '#f39c12';
                break;
            default:
                notification.style.background = '#3498db';
        }
        
        notification.style.display = 'flex';
        notification.style.opacity = '1';
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }

    saveToStorage() {
        const gameData = {
            players: this.players,
            currentRound: this.currentRound,
            targetScore: this.targetScore,
            chinchonBonus: this.chinchonBonus,
            roundHistory: this.roundHistory,
            savedMatches: this.savedMatches,
            gameStartTime: this.gameStartTime,
            gameStarted: this.gameStarted
        };
        
        localStorage.setItem('chinchon-game', JSON.stringify(gameData));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('chinchon-game');
        if (saved) {
            try {
                const gameData = JSON.parse(saved);
                
                this.players = gameData.players || [];
                this.currentRound = gameData.currentRound || 1;
                this.targetScore = gameData.targetScore || 150;
                this.chinchonBonus = gameData.chinchonBonus || -20;
                this.roundHistory = gameData.roundHistory || [];
                this.savedMatches = gameData.savedMatches || [];
                this.gameStartTime = gameData.gameStartTime || Date.now();
                this.gameStarted = gameData.gameStarted || false;
                
                this.players.forEach(player => {
                    if (player.hasChinchonCurrentRound === undefined) {
                        player.hasChinchonCurrentRound = false;
                    }
                });
                
                this.playerCountSelect.value = this.players.length.toString();
                this.targetScoreSelect.value = this.targetScore.toString();
                this.chinchonBonusSelect.value = this.chinchonBonus.toString();
                
                if (this.gameStarted) {
                    this.lockConfiguration();
                } else {
                    this.unlockConfiguration();
                }
                
                this.updateSavedMatches();
            } catch (error) {
                console.error('Error al cargar partida:', error);
                this.createDefaultPlayers(3);
            }
        } else {
            this.createDefaultPlayers(3);
        }
    }
}

// Inicializar el juego cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    window.chinchonGame = new ChinchonGame();
});
