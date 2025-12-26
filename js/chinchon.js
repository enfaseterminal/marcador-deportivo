// Chinchón - Lógica del juego con configuración bloqueable

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
        this.gameStarted = false; // Nuevo: controla si la partida ha comenzado
        
        this.initElements();
        this.loadFromStorage();
        this.renderPlayers();
        this.updateUI();
        this.setupEventListeners();
        
        // Verificar si ya hay una partida en curso al cargar
        this.checkIfGameStarted();
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
        // 1. Hay más de una ronda en el historial, o
        // 2. Los jugadores tienen puntuaciones en la ronda actual (no todas en 0)
        // 3. Ya hay datos de partidas guardadas
        
        const hasRoundHistory = this.roundHistory.length > 0;
        const hasCurrentScores = this.players.some(p => p.roundScore > 0);
        const hasNonZeroTotal = this.players.some(p => p.totalScore > 0);
        
        if (hasRoundHistory || hasCurrentScores || hasNonZeroTotal) {
            this.gameStarted = true;
            this.lockConfiguration();
        } else {
            this.gameStarted = false;
            this.unlockConfiguration();
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
        
        // Añadir tooltip o indicador visual
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
                       ${player.hasChinchonCurrentRound || this.gameStarted ? '' : ''}>
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

    // ... (resto de métodos igual hasta setupEventListeners)

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
        this.newRoundBtn.addEventListener('click', () => {
            // Cuando se inicia la primera ronda, se bloquea la configuración
            if (!this.gameStarted) {
                this.lockConfiguration();
            }
            this.newRound();
        });
        
        this.resetRoundBtn.addEventListener('click', () => this.resetRound());
        
        this.resetGameBtn.addEventListener('click', () => {
            if (confirm('¿Reiniciar toda la partida? Se perderán todos los datos y la configuración se desbloqueará.')) {
                this.resetGame();
            }
        });
        
        this.saveGameBtn.addEventListener('click', () => this.showSaveModal());

        // Eventos delegados para jugadores
        this.playersContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            // Editar nombre (solo si no ha empezado la partida o es necesario)
            if (target.classList.contains('player-name') || target.closest('.player-name')) {
                const playerId = parseInt(target.dataset.playerId || target.closest('.player-name').dataset.playerId);
                this.showEditModal(playerId);
            }
            
            // Botones de puntos
            if (target.classList.contains('btn-points') || target.closest('.btn-points')) {
                const button = target.classList.contains('btn-points') ? target : target.closest('.btn-points');
                const playerId = parseInt(button.dataset.playerId);
                const action = button.dataset.action;
                
                // Si es el primer movimiento, bloquear configuración
                if (!this.gameStarted && (action === 'add' || action === 'chinchon')) {
                    this.lockConfiguration();
                }
                
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

        // ... (resto de event listeners igual)
    }

    newRound() {
        // Validar que todos los jugadores tengan puntuación de ronda
        const incompletePlayers = this.players.filter(p => 
            p.roundScore === null || p.roundScore === undefined
        );
        
        if (incompletePlayers.length > 0) {
            const playerNames = incompletePlayers.map(p => p.name).join(', ');
            this.showNotification(`Faltan puntuaciones: ${playerNames}`, 'error');
            return;
        }

        // Si es la primera ronda y aún no se ha bloqueado la configuración, bloquearla
        if (!this.gameStarted && this.currentRound === 1) {
            this.lockConfiguration();
        }

        // ... (resto del método igual)
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

    // ... (resto de métodos igual)

    saveToStorage() {
        const gameData = {
            players: this.players,
            currentRound: this.currentRound,
            targetScore: this.targetScore,
            chinchonBonus: this.chinchonBonus,
            roundHistory: this.roundHistory,
            savedMatches: this.savedMatches,
            gameStartTime: this.gameStartTime,
            gameStarted: this.gameStarted // Guardar también el estado
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
                this.gameStarted = gameData.gameStarted || false; // Cargar estado
                
                // Asegurar que los jugadores tienen el campo hasChinchonCurrentRound
                this.players.forEach(player => {
                    if (player.hasChinchonCurrentRound === undefined) {
                        player.hasChinchonCurrentRound = false;
                    }
                });
                
                // Actualizar selects
                this.playerCountSelect.value = this.players.length.toString();
                this.targetScoreSelect.value = this.targetScore.toString();
                this.chinchonBonusSelect.value = this.chinchonBonus.toString();
                
                // Si la partida ya había comenzado, bloquear configuración
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
