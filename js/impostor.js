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
        difficulty: 'all', // Nueva opción
        enableHints: true,
        enableVoting: true,
        randomRoles: true
    },
    timer: null,
    timeRemaining: 0,
    votingTime: 30, // segundos
    gameHistory: [],
    currentPlayerIndex: 0,
    gameResult: '',
    resultMessage: '',
    
    // Inicialización
    init() {
        console.log('Inicializando Juego del Impostor');
        
        // Verificar que los datos estén cargados
        this.ensureDataLoaded().then(() => {
            // Cargar historial
            this.loadHistory();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Mostrar pantalla de configuración
            this.showScreen('setup');
            
            // Actualizar contador de palabras
            this.updateWordCount();
            
            // Inicializar botones de configuración
            this.initializeConfigControls();
            
            console.log('Juego inicializado correctamente');
        }).catch(error => {
            console.error('Error al inicializar el juego:', error);
            this.showNotification('Error al cargar el juego. Por favor, recarga la página.', 'error');
        });
    },
    
    // Asegurar que los datos estén cargados
    async ensureDataLoaded() {
        return new Promise((resolve, reject) => {
            if (window.impostorData && window.impostorData.gameData) {
                console.log('Datos ya cargados');
                resolve();
                return;
            }
            
            // Intentar cargar datos
            if (window.impostorData && typeof window.impostorData.loadGameData === 'function') {
                window.impostorData.loadGameData().then(() => {
                    console.log('Datos cargados después de esperar');
                    resolve();
                }).catch(reject);
            } else {
                // Esperar un momento y reintentar
                setTimeout(() => {
                    if (window.impostorData && window.impostorData.gameData) {
                        resolve();
                    } else {
                        reject(new Error('No se pudieron cargar los datos del juego'));
                    }
                }, 1000);
            }
        });
    },
    
    // Inicializar controles de configuración
    initializeConfigControls() {
        // Configurar valores iniciales
        this.updatePlayerCount(this.gameSettings.playerCount);
        this.updateImpostorCount(this.gameSettings.impostorCount);
        this.updateTimeLimit(this.gameSettings.timeLimit);
        
        // Actualizar categorías disponibles
        this.updateCategoryOptions();
    },
    
    // Actualizar opciones de categoría
    updateCategoryOptions() {
        if (window.impostorData && typeof window.impostorData.getCategories === 'function') {
            const categories = window.impostorData.getCategories();
            const select = document.getElementById('wordCategory');
            
            // Guardar selección actual
            const currentValue = select.value;
            
            // Limpiar opciones (excepto la primera "all")
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Añadir categorías
            categories.filter(cat => cat !== 'all').forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = this.capitalizeFirstLetter(category);
                select.appendChild(option);
            });
            
            // Restaurar selección si existe
            if (categories.includes(currentValue)) {
                select.value = currentValue;
            }
        }
    },
    
    // Capitalizar primera letra
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    // Configurar event listeners
    setupEventListeners() {
        // Configuración básica
        this.setupNumberInput('playerCount', 'playerRange', 
            (value) => this.updatePlayerCount(value));
        this.setupNumberInput('impostorCount', 'impostorRange', 
            (value) => this.updateImpostorCount(value));
        this.setupNumberInput('timeLimit', 'timeRange', 
            (value) => this.updateTimeLimit(value));
        
        // Botones de incremento/decremento
        this.setupIncrementButtons('playerCount', 'decrease-players', 'increase-players', 3, 12);
        this.setupIncrementButtons('impostorCount', 'decrease-impostors', 'increase-impostors', 1, 3);
        this.setupIncrementButtons('timeLimit', 'decrease-time', 'increase-time', 1, 15);
        
        // Categoría y dificultad
        document.getElementById('wordCategory').addEventListener('change', (e) => {
            this.gameSettings.category = e.target.value;
            this.updateWordCount();
        });
        
        // Añadir event listener para dificultad si existe
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.gameSettings.difficulty = e.target.value;
                this.updateWordCount();
            });
        }
        
        // Opciones avanzadas
        document.getElementById('enableHints').addEventListener('change', (e) => {
            this.gameSettings.enableHints = e.target.checked;
        });
        
        document.getElementById('enableVoting').addEventListener('change', (e) => {
            this.gameSettings.enableVoting = e.target.checked;
        });
        
        document.getElementById('randomRoles').addEventListener('change', (e) => {
            this.gameSettings.randomRoles = e.target.checked;
        });
        
        // Botones de control del juego
        this.setupGameControls();
        
        // Botón de ayuda flotante
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showHelp());
        }
    },
    
    // Configurar controles numéricos
    setupNumberInput(inputId, rangeId, callback) {
        const input = document.getElementById(inputId);
        const range = document.getElementById(rangeId);
        
        if (!input || !range) return;
        
        input.addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            value = this.clampValue(value, parseInt(input.min), parseInt(input.max));
            input.value = value;
            range.value = value;
            callback(value);
        });
        
        range.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            input.value = value;
            callback(value);
        });
    },
    
    // Configurar botones de incremento/decremento
    setupIncrementButtons(inputId, decBtnId, incBtnId, min, max) {
        const input = document.getElementById(inputId);
        const decBtn = document.getElementById(decBtnId);
        const incBtn = document.getElementById(incBtnId);
        
        if (!input || !decBtn || !incBtn) return;
        
        decBtn.addEventListener('click', () => {
            let value = parseInt(input.value) - 1;
            if (value < min) value = min;
            input.value = value;
            this.updateRangeValue(inputId, value);
            this.handleSettingChange(inputId, value);
        });
        
        incBtn.addEventListener('click', () => {
            let value = parseInt(input.value) + 1;
            if (value > max) value = max;
            input.value = value;
            this.updateRangeValue(inputId, value);
            this.handleSettingChange(inputId, value);
        });
    },
    
    // Actualizar valor del range correspondiente
    updateRangeValue(inputId, value) {
        const rangeMap = {
            'playerCount': 'playerRange',
            'impostorCount': 'impostorRange',
            'timeLimit': 'timeRange'
        };
        
        const rangeId = rangeMap[inputId];
        if (rangeId) {
            const range = document.getElementById(rangeId);
            if (range) range.value = value;
        }
    },
    
    // Manejar cambio de configuración
    handleSettingChange(settingId, value) {
        switch(settingId) {
            case 'playerCount':
                this.updatePlayerCount(value);
                break;
            case 'impostorCount':
                this.updateImpostorCount(value);
                break;
            case 'timeLimit':
                this.updateTimeLimit(value);
                break;
        }
    },
    
    // Configurar controles del juego
    setupGameControls() {
        const controls = [
            ['start-game', () => this.startGame()],
            ['quick-start', () => this.quickStart()],
            ['next-player', () => this.nextPlayer()],
            ['prev-player', () => this.prevPlayer()],
            ['all-done', () => this.startPlaying()],
            ['start-vote', () => this.startVoting()],
            ['end-game', () => this.endGame()],
            ['reveal-impostor', () => this.revealImpostor()],
            ['skip-vote', () => this.skipVoting()],
            ['submit-votes', () => this.submitVotes()],
            ['play-again', () => this.playAgain()],
            ['save-game', () => this.saveGame()],
            ['share-results', () => this.openShareModal()],
            ['back-to-setup', () => this.backToSetup()],
            ['clear-impostor-history', () => this.clearHistory()],
            ['copy-text', () => this.copyShareText()],
            ['share-whatsapp', () => this.shareToWhatsapp()],
            ['share-native', () => this.shareViaNative()],
            ['close-share', () => this.closeShareModal()]
        ];
        
        controls.forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    },
    
    // Limitar valor entre mínimo y máximo
    clampValue(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // Actualizar contador de jugadores
    updatePlayerCount(count) {
        this.gameSettings.playerCount = count;
        
        // Ajustar número máximo de impostores
        const maxImpostors = Math.min(3, Math.floor(count / 2));
        const impostorInput = document.getElementById('impostorCount');
        const impostorRange = document.getElementById('impostorRange');
        
        if (this.gameSettings.impostorCount > maxImpostors) {
            this.gameSettings.impostorCount = maxImpostors;
            impostorInput.value = maxImpostors;
            impostorRange.value = maxImpostors;
        }
        
        impostorRange.max = maxImpostors;
        impostorInput.max = maxImpostors;
        
        this.updateImpostorRatio();
        this.updateSubmitButton();
    },
    
    // Actualizar contador de impostores
    updateImpostorCount(count) {
        this.gameSettings.impostorCount = count;
        this.updateImpostorRatio();
    },
    
    // Actualizar ratio de impostores
    updateImpostorRatio() {
        const playerCount = this.gameSettings.playerCount;
        const impostorCount = this.gameSettings.impostorCount;
        const ratioElement = document.getElementById('impostor-ratio');
        
        if (ratioElement) {
            const ratio = playerCount / impostorCount;
            ratioElement.textContent = 
                `Ratio: 1 impostor por cada ${Math.round(ratio)} jugadores`;
        }
    },
    
    // Actualizar límite de tiempo
    updateTimeLimit(minutes) {
        this.gameSettings.timeLimit = minutes;
    },
    
    // Actualizar contador de palabras disponibles
    updateWordCount() {
        if (!window.impostorData || typeof window.impostorData.countWords !== 'function') {
            document.getElementById('word-count').textContent = 
                'Cargando palabras...';
            return;
        }
        
        const category = this.gameSettings.category;
        const difficulty = this.gameSettings.difficulty || 'all';
        const count = window.impostorData.countWords(category, difficulty);
        
        let message = `${count} palabras disponibles`;
        
        if (category !== 'all') {
            message += ` en categoría: ${this.capitalizeFirstLetter(category)}`;
        }
        
        if (difficulty !== 'all') {
            message += ` (${difficulty})`;
        }
        
        document.getElementById('word-count').textContent = message;
    },
    
    // Mostrar ayuda
    showHelp() {
        const helpText = `
            AYUDA DEL JUEGO DEL IMPOSTOR 🕵️‍♂️
            
            1️⃣ CONFIGURACIÓN:
               • Número de jugadores: 3-12
               • Número de impostores: 1-3
               • Tiempo límite: 1-15 minutos
               • Categoría: Elige el tema de las palabras
               • Dificultad: Fácil o Difícil
            
            2️⃣ ASIGNACIÓN DE ROLES:
               • Los INOCENTES reciben una palabra secreta
               • El IMPOSTOR recibe solo una pista
               • Pasa el dispositivo a cada jugador
            
            3️⃣ JUEGO:
               • Los inocentes deben descubrir al impostor
               • El impostor debe engañar a los demás
               • Tienen tiempo limitado
            
            4️⃣ VOTACIÓN:
               • Al final del tiempo, todos votan
               • El más votado es eliminado
               • Si es el impostor, ganan los inocentes
            
            ¡Diviértete! 🎮
        `;
        
        alert(helpText);
    },
    
    // Inicio rápido
    quickStart() {
        this.gameSettings = {
            playerCount: 6,
            impostorCount: 1,
            timeLimit: 5,
            category: 'all',
            difficulty: 'all',
            enableHints: true,
            enableVoting: true,
            randomRoles: true
        };
        
        // Actualizar UI
        const updates = {
            'playerCount': 6,
            'impostorCount': 1,
            'timeLimit': 5,
            'wordCategory': 'all'
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
            this.updateRangeValue(id, value);
        });
        
        // Actualizar dificultad si existe
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.value = 'all';
            this.gameSettings.difficulty = 'all';
        }
        
        // Actualizar checkboxes
        document.getElementById('enableHints').checked = true;
        document.getElementById('enableVoting').checked = true;
        document.getElementById('randomRoles').checked = true;
        
        this.updateImpostorRatio();
        this.updateWordCount();
        
        this.startGame();
    },
    
    // Iniciar juego
    startGame() {
        console.log('Iniciando juego con configuración:', this.gameSettings);
        
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
        if (!this.selectRandomWord()) {
            this.showNotification('No hay palabras disponibles con los filtros seleccionados', 'error');
            return;
        }
        
        // Crear lista de jugadores
        this.createPlayers();
        
        // Asignar roles
        this.assignRoles();
        
        // Mostrar pantalla de roles
        this.showRoleScreen();
        
        // Actualizar UI
        this.currentPlayerIndex = 0;
        this.updateRoleDisplay(this.currentPlayerIndex);
        
        this.showNotification('Partida configurada. Comienza la asignación de roles.', 'success');
    },
    
    // Seleccionar palabra aleatoria
    selectRandomWord() {
        if (!window.impostorData || typeof window.impostorData.getWords !== 'function') {
            console.error('Datos del juego no disponibles');
            this.currentWord = 'Error';
            this.currentHint = 'No hay datos disponibles';
            return false;
        }
        
        const category = this.gameSettings.category;
        const difficulty = this.gameSettings.difficulty || 'all';
        
        const availableWords = window.impostorData.getWords(category, difficulty);
        
        if (availableWords.length === 0) {
            console.error('No hay palabras disponibles con los filtros:', category, difficulty);
            return false;
        }
        
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const selectedWord = availableWords[randomIndex];
        
        this.currentWord = selectedWord.palabra;
        this.currentHint = selectedWord.pista;
        
        console.log('Palabra seleccionada:', this.currentWord, 'Pista:', this.currentHint);
        return true;
    },
    
    // Crear lista de jugadores
    createPlayers() {
        this.players = [];
        const playerCount = this.gameSettings.playerCount;
        
        for (let i = 1; i <= playerCount; i++) {
            this.players.push({
                id: i,
                name: `Jugador ${i}`,
                role: 'innocent',
                eliminated: false,
                votedFor: null,
                votesReceived: 0,
                guessedCorrectly: false
            });
        }
        
        console.log('Jugadores creados:', this.players.length);
    },
    
    // Asignar roles
    assignRoles() {
        console.log('Asignando roles...');
        
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
        const playerCount = this.players.length;
        
        // Crear array de índices aleatorios
        const indices = Array.from({length: playerCount}, (_, i) => i);
        this.shuffleArray(indices);
        
        // Asignar primeros n índices como impostores
        for (let i = 0; i < impostorCount && i < indices.length; i++) {
            const playerIndex = indices[i];
            this.players[playerIndex].role = 'impostor';
            this.impostors.push(this.players[playerIndex]);
        }
        
        console.log('Impostores asignados:', this.impostors.map(p => p.name));
    },
    
    // Barajar array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
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
        if (playerIndex < 0 || playerIndex >= this.players.length) {
            console.error('Índice de jugador inválido:', playerIndex);
            return;
        }
        
        this.currentPlayerIndex = playerIndex;
        const player = this.players[playerIndex];
        
        console.log('Mostrando rol para:', player.name, 'Rol:', player.role);
        
        // Actualizar información del jugador
        document.getElementById('role-title').textContent = player.name;
        document.getElementById('current-player').textContent = playerIndex + 1;
        
        // Actualizar barra de progreso
        this.updateProgressBar(playerIndex);
        
        // Configurar según el rol
        this.setupRoleDisplay(player);
    },
    
    // Configurar display según rol
    setupRoleDisplay(player) {
        const roleIcon = document.getElementById('role-icon');
        const roleSubtitle = document.getElementById('role-subtitle');
        const wordValue = document.getElementById('word-value');
        const hintValue = document.getElementById('hint-value');
        const hintDisplay = document.getElementById('hint-display');
        
        if (player.role === 'impostor') {
            // Configurar para impostor
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
                hintDisplay.style.display = 'block';
            } else {
                hintDisplay.style.display = 'none';
            }
        } else {
            // Configurar para inocente
            roleIcon.innerHTML = '<i class="fas fa-user-check"></i>';
            roleIcon.className = 'role-icon';
            roleSubtitle.textContent = 'Eres INOCENTE';
            roleSubtitle.style.color = '#4CAF50';
            
            wordValue.textContent = this.currentWord;
            wordValue.style.color = '#4CAF50';
            wordValue.style.fontStyle = 'normal';
            
            // Los inocentes no ven la pista
            hintDisplay.style.display = 'none';
        }
        
        // Actualizar botones de navegación
        document.getElementById('prev-player').disabled = playerIndex === 0;
        document.getElementById('next-player').disabled = playerIndex === this.players.length - 1;
    },
    
    // Actualizar barra de progreso
    updateProgressBar(playerIndex) {
        const progress = ((playerIndex + 1) / this.players.length) * 100;
        const progressFill = document.getElementById('progress-fill');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    },
    
    // Jugador anterior
    prevPlayer() {
        if (this.currentPlayerIndex > 0) {
            this.updateRoleDisplay(this.currentPlayerIndex - 1);
        }
    },
    
    // Siguiente jugador
    nextPlayer() {
        if (this.currentPlayerIndex < this.players.length - 1) {
            this.updateRoleDisplay(this.currentPlayerIndex + 1);
        }
    },
    
    // Todos listos - comenzar a jugar
    startPlaying() {
        console.log('Comenzando juego...');
        this.gameState = 'playing';
        this.showScreen('game-screen');
        
        // Inicializar tiempo
        this.timeRemaining = this.gameSettings.timeLimit * 60;
        this.updateTimerDisplay();
        
        // Iniciar temporizador
        this.startGameTimer();
        
        // Actualizar información en pantalla
        document.getElementById('current-word').textContent = this.currentWord;
        document.getElementById('impostors-remaining').textContent = 
            `${this.impostors.length} impostor${this.impostors.length !== 1 ? 'es' : ''}`;
        document.getElementById('players-remaining').textContent = 
            `${this.players.length} jugador${this.players.length !== 1 ? 'es' : ''}`;
        
        // Actualizar lista de jugadores
        this.updatePlayersList();
        
        this.showNotification(`¡La partida ha comenzado! Tienes ${this.gameSettings.timeLimit} minutos.`, 'success');
    },
    
    // Iniciar temporizador del juego
    startGameTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
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
    
    // Actualizar display del temporizador
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = display;
            
            // Cambiar color cuando queda poco tiempo
            if (this.timeRemaining <= 60) {
                timerDisplay.style.color = '#FF5722';
            } else {
                timerDisplay.style.color = '';
            }
        }
    },
    
    // Actualizar lista de jugadores
    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        if (!playersList) return;
        
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
        
        console.log('Iniciando votación...');
        this.gameState = 'voting';
        clearInterval(this.timer);
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
        if (!votingOptions) return;
        
        votingOptions.innerHTML = '';
        
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
        console.log('Votando por jugador:', playerId);
        
        // En esta versión simplificada, asumimos que el jugador actual es el primero
        // En una versión completa, cada jugador votaría desde su dispositivo
        const currentPlayer = this.players[0]; // Simplificación
        currentPlayer.votedFor = playerId;
        
        // Actualizar UI
        const options = document.querySelectorAll('.vote-option');
        options.forEach(option => {
            option.classList.remove('selected');
            
            if (parseInt(option.dataset.id) === playerId) {
                option.classList.add('selected');
            }
        });
        
        this.updateSubmitButton();
        this.updateCurrentVotes();
    },
    
    // Actualizar votos actuales
    updateCurrentVotes() {
        const votesList = document.getElementById('votes-list');
        if (!votesList) return;
        
        votesList.innerHTML = '';
        
        this.players.forEach(player => {
            if (player.votedFor) {
                const votedPlayer = this.players.find(p => p.id === player.votedFor);
                if (votedPlayer) {
                    const voteItem = document.createElement('div');
                    voteItem.className = 'vote-item';
                    voteItem.innerHTML = `
                        <span>${player.name}</span>
                        <span>→</span>
                        <span>${votedPlayer.name}</span>
                    `;
                    votesList.appendChild(voteItem);
                }
            }
        });
        
        // Mostrar mensaje si no hay votos
        if (votesList.children.length === 0) {
            votesList.innerHTML = '<p class="empty-votes">Aún no hay votos registrados</p>';
        }
    },
    
    // Actualizar botón de enviar votos
    updateSubmitButton() {
        const votedCount = this.players.filter(p => p.votedFor !== null).length;
        const totalPlayers = this.players.filter(p => !p.eliminated).length;
        
        const button = document.getElementById('submit-votes');
        if (button) {
            button.textContent = `Enviar votos (${votedCount}/${totalPlayers})`;
            button.disabled = votedCount === 0;
        }
    },
    
    // Saltar votación
    skipVoting() {
        console.log('Saltando votación...');
        this.endGame();
    },
    
    // Enviar votos
    submitVotes() {
        console.log('Enviando votos...');
        
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
        this.processVotingResults();
    },
    
    // Procesar resultados de votación
    processVotingResults() {
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
        
        // Determinar resultado
        if (votedPlayers.length === 0 || votedPlayers.length > 1) {
            // Empate o sin votos
            this.gameResult = 'impostor_win';
            this.resultMessage = 'Hubo un empate en la votación. ¡El impostor gana!';
        } else {
            const eliminatedPlayer = votedPlayers[0];
            eliminatedPlayer.eliminated = true;
            
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
        console.log('Terminando juego...');
        
        if (this.gameState === 'playing') {
            // Si se termina sin votación, el impostor gana
            this.gameResult = 'impostor_win';
            this.resultMessage = 'Se acabó el tiempo. ¡El impostor gana!';
        }
        
        this.showResults();
    },
    
    // Mostrar resultados
    showResults() {
        console.log('Mostrando resultados...');
        this.gameState = 'results';
        
        // Detener todos los temporizadores
        if (this.timer) {
            clearInterval(this.timer);
        }
        if (this.votingTimer) {
            clearInterval(this.votingTimer);
        }
        
        this.showScreen('results-screen');
        
        // Determinar ganador
        const impostorsWon = this.gameResult === 'impostor_win';
        
        // Mostrar/ocultar tarjetas de resultado
        const impostorCard = document.getElementById('impostor-win-card');
        const innocentCard = document.getElementById('innocent-win-card');
        
        if (impostorCard) {
            impostorCard.style.display = impostorsWon ? 'block' : 'none';
        }
        if (innocentCard) {
            innocentCard.style.display = impostorsWon ? 'none' : 'block';
        }
        
        // Actualizar detalles de la partida
        this.updateGameDetails();
        
        // Actualizar lista de resultados por jugador
        this.updatePlayerResults();
        
        // Efectos visuales
        this.applyResultEffects(impostorsWon);
        
        console.log('Resultados mostrados. Ganador:', impostorsWon ? 'Impostor' : 'Inocentes');
    },
    
    // Actualizar detalles del juego
    updateGameDetails() {
        document.getElementById('game-duration').textContent = 
            `${this.gameSettings.timeLimit} minutos`;
        document.getElementById('game-players').textContent = this.players.length;
        document.getElementById('game-impostors').textContent = this.impostors.length;
        document.getElementById('game-word').textContent = this.currentWord;
        document.getElementById('game-hint').textContent = this.currentHint;
        document.getElementById('game-result').textContent = 
            this.gameResult === 'impostor_win' ? 'Impostor gana' : 'Inocentes ganan';
        document.getElementById('game-impostor-names').textContent = 
            this.impostors.map(i => i.name).join(', ');
        
        // Actualizar mensajes de resultado
        document.getElementById('impostor-win-details').textContent = this.resultMessage;
        document.getElementById('innocent-win-details').textContent = this.resultMessage;
    },
    
    // Actualizar resultados por jugador
    updatePlayerResults() {
        const resultsList = document.getElementById('players-results-list');
        if (!resultsList) return;
        
        resultsList.innerHTML = '';
        
        this.players.forEach(player => {
            const resultItem = document.createElement('div');
            resultItem.className = `player-result-item ${player.role} ${player.eliminated ? 'eliminated' : ''}`;
            
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
    
    // Aplicar efectos de resultado
    applyResultEffects(impostorsWon) {
        if (impostorsWon) {
            document.body.classList.add('impostor-win');
            document.body.classList.remove('innocent-win');
        } else {
            document.body.classList.add('innocent-win');
            document.body.classList.remove('impostor-win');
            
            // Mostrar celebración si existe la función
            if (typeof showCelebration === 'function') {
                showCelebration();
            }
        }
    },
    
    // Jugar otra vez
    playAgain() {
        console.log('Jugando otra vez...');
        
        // Reiniciar estado
        this.gameState = 'setup';
        this.players = [];
        this.impostors = [];
        this.currentWord = '';
        this.currentHint = '';
        
        // Limpiar temporizadores
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.votingTimer) {
            clearInterval(this.votingTimer);
            this.votingTimer = null;
        }
        
        // Mostrar pantalla de configuración
        this.showScreen('setup-screen');
        
        // Limpiar clases de resultado
        document.body.classList.remove('impostor-win', 'innocent-win');
        
        // Actualizar UI de configuración
        this.updateImpostorRatio();
        this.updateWordCount();
        
        this.showNotification('Configura una nueva partida', 'info');
    },
    
    // Guardar partida
    saveGame() {
        console.log('Guardando partida...');
        
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
                impostorNames: this.impostors.map(i => i.name).join(', '),
                category: this.gameSettings.category,
                difficulty: this.gameSettings.difficulty
            };
            
            window.impostorStorage.saveGame(gameData);
            this.loadHistory();
            this.showNotification('Partida guardada en el historial', 'success');
        } else {
            this.showNotification('Error al guardar la partida. Almacenamiento no disponible.', 'error');
        }
    },
    
    // Cargar historial
    loadHistory() {
        console.log('Cargando historial...');
        
        if (typeof window.impostorStorage !== 'undefined') {
            this.gameHistory = window.impostorStorage.getHistory();
            this.renderHistory();
        }
    },
    
    // Renderizar historial
    renderHistory() {
        const historyList = document.getElementById('impostor-history-list');
        if (!historyList) return;
        
        if (!this.gameHistory || this.gameHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-history fa-2x"></i>
                    <p>No hay partidas guardadas todavía.</p>
                    <p class="small">Juega una partida para comenzar el historial.</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = '';
        
        // Mostrar máximo 10 partidas
        const recentGames = this.gameHistory.slice(0, 10);
        
        recentGames.forEach((game, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const resultClass = game.result === 'Impostor gana' ? 'impostor-win' : 'innocent-win';
            
            historyItem.innerHTML = `
                <div class="history-teams">
                    <div><strong>Partida ${index + 1}</strong></div>
                    <div>${game.date}</div>
                </div>
                <div class="history-score ${resultClass}">
                    ${game.result}
                </div>
                <div class="history-info">
                    <div><i class="fas fa-users"></i> ${game.players} jugadores</div>
                    <div><i class="fas fa-user-secret"></i> ${game.impostors} impostor(es)</div>
                    <div><i class="fas fa-key"></i> "${game.word}"</div>
                    ${game.category && game.category !== 'all' ? 
                        `<div><i class="fas fa-tag"></i> ${game.category}</div>` : ''}
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
    },
    
    // Limpiar historial
    clearHistory() {
        if (confirm('¿Estás seguro de que quieres borrar todo el historial de partidas? Esta acción no se puede deshacer.')) {
            if (typeof window.impostorStorage !== 'undefined') {
                window.impostorStorage.clearHistory();
                this.loadHistory();
                this.showNotification('Historial borrado correctamente', 'success');
            }
        }
    },
    
    // Volver a configuración
    backToSetup() {
        console.log('Volviendo a configuración...');
        
        // Preguntar si hay partida en curso
        if (this.gameState !== 'setup' && this.gameState !== 'results') {
            if (!confirm('Hay una partida en curso. ¿Seguro que quieres volver al inicio? Se perderá el progreso.')) {
                return;
            }
        }
        
        this.gameState = 'setup';
        this.showScreen('setup-screen');
        document.body.classList.remove('impostor-win', 'innocent-win');
        
        // Detener temporizadores si los hay
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.showNotification('Volviendo a la configuración inicial', 'info');
    },
    
    // Compartir resultados
    openShareModal() {
        console.log('Abriendo modal de compartir...');
        
        const modal = document.getElementById('share-modal');
        const textArea = document.getElementById('share-text');
        
        if (!modal || !textArea) return;
        
        // Generar texto para compartir
        const shareText = this.generateShareText();
        textArea.value = shareText;
        
        modal.style.display = 'flex';
    },
    
    // Generar texto para compartir
    generateShareText() {
        const impostorsWon = this.gameResult === 'impostor_win';
        const impostorNames = this.impostors.map(i => i.name).join(', ');
        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();
        
        let shareText = `🎮 RESULTADO DEL JUEGO DEL IMPOSTOR 🎮\n`;
        shareText += `📅 ${date} ⏰ ${time}\n\n`;
        
        shareText += `🏆 ${impostorsWon ? '¡EL IMPOSTOR GANA! 👿' : '¡LOS INOCENTES GANAN! 😇'}\n\n`;
        
        shareText += `📊 DETALLES DE LA PARTIDA:\n`;
        shareText += `• Jugadores: ${this.players.length}\n`;
        shareText += `• Impostores: ${this.impostors.length} (${impostorNames})\n`;
        shareText += `• Palabra secreta: "${this.currentWord}"\n`;
        shareText += `• Pista del impostor: "${this.currentHint}"\n`;
        shareText += `• Duración: ${this.gameSettings.timeLimit} minutos\n`;
        shareText += `• Categoría: ${this.capitalizeFirstLetter(this.gameSettings.category)}\n`;
        if (this.gameSettings.difficulty !== 'all') {
            shareText += `• Dificultad: ${this.gameSettings.difficulty}\n`;
        }
        shareText += `• Resultado: ${impostorsWon ? 'Impostor gana 👿' : 'Inocentes ganan 😇'}\n\n`;
        
        shareText += `👥 ROLES DE LOS JUGADORES:\n`;
        this.players.forEach(player => {
            const emoji = player.role === 'impostor' ? '👿' : '😇';
            const eliminated = player.eliminated ? ' (ELIMINADO ✗)' : '';
            shareText += `• ${player.name}: ${player.role === 'impostor' ? 'IMPOSTOR' : 'INOCENTE'} ${emoji}${eliminated}\n`;
        });
        
        shareText += `\n🎲 Generado con Juego del Impostor - Liga Escolar\n`;
        shareText += `🔗 Juega en: https://www.ligaescolar.es/impostor/`;
        
        return shareText;
    },
    
    closeShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    copyShareText() {
        const textArea = document.getElementById('share-text');
        if (!textArea) return;
        
        textArea.select();
        textArea.setSelectionRange(0, 99999); // Para móviles
        
        try {
            navigator.clipboard.writeText(textArea.value);
            this.showNotification('Texto copiado al portapapeles', 'success');
        } catch (err) {
            // Fallback para navegadores antiguos
            document.execCommand('copy');
            this.showNotification('Texto copiado al portapapeles', 'success');
        }
    },
    
    shareToWhatsapp() {
        const textArea = document.getElementById('share-text');
        if (!textArea) return;
        
        const text = encodeURIComponent(textArea.value);
        const url = `https://wa.me/?text=${text}`;
        window.open(url, '_blank');
    },
    
    shareViaNative() {
        const textArea = document.getElementById('share-text');
        if (!textArea) return;
        
        const text = textArea.value;
        
        if (navigator.share) {
            navigator.share({
                title: 'Resultados del Juego del Impostor - Liga Escolar',
                text: text,
                url: 'https://www.ligaescolar.es/impostor/'
            }).catch(err => {
                console.log('Error al compartir:', err);
                this.copyShareText();
            });
        } else {
            this.copyShareText();
        }
    },
    
    // Mostrar pantalla específica
    showScreen(screenId) {
        console.log('Mostrando pantalla:', screenId);
        
        // Ocultar todas las pantallas
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar la pantalla solicitada
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            
            // Asegurarse de que la pantalla sea visible
            screen.style.display = 'block';
        }
    },
    
    // Mostrar notificación
    showNotification(message, type = 'success') {
        console.log('Notificación:', type, message);
        
        // Intentar usar la función común si existe
        if (typeof window.common !== 'undefined' && 
            typeof window.common.showNotification === 'function') {
            window.common.showNotification(message, type);
        } else {
            // Fallback: alert simple
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
};

// Hacer el juego accesible globalmente
window.impostorGame = impostorGame;
