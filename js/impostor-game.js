// impostor/js/impostor-game.js
// Lógica completa del juego del impostor

const impostorGame = {
    // Estado del juego
    gameState: 'roles', // 'roles', 'playing', 'voting', 'results'
    players: [],
    impostors: [],
    currentWord: '',
    currentHint: '',
    gameSettings: null,
    
    // Temporizadores
    gameTimer: null,
    votingTimer: null,
    timeRemaining: 0,
    votingTime: 30,
    
    // Control de jugadores
    currentPlayerIndex: 0,
    playersRevealed: [],
    currentVote: null,
    votes: [],
    eliminatedPlayers: [],
    
    // Resultados
    gameResult: null,
    correctVotes: 0,
    totalVotes: 0,
    
    // Sonidos
    sounds: {
        reveal: null,
        vote: null,
        win: null,
        lose: null,
        timer: null
    },
    
    init() {
        console.log('=== IMPOSTOR GAME INICIADO ===');
        
        // Cargar configuración
        this.loadGameSettings();
        
        // Inicializar juego
        this.initializeGame();
        
        // Configurar listeners
        this.setupEventListeners();
        
        // Inicializar sonidos
        this.initSounds();
        
        console.log('Juego inicializado correctamente');
    },
    
    loadGameSettings() {
        try {
            // Intentar cargar desde sessionStorage primero (datos frescos)
            const gameData = sessionStorage.getItem('impostor_current_game');
            if (gameData) {
                const parsed = JSON.parse(gameData);
                this.gameSettings = parsed.settings || parsed;
            } 
            // Si no, cargar desde localStorage
            else if (localStorage.getItem('impostor_current_settings')) {
                this.gameSettings = JSON.parse(localStorage.getItem('impostor_current_settings'));
            } 
            // Si no hay nada, usar configuración por defecto
            else {
                this.gameSettings = {
                    playerCount: 6,
                    impostorCount: 1,
                    timeLimit: 5,
                    category: 'all',
                    difficulty: 'mixto',
                    enableTimer: true,
                    enableSound: true,
                    autoSave: true
                };
            }
            
            console.log('Configuración cargada:', this.gameSettings);
        } catch (e) {
            console.error('Error al cargar configuración:', e);
            this.gameSettings = {
                playerCount: 6,
                impostorCount: 1,
                timeLimit: 5,
                category: 'all',
                difficulty: 'mixto',
                enableTimer: true,
                enableSound: true,
                autoSave: true
            };
        }
    },
    
    initializeGame() {
        // Seleccionar palabra aleatoria
        this.selectRandomWord();
        
        // Crear lista de jugadores
        this.createPlayers();
        
        // Asignar roles aleatoriamente
        this.assignRoles();
        
        // Inicializar estado de revelación
        this.playersRevealed = new Array(this.players.length).fill(false);
        
        // Mostrar pantalla de roles
        this.showScreen('role-screen');
        this.updateRoleDisplay();
        
        // Actualizar estadísticas
        this.updateGameStats();
    },
    
    selectRandomWord() {
        if (!window.impostorData || !window.impostorData.getWords) {
            console.error('Datos del juego no disponibles');
            this.currentWord = 'ERROR';
            this.currentHint = 'Error cargando datos';
            return;
        }
        
        try {
            // Obtener palabras filtradas
            const words = window.impostorData.getWords(
                this.gameSettings.category,
                this.gameSettings.difficulty
            );
            
            if (!words || words.length === 0) {
                console.warn('No hay palabras disponibles, usando palabras por defecto');
                // Usar palabras de emergencia
                const emergencyWords = [
                    { palabra: "Fútbol", pista: "Deporte con balón", categoria: "deportes", dificultad: "facil" },
                    { palabra: "Perro", pista: "Animal que ladra", categoria: "animales", dificultad: "facil" },
                    { palabra: "Pizza", pista: "Comida italiana", categoria: "comida", dificultad: "facil" }
                ];
                
                const randomIndex = Math.floor(Math.random() * emergencyWords.length);
                this.currentWord = emergencyWords[randomIndex].palabra;
                this.currentHint = emergencyWords[randomIndex].pista;
                return;
            }
            
            // Seleccionar palabra aleatoria
            const randomIndex = Math.floor(Math.random() * words.length);
            const selectedWord = words[randomIndex];
            
            this.currentWord = selectedWord.palabra;
            this.currentHint = selectedWord.pista;
            
            console.log('Palabra seleccionada:', this.currentWord);
            console.log('Pista para impostor:', this.currentHint);
            
        } catch (e) {
            console.error('Error al seleccionar palabra:', e);
            this.currentWord = 'ERROR';
            this.currentHint = 'Error inesperado';
        }
    },
    
    createPlayers() {
        this.players = [];
        
        for (let i = 0; i < this.gameSettings.playerCount; i++) {
            this.players.push({
                id: i + 1,
                name: `Jugador ${i + 1}`,
                role: 'innocent', // Se asignará después
                revealed: false,
                eliminated: false,
                votedFor: null,
                votesReceived: 0,
                guessedCorrectly: false
            });
        }
    },
    
    assignRoles() {
        const impostorCount = this.gameSettings.impostorCount;
        
        // Resetear todos a inocentes
        this.players.forEach(player => {
            player.role = 'innocent';
        });
        
        // Seleccionar impostores aleatorios
        this.impostors = [];
        const availableIndices = [...Array(this.players.length).keys()];
        
        for (let i = 0; i < impostorCount; i++) {
            if (availableIndices.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            const playerIndex = availableIndices[randomIndex];
            
            this.players[playerIndex].role = 'impostor';
            this.impostors.push(this.players[playerIndex]);
            
            // Remover del array de disponibles
            availableIndices.splice(randomIndex, 1);
        }
        
        console.log('Impostores asignados:', this.impostors.map(p => p.name));
    },
    
    updateRoleDisplay() {
        if (this.currentPlayerIndex >= this.players.length) {
            console.error('Índice de jugador inválido');
            return;
        }
        
        const player = this.players[this.currentPlayerIndex];
        const hasRevealed = this.playersRevealed[this.currentPlayerIndex];
        
        // Actualizar información del jugador
        document.getElementById('role-title').textContent = player.name;
        document.getElementById('current-player').textContent = this.currentPlayerIndex + 1;
        document.getElementById('total-players').textContent = this.players.length;
        document.getElementById('total-players-2').textContent = this.players.length;
        
        // Actualizar contador de revelados
        const revealedCount = this.playersRevealed.filter(r => r).length;
        document.getElementById('players-revealed').textContent = revealedCount;
        
        // Actualizar barra de progreso
        const progress = ((this.currentPlayerIndex + 1) / this.players.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Configurar según si ya reveló o no
        const secretValue = document.getElementById('secret-value');
        const secretHint = document.getElementById('secret-hint');
        const roleIcon = document.getElementById('role-icon');
        const roleSubtitle = document.getElementById('role-subtitle');
        const secretLabel = document.getElementById('secret-label');
        const revealBtn = document.getElementById('reveal-role');
        const nextBtn = document.getElementById('next-player-btn');
        
        if (hasRevealed) {
            // Jugador ya reveló su rol
            secretValue.classList.remove('hidden-secret');
            secretHint.style.display = 'block';
            
            if (player.role === 'impostor') {
                // Es impostor
                roleIcon.className = 'role-icon impostor';
                roleIcon.innerHTML = '<i class="fas fa-user-secret"></i>';
                roleSubtitle.textContent = '¡Eres el IMPOSTOR!';
                roleSubtitle.style.color = '#ff4081';
                
                secretValue.textContent = this.currentHint;
                secretValue.className = 'secret-value hint-secret';
                secretLabel.textContent = 'Pista para el impostor:';
                secretHint.innerHTML = '<small><i class="fas fa-lightbulb"></i> Solo tú ves esta pista</small>';
                
            } else {
                // Es ciudadano
                roleIcon.className = 'role-icon innocent';
                roleIcon.innerHTML = '<i class="fas fa-user-check"></i>';
                roleSubtitle.textContent = 'Eres un CIUDADANO';
                roleSubtitle.style.color = '#4CAF50';
                
                secretValue.textContent = this.currentWord;
                secretValue.className = 'secret-value word-secret';
                secretLabel.textContent = 'Palabra secreta:';
                secretHint.innerHTML = '<small><i class="fas fa-key"></i> Los ciudadanos ven esta palabra</small>';
            }
            
            revealBtn.disabled = true;
            revealBtn.innerHTML = '<i class="fas fa-check"></i> Rol Revelado';
            nextBtn.disabled = false;
            
        } else {
            // Jugador aún no ha revelado
            secretValue.classList.add('hidden-secret');
            secretHint.style.display = 'none';
            
            roleIcon.className = 'role-icon';
            roleIcon.innerHTML = '<i class="fas fa-user"></i>';
            roleSubtitle.textContent = 'Toca para revelar tu rol';
            roleSubtitle.style.color = '';
            
            secretValue.textContent = 'TOCA PARA REVELAR';
            secretValue.className = 'secret-value hidden-secret';
            secretLabel.textContent = 'Tu información secreta:';
            
            revealBtn.disabled = false;
            revealBtn.innerHTML = '<i class="fas fa-eye"></i> Revelar Mi Rol';
            nextBtn.disabled = true;
        }
    },
    
    setupEventListeners() {
        // Botones de la pantalla de roles
        document.getElementById('reveal-role')?.addEventListener('click', () => {
            this.revealCurrentPlayerRole();
        });
        
        document.getElementById('next-player-btn')?.addEventListener('click', () => {
            this.goToNextPlayer();
        });
        
        // Botones del juego principal
        document.getElementById('start-voting-btn')?.addEventListener('click', () => {
            this.startVoting();
        });
        
        document.getElementById('end-game-btn')?.addEventListener('click', () => {
            this.showConfirm('¿Terminar la partida ahora?', () => {
                this.endGame('timeout');
            });
        });
        
        document.getElementById('reveal-impostor-btn')?.addEventListener('click', () => {
            this.showConfirm('¿Revelar al impostor y terminar el juego? (Solo moderador)', () => {
                this.revealImpostor();
            });
        });
        
        // Botones de votación
        document.getElementById('submit-vote-btn')?.addEventListener('click', () => {
            this.submitVote();
        });
        
        document.getElementById('skip-vote-btn')?.addEventListener('click', () => {
            this.skipVote();
        });
        
        // Botones de resultados
        document.getElementById('play-again-btn')?.addEventListener('click', () => {
            this.playAgain();
        });
        
        document.getElementById('save-game-btn')?.addEventListener('click', () => {
            this.saveGame();
        });
        
        document.getElementById('share-results-btn')?.addEventListener('click', () => {
            this.shareResults();
        });
        
        document.getElementById('back-to-menu-btn')?.addEventListener('click', () => {
            this.showConfirm('¿Volver al menú principal? Se perderá el progreso actual.', () => {
                window.location.href = 'index.html';
            });
        });
        
        // También manejar clic en el secreto oculto
        document.getElementById('secret-value')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('hidden-secret')) {
                this.revealCurrentPlayerRole();
            }
        });
    },
    
    revealCurrentPlayerRole() {
        const player = this.players[this.currentPlayerIndex];
        
        // Marcar como revelado
        this.playersRevealed[this.currentPlayerIndex] = true;
        
        // Reproducir sonido
        this.playSound('reveal');
        
        // Actualizar display
        this.updateRoleDisplay();
        
        console.log(`${player.name} ha revelado su rol: ${player.role}`);
    },
    
    goToNextPlayer() {
        // Avanzar al siguiente jugador
        this.currentPlayerIndex++;
        
        // Si hemos pasado por todos los jugadores, comenzar el juego
        if (this.currentPlayerIndex >= this.players.length) {
            this.startGame();
            return;
        }
        
        // Actualizar display para el nuevo jugador
        this.updateRoleDisplay();
    },
    
    startGame() {
        this.gameState = 'playing';
        this.showScreen('game-screen');
        
        // Inicializar tiempo
        this.timeRemaining = this.gameSettings.timeLimit * 60;
        this.updateTimerDisplay();
        
        // Iniciar temporizador si está activado
        if (this.gameSettings.enableTimer) {
            this.startGameTimer();
        }
        
        // Actualizar información en pantalla
        this.updateGameScreen();
        
        // Reproducir sonido de inicio
        this.playSound('reveal');
        
        console.log('¡Juego comenzado!');
    },
    
    startGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        this.gameTimer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            // Cambiar color cuando quede poco tiempo
            if (this.timeRemaining <= 60) {
                document.getElementById('timer-display').classList.add('timer-warning');
                
                // Reproducer sonido de alerta cada 10 segundos
                if (this.timeRemaining % 10 === 0 && this.timeRemaining > 0) {
                    this.playSound('timer');
                }
            }
            
            // Finalizar si se acaba el tiempo
            if (this.timeRemaining <= 0) {
                clearInterval(this.gameTimer);
                this.endGame('timeout');
            }
        }, 1000);
    },
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-display').textContent = display;
    },
    
    updateGameScreen() {
        // Actualizar palabra del jugador actual (si es ciudadano)
        const currentPlayer = this.players[this.currentPlayerIndex - 1] || this.players[0];
        const playerWord = document.getElementById('player-word');
        
        if (currentPlayer.role === 'innocent') {
            playerWord.textContent = this.currentWord;
            playerWord.className = 'secret-value word-secret';
        } else {
            playerWord.textContent = this.currentHint;
            playerWord.className = 'secret-value hint-secret';
        }
        
        // Actualizar estadísticas
        document.getElementById('players-remaining').textContent = this.players.length;
        document.getElementById('impostors-remaining').textContent = this.impostors.length;
        document.getElementById('time-limit-display').textContent = `${this.gameSettings.timeLimit} minutos`;
        
        // Actualizar lista de jugadores
        this.updatePlayersGrid();
    },
    
    updatePlayersGrid() {
        const grid = document.getElementById('players-grid');
        if (!grid) return;
        
        let html = '';
        
        this.players.forEach(player => {
            const isImpostor = player.role === 'impostor';
            const isEliminated = player.eliminated;
            
            html += `
                <div class="player-vote-card ${isEliminated ? 'eliminated' : ''}">
                    <div class="player-icon">
                        ${isImpostor ? 
                            '<i class="fas fa-user-secret"></i>' : 
                            '<i class="fas fa-user-check"></i>'}
                    </div>
                    <div class="player-name">${player.name}</div>
                    <div class="player-status">
                        ${isEliminated ? 'ELIMINADO' : 'ACTIVO'}
                    </div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
    },
    
    startVoting() {
        this.gameState = 'voting';
        this.showScreen('voting-screen');
        
        // Reiniciar votación
        this.currentVote = null;
        this.votes = [];
        
        // Configurar temporizador de votación
        this.votingTime = 30;
        document.getElementById('voting-timer').textContent = '00:30';
        
        // Iniciar temporizador
        this.startVotingTimer();
        
        // Crear opciones de votación
        this.createVotingOptions();
        
        // Actualizar lista de votos
        this.updateVotesList();
        
        console.log('Votación iniciada');
    },
    
    startVotingTimer() {
        if (this.votingTimer) {
            clearInterval(this.votingTimer);
        }
        
        this.votingTimer = setInterval(() => {
            this.votingTime--;
            const display = `00:${this.votingTime.toString().padStart(2, '0')}`;
            document.getElementById('voting-timer').textContent = display;
            
            // Finalizar votación si se acaba el tiempo
            if (this.votingTime <= 0) {
                clearInterval(this.votingTimer);
                this.finishVoting();
            }
        }, 1000);
    },
    
    createVotingOptions() {
        const grid = document.getElementById('voting-players-grid');
        if (!grid) return;
        
        let html = '';
        
        this.players.forEach(player => {
            if (player.eliminated) return;
            
            html += `
                <div class="player-vote-card" data-player-id="${player.id}">
                    <div class="player-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="player-name">${player.name}</div>
                    <div class="vote-indicator">○</div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
        
        // Añadir event listeners a las cartas
        document.querySelectorAll('.player-vote-card[data-player-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                const playerId = parseInt(card.dataset.playerId);
                this.selectVote(playerId);
            });
        });
    },
    
    selectVote(playerId) {
        // No permitir cambiar voto si ya se votó
        const existingVote = this.votes.find(v => v.voter === this.getCurrentVoterId());
        if (existingVote) {
            return;
        }
        
        this.currentVote = playerId;
        
        // Actualizar UI
        document.querySelectorAll('.player-vote-card').forEach(card => {
            card.classList.remove('selected');
            const indicator = card.querySelector('.vote-indicator');
            if (indicator) indicator.textContent = '○';
        });
        
        const selectedCard = document.querySelector(`.player-vote-card[data-player-id="${playerId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            const indicator = selectedCard.querySelector('.vote-indicator');
            if (indicator) indicator.textContent = '✓';
        }
        
        // Habilitar botón de enviar
        document.getElementById('submit-vote-btn').disabled = false;
    },
    
    getCurrentVoterId() {
        // En un juego real, esto identificaría al jugador actual votando
        // Por ahora, usamos un identificador simple
        return `voter_${this.votes.length}`;
    },
    
    submitVote() {
        if (!this.currentVote) return;
        
        const voterId = this.getCurrentVoterId();
        const votedPlayer = this.players.find(p => p.id === this.currentVote);
        
        if (!votedPlayer) return;
        
        // Registrar voto
        const vote = {
            voter: voterId,
            votedPlayerId: this.currentVote,
            votedPlayerName: votedPlayer.name,
            timestamp: Date.now()
        };
        
        this.votes.push(vote);
        votedPlayer.votesReceived++;
        
        // Reproducir sonido
        this.playSound('vote');
        
        // Mostrar resultado inmediato
        this.showVoteResult(votedPlayer);
        
        // Actualizar lista de votos
        this.updateVotesList();
        
        // Deshabilitar botón y limpiar selección
        document.getElementById('submit-vote-btn').disabled = true;
        this.currentVote = null;
        
        // Verificar si todos han votado
        if (this.votes.length >= this.players.length - this.eliminatedPlayers.length) {
            setTimeout(() => {
                this.finishVoting();
            }, 3000);
        }
    },
    
    showVoteResult(votedPlayer) {
        const resultDiv = document.getElementById('vote-result');
        const isImpostor = votedPlayer.role === 'impostor';
        
        resultDiv.style.display = 'block';
        resultDiv.style.background = isImpostor ? 
            'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)';
        resultDiv.style.border = isImpostor ? 
            '2px solid #4CAF50' : '2px solid #f44336';
        
        resultDiv.innerHTML = `
            <h3>${isImpostor ? '✅ ¡CORRECTO!' : '❌ ¡INCORRECTO!'}</h3>
            <p><strong>${votedPlayer.name}</strong> era ${isImpostor ? 'el IMPOSTOR' : 'un CIUDADANO INOCENTE'}</p>
            <p>${isImpostor ? 
                '¡Has descubierto al impostor!' : 
                'Era un ciudadano inocente. ¡El impostor sigue libre!'}</p>
        `;
        
        // Marcar si se adivinó correctamente
        // (En un juego real, necesitaríamos saber quién votó)
        
        // Si se votó a un impostor, eliminarlo
        if (isImpostor) {
            votedPlayer.eliminated = true;
            this.eliminatedPlayers.push(votedPlayer);
            
            // Verificar si ganaron los ciudadanos
            const remainingImpostors = this.impostors.filter(i => !i.eliminated);
            if (remainingImpostors.length === 0) {
                setTimeout(() => {
                    this.endGame('innocent_win');
                }, 3000);
                return;
            }
        }
        
        // Ocultar resultado después de 3 segundos
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 3000);
    },
    
    updateVotesList() {
        const list = document.getElementById('current-votes-list');
        if (!list) return;
        
        if (this.votes.length === 0) {
            list.innerHTML = '<p style="text-align: center; opacity: 0.7;">Aún no hay votos</p>';
            return;
        }
        
        let html = '';
        this.votes.forEach(vote => {
            const votedPlayer = this.players.find(p => p.id === vote.votedPlayerId);
            const isImpostor = votedPlayer?.role === 'impostor';
            
            html += `
                <div class="vote-item">
                    <span>Voto por <strong>${vote.votedPlayerName}</strong></span>
                    <span class="vote-result ${isImpostor ? 'vote-correct' : 'vote-incorrect'}">
                        ${isImpostor ? 'IMPOSTOR ✓' : 'INOCENTE ✗'}
                    </span>
                </div>
            `;
        });
        
        list.innerHTML = html;
    },
    
    skipVote() {
        const voterId = this.getCurrentVoterId();
        
        // Registrar voto en blanco
        this.votes.push({
            voter: voterId,
            votedPlayerId: null,
            votedPlayerName: 'Nadie',
            timestamp: Date.now()
        });
        
        // Actualizar lista de votos
        this.updateVotesList();
        
        // Verificar si todos han votado
        if (this.votes.length >= this.players.length - this.eliminatedPlayers.length) {
            setTimeout(() => {
                this.finishVoting();
            }, 1000);
        }
    },
    
    finishVoting() {
        clearInterval(this.votingTimer);
        
        // Encontrar jugador más votado
        let maxVotes = 0;
        let mostVotedPlayers = [];
        
        this.players.forEach(player => {
            if (player.votesReceived > maxVotes) {
                maxVotes = player.votesReceived;
                mostVotedPlayers = [player];
            } else if (player.votesReceived === maxVotes && maxVotes > 0) {
                mostVotedPlayers.push(player);
            }
        });
        
        // Determinar resultado
        if (mostVotedPlayers.length === 0 || mostVotedPlayers.length > 1) {
            // Empate o sin votos válidos
            this.endGame('impostor_win');
        } else {
            const eliminatedPlayer = mostVotedPlayers[0];
            
            if (eliminatedPlayer.role === 'impostor') {
                // Verificar si quedan impostores
                const remainingImpostors = this.impostors.filter(i => !i.eliminated);
                
                if (remainingImpostors.length === 0) {
                    this.endGame('innocent_win');
                } else {
                    this.endGame('impostor_win');
                }
            } else {
                this.endGame('impostor_win');
            }
        }
    },
    
    revealImpostor() {
        // El moderador revela al impostor automáticamente
        this.endGame('innocent_win');
    },
    
    endGame(resultType) {
        this.gameState = 'results';
        
        // Detener todos los temporizadores
        if (this.gameTimer) clearInterval(this.gameTimer);
        if (this.votingTimer) clearInterval(this.votingTimer);
        
        // Determinar resultado
        let resultMessage = '';
        let isInnocentWin = false;
        
        switch(resultType) {
            case 'innocent_win':
                resultMessage = '¡LOS CIUDADANOS GANAN!';
                isInnocentWin = true;
                this.playSound('win');
                break;
                
            case 'impostor_win':
                resultMessage = '¡EL IMPOSTOR GANA!';
                isInnocentWin = false;
                this.playSound('lose');
                break;
                
            case 'timeout':
                resultMessage = '¡SE ACABÓ EL TIEMPO! El impostor gana.';
                isInnocentWin = false;
                this.playSound('lose');
                break;
        }
        
        // Mostrar pantalla de resultados
        this.showResults(isInnocentWin, resultMessage);
        
        // Guardar juego automáticamente si está configurado
        if (this.gameSettings.autoSave) {
            setTimeout(() => {
                this.saveGame();
            }, 1000);
        }
    },
    
    showResults(isInnocentWin, resultMessage) {
        this.showScreen('results-screen');
        
        // Actualizar banner de resultado
        const banner = document.getElementById('result-banner');
        banner.className = `result-banner ${isInnocentWin ? 'innocent-win' : 'impostor-win'}`;
        banner.innerHTML = `
            <i class="fas fa-${isInnocentWin ? 'user-check' : 'user-secret'}"></i>
            <div>${resultMessage}</div>
        `;
        
        // Calcular estadísticas
        const totalVotes = this.votes.length;
        const correctVotes = this.votes.filter(vote => {
            const votedPlayer = this.players.find(p => p.id === vote.votedPlayerId);
            return votedPlayer && votedPlayer.role === 'impostor';
        }).length;
        
        // Actualizar detalles
        document.getElementById('result-word').textContent = this.currentWord;
        document.getElementById('result-hint').textContent = this.currentHint;
        document.getElementById('result-players').textContent = this.players.length;
        document.getElementById('result-impostors').textContent = 
            this.impostors.map(i => i.name).join(', ');
        document.getElementById('result-duration').textContent = 
            `${this.gameSettings.timeLimit} minutos`;
        document.getElementById('result-correct-votes').textContent = 
            `${correctVotes} de ${totalVotes} votos`;
        
        // Actualizar resultados por jugador
        this.updatePlayerResults();
    },
    
    updatePlayerResults() {
        const container = document.getElementById('players-results');
        if (!container) return;
        
        let html = '';
        
        this.players.forEach(player => {
            const isImpostor = player.role === 'impostor';
            const voteResult = player.votesReceived > 0 ? 
                `Recibió ${player.votesReceived} voto(s)` : 'No recibió votos';
            
            html += `
                <div class="player-result ${isImpostor ? 'impostor' : 'innocent'}">
                    <div>
                        <strong>${player.name}</strong>
                        <div class="player-role">${isImpostor ? 'IMPOSTOR' : 'CIUDADANO'}</div>
                    </div>
                    <div>
                        <div class="vote-result">
                            ${voteResult}
                        </div>
                        ${player.eliminated ? '<div class="eliminated-badge">ELIMINADO</div>' : ''}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    saveGame() {
        if (!window.impostorStorage || typeof window.impostorStorage.saveGame !== 'function') {
            console.warn('No se puede guardar el juego: storage no disponible');
            return;
        }
        
        try {
            const gameData = {
                date: new Date().toLocaleString('es-ES'),
                timestamp: Date.now(),
                players: this.players.length,
                impostors: this.impostors.length,
                word: this.currentWord,
                hint: this.currentHint,
                result: this.gameResult === 'innocent_win' ? 'Ciudadanos ganan' : 'Impostor gana',
                duration: this.gameSettings.timeLimit,
                impostorNames: this.impostors.map(i => i.name).join(', '),
                category: this.gameSettings.category,
                difficulty: this.gameSettings.difficulty
            };
            
            window.impostorStorage.saveGame(gameData);
            console.log('Partida guardada en el historial');
            
            // Mostrar notificación
            this.showNotification('Partida guardada en el historial', 'success');
            
        } catch (e) {
            console.error('Error al guardar el juego:', e);
            this.showNotification('Error al guardar la partida', 'error');
        }
    },
    
    playAgain() {
        if (confirm('¿Iniciar una nueva partida con la misma configuración?')) {
            // Limpiar datos temporales
            sessionStorage.removeItem('impostor_current_game');
            
            // Reiniciar juego
            this.initializeGame();
        }
    },
    
    shareResults() {
        const isInnocentWin = this.gameResult === 'innocent_win';
        const impostorNames = this.impostors.map(i => i.name).join(', ');
        
        const shareText = `🎮 RESULTADO DEL JUEGO DEL IMPOSTOR 🎮

🏆 ${isInnocentWin ? '¡CIUDADANOS GANAN! 😇' : '¡IMPOSTOR GANA! 👿'}

📊 DETALLES:
• Jugadores: ${this.players.length}
• Impostor(es): ${impostorNames}
• Palabra secreta: "${this.currentWord}"
• Pista del impostor: "${this.currentHint}"
• Duración: ${this.gameSettings.timeLimit} minutos

👥 ROLES:
${this.players.map(p => `• ${p.name}: ${p.role === 'impostor' ? 'IMPOSTOR 👿' : 'CIUDADANO 😇'}`).join('\n')}

🔗 Juego del Impostor - Liga Escolar`;

        // Mostrar modal de compartir
        const textarea = document.getElementById('share-text');
        const modal = document.getElementById('share-modal');
        
        textarea.value = shareText;
        modal.style.display = 'flex';
    },
    
    showScreen(screenId) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar la pantalla solicitada
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            
            // Scroll al inicio
            window.scrollTo(0, 0);
        }
    },
    
    updateGameStats() {
        // Actualizar estadísticas generales
        const remainingImpostors = this.impostors.filter(i => !i.eliminated).length;
        const remainingPlayers = this.players.filter(p => !p.eliminated).length;
        
        // Actualizar UI si existe
        if (document.getElementById('impostors-remaining')) {
            document.getElementById('impostors-remaining').textContent = remainingImpostors;
        }
        
        if (document.getElementById('players-remaining')) {
            document.getElementById('players-remaining').textContent = remainingPlayers;
        }
    },
    
    initSounds() {
        // Crear sonidos simples usando el Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Sonido de revelación
            this.sounds.reveal = () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // Do
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // Mi
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
            };
            
            // Sonido de voto
            this.sounds.vote = () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime); // Sol
                
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
            };
            
            // Sonido de victoria
            this.sounds.win = () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // Do
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // Mi
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // Sol
                oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3); // Do alto
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);
            };
            
            // Sonido de derrota
            this.sounds.lose = () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // Do
                oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime + 0.1); // Sol bajo
                oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime + 0.2); // Do bajo
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.4);
            };
            
            // Sonido de temporizador
            this.sounds.timer = () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime); // Mi
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
            };
            
        } catch (e) {
            console.warn('No se pudieron inicializar los sonidos:', e);
            
            // Fallback a funciones vacías
            Object.keys(this.sounds).forEach(key => {
                this.sounds[key] = () => {};
            });
        }
    },
    
    playSound(soundName) {
        // Solo reproducir si los sonidos están activados
        if (!this.gameSettings.enableSound) return;
        
        if (this.sounds[soundName] && typeof this.sounds[soundName] === 'function') {
            try {
                this.sounds[soundName]();
            } catch (e) {
                console.warn('Error al reproducir sonido:', e);
            }
        }
    },
    
    showConfirm(message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const title = document.getElementById('modal-title');
        const msg = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        if (!modal || !title || !msg) {
            // Fallback simple
            if (confirm(message)) {
                onConfirm();
            }
            return;
        }
        
        title.textContent = 'Confirmar acción';
        msg.textContent = message;
        
        // Configurar botones
        const handleConfirm = () => {
            modal.style.display = 'none';
            onConfirm();
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        const handleCancel = () => {
            modal.style.display = 'none';
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        
        // Mostrar modal
        modal.style.display = 'flex';
    },
    
    showNotification(message, type = 'info') {
        // Usar notificación común si existe
        if (window.common && window.common.showNotification) {
            window.common.showNotification(message, type);
        } else {
            // Fallback simple
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
};

// Hacer accesible globalmente
window.impostorGame = impostorGame;
