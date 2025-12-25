// Chinchón - Lógica del juego

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
        
        this.initElements();
        this.loadFromStorage();
        this.renderPlayers();
        this.updateUI();
        this.setupEventListeners();
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
                scores: []
            });
        }
    }

    renderPlayers() {
        this.playersContainer.innerHTML = '';
        
        // Ordenar jugadores por puntuación total (menor es mejor en Chinchón)
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
        
        // Determinar si el jugador hizo Chinchón en la ronda actual
        const hasChinchon = player.roundScore === 0;
        
        if (hasChinchon) {
            card.classList.add('chinchon-achieved');
        }
        
        card.innerHTML = `
            ${hasChinchon ? '<div class="chinchon-badge">CHINCHÓN!</div>' : ''}
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
                    <div class="stat-value round">${player.roundScore}</div>
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
                       value="${player.roundScore || ''}">
                <button class="btn-points btn-add" data-action="add" data-player-id="${player.id}">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn-points btn-subtract" data-action="subtract" data-player-id="${player.id}">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="btn-points" style="background: #3498db;" data-action="chinchon" data-player-id="${player.id}" title="Marcar Chinchón">
                    <i class="fas fa-crown"></i>
                </button>
            </div>
            
            <div style="margin-top: 10px; font-size: 0.8rem; color: rgba(255, 255, 255, 0.7);">
                <i class="fas fa-history"></i> Últimas rondas: 
                ${player.scores.slice(-3).map(score => `<span style="margin: 0 2px;">${score}</span>`).join(', ')}
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

    addPoints(playerId, points) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        
        if (points === 0) {
            // Chinchón
            player.roundScore = 0;
            player.chinchons++;
            this.showNotification(`${player.name} hizo Chinchón!`, 'success');
        } else {
            player.roundScore = points;
        }
        
        this.updateUI();
        this.saveToStorage();
    }

    newRound() {
        // Validar que todos los jugadores tengan puntuación de ronda
        const incompletePlayers = this.players.filter(p => p.roundScore === null || p.roundScore === undefined);
        if (incompletePlayers.length > 0) {
            this.showNotification('Todos los jugadores deben tener puntuación de ronda', 'error');
            return;
        }

        // Guardar puntuaciones de ronda
        this.players.forEach(player => {
            player.totalScore += player.roundScore;
            player.scores.push(player.roundScore);
            
            // Reiniciar puntuación de ronda
            player.roundScore = 0;
        });

        // Determinar ganador de la ronda (menor puntuación)
        const roundScores = this.players.map(p => ({
            id: p.id,
            name: p.name,
            score: p.scores[p.scores.length - 1]
        }));
        
        const minScore = Math.min(...roundScores.map(r => r.score));
        const roundWinners = roundScores.filter(r => r.score === minScore);
        
        // Si hay empate, nadie gana la ronda
        if (roundWinners.length === 1) {
            const winner = this.players.find(p => p.id === roundWinners[0].id);
            winner.roundsWon++;
        }

        // Guardar ronda en historial
        const roundData = {
            round: this.currentRound,
            scores: roundScores.reduce((acc, curr) => {
                acc[curr.id] = curr.score;
                return acc;
            }, {}),
            winner: roundWinners.length === 1 ? roundWinners[0].name : 'Empate'
        };
        
        this.roundHistory.push(roundData);
        this.currentRound++;
        
        // Actualizar interfaz
        this.updateRoundHistory();
        this.renderPlayers();
        this.updateUI();
        this.saveToStorage();
        
        // Verificar si algún jugador alcanzó el objetivo
        this.checkGameEnd();
    }

    checkGameEnd() {
        const playersOverTarget = this.players.filter(p => p.totalScore >= this.targetScore);
        if (playersOverTarget.length > 0) {
            // El ganador es el jugador con menor puntuación total
            const sortedPlayers = [...this.players].sort((a, b) => a.totalScore - b.totalScore);
            const winner = sortedPlayers[0];
            
            this.showNotification(`¡${winner.name} gana la partida!`, 'success');
            
            // Opcional: guardar partida automáticamente
            // this.saveMatch(`Partida ${new Date().toLocaleDateString()}`, winner.name);
        }
    }

    updateRoundHistory() {
        this.roundsBody.innerHTML = '';
        
        // Crear encabezado de la tabla
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `<th>Ronda</th>${this.players.map(p => `<th>${p.name}</th>`).join('')}<th>Ganador</th>`;
        
        // Crear filas para cada ronda
        this.roundHistory.forEach(roundData => {
            const row = document.createElement('tr');
            
            // Determinar clases para celdas
            const minScore = Math.min(...Object.values(roundData.scores));
            const maxScore = Math.max(...Object.values(roundData.scores));
            
            const cells = this.players.map(player => {
                const score = roundData.scores[player.id];
                let cellClass = '';
                
                if (score === minScore) cellClass = 'winner-cell';
                if (score === maxScore && score !== minScore) cellClass = 'loser-cell';
                if (score === 0) cellClass = 'chinchon-cell';
                
                return `<td class="${cellClass}">${score}</td>`;
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
        // Actualizar información general
        this.currentRoundSpan.textContent = this.currentRound;
        this.displayTargetSpan.textContent = this.targetScore;
        
        // Actualizar líder
        const sortedPlayers = [...this.players].sort((a, b) => a.totalScore - b.totalScore);
        this.currentLeaderSpan.textContent = sortedPlayers.length > 0 ? sortedPlayers[0].name : 'Ninguno';
        
        // Actualizar duración
        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        this.gameDurationSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    setupEventListeners() {
        // Configuración
        this.applyPlayersBtn.addEventListener('click', () => {
            const count = parseInt(this.playerCountSelect.value);
            this.createDefaultPlayers(count);
            this.renderPlayers();
            this.updateRoundHistory();
            this.showNotification(`${count} jugadores configurados`, 'success');
            this.saveToStorage();
        });

        this.applyTargetBtn.addEventListener('click', () => {
            this.targetScore = parseInt(this.targetScoreSelect.value);
            this.updateUI();
            this.showNotification(`Objetivo: ${this.targetScore} puntos`, 'success');
            this.saveToStorage();
        });

        this.applyBonusBtn.addEventListener('click', () => {
            this.chinchonBonus = parseInt(this.chinchonBonusSelect.value);
            this.showNotification(`Bonus Chinchón: ${this.chinchonBonus} puntos`, 'success');
            this.saveToStorage();
        });

        // Acciones
        this.newRoundBtn.addEventListener('click', () => this.newRound());
        this.resetRoundBtn.addEventListener('click', () => this.resetRound());
        this.resetGameBtn.addEventListener('click', () => this.resetGame());
        this.saveGameBtn.addEventListener('click', () => this.showSaveModal());

        // Eventos delegados para jugadores
        this.playersContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            // Editar nombre
            if (target.classList.contains('player-name') || target.closest('.player-name')) {
                const playerId = parseInt(target.dataset.playerId || target.closest('.player-name').dataset.playerId);
                this.showEditModal(playerId);
            }
            
            // Botones de puntos
            if (target.classList.contains('btn-points') || target.closest('.btn-points')) {
                const button = target.classList.contains('btn-points') ? target : target.closest('.btn-points');
                const playerId = parseInt(button.dataset.playerId);
                const action = button.dataset.action;
                
                const input = document.getElementById(`points-${playerId}`);
                
                if (action === 'add') {
                    const points = parseInt(input.value) || 0;
                    this.addPoints(playerId, points);
                } else if (action === 'subtract') {
                    const points = parseInt(input.value) || 0;
                    if (points > 0) {
                        input.value = points - 1;
                        this.addPoints(playerId, points - 1);
                    }
                } else if (action === 'chinchon') {
                    this.addPoints(playerId, 0);
                }
            }
        });

        // Entrada de puntos
        this.playersContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('points-input')) {
                const playerId = parseInt(e.target.id.split('-')[1]);
                const points = parseInt(e.target.value) || 0;
                this.addPoints(playerId, points);
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
            `Ganador: ${winner.name} con ${winner.totalScore} puntos`;
        
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
            targetScore: this.targetScore
        };

        this.savedMatches.push(matchData);
        this.saveToStorage();
        this.showNotification('Partida guardada', 'success');
        this.updateSavedMatches();
        this.hideSaveModal();
    }

    updateSavedMatches() {
        this.savedMatchesContainer.innerHTML = '';
        
        if (this.savedMatches.length === 0) {
            this.savedMatchesContainer.innerHTML = '<div class="empty-message">No hay partidas guardadas</div>';
            return;
        }

        this.savedMatches.forEach(match => {
            const matchElement = document.createElement('div');
            matchElement.className = 'card';
            matchElement.style.margin = '5px 0';
            matchElement.style.padding = '10px';
            
            const winner = match.players.sort((a, b) => a.totalScore - b.totalScore)[0];
            const date = new Date(match.date).toLocaleDateString();
            
            matchElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${match.name}</strong><br>
                        <small>${date} - ${match.rounds} rondas</small>
                    </div>
                    <div style="text-align: right;">
                        <strong>Ganador: ${winner.name}</strong><br>
                        <small>${winner.totalScore} puntos</small>
                    </div>
                </div>
            `;
            
            this.savedMatchesContainer.appendChild(matchElement);
        });
    }

    resetRound() {
        if (!confirm('¿Reiniciar la ronda actual? Los puntos de esta ronda se perderán.')) return;
        
        this.players.forEach(player => {
            player.roundScore = 0;
        });
        
        this.renderPlayers();
        this.showNotification('Ronda reiniciada', 'success');
    }

    resetGame() {
        if (!confirm('¿Reiniciar toda la partida? Se perderán todos los datos.')) return;
        
        this.createDefaultPlayers(this.players.length);
        this.currentRound = 1;
        this.roundHistory = [];
        this.gameStartTime = Date.now();
        
        this.renderPlayers();
        this.updateRoundHistory();
        this.updateUI();
        this.showNotification('Partida reiniciada', 'success');
        this.saveToStorage();
    }

    shareCurrentGame() {
        const sortedPlayers = [...this.players].sort((a, b) => a.totalScore - b.totalScore);
        const winner = sortedPlayers[0];
        
        let shareText = `🏆 CHINCHÓN - Partida Actual\n`;
        shareText += `Ronda: ${this.currentRound} | Objetivo: ${this.targetScore}\n\n`;
        
        sortedPlayers.forEach((player, index) => {
            shareText += `${index + 1}° ${player.name}: ${player.totalScore} puntos`;
            if (player.chinchons > 0) shareText += ` (${player.chinchons} Chinchón${player.chinchons > 1 ? 'es' : ''})`;
            shareText += '\n';
        });
        
        shareText += `\nLíder: ${winner.name} con ${winner.totalScore} puntos`;
        
        this.showShareModal(shareText);
    }

    shareHistory() {
        let shareText = `📊 CHINCHÓN - Historial de Partidas\n\n`;
        
        if (this.savedMatches.length === 0) {
            shareText += 'No hay partidas guardadas.';
        } else {
            this.savedMatches.forEach(match => {
                const date = new Date(match.date).toLocaleDateString();
                const winner = match.players.sort((a, b) => a.totalScore - b.totalScore)[0];
                
                shareText += `🏆 ${match.name} (${date})\n`;
                shareText += `   Ganador: ${winner.name} (${winner.totalScore} pts)\n`;
                shareText += `   Rondas: ${match.rounds}\n\n`;
            });
        }
        
        this.showShareModal(shareText);
    }

    shareWhatsApp() {
        const sortedPlayers = [...this.players].sort((a, b) => a.totalScore - b.totalScore);
        let shareText = `*🏆 CHINCHÓN - Resultados*\n\n`;
        
        sortedPlayers.forEach((player, index) => {
            shareText += `${index + 1}° *${player.name}*: ${player.totalScore} puntos`;
            if (player.chinchons > 0) shareText += ` (${player.chinchons} Chinchón${player.chinchons > 1 ? 'es' : ''})`;
            shareText += '\n';
        });
        
        const encodedText = encodeURIComponent(shareText);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    }

    showShareModal(text) {
        document.getElementById('share-text').textContent = text;
        this.shareModal.style.display = 'block';
    }

    showNotification(message, type = 'info') {
        const notification = this.notification;
        const text = notification.querySelector('#notification-text');
        
        text.textContent = message;
        notification.style.background = type === 'error' ? '#e74c3c' : 
                                      type === 'success' ? '#27ae60' : '#3498db';
        
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
            gameStartTime: this.gameStartTime
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
                
                // Actualizar selects
                this.playerCountSelect.value = this.players.length.toString();
                this.targetScoreSelect.value = this.targetScore.toString();
                this.chinchonBonusSelect.value = this.chinchonBonus.toString();
                
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
