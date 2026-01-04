// [file name]: impostor/js/impostor.js
// Lógica principal del juego del impostor

const impostorGame = {
    // Estado del juego
    gameState: 'setup', // 'setup', 'roles', 'playing', 'voting', 'results'
    players: [],
    impostors: [],
    currentWord: '',
    currentHint: '',
    gameSettings: {
        playerCount: 6,
        impostorCount: 1,
        timeLimit: 5, // minutos
        category: 'all',
        enableHints: true,
        enableVoting: true,
        randomRoles: true
    },
    timer: null,
    timeRemaining: 0,
    votingTime: 30, // segundos
    gameHistory: [],
    
    // Inicialización
    init() {
        console.log('Inicializando Juego del Impostor');
        
        // Cargar datos
        this.loadGameData();
        
        // Cargar historial
        this.loadHistory();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Mostrar pantalla de configuración
        this.showScreen('setup');
        
        // Actualizar contador de palabras
        this.updateWordCount();
    },
    
    // Cargar datos del juego
    loadGameData() {
        // Esto se cargará desde impostor-data.js
        if (typeof window.impostorData !== 'undefined') {
            this.gameData = window.impostorData.getGameData();
            console.log('Datos del juego cargados:', this.gameData.palabras.length, 'palabras disponibles');
        }
    },
    
    // Configurar event listeners
    setupEventListeners() {
        // Configuración
        document.getElementById('playerCount').addEventListener('input', (e) => {
            this.updatePlayerCount(parseInt(e.target.value));
        });
        
        document.getElementById('playerRange').addEventListener('input', (e) => {
            document.getElementById('playerCount').value = e.target.value;
            this.updatePlayerCount(parseInt(e.target.value));
        });
        
        document.getElementById('decrease-players').addEventListener('click', () => {
            let value = parseInt(document.getElementById('playerCount').value) - 1;
            if (value < 3) value = 3;
            document.getElementById('playerCount').value = value;
            document.getElementById('playerRange').value = value;
            this.updatePlayerCount(value);
        });
        
        document.getElementById('increase-players').addEventListener('click', () => {
            let value = parseInt(document.getElementById('playerCount').value) + 1;
            if (value > 12) value = 12;
            document.getElementById('playerCount').value = value;
            document.getElementById('playerRange').value = value;
            this.updatePlayerCount(value);
        });
        
        document.getElementById('impostorCount').addEventListener('input', (e) => {
            this.updateImpostorCount(parseInt(e.target.value));
        });
        
        document.getElementById('impostorRange').addEventListener('input', (e) => {
            document.getElementById('impostorCount').value = e.target.value;
            this.updateImpostorCount(parseInt(e.target.value));
        });
        
        document.getElementById('decrease-impostors').addEventListener('click', () => {
            let value = parseInt(document.getElementById('impostorCount').value) - 1;
            if (value < 1) value = 1;
            document.getElementById('impostorCount').value = value;
            document.getElementById('impostorRange').value = value;
            this.updateImpostorCount(value);
        });
        
        document.getElementById('increase-impostors').addEventListener('click', () => {
            let value = parseInt(document.getElementById('impostorCount').value) + 1;
            if (value > 3) value = 3;
            document.getElementById('impostorCount').value = value;
            document.getElementById('impostorRange').value = value;
            this.updateImpostorCount(value);
        });
        
        document.getElementById('timeLimit').addEventListener('input', (e) => {
            this.updateTimeLimit(parseInt(e.target.value));
        });
        
        document.getElementById('timeRange').addEventListener('input', (e) => {
            document.getElementById('timeLimit').value = e.target.value;
            this.updateTimeLimit(parseInt(e.target.value));
        });
        
        document.getElementById('wordCategory').addEventListener('change', (e) => {
            this.gameSettings.category = e.target.value;
            this.updateWordCount();
        });
        
        // Botones de control
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('quick-start').addEventListener('click', () => this.quickStart());
        document.getElementById('next-player').addEventListener('click', () => this.nextPlayer());
        document.getElementById('prev-player').addEventListener('click', () => this.prevPlayer());
        document.getElementById('all-done').addEventListener('click', () => this.startPlaying());
        document.getElementById('start-vote').addEventListener('click', () => this.startVoting());
        document.getElementById('end-game').addEventListener('click', () => this.endGame());
        document.getElementById('reveal-impostor').addEventListener('click', () => this.revealImpostor());
        document.getElementById('skip-vote').addEventListener('click', () => this.skipVoting());
        document.getElementById('submit-votes').addEventListener('click', () => this.submitVotes());
        document.getElementById('play-again').addEventListener('click', () => this.playAgain());
        document.getElementById('save-game').addEventListener('click', () => this.saveGame());
        document.getElementById('share-results').addEventListener('click', () => this.openShareModal());
        document.getElementById('back-to-setup').addEventListener('click', () => this.backToSetup());
        document.getElementById('clear-impostor-history').addEventListener('click', () => this.clearHistory());
        
        // Compartir
        document.getElementById('copy-text').addEventListener('click', () => this.copyShareText());
        document.getElementById('share-whatsapp').addEventListener('click', () => this.shareToWhatsapp());
        document.getElementById('share-native').addEventListener('click', () => this.shareViaNative());
        document.getElementById('close-share').addEventListener('click', () => this.closeShareModal());
    },
    
    // Actualizar contador de jugadores
    updatePlayerCount(count) {
        this.gameSettings.playerCount = count;
        document.getElementById('playerRange').value = count;
        
        // Ajustar número máximo de impostores
        const maxImpostors = Math.min(3, Math.floor(count / 2));
        if (this.gameSettings.impostorCount > maxImpostors) {
            this.gameSettings.impostorCount = maxImpostors;
            document.getElementById('impostorCount').value = maxImpostors;
            document.getElementById('impostorRange').value = maxImpostors;
            document.getElementById('impostorRange').max = maxImpostors;
        } else {
            document.getElementById('impostorRange').max = maxImpostors;
        }
        
        this.updateImpostorRatio();
    },
    
    // Actualizar contador de impostores
    updateImpostorCount(count) {
        this.gameSettings.impostorCount = count;
        document.getElementById('impostorRange').value = count;
        this.updateImpostorRatio();
    },
    
    // Actualizar ratio de impostores
    updateImpostorRatio() {
        const ratio = this.gameSettings.playerCount / this.gameSettings.impostorCount;
        document.getElementById('impostor-ratio').textContent = 
            `Ratio: 1 impostor por cada ${Math.round(ratio)} jugadores`;
    },
    
    // Actualizar límite de tiempo
    updateTimeLimit(minutes) {
        this.gameSettings.timeLimit = minutes;
        document.getElementById('timeRange').value = minutes;
    },
    
    // Actualizar contador de palabras disponibles
    updateWordCount() {
        if (!this.gameData || !this.gameData.palabras) return;
        
        const category = this.gameSettings.category;
        let count = 0;
        
        if (category === 'all') {
            count = this.gameData.palabras.length;
        } else {
            count = this.gameData.palabras.filter(word => 
                word.categoria === category).length;
        }
        
        document.getElementById('word-count').textContent = 
            `${count} palabras disponibles en esta categoría`;
    },
    
    // Inicio rápido
    quickStart() {
        this.gameSettings = {
            playerCount: 6,
            impostorCount: 1,
            timeLimit: 5,
            category: 'all',
            enableHints: true,
            enableVoting: true,
            randomRoles: true
        };
        
        // Actualizar UI
        document.getElementById('playerCount').value = 6;
        document.getElementById('playerRange').value = 6;
        document.getElementById('impostorCount').value = 1;
        document.getElementById('impostorRange').value = 1;
        document.getElementById('timeLimit').value = 5;
        document.getElementById('timeRange').value = 5;
        document.getElementById('wordCategory').value = 'all';
        document.getElementById('enableHints').checked = true;
        document.getElementById('enableVoting').checked = true;
        document.getElementById('randomRoles').checked = true;
        
        this.updateImpostorRatio();
        this.updateWordCount();
        
        this.startGame();
    },
    
    // Iniciar juego
    startGame() {
        // Validar configuración
        if (this.gameSettings.playerCount < 3) {
            this.showNotification('Se necesitan al menos 3 jugadores', 'error');
            return;
        }
        
        if (this.gameSettings.impostorCount >= this.gameSettings.playerCount) {
            this.showNotification('Debe haber más jugadores que impostores', 'error');
            return;
        }
        
        // Seleccionar palabra aleatoria
        this.selectRandomWord();
        
        if (!this.currentWord) {
            this.showNotification('No se pudo seleccionar una palabra. Intenta con otra categoría.', 'error');
            return;
        }
        
        // Crear lista de jugadores
        this.createPlayers();
        
        // Asignar roles
        this.assignRoles();
        
        // Mostrar pantalla de roles
        this.showRoleScreen();
        
        // Actualizar UI
        this.updateRoleDisplay(0);
        
        this.showNotification('Partida configurada. Comienza la asignación de roles.', 'success');
    },
    
    // Seleccionar palabra aleatoria
    selectRandomWord() {
        if (!this.gameData || !this.gameData.palabras) {
            this.currentWord = 'Error';
            this.currentHint = 'No hay datos disponibles';
            return;
        }
        
        let filteredWords = this.gameData.palabras;
        
        if (this.gameSettings.category !== 'all') {
            filteredWords = filteredWords.filter(word => 
                word.categoria === this.gameSettings.category);
        }
        
        if (filteredWords.length === 0) {
            // Si no hay palabras en la categoría, usar todas
            filteredWords = this.gameData.palabras;
        }
        
        const randomIndex = Math.floor(Math.random() * filteredWords.length);
        const selectedWord = filteredWords[randomIndex];
        
        this.currentWord = selectedWord.palabra;
        this.currentHint = selectedWord.pista;
        
        console.log('Palabra seleccionada:', this.currentWord, 'Pista:', this.currentHint);
    },
    
    // Crear lista de jugadores
    createPlayers() {
        this.players = [];
        
        for (let i = 1; i <= this.gameSettings.playerCount; i++) {
            this.players.push({
                id: i,
                name: `Jugador ${i}`,
                role: 'innocent', // 'innocent' o 'impostor'
                eliminated: false,
                votedFor: null,
                votesReceived: 0,
                guessedCorrectly: false
            });
        }
    },
    
    // Asignar roles
    assignRoles() {
        // Reiniciar todos a inocentes
        this.players.forEach(player => {
            player.role = 'innocent';
            player.eliminated = false;
            player.votedFor = null;
            player.votesReceived = 0;
        });
        
        // Seleccionar impostores aleatorios
        this.impostors = [];
        const impostorCount = this.gameSettings.impostorCount;
        let availablePlayers = [...this.players];
        
        for (let i = 0; i < impostorCount; i++) {
            if (availablePlayers.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * availablePlayers.length);
            const impostor = availablePlayers[randomIndex];
            
            impostor.role = 'impostor';
            this.impostors.push(impostor);
            
            // Eliminar de disponibles
            availablePlayers.splice(randomIndex, 1);
        }
        
        console.log('Impostores asignados:', this.impostors.map(p => p.name));
    },
    
    // Mostrar pantalla de roles
    showRoleScreen() {
        this.gameState = 'roles';
        this.showScreen('role-screen');
        
        // Actualizar contadores
        document.getElementById('total-players').textContent = this.players.length;
        document.getElementById('current-player').textContent = '1';
        
        // Actualizar barra de progreso
        this.updateProgressBar(0);
    },
    
    // Actualizar pantalla de roles
    updateRoleDisplay(playerIndex) {
        if (playerIndex < 0 || playerIndex >= this.players.length) return;
        
        const player = this.players[playerIndex];
        const roleIcon = document.getElementById('role-icon');
        const roleTitle = document.getElementById('role-title');
        const roleSubtitle = document.getElementById('role-subtitle');
        const wordValue = document.getElementById('word-value');
        const hintValue = document.getElementById('hint-value');
        
        // Actualizar información del jugador
        roleTitle.textContent = player.name;
        document.getElementById('current-player').textContent = playerIndex + 1;
        
        // Actualizar barra de progreso
        this.updateProgressBar(playerIndex);
        
        // Configurar según el rol
        if (player.role === 'impostor') {
            roleIcon.innerHTML = '<i class="fas fa-user-secret"></i>';
            roleIcon.className = 'role-icon impostor';
            roleSubtitle.textContent = 'Eres el IMPOSTOR';
            roleSubtitle.style.color = '#ff4081';
            
            wordValue.textContent = '???';
            wordValue.style.color = '#ff4081';
            wordValue.style.fontStyle = 'italic';
            
            if (this.gameSettings.enableHints) {
                hintValue.textContent = this.currentHint;
                hintValue.style.color = '#ff4081';
                document.getElementById('hint-display').style.display = 'block';
            } else {
                document.getElementById('hint-display').style.display = 'none';
            }
        } else {
            roleIcon.innerHTML = '<i class="fas fa-user-check"></i>';
            roleIcon.className = 'role-icon';
            roleSubtitle.textContent = 'Eres INOCENTE';
            roleSubtitle.style.color = '#4CAF50';
            
            wordValue.textContent = this.currentWord;
            wordValue.style.color = '#4CAF50';
            wordValue.style.fontStyle = 'normal';
            
            // Los inocentes no ven la pista
            document.getElementById('hint-display').style.display = 'none';
        }
        
        // Actualizar botones de navegación
        document.getElementById('prev-player').disabled = playerIndex === 0;
        document.getElementById('next-player').disabled = playerIndex === this.players.length - 1;
    },
    
    // Actualizar barra de progreso
    updateProgressBar(playerIndex) {
        const progress = ((playerIndex + 1) / this.players.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    },
    
    // Jugador anterior
    prevPlayer() {
        const current = parseInt(document.getElementById('current-player').textContent) - 1;
        if (current > 1) {
            this.updateRoleDisplay(current - 2);
        }
    },
    
    // Siguiente jugador
    nextPlayer() {
        const current = parseInt(document.getElementById('current-player').textContent) - 1;
        if (current < this.players.length - 1) {
            this.updateRoleDisplay(current);
        }
    },
    
    // Todos listos - comenzar a jugar
    startPlaying() {
        this.gameState = 'playing';
        this.showScreen('game-screen');
        
        // Inicializar tiempo
        this.timeRemaining = this.gameSettings.timeLimit * 60; // convertir a segundos
        this.updateTimerDisplay();
        
        // Iniciar temporizador
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                clearInterval(this.timer);
                if (this.gameSettings.enableVoting) {
                    this.startVoting();
                } else {
                    this.endGame();
                }
            }
        }, 1000);
        
        // Actualizar información en pantalla
        document.getElementById('current-word').textContent = this.currentWord;
        document.getElementById('impostors-remaining').textContent = 
            `${this.impostors.length} impostor${this.impostors.length !== 1 ? 'es' : ''}`;
        document.getElementById('players-remaining').textContent = 
            `${this.players.length} jugador${this.players.length !== 1 ? 'es' : ''}`;
        
        // Actualizar lista de jugadores
        this.updatePlayersList();
        
        this.showNotification('¡La partida ha comenzado! Los inocentes tienen ' + 
            this.gameSettings.timeLimit + ' minutos para descubrir al impostor.', 'success');
    },
    
    // Actualizar display del temporizador
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-display').textContent = display;
        
        // Cambiar color cuando queda poco tiempo
        if (this.timeRemaining <= 60) {
            document.getElementById('timer-display').style.color = '#FF5722';
        } else {
            document.getElementById('timer-display').style.color = '';
        }
    },
    
    // Actualizar lista de jugadores
    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        
        this.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = `player-item ${player.role} ${player.eliminated ? 'eliminated' : ''}`;
            playerItem.dataset.id = player.id;
            
            playerItem.innerHTML = `
                <div class="player-icon">
                    ${player.role === 'impostor' ? 
                        '<i class="fas fa-user-secret"></i>' : 
                        '<i class="fas fa-user-check"></i>'}
                </div>
                <div class="player-name">${player.name}</div>
                <div class="player-role">
                    ${player.eliminated ? 'ELIMINADO' : 
                     player.role === 'impostor' ? 'IMPOSTOR' : 'INOCENTE'}
                </div>
            `;
            
            playersList.appendChild(playerItem);
        });
    },
    
    // Iniciar votación
    startVoting() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'voting';
        clearInterval(this.timer);
        this.showScreen('voting-screen');
        
        // Configurar temporizador de votación
        this.votingTime = 30;
        document.getElementById('voting-timer').textContent = '00:30';
        
        const votingTimer = setInterval(() => {
            this.votingTime--;
            const display = `00:${this.votingTime.toString().padStart(2, '0')}`;
            document.getElementById('voting-timer').textContent = display;
            
            if (this.votingTime <= 0) {
                clearInterval(votingTimer);
                this.submitVotes();
            }
        }, 1000);
        
        // Crear opciones de votación
        this.createVotingOptions();
        
        this.showNotification('¡Comienza la votación! Tienes 30 segundos para votar.', 'warning');
    },
    
    // Crear opciones de votación
    createVotingOptions() {
        const votingOptions = document.getElementById('voting-options');
        votingOptions.innerHTML = '';
        
        // Contador de votos
        const votes = {};
        this.players.forEach(player => votes[player.id] = 0);
        
        this.players.forEach(player => {
            if (player.eliminated) return;
            
            const option = document.createElement('div');
            option.className = `vote-option ${player.eliminated ? 'eliminated' : ''}`;
            option.dataset.id = player.id;
            option.innerHTML = `
                <div class="player-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div class="player-name">${player.name}</div>
                <div class="vote-count">0</div>
            `;
            
            if (!player.eliminated) {
                option.addEventListener('click', () => this.selectVoteOption(player.id));
            }
            
            votingOptions.appendChild(option);
        });
        
        // Actualizar botón de enviar votos
        this.updateSubmitButton();
    },
    
    // Seleccionar opción de voto
    selectVoteOption(playerId) {
        // Solo permitir un voto por jugador (simplificado para esta demo)
        // En una versión completa, cada jugador votaría desde su dispositivo
        
        const options = document.querySelectorAll('.vote-option');
        options.forEach(option => {
            option.classList.remove('selected');
            
            if (parseInt(option.dataset.id) === playerId) {
                option.classList.add('selected');
                
                // Simular que el jugador actual vota por este jugador
                if (this.players.length > 0) {
                    this.players[0].votedFor = playerId;
                }
            }
        });
        
        this.updateSubmitButton();
    },
    
    // Actualizar botón de enviar votos
    updateSubmitButton() {
        const votedCount = this.players.filter(p => p.votedFor !== null).length;
        const totalPlayers = this.players.filter(p => !p.eliminated).length;
        
        const button = document.getElementById('submit-votes');
        button.textContent = `Enviar votos (${votedCount}/${totalPlayers})`;
        button.disabled = votedCount === 0;
    },
    
    // Saltar votación
    skipVoting() {
        this.endGame();
    },
    
    // Enviar votos
    submitVotes() {
        // Contar votos
        this.players.forEach(player => {
            player.votesReceived = 0;
        });
        
        this.players.forEach(voter => {
            if (voter.votedFor) {
                const votedPlayer = this.players.find(p => p.id === voter.votedFor);
                if (votedPlayer) {
                    votedPlayer.votesReceived++;
                }
            }
        });
        
        // Encontrar jugador más votado
        let maxVotes = 0;
        let votedPlayers = [];
        
        this.players.forEach(player => {
            if (player.votesReceived > maxVotes) {
                maxVotes = player.votesReceived;
                votedPlayers = [player];
            } else if (player.votesReceived === maxVotes && maxVotes > 0) {
                votedPlayers.push(player);
            }
        });
        
        // Si hay empate o nadie votó
        if (votedPlayers.length === 0 || votedPlayers.length > 1) {
            // Empate o sin votos - el impostor gana
            this.gameResult = 'impostor_win';
            this.resultMessage = 'Hubo un empate en la votación. ¡El impostor gana!';
        } else {
            // Un jugador fue votado
            const eliminatedPlayer = votedPlayers[0];
            eliminatedPlayer.eliminated = true;
            
            // Verificar si era impostor
            if (eliminatedPlayer.role === 'impostor') {
                // Verificar si quedan impostores
                const remainingImpostors = this.impostors.filter(i => !i.eliminated);
                
                if (remainingImpostors.length === 0) {
                    this.gameResult = 'innocent_win';
                    this.resultMessage = '¡Los inocentes ganaron! Descubrieron al impostor.';
                } else {
                    this.gameResult = 'impostor_win';
                    this.resultMessage = 'Eliminaron a un impostor, ¡pero queda otro! El impostor gana.';
                }
            } else {
                this.gameResult = 'impostor_win';
                this.resultMessage = 'Eliminaron a un inocente. ¡El impostor gana!';
            }
        }
        
        this.showResults();
    },
    
    // Revelar impostor (para moderador)
    revealImpostor() {
        if (confirm('¿Estás seguro de que quieres revelar al impostor? Esto terminará la partida.')) {
            this.gameResult = 'innocent_win';
            this.resultMessage = 'El moderador reveló al impostor. ¡Los inocentes ganan!';
            this.endGame();
        }
    },
    
    // Terminar juego
    endGame() {
        if (this.gameState === 'playing') {
            // Si se termina sin votación, el impostor gana
            this.gameResult = 'impostor_win';
            this.resultMessage = 'Se acabó el tiempo. ¡El impostor gana!';
        }
        
        this.showResults();
    },
    
    // Mostrar resultados
    showResults() {
        this.gameState = 'results';
        clearInterval(this.timer);
        this.showScreen('results-screen');
        
        // Determinar ganador
        const impostorsWon = this.gameResult === 'impostor_win';
        
        // Mostrar/ocultar tarjetas de resultado
        document.getElementById('impostor-win-card').style.display = 
            impostorsWon ? 'block' : 'none';
        document.getElementById('innocent-win-card').style.display = 
            impostorsWon ? 'none' : 'block';
        
        // Actualizar detalles
        document.getElementById('game-duration').textContent = 
            `${this.gameSettings.timeLimit} minutos`;
        document.getElementById('game-players').textContent = this.players.length;
        document.getElementById('game-impostors').textContent = this.impostors.length;
        document.getElementById('game-word').textContent = this.currentWord;
        document.getElementById('game-hint').textContent = this.currentHint;
        document.getElementById('game-result').textContent = 
            impostorsWon ? 'Impostor gana' : 'Inocentes ganan';
        document.getElementById('game-impostor-names').textContent = 
            this.impostors.map(i => i.name).join(', ');
        
        // Actualizar mensajes de resultado
        document.getElementById('impostor-win-details').textContent = this.resultMessage;
        document.getElementById('innocent-win-details').textContent = this.resultMessage;
        
        // Actualizar lista de resultados por jugador
        this.updatePlayerResults();
        
        // Sonido y efectos
        if (impostorsWon) {
            document.body.classList.add('impostor-win');
        } else {
            document.body.classList.add('innocent-win');
            if (typeof showCelebration === 'function') {
                showCelebration();
            }
        }
    },
    
    // Actualizar resultados por jugador
    updatePlayerResults() {
        const resultsList = document.getElementById('players-results-list');
        resultsList.innerHTML = '';
        
        this.players.forEach(player => {
            const resultItem = document.createElement('div');
            resultItem.className = `player-result-item ${player.role}`;
            
            // Determinar si votó correctamente
            let voteInfo = '';
            if (player.votedFor) {
                const votedPlayer = this.players.find(p => p.id === player.votedFor);
                if (votedPlayer) {
                    const correctVote = votedPlayer.role === 'impostor';
                    voteInfo = correctVote ? 
                        '<span class="correct-vote">✓ Votó correctamente</span>' :
                        '<span class="incorrect-vote">✗ Votó incorrectamente</span>';
                    
                    if (correctVote) {
                        resultItem.classList.add('correct-vote');
                    } else {
                        resultItem.classList.add('incorrect-vote');
                    }
                }
            }
            
            resultItem.innerHTML = `
                <div>
                    <strong>${player.name}</strong>
                    <div class="player-role-small">
                        ${player.role === 'impostor' ? 'IMPOSTOR' : 'INOCENTE'}
                        ${player.eliminated ? ' (ELIMINADO)' : ''}
                    </div>
                </div>
                <div>
                    ${voteInfo}
                    <div class="votes-received">Votos: ${player.votesReceived}</div>
                </div>
            `;
            
            resultsList.appendChild(resultItem);
        });
    },
    
    // Jugar otra vez
    playAgain() {
        // Mantener configuración, reiniciar juego
        this.gameState = 'setup';
        this.showScreen('setup-screen');
        document.body.classList.remove('impostor-win', 'innocent-win');
        
        // Actualizar UI de configuración
        this.updateImpostorRatio();
        this.updateWordCount();
        
        this.showNotification('Configura una nueva partida', 'info');
    },
    
    // Guardar partida
    saveGame() {
        if (typeof window.impostorStorage !== 'undefined') {
            const gameData = {
                date: new Date().toLocaleString(),
                timestamp: new Date().getTime(),
                players: this.players.length,
                impostors: this.impostors.length,
                word: this.currentWord,
                hint: this.currentHint,
                result: this.gameResult === 'impostor_win' ? 'Impostor gana' : 'Inocentes ganan',
                duration: this.gameSettings.timeLimit,
                impostorNames: this.impostors.map(i => i.name).join(', ')
            };
            
            window.impostorStorage.saveGame(gameData);
            this.loadHistory();
            this.showNotification('Partida guardada en el historial', 'success');
        } else {
            this.showNotification('Error al guardar la partida', 'error');
        }
    },
    
    // Cargar historial
    loadHistory() {
        if (typeof window.impostorStorage !== 'undefined') {
            this.gameHistory = window.impostorStorage.getHistory();
            this.renderHistory();
        }
    },
    
    // Renderizar historial
    renderHistory() {
        const historyList = document.getElementById('impostor-history-list');
        
        if (!this.gameHistory || this.gameHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-history fa-2x"></i>
                    <p>No hay partidas guardadas todavía.</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = '';
        
        this.gameHistory.forEach((game, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            historyItem.innerHTML = `
                <div class="history-teams">
                    <div><strong>Partida ${index + 1}</strong></div>
                    <div>${game.date}</div>
                </div>
                <div class="history-score ${game.result === 'Impostor gana' ? 'impostor-win' : 'innocent-win'}">
                    ${game.result}
                </div>
                <div class="history-info">
                    <div><i class="fas fa-users"></i> ${game.players} jugadores</div>
                    <div><i class="fas fa-user-secret"></i> ${game.impostors} impostor(es)</div>
                    <div><i class="fas fa-key"></i> "${game.word}"</div>
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
    },
    
    // Limpiar historial
    clearHistory() {
        if (confirm('¿Estás seguro de que quieres borrar todo el historial de partidas?')) {
            if (typeof window.impostorStorage !== 'undefined') {
                window.impostorStorage.clearHistory();
                this.loadHistory();
                this.showNotification('Historial borrado correctamente', 'success');
            }
        }
    },
    
    // Volver a configuración
    backToSetup() {
        this.gameState = 'setup';
        this.showScreen('setup-screen');
        document.body.classList.remove('impostor-win', 'innocent-win');
    },
    
    // Compartir resultados
    openShareModal() {
        const modal = document.getElementById('share-modal');
        const textArea = document.getElementById('share-text');
        
        // Generar texto para compartir
        const impostorsWon = this.gameResult === 'impostor_win';
        const impostorNames = this.impostors.map(i => i.name).join(', ');
        
        let shareText = `🎮 RESULTADO DEL JUEGO DEL IMPOSTOR 🎮\n\n`;
        shareText += `🏆 ${impostorsWon ? '¡EL IMPOSTOR GANA!' : '¡LOS INOCENTES GANAN!'}\n\n`;
        shareText += `📊 Detalles de la partida:\n`;
        shareText += `• Jugadores: ${this.players.length}\n`;
        shareText += `• Impostores: ${this.impostors.length} (${impostorNames})\n`;
        shareText += `• Palabra secreta: "${this.currentWord}"\n`;
        shareText += `• Pista del impostor: "${this.currentHint}"\n`;
        shareText += `• Duración: ${this.gameSettings.timeLimit} minutos\n`;
        shareText += `• Resultado: ${impostorsWon ? 'Impostor gana' : 'Inocentes ganan'}\n\n`;
        
        shareText += `👥 Roles de los jugadores:\n`;
        this.players.forEach(player => {
            shareText += `• ${player.name}: ${player.role === 'impostor' ? 'IMPOSTOR' : 'INOCENTE'} ${player.eliminated ? '(ELIMINADO)' : ''}\n`;
        });
        
        shareText += `\n🎲 Generado con Juego del Impostor - Liga Escolar\n`;
        shareText += `🔗 https://www.ligaescolar.es/impostor/`;
        
        textArea.value = shareText;
        modal.style.display = 'flex';
    },
    
    closeShareModal() {
        document.getElementById('share-modal').style.display = 'none';
    },
    
    copyShareText() {
        const textArea = document.getElementById('share-text');
        textArea.select();
        
        try {
            navigator.clipboard.writeText(textArea.value);
            this.showNotification('Texto copiado al portapapeles', 'success');
        } catch (err) {
            // Fallback
            textArea.select();
            document.execCommand('copy');
            this.showNotification('Texto copiado al portapapeles', 'success');
        }
    },
    
    shareToWhatsapp() {
        const textArea = document.getElementById('share-text');
        const text = encodeURIComponent(textArea.value);
        const url = `https://wa.me/?text=${text}`;
        window.open(url, '_blank');
    },
    
    shareViaNative() {
        const textArea = document.getElementById('share-text');
        const text = textArea.value;
        
        if (navigator.share) {
            navigator.share({
                title: 'Resultados del Juego del Impostor - Liga Escolar',
                text: text,
                url: 'https://www.ligaescolar.es/impostor/'
            }).catch(err => {
                console.log('Error al compartir:', err);
            });
        } else {
            this.copyShareText();
        }
    },
    
    // Mostrar pantalla específica
    showScreen(screenId) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar la pantalla solicitada
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    },
    
    // Mostrar notificación
    showNotification(message, type = 'success') {
        if (typeof window.common !== 'undefined' && 
            typeof window.common.showNotification === 'function') {
            window.common.showNotification(message, type);
        } else {
            // Fallback básico
            alert(message);
        }
    }
};

// Hacer el juego accesible globalmente
window.impostorGame = impostorGame;
