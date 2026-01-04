// impostor/js/impostor-game.js
// Lógica para la página del juego (game.html)

const impostorGame = {
    gameState: 'roles', // 'roles', 'playing', 'voting', 'results'
    players: [],
    impostors: [],
    currentWord: '',
    currentHint: '',
    gameSettings: null,
    timer: null,
    timeRemaining: 0,
    votingTime: 30,
    currentPlayerIndex: 0,
    selectedVote: null,
    
    init() {
        console.log('Inicializando juego del impostor...');
        
        // Cargar configuración
        this.loadSettings();
        
        // Inicializar juego
        this.startNewGame();
        
        // Configurar event listeners
        this.setupEventListeners();
    },
    
    loadSettings() {
        const saved = localStorage.getItem('impostor_current_settings');
        if (saved) {
            this.gameSettings = JSON.parse(saved);
        } else {
            // Configuración por defecto
            this.gameSettings = {
                playerCount: 6,
                impostorCount: 1,
                timeLimit: 5,
                category: 'all',
                difficulty: 'all',
                enableHints: true,
                enableVoting: true
            };
        }
    },
    
    startNewGame() {
        // Seleccionar palabra aleatoria
        this.selectRandomWord();
        
        // Crear jugadores
        this.createPlayers();
        
        // Asignar roles
        this.assignRoles();
        
        // Mostrar primer jugador
        this.showScreen('role-screen');
        this.updateRoleDisplay(0);
    },
    
    selectRandomWord() {
        if (!window.impostorData) {
            console.error('Error: datos no cargados');
            this.currentWord = 'ERROR';
            this.currentHint = 'Error cargando datos';
            return;
        }
        
        const gameData = window.impostorData.getGameData();
        if (!gameData || !gameData.palabras) {
            this.currentWord = 'SIN DATOS';
            this.currentHint = 'No hay palabras disponibles';
            return;
        }
        
        let palabrasFiltradas = gameData.palabras;
        
        // Filtrar por categoría
        if (this.gameSettings.category !== 'all') {
            palabrasFiltradas = palabrasFiltradas.filter(word => 
                word.categoria === this.gameSettings.category
            );
        }
        
        // Filtrar por dificultad
        if (this.gameSettings.difficulty !== 'all' && this.gameSettings.difficulty !== 'mixto') {
            palabrasFiltradas = palabrasFiltradas.filter(word => 
                word.dificultad === this.gameSettings.difficulty
            );
        }
        
        if (palabrasFiltradas.length === 0) {
            this.currentWord = 'NO HAY PALABRAS';
            this.currentHint = 'Cambia los filtros en configuración';
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * palabrasFiltradas.length);
        const selectedWord = palabrasFiltradas[randomIndex];
        
        this.currentWord = selectedWord.palabra;
        this.currentHint = selectedWord.pista;
        
        console.log('Palabra seleccionada:', this.currentWord);
    },
    
    createPlayers() {
        this.players = [];
        
        for (let i = 1; i <= this.gameSettings.playerCount; i++) {
            this.players.push({
                id: i,
                name: `Jugador ${i}`,
                role: 'innocent',
                eliminated: false,
                votedFor: null,
                votesReceived: 0
            });
        }
    },
    
    assignRoles() {
        // Reiniciar roles
        this.players.forEach(player => {
            player.role = 'innocent';
        });
        
        this.impostors = [];
        const impostorCount = this.gameSettings.impostorCount;
        
        // Seleccionar índices aleatorios
        const indices = [];
        for (let i = 0; i < this.players.length; i++) {
            indices.push(i);
        }
        
        // Barajar
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        // Asignar primeros n como impostores
        for (let i = 0; i < impostorCount; i++) {
            const playerIndex = indices[i];
            this.players[playerIndex].role = 'impostor';
            this.impostors.push(this.players[playerIndex]);
        }
    },
    
    updateRoleDisplay(playerIndex) {
        const player = this.players[playerIndex];
        this.currentPlayerIndex = playerIndex;
        
        // Actualizar UI
        document.getElementById('role-title').textContent = player.name;
        document.getElementById('current-player').textContent = playerIndex + 1;
        document.getElementById('total-players').textContent = this.players.length;
        
        // Actualizar progreso
        const progress = ((playerIndex + 1) / this.players.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Configurar según rol
        const roleIcon = document.getElementById('role-icon');
        const roleSubtitle = document.getElementById('role-subtitle');
        const wordValue = document.getElementById('word-value');
        const hintValue = document.getElementById('hint-value');
        const hintDisplay = document.getElementById('hint-value').parentElement;
        
        if (player.role === 'impostor') {
            roleIcon.innerHTML = '<i class="fas fa-user-secret fa-4x"></i>';
            roleIcon.style.color = '#ff4081';
            roleSubtitle.textContent = '¡Eres el IMPOSTOR!';
            roleSubtitle.style.color = '#ff4081';
            
            wordValue.textContent = '???';
            wordValue.style.color = '#ff4081';
            
            if (this.gameSettings.enableHints) {
                hintValue.textContent = this.currentHint;
                hintDisplay.style.display = 'block';
            } else {
                hintDisplay.style.display = 'none';
            }
        } else {
            roleIcon.innerHTML = '<i class="fas fa-user-check fa-4x"></i>';
            roleIcon.style.color = '#4CAF50';
            roleSubtitle.textContent = 'Eres INOCENTE';
            roleSubtitle.style.color = '#4CAF50';
            
            wordValue.textContent = this.currentWord;
            wordValue.style.color = '#4CAF50';
            hintDisplay.style.display = 'none';
        }
        
        // Actualizar botones de navegación
        document.getElementById('prev-player').disabled = playerIndex === 0;
        document.getElementById('next-player').disabled = playerIndex === this.players.length - 1;
    },
    
    startGame() {
        this.gameState = 'playing';
        this.showScreen('game-screen');
        
        // Inicializar temporizador
        this.timeRemaining = this.gameSettings.timeLimit * 60;
        this.updateTimerDisplay();
        this.startTimer();
        
        // Actualizar información en pantalla
        document.getElementById('current-word').textContent = this.currentWord;
        document.getElementById('impostors-count').textContent = 
            `${this.impostors.length} impostor${this.impostors.length !== 1 ? 'es' : ''}`;
        document.getElementById('players-count').textContent = 
            `${this.players.length} jugador${this.players.length !== 1 ? 'es' : ''}`;
        document.getElementById('time-limit').textContent = this.gameSettings.timeLimit;
        
        // Actualizar lista de jugadores
        this.updatePlayersList();
    },
    
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
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
    },
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-display').textContent = display;
        
        // Cambiar color si queda poco tiempo
        if (this.timeRemaining <= 60) {
            document.getElementById('timer-display').style.color = '#FF5722';
        }
    },
    
    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        if (!playersList) return;
        
        playersList.innerHTML = '';
        
        this.players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = `player-card ${player.role} ${player.eliminated ? 'eliminated' : ''}`;
            
            playerCard.innerHTML = `
                <div class="player-icon">
                    ${player.role === 'impostor' ? 
                        '<i class="fas fa-user-secret"></i>' : 
                        '<i class="fas fa-user-check"></i>'}
                </div>
                <div class="player-name">${player.name}</div>
                <div class="player-role-text">
                    ${player.eliminated ? 'ELIMINADO' : 
                     player.role === 'impostor' ? 'IMPOSTOR' : 'INOCENTE'}
                </div>
            `;
            
            playersList.appendChild(playerCard);
        });
    },
    
    startVoting() {
        this.gameState = 'voting';
        this.showScreen('voting-screen');
        
        // Configurar temporizador de votación
        this.votingTime = 30;
        document.getElementById('voting-timer').textContent = '00:30';
        
        this.votingTimer = setInterval(() => {
            this.votingTime--;
            const display = `00:${this.votingTime.toString().padStart(2, '0')}`;
            document.getElementById('voting-timer').textContent = display;
            
            if (this.votingTime <= 0) {
                clearInterval(this.votingTimer);
                this.processVotes();
            }
        }, 1000);
        
        // Crear opciones de votación
        this.createVotingOptions();
    },
    
    createVotingOptions() {
        const votingOptions = document.getElementById('voting-options');
        if (!votingOptions) return;
        
        votingOptions.innerHTML = '';
        this.selectedVote = null;
        
        this.players.forEach(player => {
            if (player.eliminated) return;
            
            const option = document.createElement('div');
            option.className = 'player-card vote-option';
            option.dataset.id = player.id;
            
            option.innerHTML = `
                <div class="player-name">${player.name}</div>
                <div class="vote-indicator">○</div>
            `;
            
            option.addEventListener('click', () => {
                this.selectVote(player.id);
            });
            
            votingOptions.appendChild(option);
        });
        
        // Actualizar botón de enviar
        document.getElementById('submit-vote').disabled = true;
    },
    
    selectVote(playerId) {
        this.selectedVote = playerId;
        
        // Actualizar UI
        document.querySelectorAll('.vote-option').forEach(option => {
            option.classList.remove('selected');
            if (parseInt(option.dataset.id) === playerId) {
                option.classList.add('selected');
                option.querySelector('.vote-indicator').textContent = '✓';
            } else {
                option.querySelector('.vote-indicator').textContent = '○';
            }
        });
        
        document.getElementById('submit-vote').disabled = false;
    },
    
    processVotes() {
        // En un juego real, aquí recolectarías votos de todos
        // Por ahora, simulamos que todos votan por el seleccionado
        
        if (!this.selectedVote) {
            // Si no hay votos, el impostor gana
            this.showResults('impostor', 'No hubo votos válidos');
            return;
        }
        
        const votedPlayer = this.players.find(p => p.id === this.selectedVote);
        if (!votedPlayer) return;
        
        if (votedPlayer.role === 'impostor') {
            this.showResults('innocent', '¡Descubrieron al impostor!');
        } else {
            this.showResults('impostor', 'Eliminaron a un inocente');
        }
    },
    
    showResults(winner, message) {
        this.gameState = 'results';
        this.showScreen('results-screen');
        
        // Detener temporizadores
        if (this.timer) clearInterval(this.timer);
        if (this.votingTimer) clearInterval(this.votingTimer);
        
        // Actualizar resultados
        const title = document.getElementById('results-title');
        const resultMsg = document.getElementById('results-message');
        
        if (winner === 'innocent') {
            title.innerHTML = '<i class="fas fa-user-check"></i> ¡Inocentes Ganan!';
            resultMsg.innerHTML = `<p class="innocent-win">${message}</p>`;
            document.body.classList.add('innocent-win');
            
            // Efecto de celebración
            if (typeof showCelebration === 'function') {
                showCelebration();
            }
        } else {
            title.innerHTML = '<i class="fas fa-user-secret"></i> ¡Impostor Gana!';
            resultMsg.innerHTML = `<p class="impostor-win">${message}</p>`;
            document.body.classList.add('impostor-win');
        }
        
        // Actualizar detalles
        document.getElementById('result-word').textContent = this.currentWord;
        document.getElementById('result-hint').textContent = this.currentHint;
        document.getElementById('result-impostors').textContent = 
            this.impostors.map(i => i.name).join(', ');
        document.getElementById('result-duration').textContent = 
            `${this.gameSettings.timeLimit} minutos`;
        
        // Guardar en historial
        this.saveToHistory(winner, message);
    },
    
    saveToHistory(winner, message) {
        if (!window.impostorStorage) return;
        
        const gameData = {
            date: new Date().toLocaleString(),
            timestamp: new Date().getTime(),
            players: this.players.length,
            impostors: this.impostors.length,
            word: this.currentWord,
            hint: this.currentHint,
            result: winner === 'innocent' ? 'Inocentes ganan' : 'Impostor gana',
            duration: this.gameSettings.timeLimit,
            impostorNames: this.impostors.map(i => i.name).join(', ')
        };
        
        window.impostorStorage.saveGame(gameData);
    },
    
    endGame() {
        // Terminar juego sin votación
        this.showResults('impostor', 'Se acabó el tiempo');
    },
    
    setupEventListeners() {
        // Navegación de roles
        document.getElementById('prev-player').addEventListener('click', () => {
            if (this.currentPlayerIndex > 0) {
                this.updateRoleDisplay(this.currentPlayerIndex - 1);
            }
        });
        
        document.getElementById('next-player').addEventListener('click', () => {
            if (this.currentPlayerIndex < this.players.length - 1) {
                this.updateRoleDisplay(this.currentPlayerIndex + 1);
            }
        });
        
        document.getElementById('start-playing').addEventListener('click', () => {
            this.startGame();
        });
        
        // Controles del juego
        document.getElementById('start-vote').addEventListener('click', () => {
            this.startVoting();
        });
        
        document.getElementById('submit-vote').addEventListener('click', () => {
            this.processVotes();
        });
        
        document.getElementById('skip-vote').addEventListener('click', () => {
            this.endGame();
        });
        
        document.getElementById('reveal-impostor').addEventListener('click', () => {
            if (confirm('¿Revelar al impostor y terminar el juego?')) {
                this.showResults('innocent', 'El moderador reveló al impostor');
            }
        });
        
        document.getElementById('end-game').addEventListener('click', () => {
            if (confirm('¿Terminar la partida ahora?')) {
                this.endGame();
            }
        });
        
        // Resultados
        document.getElementById('play-again').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('back-to-setup').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        document.getElementById('share-results').addEventListener('click', () => {
            this.shareResults();
        });
    },
    
    showScreen(screenId) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar la pantalla solicitada
        document.getElementById(screenId).classList.add('active');
    },
    
    shareResults() {
        const text = `🎮 Resultado del Juego del Impostor\n\n` +
                   `Palabra: ${this.currentWord}\n` +
                   `Resultado: ${this.impostors.length === 0 ? 'Inocentes ganan' : 'Impostor gana'}\n` +
                   `Jugadores: ${this.players.length}\n` +
                   `Impostores: ${this.impostors.map(i => i.name).join(', ')}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Resultado del Juego del Impostor',
                text: text
            });
        } else {
            // Copiar al portapapeles
            navigator.clipboard.writeText(text).then(() => {
                alert('Resultados copiados al portapapeles');
            });
        }
    }
};
