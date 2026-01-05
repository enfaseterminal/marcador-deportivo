// futbol-sala.js - Gestor completo con popups personalizados para tarjetas

(function() {
    'use strict';
    
    console.log('=== INICIALIZACIÓN FÚTBOL SALA CON SISTEMA DE POPUPS ===');
    
    // Variables globales del juego
    const futbolSala = {
        // Estado del juego
        gameState: 'active',
        matchTime: 0,
        matchTimer: null,
        period: 1,
        maxPeriods: 2,
        isTimerRunning: false,
        
        // Para el sistema de popups
        currentCardAction: null,
        
        // Equipos
        localTeam: {
            name: 'Equipo Local',
            players: [],
            goals: 0,
            yellowCards: 0,
            blueCards: 0,
            totalCards: 0
        },
        
        visitTeam: {
            name: 'Equipo Visitante',
            players: [],
            goals: 0,
            yellowCards: 0,
            blueCards: 0,
            totalCards: 0
        },
        
        // Inicialización
        init: function() {
            console.log('Inicializando fútbol sala con sistema de popups...');
            
            // Cargar estado guardado
            this.loadGameState();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Configurar modal de nombre de equipo
            this.setupTeamNameModal();
            
            // Configurar popup de tarjetas
            this.setupCardPopup();
            
            // Configurar edición de jugadores
            this.setupPlayerCardEditing();
            
            // Renderizar equipos
            this.renderTeams();
            
            // Actualizar estadísticas
            this.updateGlobalStats();
            
            // Configurar cronómetro
            this.setupTimer();
            
            console.log('Fútbol sala con popups inicializado correctamente');
        },
        
        // Configurar eventos
        setupEventListeners: function() {
            console.log('Configurando event listeners de fútbol sala...');
            
            // Botones de control del cronómetro
            document.getElementById('start-timer')?.addEventListener('click', () => this.startTimer());
            document.getElementById('pause-timer')?.addEventListener('click', () => this.pauseTimer());
            document.getElementById('reset-timer')?.addEventListener('click', () => this.resetTimer());
            document.getElementById('next-period')?.addEventListener('click', () => this.nextPeriod());
            
            // Botones globales
            document.getElementById('reset-all-cards')?.addEventListener('click', () => this.resetAllCards());
            document.getElementById('save-match')?.addEventListener('click', () => this.saveMatch());
            document.getElementById('load-match')?.addEventListener('click', () => this.loadMatchDialog());
            document.getElementById('new-match')?.addEventListener('click', () => this.newMatch());
            
            // Botones para añadir jugadores
            document.querySelectorAll('.add-player-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const team = e.target.closest('.add-player-btn').dataset.team;
                    this.addNewPlayer(team);
                });
            });
            
            // Campo de notas
            document.getElementById('match-notes')?.addEventListener('input', (e) => {
                this.saveGameState();
            });
            
            console.log('Event listeners configurados correctamente');
        },
        
        // MODAL PARA CAMBIAR NOMBRE DE EQUIPO (MANTENIDO)
        setupTeamNameModal: function() {
            const modal = document.getElementById('team-name-modal');
            const openButtons = document.querySelectorAll('.change-team-name-btn');
            const cancelBtn = document.getElementById('cancel-change-name');
            const saveBtn = document.getElementById('save-team-name');
            const teamNameInput = document.getElementById('new-team-name');
            const teamTypeLabel = document.getElementById('team-type-label');
            
            let currentTeamType = null;
            let originalName = '';
            
            openButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.stopPropagation();
                    currentTeamType = this.dataset.team;
                    const team = currentTeamType === 'local' ? futbolSala.localTeam : futbolSala.visitTeam;
                    
                    teamTypeLabel.textContent = currentTeamType === 'local' ? 'Local' : 'Visitante';
                    teamNameInput.value = team.name;
                    originalName = team.name;
                    
                    modal.classList.add('active');
                    teamNameInput.focus();
                    teamNameInput.select();
                });
            });
            
            cancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                modal.classList.remove('active');
                teamNameInput.value = originalName;
                currentTeamType = null;
            });
            
            saveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (!currentTeamType) return;
                
                const newName = teamNameInput.value.trim();
                if (newName && newName !== originalName) {
                    const team = currentTeamType === 'local' ? futbolSala.localTeam : futbolSala.visitTeam;
                    const oldName = team.name;
                    team.name = newName;
                    
                    document.getElementById(`${currentTeamType}-team-name`).textContent = newName;
                    
                    document.querySelectorAll(`.player-card[data-team="${currentTeamType}"] .team-name`).forEach(el => {
                        el.textContent = newName;
                    });
                    
                    futbolSala.saveGameState();
                    futbolSala.showNotification(`Nombre cambiado: "${oldName}" → "${newName}"`);
                }
                
                modal.classList.remove('active');
                currentTeamType = null;
            });
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    modal.classList.remove('active');
                    teamNameInput.value = originalName;
                    currentTeamType = null;
                }
            });
            
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    teamNameInput.value = originalName;
                    currentTeamType = null;
                }
            });
            
            modal.querySelector('.modal-content')?.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        },
        
        // CONFIGURAR POPUP PERSONALIZADO PARA TARJETAS
        setupCardPopup: function() {
            const overlay = document.getElementById('card-popup-overlay');
            const popup = document.getElementById('card-popup');
            const cancelBtn = document.getElementById('card-popup-cancel');
            const confirmBtn = document.getElementById('card-popup-confirm');
            const icon = document.getElementById('card-popup-icon');
            const title = document.getElementById('card-popup-title');
            const playerName = document.getElementById('card-player-name');
            
            if (!overlay || !popup) {
                console.error('No se encontraron elementos del popup de tarjetas');
                return;
            }
            
            // Cancelar tarjeta
            cancelBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
                this.currentCardAction = null;
            });
            
            // Confirmar tarjeta
            confirmBtn.addEventListener('click', () => {
                if (!this.currentCardAction) return;
                
                const { action, cardType, playerId, teamType } = this.currentCardAction;
                const reason = document.getElementById('card-reason').value;
                const minute = document.getElementById('card-minute').value;
                const comment = document.getElementById('card-comment').value;
                
                overlay.classList.remove('active');
                
                if (action === 'add') {
                    this.processCardAdd(playerId, teamType, cardType, { reason, minute, comment });
                }
                
                this.currentCardAction = null;
            });
            
            // Cerrar con Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay.classList.contains('active')) {
                    overlay.classList.remove('active');
                    this.currentCardAction = null;
                }
            });
            
            // Cerrar haciendo clic fuera
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                    this.currentCardAction = null;
                }
            });
        },
        
        // MOSTRAR POPUP PARA AÑADIR TARJETA
        showCardPopup: function(playerId, teamType, cardType) {
            const overlay = document.getElementById('card-popup-overlay');
            const popup = document.getElementById('card-popup');
            const icon = document.getElementById('card-popup-icon');
            const title = document.getElementById('card-popup-title');
            const playerName = document.getElementById('card-player-name');
            const confirmBtn = document.getElementById('card-popup-confirm');
            
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            const player = team.players.find(p => p.id === playerId);
            
            if (!player) return;
            
            // Configurar datos del popup
            this.currentCardAction = {
                action: 'add',
                cardType: cardType,
                playerId: playerId,
                teamType: teamType
            };
            
            // Configurar según tipo de tarjeta
            if (cardType === 'yellow') {
                popup.className = 'card-popup yellow';
                icon.innerHTML = '🟨';
                title.textContent = 'Tarjeta Amarilla';
                confirmBtn.className = 'btn btn-warning';
                confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Tarjeta Amarilla';
            } else {
                popup.className = 'card-popup blue';
                icon.innerHTML = '🟦';
                title.textContent = 'Tarjeta Azul';
                confirmBtn.className = 'btn btn-primary';
                confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Tarjeta Azul';
            }
            
            playerName.textContent = player.name;
            
            // Resetear formulario
            document.getElementById('card-reason').value = 'Falta';
            document.getElementById('card-minute').value = '';
            document.getElementById('card-comment').value = '';
            
            // Mostrar popup
            overlay.classList.add('active');
            document.getElementById('card-reason').focus();
        },
        
        // PROCESAR AÑADIR TARJETA DESPUÉS DE CONFIRMAR
        processCardAdd: function(playerId, teamType, cardType, cardData) {
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            const player = team.players.find(p => p.id === playerId);
            const playerCard = document.querySelector(`.player-card[data-player-id="${playerId}"][data-team="${teamType}"]`);
            
            if (!player || !playerCard) return;
            
            const cardProp = cardType === 'yellow' ? 'yellowCards' : 'blueCards';
            const cardClass = cardType === 'yellow' ? 'has-yellow-card' : 'has-blue-card';
            const cardCountClass = cardType === 'yellow' ? 'yellow-cards-count' : 'blue-cards-count';
            const cardColor = cardType === 'yellow' ? 'amarilla' : 'azul';
            const cardEmoji = cardType === 'yellow' ? '🟨' : '🟦';
            
            // Incrementar contador
            player[cardProp]++;
            
            // Guardar datos adicionales
            player.lastCard = {
                type: cardType,
                reason: cardData.reason,
                minute: cardData.minute,
                comment: cardData.comment,
                timestamp: new Date().toISOString()
            };
            
            // Actualizar UI del jugador
            playerCard.querySelector(`.${cardCountClass}`).textContent = player[cardProp];
            playerCard.classList.add(cardClass);
            
            // Habilitar botón de quitar
            const removeBtn = playerCard.querySelector(`.remove-${cardType}-btn`);
            if (removeBtn) removeBtn.disabled = false;
            
            // Si son 2 tarjetas amarillas, marcar como expulsión
            if (cardType === 'yellow' && player.yellowCards >= 2) {
                playerCard.classList.add('double-yellow');
                
                // Mostrar alerta de expulsión
                setTimeout(() => {
                    this.showExpulsionAlert(player.name);
                }, 300);
            }
            
            // Actualizar estadísticas globales
            this.updateGlobalStats();
            this.saveGameState();
            
            // Mostrar notificación con detalles
            let notificationMsg = `${cardEmoji} Tarjeta ${cardColor} para ${player.name}`;
            if (cardData.minute) {
                notificationMsg += ` (minuto ${cardData.minute})`;
            }
            notificationMsg += `. Total: ${player[cardProp]}`;
            
            this.showNotification(notificationMsg);
        },
        
        // MOSTRAR ALERTA DE EXPULSIÓN
        showExpulsionAlert: function(playerName) {
            const alertHtml = `
                <div class="expulsion-alert" style="
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #dc3545, #c82333);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(220, 53, 69, 0.5);
                    z-index: 10001;
                    text-align: center;
                    animation: slideDown 0.5s ease;
                ">
                    <h3 style="margin: 0 0 10px 0;">
                        <i class="fas fa-exclamation-triangle"></i> ¡EXPULSIÓN!
                    </h3>
                    <p style="margin: 0; font-size: 1.2rem;">
                        ${playerName} ha recibido 2 tarjetas amarillas
                    </p>
                    <small style="opacity: 0.9;">Expulsión automática del partido</small>
                </div>
            `;
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = alertHtml;
            document.body.appendChild(tempDiv.firstChild);
            
            setTimeout(() => {
                const alert = document.querySelector('.expulsion-alert');
                if (alert) {
                    alert.style.opacity = '0';
                    alert.style.transform = 'translateX(-50%) translateY(-20px)';
                    setTimeout(() => {
                        if (alert.parentNode) {
                            alert.parentNode.removeChild(alert);
                        }
                    }, 500);
                }
            }, 5000);
        },
        
        // CONFIGURAR EDICIÓN DE JUGADORES
        setupPlayerCardEditing: function() {
            document.addEventListener('click', (e) => {
                // Editar dorsal
                if (e.target.closest('.edit-dorsal-btn')) {
                    this.handleEditDorsal(e);
                }
                
                // Cambiar titular/suplente
                if (e.target.closest('.toggle-starter-btn')) {
                    this.handleToggleStarter(e);
                }
                
                // Editar nombre del jugador
                if (e.target.closest('.edit-name-btn')) {
                    this.handleEditName(e);
                }
                
                // Añadir tarjeta amarilla (USANDO POPUP)
                if (e.target.closest('.add-yellow-btn')) {
                    this.handleAddCardClick(e, 'yellow');
                }
                
                // Quitar tarjeta amarilla
                if (e.target.closest('.remove-yellow-btn')) {
                    this.handleRemoveCard(e, 'yellow');
                }
                
                // Añadir tarjeta azul (USANDO POPUP)
                if (e.target.closest('.add-blue-btn')) {
                    this.handleAddCardClick(e, 'blue');
                }
                
                // Quitar tarjeta azul
                if (e.target.closest('.remove-blue-btn')) {
                    this.handleRemoveCard(e, 'blue');
                }
                
                // Reiniciar tarjetas de un jugador
                if (e.target.closest('.reset-cards-btn')) {
                    this.handleResetPlayerCards(e);
                }
                
                // Añadir gol (MANTENIENDO PROMPT SIMPLE)
                if (e.target.closest('.add-goal-btn')) {
                    this.handleAddGoal(e);
                }
            });
        },
        
        // MANEJADOR: Añadir tarjeta (abre popup)
        handleAddCardClick: function(e, cardType) {
            const playerCard = e.target.closest('.player-card');
            const playerId = parseInt(playerCard.dataset.playerId);
            const teamType = playerCard.dataset.team;
            
            this.showCardPopup(playerId, teamType, cardType);
        },
        
        // MANEJADOR: Quitar tarjeta (confirmación simple)
        handleRemoveCard: function(e, cardType) {
            const playerCard = e.target.closest('.player-card');
            const playerId = parseInt(playerCard.dataset.playerId);
            const teamType = playerCard.dataset.team;
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            const player = team.players.find(p => p.id === playerId);
            
            if (!player) return;
            
            const cardProp = cardType === 'yellow' ? 'yellowCards' : 'blueCards';
            const cardColor = cardType === 'yellow' ? 'amarilla' : 'azul';
            const cardEmoji = cardType === 'yellow' ? '🟨' : '🟦';
            
            if (player[cardProp] === 0) return;
            
            if (confirm(`${cardEmoji} ¿Quitar tarjeta ${cardColor} a ${player.name}?\nActualmente tiene: ${player[cardProp]}`)) {
                player[cardProp]--;
                
                // Actualizar UI
                const cardCountClass = cardType === 'yellow' ? 'yellow-cards-count' : 'blue-cards-count';
                const cardClass = cardType === 'yellow' ? 'has-yellow-card' : 'has-blue-card';
                
                playerCard.querySelector(`.${cardCountClass}`).textContent = player[cardProp];
                
                if (player[cardProp] === 0) {
                    playerCard.classList.remove(cardClass);
                    const removeBtn = playerCard.querySelector(`.remove-${cardType}-btn`);
                    if (removeBtn) removeBtn.disabled = true;
                }
                
                // Si son tarjetas amarillas y baja de 2, quitar doble amarilla
                if (cardType === 'yellow' && player.yellowCards < 2) {
                    playerCard.classList.remove('double-yellow');
                }
                
                this.updateGlobalStats();
                this.saveGameState();
                
                this.showNotification(`${cardEmoji} Tarjeta ${cardColor} retirada a ${player.name}. Total: ${player[cardProp]}`);
            }
        },
        
        // MANEJADOR: Editar dorsal
        handleEditDorsal: function(e) {
            const playerCard = e.target.closest('.player-card');
            const playerId = parseInt(playerCard.dataset.playerId);
            const teamType = playerCard.dataset.team;
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            const player = team.players.find(p => p.id === playerId);
            
            if (!player) return;
            
            const newDorsal = prompt('Nuevo número de dorsal (0-99):', player.dorsal);
            if (newDorsal !== null) {
                const dorsalNum = parseInt(newDorsal);
                if (!isNaN(dorsalNum) && dorsalNum >= 0 && dorsalNum <= 99) {
                    const dorsalExists = team.players.some(p => p.id !== playerId && p.dorsal === dorsalNum);
                    if (dorsalExists) {
                        alert(`El dorsal ${dorsalNum} ya está en uso por otro jugador.`);
                        return;
                    }
                    
                    player.dorsal = dorsalNum;
                    playerCard.querySelector('.player-dorsal').textContent = dorsalNum;
                    this.saveGameState();
                    this.showNotification(`Dorsal de ${player.name} cambiado a ${dorsalNum}`);
                } else {
                    alert('El dorsal debe ser un número entre 0 y 99');
                }
            }
        },
        
        // MANEJADOR: Cambiar titular/suplente
        handleToggleStarter: function(e) {
            const playerCard = e.target.closest('.player-card');
            const playerId = parseInt(playerCard.dataset.playerId);
            const teamType = playerCard.dataset.team;
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            const player = team.players.find(p => p.id === playerId);
            
            if (!player) return;
            
            player.isStarter = !player.isStarter;
            playerCard.classList.toggle('substitute', !player.isStarter);
            
            const badge = playerCard.querySelector('.starter-badge');
            if (badge) {
                badge.textContent = player.isStarter ? 'Titular' : 'Suplente';
                badge.className = `starter-badge badge ${player.isStarter ? 'badge-primary' : 'badge-secondary'}`;
            }
            
            this.saveGameState();
            this.showNotification(`${player.name} ahora es ${player.isStarter ? 'titular' : 'suplente'}`);
        },
        
        // MANEJADOR: Editar nombre del jugador
        handleEditName: function(e) {
            const playerCard = e.target.closest('.player-card');
            const playerId = parseInt(playerCard.dataset.playerId);
            const teamType = playerCard.dataset.team;
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            const player = team.players.find(p => p.id === playerId);
            
            if (!player) return;
            
            const newName = prompt('Nuevo nombre del jugador:', player.name);
            if (newName !== null && newName.trim() !== '' && newName !== player.name) {
                const oldName = player.name;
                player.name = newName.trim();
                playerCard.querySelector('.player-name').textContent = player.name;
                this.saveGameState();
                this.showNotification(`Nombre cambiado: "${oldName}" → "${player.name}"`);
            }
        },
        
        // MANEJADOR: Añadir gol (MANTENIENDO PROMPT SIMPLE)
        handleAddGoal: function(e) {
            const playerCard = e.target.closest('.player-card');
            const playerId = parseInt(playerCard.dataset.playerId);
            const teamType = playerCard.dataset.team;
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            const player = team.players.find(p => p.id === playerId);
            
            if (!player) return;
            
            const goals = prompt(`¿Cuántos goles marca ${player.name}?`, "1");
            if (goals !== null) {
                const goalCount = parseInt(goals) || 1;
                
                player.goals = (player.goals || 0) + goalCount;
                team.goals += goalCount;
                
                document.getElementById(`${teamType}-score`).textContent = team.goals;
                this.updateGlobalStats();
                this.saveGameState();
                
                if (typeof window.celebrateGoal === 'function') {
                    window.celebrateGoal(teamType);
                }
                
                this.showNotification(`¡GOOOOOOL! ${player.name} marca ${goalCount} gol(es). Total: ${player.goals}`);
            }
        },
        
        // MANEJADOR: Reiniciar tarjetas de un jugador
        handleResetPlayerCards: function(e) {
            const playerCard = e.target.closest('.player-card');
            const playerId = parseInt(playerCard.dataset.playerId);
            const teamType = playerCard.dataset.team;
            
            this.resetPlayerCards(playerId, teamType);
        },
        
        // REINICIAR TARJETAS DE UN JUGADOR
        resetPlayerCards: function(playerId, teamType) {
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            const player = team.players.find(p => p.id === playerId);
            
            if (!player) return;
            
            if (player.yellowCards === 0 && player.blueCards === 0) {
                this.showNotification(`${player.name} no tiene tarjetas para reiniciar`);
                return;
            }
            
            if (confirm(`¿Reiniciar todas las tarjetas de ${player.name}?`)) {
                player.yellowCards = 0;
                player.blueCards = 0;
                
                const playerCard = document.querySelector(`.player-card[data-player-id="${playerId}"][data-team="${teamType}"]`);
                if (playerCard) {
                    playerCard.querySelector('.yellow-cards-count').textContent = '0';
                    playerCard.querySelector('.blue-cards-count').textContent = '0';
                    playerCard.classList.remove('has-yellow-card', 'has-blue-card', 'double-yellow');
                    
                    const removeYellowBtn = playerCard.querySelector('.remove-yellow-btn');
                    const removeBlueBtn = playerCard.querySelector('.remove-blue-btn');
                    if (removeYellowBtn) removeYellowBtn.disabled = true;
                    if (removeBlueBtn) removeBlueBtn.disabled = true;
                }
                
                this.updateGlobalStats();
                this.saveGameState();
                
                this.showNotification(`Tarjetas de ${player.name} reiniciadas`);
            }
        },
        
        // ACTUALIZAR CONTADORES GLOBALES DEL EQUIPO
        updateTeamCardCounts: function(teamType) {
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            
            team.yellowCards = team.players.reduce((sum, player) => sum + player.yellowCards, 0);
            team.blueCards = team.players.reduce((sum, player) => sum + player.blueCards, 0);
            team.totalCards = team.yellowCards + team.blueCards;
            
            const globalElement = document.querySelector(`.${teamType}-cards-global`);
            if (globalElement) {
                globalElement.innerHTML = `
                    <span class="yellow-card-count">🟨 ${team.yellowCards}</span>
                    <span class="blue-card-count">🟦 ${team.blueCards}</span>
                `;
            }
        },
        
        // ACTUALIZAR ESTADÍSTICAS GLOBALES
        updateGlobalStats: function() {
            document.getElementById('local-score').textContent = this.localTeam.goals;
            document.getElementById('visit-score').textContent = this.visitTeam.goals;
            
            this.updateTeamCardCounts('local');
            this.updateTeamCardCounts('visit');
            
            const totalYellowCards = this.localTeam.yellowCards + this.visitTeam.yellowCards;
            const totalBlueCards = this.localTeam.blueCards + this.visitTeam.blueCards;
            const totalGoals = this.localTeam.goals + this.visitTeam.goals;
            
            const totalDoubleYellows = [
                ...this.localTeam.players.filter(p => p.yellowCards >= 2),
                ...this.visitTeam.players.filter(p => p.yellowCards >= 2)
            ].length;
            
            document.getElementById('total-yellow-cards').textContent = totalYellowCards;
            document.getElementById('total-blue-cards').textContent = totalBlueCards;
            document.getElementById('total-double-yellows').textContent = totalDoubleYellows;
            document.getElementById('total-goals').textContent = totalGoals;
            
            document.getElementById('match-period').textContent = this.period;
        },
        
        // RENDERIZAR EQUIPOS
        renderTeams: function() {
            this.renderTeam('local', this.localTeam);
            this.renderTeam('visit', this.visitTeam);
        },
        
        // RENDERIZAR UN EQUIPO
        renderTeam: function(teamType, team) {
            const container = document.getElementById(`${teamType}-players`);
            if (!container) return;
            
            container.innerHTML = '';
            
            if (team.players.length === 0) {
                this.createDefaultPlayers(teamType);
            }
            
            const sortedPlayers = [...team.players].sort((a, b) => {
                if (a.isStarter !== b.isStarter) return b.isStarter - a.isStarter;
                return a.dorsal - b.dorsal;
            });
            
            sortedPlayers.forEach(player => {
                const playerCard = this.createPlayerCard(player, teamType);
                container.appendChild(playerCard);
            });
        },
        
        // CREAR TARJETA DE JUGADOR
        createPlayerCard: function(player, teamType) {
            const card = document.createElement('div');
            card.className = `player-card ${player.isStarter ? '' : 'substitute'}`;
            card.dataset.playerId = player.id;
            card.dataset.team = teamType;
            
            if (player.yellowCards > 0) card.classList.add('has-yellow-card');
            if (player.blueCards > 0) card.classList.add('has-blue-card');
            if (player.yellowCards >= 2) card.classList.add('double-yellow');
            
            const playerGoals = player.goals || 0;
            const teamName = teamType === 'local' ? this.localTeam.name : this.visitTeam.name;
            
            card.innerHTML = `
                <div class="player-header">
                    <div class="player-info">
                        <div class="player-dorsal">${player.dorsal}</div>
                        <div class="player-details">
                            <div class="player-name">${player.name}</div>
                            <div class="player-stats-small">
                                <span class="badge badge-success">⚽ ${playerGoals}</span>
                                <span class="starter-badge badge ${player.isStarter ? 'badge-primary' : 'badge-secondary'}">
                                    ${player.isStarter ? 'Titular' : 'Suplente'}
                                </span>
                                <span class="team-name badge badge-light">${teamName}</span>
                            </div>
                        </div>
                    </div>
                    <div class="player-actions">
                        <button class="btn btn-sm edit-dorsal-btn" title="Cambiar dorsal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm edit-name-btn" title="Cambiar nombre">
                            <i class="fas fa-user-edit"></i>
                        </button>
                        <button class="btn btn-sm toggle-starter-btn" title="Cambiar titular/suplente">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="player-stats">
                    <div class="stat-item">
                        <span class="stat-label">Tarjetas amarillas:</span>
                        <span class="yellow-cards-count">${player.yellowCards}</span>
                        <button class="btn btn-sm add-yellow-btn">
                            <i class="fas fa-plus"></i> 🟨 Añadir
                        </button>
                        <button class="btn btn-sm btn-dark remove-yellow-btn" ${player.yellowCards === 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i> Quitar
                        </button>
                    </div>
                    
                    <div class="stat-item">
                        <span class="stat-label">Tarjetas azules:</span>
                        <span class="blue-cards-count">${player.blueCards}</span>
                        <button class="btn btn-sm add-blue-btn">
                            <i class="fas fa-plus"></i> 🟦 Añadir
                        </button>
                        <button class="btn btn-sm btn-dark remove-blue-btn" ${player.blueCards === 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i> Quitar
                        </button>
                    </div>
                    
                    <div class="stat-item">
                        <button class="btn btn-sm btn-secondary reset-cards-btn">
                            <i class="fas fa-undo"></i> Reiniciar tarjetas
                        </button>
                        <button class="btn btn-sm btn-info add-goal-btn">
                            <i class="fas fa-futbol"></i> Gol
                        </button>
                    </div>
                </div>
            `;
            
            return card;
        },
        
        // CREAR JUGADORES POR DEFECTO
        createDefaultPlayers: function(teamType) {
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            const teamName = team.name;
            
            // Jugadores titulares (5)
            for (let i = 1; i <= 5; i++) {
                team.players.push({
                    id: Date.now() + i,
                    name: `Jugador ${teamName} ${i}`,
                    dorsal: i,
                    isStarter: true,
                    yellowCards: 0,
                    blueCards: 0,
                    goals: 0
                });
            }
            
            // Jugadores suplentes (5)
            for (let i = 6; i <= 10; i++) {
                team.players.push({
                    id: Date.now() + i,
                    name: `Suplente ${teamName} ${i}`,
                    dorsal: i,
                    isStarter: false,
                    yellowCards: 0,
                    blueCards: 0,
                    goals: 0
                });
            }
        },
        
        // AÑADIR NUEVO JUGADOR
        addNewPlayer: function(teamType) {
            const team = teamType === 'local' ? this.localTeam : this.visitTeam;
            const teamName = team.name;
            
            let nextDorsal = 1;
            const usedDorsals = team.players.map(p => p.dorsal);
            while (usedDorsals.includes(nextDorsal)) {
                nextDorsal++;
            }
            
            const newPlayer = {
                id: Date.now(),
                name: `Nuevo Jugador ${teamName}`,
                dorsal: nextDorsal,
                isStarter: false,
                yellowCards: 0,
                blueCards: 0,
                goals: 0
            };
            
            team.players.push(newPlayer);
            this.renderTeam(teamType, team);
            this.saveGameState();
            
            this.showNotification(`Nuevo jugador añadido al equipo ${teamName} (dorsal ${nextDorsal})`);
        },
        
        // REINICIAR TODAS LAS TARJETAS
        resetAllCards: function() {
            if (!confirm('¿Estás seguro de que quieres reiniciar TODAS las tarjetas de AMBOS equipos?')) {
                return;
            }
            
            this.localTeam.players.forEach(player => {
                player.yellowCards = 0;
                player.blueCards = 0;
            });
            this.localTeam.yellowCards = 0;
            this.localTeam.blueCards = 0;
            
            this.visitTeam.players.forEach(player => {
                player.yellowCards = 0;
                player.blueCards = 0;
            });
            this.visitTeam.yellowCards = 0;
            this.visitTeam.blueCards = 0;
            
            this.renderTeams();
            this.updateGlobalStats();
            this.saveGameState();
            
            this.showNotification('Todas las tarjetas han sido reiniciadas');
        },
        
        // CONFIGURAR CRONÓMETRO
        setupTimer: function() {
            this.matchTime = 0;
            this.updateTimerDisplay();
        },
        
        // INICIAR CRONÓMETRO
        startTimer: function() {
            if (this.isTimerRunning) return;
            
            this.isTimerRunning = true;
            this.matchTimer = setInterval(() => {
                this.matchTime++;
                this.updateTimerDisplay();
            }, 1000);
            
            document.getElementById('start-timer').disabled = true;
            document.getElementById('pause-timer').disabled = false;
            
            this.showNotification('Cronómetro iniciado');
        },
        
        // PAUSAR CRONÓMETRO
        pauseTimer: function() {
            if (!this.isTimerRunning) return;
            
            this.isTimerRunning = false;
            clearInterval(this.matchTimer);
            
            document.getElementById('start-timer').disabled = false;
            document.getElementById('pause-timer').disabled = true;
            
            this.showNotification('Cronómetro pausado');
        },
        
        // REINICIAR CRONÓMETRO
        resetTimer: function() {
            if (confirm('¿Reiniciar el cronómetro a 0:00?')) {
                this.pauseTimer();
                this.matchTime = 0;
                this.updateTimerDisplay();
                this.showNotification('Cronómetro reiniciado');
            }
        },
        
        // SIGUIENTE PERIODO
        nextPeriod: function() {
            if (this.period < this.maxPeriods) {
                this.period++;
                this.pauseTimer();
                this.matchTime = 0;
                this.updateTimerDisplay();
                this.showNotification(`Periodo ${this.period} iniciado`);
            } else {
                this.showNotification('¡Partido finalizado!');
            }
        },
        
        // ACTUALIZAR DISPLAY DEL CRONÓMETRO
        updateTimerDisplay: function() {
            const minutes = Math.floor(this.matchTime / 60);
            const seconds = this.matchTime % 60;
            const timerStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const timerElement = document.getElementById('match-timer');
            if (timerElement) {
                timerElement.textContent = timerStr;
            }
        },
        
        // GUARDAR PARTIDO
        saveMatch: function() {
            const matchData = {
                id: this.currentMatchId || Date.now(),
                date: new Date().toISOString(),
                localTeam: JSON.parse(JSON.stringify(this.localTeam)),
                visitTeam: JSON.parse(JSON.stringify(this.visitTeam)),
                matchTime: this.matchTime,
                period: this.period,
                notes: document.getElementById('match-notes')?.value || ''
            };
            
            const savedMatches = JSON.parse(localStorage.getItem('futbolSalaMatches') || '[]');
            const existingIndex = savedMatches.findIndex(m => m.id === matchData.id);
            
            if (existingIndex >= 0) {
                savedMatches[existingIndex] = matchData;
            } else {
                savedMatches.push(matchData);
            }
            
            localStorage.setItem('futbolSalaMatches', JSON.stringify(savedMatches));
            this.currentMatchId = matchData.id;
            
            this.showNotification('Partido guardado correctamente');
        },
        
        // CARGAR PARTIDO (diálogo)
        loadMatchDialog: function() {
            const savedMatches = JSON.parse(localStorage.getItem('futbolSalaMatches') || '[]');
            
            if (savedMatches.length === 0) {
                alert('No hay partidos guardados');
                return;
            }
            
            const matchList = savedMatches.map(match => 
                `${new Date(match.date).toLocaleDateString()} - ${match.localTeam.name} vs ${match.visitTeam.name}`
            ).join('\n');
            
            const selection = prompt(
                `Partidos guardados:\n\n${matchList}\n\nIngresa el número del partido a cargar (1-${savedMatches.length}):`,
                "1"
            );
            
            if (selection !== null) {
                const index = parseInt(selection) - 1;
                if (index >= 0 && index < savedMatches.length) {
                    this.loadMatch(savedMatches[index]);
                }
            }
        },
        
        // CARGAR PARTIDO
        loadMatch: function(matchData) {
            this.localTeam = matchData.localTeam;
            this.visitTeam = matchData.visitTeam;
            this.matchTime = matchData.matchTime;
            this.period = matchData.period;
            this.currentMatchId = matchData.id;
            
            document.getElementById('local-team-name').textContent = this.localTeam.name;
            document.getElementById('visit-team-name').textContent = this.visitTeam.name;
            document.getElementById('match-notes').value = matchData.notes || '';
            
            this.renderTeams();
            this.updateGlobalStats();
            this.updateTimerDisplay();
            
            this.showNotification('Partido cargado correctamente');
        },
        
        // NUEVO PARTIDO
        newMatch: function() {
            if (!confirm('¿Crear un nuevo partido? Se perderán los cambios no guardados.')) {
                return;
            }
            
            this.localTeam = {
                name: 'Equipo Local',
                players: [],
                goals: 0,
                yellowCards: 0,
                blueCards: 0,
                totalCards: 0
            };
            
            this.visitTeam = {
                name: 'Equipo Visitante',
                players: [],
                goals: 0,
                yellowCards: 0,
                blueCards: 0,
                totalCards: 0
            };
            
            this.matchTime = 0;
            this.period = 1;
            this.isTimerRunning = false;
            this.currentMatchId = null;
            
            clearInterval(this.matchTimer);
            
            document.getElementById('local-team-name').textContent = this.localTeam.name;
            document.getElementById('visit-team-name').textContent = this.visitTeam.name;
            document.getElementById('match-notes').value = '';
            
            this.createDefaultPlayers('local');
            this.createDefaultPlayers('visit');
            this.renderTeams();
            this.updateGlobalStats();
            this.updateTimerDisplay();
            
            document.getElementById('start-timer').disabled = false;
            document.getElementById('pause-timer').disabled = true;
            
            this.showNotification('Nuevo partido creado');
        },
        
        // GUARDAR ESTADO DEL JUEGO
        saveGameState: function() {
            const state = {
                localTeam: this.localTeam,
                visitTeam: this.visitTeam,
                matchTime: this.matchTime,
                period: this.period,
                isTimerRunning: this.isTimerRunning,
                notes: document.getElementById('match-notes')?.value || '',
                currentMatchId: this.currentMatchId
            };
            
            try {
                localStorage.setItem('futbolSalaCurrentGame', JSON.stringify(state));
            } catch (e) {
                console.error('Error al guardar estado:', e);
            }
        },
        
        // CARGAR ESTADO DEL JUEGO
        loadGameState: function() {
            try {
                const saved = localStorage.getItem('futbolSalaCurrentGame');
                if (saved) {
                    const state = JSON.parse(saved);
                    
                    this.localTeam = state.localTeam || this.localTeam;
                    this.visitTeam = state.visitTeam || this.visitTeam;
                    this.matchTime = state.matchTime || 0;
                    this.period = state.period || 1;
                    this.isTimerRunning = false;
                    this.currentMatchId = state.currentMatchId || null;
                    
                    document.getElementById('local-team-name').textContent = this.localTeam.name;
                    document.getElementById('visit-team-name').textContent = this.visitTeam.name;
                    
                    const notesElement = document.getElementById('match-notes');
                    if (notesElement && state.notes) {
                        notesElement.value = state.notes;
                    }
                    
                    if (this.isTimerRunning) {
                        document.getElementById('start-timer').disabled = true;
                        document.getElementById('pause-timer').disabled = false;
                    } else {
                        document.getElementById('start-timer').disabled = false;
                        document.getElementById('pause-timer').disabled = true;
                    }
                    
                    this.updateTimerDisplay();
                } else {
                    this.createDefaultPlayers('local');
                    this.createDefaultPlayers('visit');
                }
            } catch (e) {
                console.error('Error al cargar estado:', e);
                this.createDefaultPlayers('local');
                this.createDefaultPlayers('visit');
            }
        },
        
        // MOSTRAR NOTIFICACIÓN
        showNotification: function(message) {
            const notification = document.getElementById('notification');
            const notificationText = document.getElementById('notification-text');
            
            if (notification && notificationText) {
                notificationText.textContent = message;
                notification.classList.add('show');
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 3000);
            }
        }
    };
    
    // Exponer al ámbito global
    window.futbolSala = futbolSala;
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => futbolSala.init());
    } else {
        futbolSala.init();
    }
    
    console.log('Fútbol Sala Manager con popups personalizados cargado');
})();
