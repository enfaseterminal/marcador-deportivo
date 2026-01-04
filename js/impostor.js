// [file name]: impostor/js/impostor.js
// Lógica principal del juego del impostor - VERSIÓN CORREGIDA

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
    
    // Inicialización CORREGIDA
    init() {
        console.log('[impostor.js] Inicializando Juego del Impostor');
        
        // PRIMERO: Forzar que setup-screen sea visible
        this.forceSetupVisible();
        
        // Cargar datos
        this.loadGameData();
        
        // Cargar historial
        this.loadHistory();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // MOSTRAR pantalla de configuración (usando ID CORRECTO)
        this.showScreen('setup-screen');
        
        // Actualizar contador de palabras
        this.updateWordCount();
        
        // Inicializar controles
        this.initializeConfigControls();
        
        console.log('[impostor.js] Juego inicializado correctamente');
        return true;
    },
    
    // Función para forzar visibilidad de setup-screen
    forceSetupVisible() {
        console.log('[impostor.js] Forzando visibilidad de setup-screen');
        
        // Ocultar todas las pantallas
        const allScreens = document.querySelectorAll('.game-screen');
        allScreens.forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
            screen.style.opacity = '0';
            screen.style.visibility = 'hidden';
        });
        
        // Mostrar solo setup-screen
        const setupScreen = document.getElementById('setup-screen');
        if (setupScreen) {
            setupScreen.classList.add('active');
            setupScreen.style.display = 'block';
            setupScreen.style.opacity = '1';
            setupScreen.style.visibility = 'visible';
        }
        
        // Actualizar estado del juego
        this.gameState = 'setup';
    },
    
    // Cargar datos del juego
    loadGameData() {
        console.log('[impostor.js] Cargando datos del juego');
        
        // Esto se cargará desde impostor-data.js
        if (typeof window.impostorData !== 'undefined') {
            this.gameData = window.impostorData.getGameData();
            if (this.gameData && this.gameData.palabras) {
                console.log('[impostor.js] Datos cargados:', this.gameData.palabras.length, 'palabras disponibles');
            } else {
                console.warn('[impostor.js] Datos cargados pero sin palabras');
            }
        } else {
            console.error('[impostor.js] ERROR: window.impostorData no está definido');
            // Datos de emergencia
            this.gameData = {
                palabras: [
                    { palabra: "Fútbol", pista: "Deporte con balón", categoria: "deportes", dificultad: "facil" },
                    { palabra: "Baloncesto", pista: "Deporte con canasta", categoria: "deportes", dificultad: "facil" },
                    { palabra: "Perro", pista: "Animal que ladra", categoria: "animales", dificultad: "facil" },
                    { palabra: "Gato", pista: "Animal que maúlla", categoria: "animales", dificultad: "facil" }
                ]
            };
            console.log('[impostor.js] Usando datos de emergencia:', this.gameData.palabras.length, 'palabras');
        }
    },
    
    // Inicializar controles de configuración
    initializeConfigControls() {
        console.log('[impostor.js] Inicializando controles de configuración');
        
        // Configurar valores iniciales
        if (document.getElementById('playerCount')) {
            this.updatePlayerCount(this.gameSettings.playerCount);
            this.updateImpostorCount(this.gameSettings.impostorCount);
            this.updateTimeLimit(this.gameSettings.timeLimit);
            
            // Actualizar categorías disponibles
            this.updateCategoryOptions();
            
            console.log('[impostor.js] Controles de configuración inicializados');
        } else {
            console.error('[impostor.js] ERROR: Controles de configuración no encontrados');
        }
    },
    
    // Configurar event listeners
    setupEventListeners() {
        console.log('[impostor.js] Configurando event listeners');
        
        try {
            // Configuración básica - jugadores
            const playerCountInput = document.getElementById('playerCount');
            const playerRangeInput = document.getElementById('playerRange');
            
            if (playerCountInput && playerRangeInput) {
                playerCountInput.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value) || 6;
                    this.updatePlayerCount(value);
                });
                
                playerRangeInput.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value) || 6;
                    playerCountInput.value = value;
                    this.updatePlayerCount(value);
                });
            }
            
            // Botones de incremento/decremento jugadores
            const decreasePlayersBtn = document.getElementById('decrease-players');
            const increasePlayersBtn = document.getElementById('increase-players');
            
            if (decreasePlayersBtn && increasePlayersBtn && playerCountInput) {
                decreasePlayersBtn.addEventListener('click', () => {
                    let value = parseInt(playerCountInput.value) - 1;
                    if (value < 3) value = 3;
                    playerCountInput.value = value;
                    if (playerRangeInput) playerRangeInput.value = value;
                    this.updatePlayerCount(value);
                });
                
                increasePlayersBtn.addEventListener('click', () => {
                    let value = parseInt(playerCountInput.value) + 1;
                    if (value > 12) value = 12;
                    playerCountInput.value = value;
                    if (playerRangeInput) playerRangeInput.value = value;
                    this.updatePlayerCount(value);
                });
            }
            
            // Configuración básica - impostores
            const impostorCountInput = document.getElementById('impostorCount');
            const impostorRangeInput = document.getElementById('impostorRange');
            
            if (impostorCountInput && impostorRangeInput) {
                impostorCountInput.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value) || 1;
                    this.updateImpostorCount(value);
                });
                
                impostorRangeInput.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value) || 1;
                    impostorCountInput.value = value;
                    this.updateImpostorCount(value);
                });
            }
            
            // Botones de incremento/decremento impostores
            const decreaseImpostorsBtn = document.getElementById('decrease-impostors');
            const increaseImpostorsBtn = document.getElementById('increase-impostors');
            
            if (decreaseImpostorsBtn && increaseImpostorsBtn && impostorCountInput) {
                decreaseImpostorsBtn.addEventListener('click', () => {
                    let value = parseInt(impostorCountInput.value) - 1;
                    if (value < 1) value = 1;
                    impostorCountInput.value = value;
                    if (impostorRangeInput) impostorRangeInput.value = value;
                    this.updateImpostorCount(value);
                });
                
                increaseImpostorsBtn.addEventListener('click', () => {
                    let value = parseInt(impostorCountInput.value) + 1;
                    if (value > 3) value = 3;
                    impostorCountInput.value = value;
                    if (impostorRangeInput) impostorRangeInput.value = value;
                    this.updateImpostorCount(value);
                });
            }
            
            // Configuración básica - tiempo
            const timeLimitInput = document.getElementById('timeLimit');
            const timeRangeInput = document.getElementById('timeRange');
            
            if (timeLimitInput && timeRangeInput) {
                timeLimitInput.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value) || 5;
                    this.updateTimeLimit(value);
                });
                
                timeRangeInput.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value) || 5;
                    timeLimitInput.value = value;
                    this.updateTimeLimit(value);
                });
            }
            
            // Botones de incremento/decremento tiempo
            const decreaseTimeBtn = document.getElementById('decrease-time');
            const increaseTimeBtn = document.getElementById('increase-time');
            
            if (decreaseTimeBtn && increaseTimeBtn && timeLimitInput) {
                decreaseTimeBtn.addEventListener('click', () => {
                    let value = parseInt(timeLimitInput.value) - 1;
                    if (value < 1) value = 1;
                    timeLimitInput.value = value;
                    if (timeRangeInput) timeRangeInput.value = value;
                    this.updateTimeLimit(value);
                });
                
                increaseTimeBtn.addEventListener('click', () => {
                    let value = parseInt(timeLimitInput.value) + 1;
                    if (value > 15) value = 15;
                    timeLimitInput.value = value;
                    if (timeRangeInput) timeRangeInput.value = value;
                    this.updateTimeLimit(value);
                });
            }
            
            // Categoría de palabras
            const wordCategorySelect = document.getElementById('wordCategory');
            if (wordCategorySelect) {
                wordCategorySelect.addEventListener('change', (e) => {
                    this.gameSettings.category = e.target.value;
                    this.updateWordCount();
                });
            }
            
            // Dificultad (nueva opción)
            const difficultySelect = document.getElementById('difficulty');
            if (difficultySelect) {
                difficultySelect.addEventListener('change', (e) => {
                    this.gameSettings.difficulty = e.target.value;
                    this.updateWordCount();
                });
            }
            
            // Opciones avanzadas
            const enableHintsCheckbox = document.getElementById('enableHints');
            if (enableHintsCheckbox) {
                enableHintsCheckbox.addEventListener('change', (e) => {
                    this.gameSettings.enableHints = e.target.checked;
                });
            }
            
            const enableVotingCheckbox = document.getElementById('enableVoting');
            if (enableVotingCheckbox) {
                enableVotingCheckbox.addEventListener('change', (e) => {
                    this.gameSettings.enableVoting = e.target.checked;
                });
            }
            
            const randomRolesCheckbox = document.getElementById('randomRoles');
            if (randomRolesCheckbox) {
                randomRolesCheckbox.addEventListener('change', (e) => {
                    this.gameSettings.randomRoles = e.target.checked;
                });
            }
            
            // Botones de control del juego
            this.setupGameControls();
            
            console.log('[impostor.js] Event listeners configurados correctamente');
            
        } catch (error) {
            console.error('[impostor.js] ERROR al configurar event listeners:', error);
        }
    },
    
    // Configurar controles del juego
    setupGameControls() {
        console.log('[impostor.js] Configurando controles del juego');
        
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
            try {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('click', handler);
                } else {
                    console.warn('[impostor.js] Control no encontrado:', id);
                }
            } catch (error) {
                console.error('[impostor.js] Error al configurar control', id, ':', error);
            }
        });
        
        console.log('[impostor.js] Controles del juego configurados');
    },
    
    // Actualizar contador de jugadores
    updatePlayerCount(count) {
        console.log('[impostor.js] Actualizando jugadores:', count);
        
        this.gameSettings.playerCount = count;
        
        // Ajustar número máximo de impostores
        const maxImpostors = Math.min(3, Math.floor(count / 2));
        const impostorInput = document.getElementById('impostorCount');
        const impostorRange = document.getElementById('impostorRange');
        
        if (impostorInput && impostorRange) {
            if (this.gameSettings.impostorCount > maxImpostors) {
                this.gameSettings.impostorCount = maxImpostors;
                impostorInput.value = maxImpostors;
                impostorRange.value = maxImpostors;
            }
            
            impostorRange.max = maxImpostors;
            impostorInput.max = maxImpostors;
        }
        
        this.updateImpostorRatio();
    },
    
    // Actualizar contador de impostores
    updateImpostorCount(count) {
        console.log('[impostor.js] Actualizando impostores:', count);
        this.gameSettings.impostorCount = count;
        this.updateImpostorRatio();
    },
    
    // Actualizar ratio de impostores
    updateImpostorRatio() {
        const playerCount = this.gameSettings.playerCount;
        const impostorCount = this.gameSettings.impostorCount;
        const ratioElement = document.getElementById('impostor-ratio');
        
        if (ratioElement && playerCount > 0 && impostorCount > 0) {
            const ratio = Math.round(playerCount / impostorCount);
            ratioElement.textContent = `Ratio: 1 impostor por cada ${ratio} jugadores`;
        }
    },
    
    // Actualizar límite de tiempo
    updateTimeLimit(minutes) {
        console.log('[impostor.js] Actualizando tiempo límite:', minutes);
        this.gameSettings.timeLimit = minutes;
    },
    
    // Actualizar opciones de categoría
    updateCategoryOptions() {
        // Esta función se implementaría si hay un sistema dinámico de categorías
        // Por ahora, las categorías están definidas en el HTML
    },
    
    // Actualizar contador de palabras disponibles
    updateWordCount() {
        const wordCountElement = document.getElementById('word-count');
        if (!wordCountElement) return;
        
        if (!this.gameData || !this.gameData.palabras) {
            wordCountElement.textContent = 'Error cargando palabras';
            return;
        }
        
        let palabrasFiltradas = this.gameData.palabras;
        
        // Filtrar por categoría
        if (this.gameSettings.category !== 'all') {
            palabrasFiltradas = palabrasFiltradas.filter(word => 
                word.categoria === this.gameSettings.category
            );
        }
        
        // Filtrar por dificultad
        if (this.gameSettings.difficulty !== 'all') {
            if (this.gameSettings.difficulty === 'mixto') {
                // Para mixto, no filtrar por dificultad
            } else {
                palabrasFiltradas = palabrasFiltradas.filter(word => 
                    word.dificultad === this.gameSettings.difficulty
                );
            }
        }
        
        const count = palabrasFiltradas.length;
        let message = `${count} palabras disponibles`;
        
        if (this.gameSettings.category !== 'all') {
            message += ` en ${this.capitalizeFirstLetter(this.gameSettings.category)}`;
        }
        
        if (this.gameSettings.difficulty !== 'all') {
            message += ` (${this.gameSettings.difficulty})`;
        }
        
        wordCountElement.textContent = message;
    },
    
    // Capitalizar primera letra
    capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    // Inicio rápido
    quickStart() {
        console.log('[impostor.js] Inicio rápido activado');
        
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
        document.getElementById('playerCount').value = 6;
        document.getElementById('playerRange').value = 6;
        document.getElementById('impostorCount').value = 1;
        document.getElementById('impostorRange').value = 1;
        document.getElementById('timeLimit').value = 5;
        document.getElementById('timeRange').value = 5;
        document.getElementById('wordCategory').value = 'all';
        document.getElementById('difficulty').value = 'all';
        document.getElementById('enableHints').checked = true;
        document.getElementById('enableVoting').checked = true;
        document.getElementById('randomRoles').checked = true;
        
        this.updateImpostorRatio();
        this.updateWordCount();
        
        this.startGame();
    },
    
    // Iniciar juego
    startGame() {
        console.log('[impostor.js] Iniciando juego...');
        
        // Validar configuración
        if (this.gameSettings.playerCount < 3) {
            this.showNotification('Se necesitan al menos 3 jugadores', 'error');
            return false;
        }
        
        if (this.gameSettings.impostorCount >= this.gameSettings.playerCount) {
            this.showNotification('Debe haber más jugadores que impostores', 'error');
            return false;
        }
        
        // Seleccionar palabra aleatoria
        if (!this.selectRandomWord()) {
            this.showNotification('No hay palabras disponibles con los filtros seleccionados', 'error');
            return false;
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
        return true;
    },
    
    // Seleccionar palabra aleatoria
    selectRandomWord() {
        console.log('[impostor.js] Seleccionando palabra aleatoria');
        
        if (!this.gameData || !this.gameData.palabras) {
            console.error('[impostor.js] No hay datos de palabras');
            this.currentWord = 'Error';
            this.currentHint = 'No hay datos disponibles';
            return false;
        }
        
        let palabrasFiltradas = this.gameData.palabras;
        
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
            console.error('[impostor.js] No hay palabras después de filtrar');
            return false;
        }
        
        const randomIndex = Math.floor(Math.random() * palabrasFiltradas.length);
        const selectedWord = palabrasFiltradas[randomIndex];
        
        this.currentWord = selectedWord.palabra;
        this.currentHint = selectedWord.pista;
        
        console.log('[impostor.js] Palabra seleccionada:', this.currentWord, 'Pista:', this.currentHint);
        return true;
    },
    
    // Crear lista de jugadores
    createPlayers() {
        console.log('[impostor.js] Creando jugadores:', this.gameSettings.playerCount);
        
        this.players = [];
        
        for (let i = 1; i <= this.gameSettings.playerCount; i++) {
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
        
        console.log('[impostor.js] Jugadores creados:', this.players.length);
    },
    
    // Asignar roles
    assignRoles() {
        console.log('[impostor.js] Asignando roles...');
        
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
        
        // Crear array de índices aleatorios
        const indices = [];
        for (let i = 0; i < this.players.length; i++) {
            indices.push(i);
        }
        
        // Barajar índices
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        // Asignar primeros n índices como impostores
        for (let i = 0; i < impostorCount && i < indices.length; i++) {
            const playerIndex = indices[i];
            this.players[playerIndex].role = 'impostor';
            this.impostors.push(this.players[playerIndex]);
        }
        
        console.log('[impostor.js] Impostores asignados:', this.impostors.map(p => p.name));
    },
    
    // Mostrar pantalla de roles
    showRoleScreen() {
        console.log('[impostor.js] Mostrando pantalla de roles');
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
            console.error('[impostor.js] Índice de jugador inválido:', playerIndex);
            return;
        }
        
        this.currentPlayerIndex = playerIndex;
        const player = this.players[playerIndex];
        
        console.log('[impostor.js] Mostrando rol para:', player.name, 'Rol:', player.role);
        
        // Actualizar información del jugador
        document.getElementById('role-title').textContent = player.name;
        document.getElementById('current-player').textContent = playerIndex + 1;
        
        // Actualizar barra de progreso
        this.updateProgressBar(playerIndex);
        
        // Configurar según el rol
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
                if (hintDisplay) hintDisplay.style.display = 'block';
            } else {
                if (hintDisplay) hintDisplay.style.display = 'none';
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
            if (hintDisplay) hintDisplay.style.display = 'none';
        }
        
        // Actualizar botones de navegación
        const prevBtn = document.getElementById('prev-player');
        const nextBtn = document.getElementById('next-player');
        
        if (prevBtn) prevBtn.disabled = playerIndex === 0;
        if (nextBtn) nextBtn.disabled = playerIndex === this.players.length - 1;
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
        console.log('[impostor.js] Comenzando juego...');
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
        
        console.log('[impostor.js] Iniciando votación...');
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
        console.log('[impostor.js] Votando por jugador:', playerId);
        
        // En esta versión simplificada, asumimos que el jugador actual es el primero
        const currentPlayer = this.players[0];
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
        console.log('[impostor.js] Saltando votación...');
        this.endGame();
    },
    
    // Enviar votos
    submitVotes() {
        console.log('[impostor.js] Enviando votos...');
        
        if (this.votingTimer) {
            clearInterval(this.votingTimer);
        }
        
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
        console.log('[impostor.js] Terminando juego...');
        
        if (this.gameState === 'playing') {
            // Si se termina sin votación, el impostor gana
            this.gameResult = 'impostor_win';
            this.resultMessage = 'Se acabó el tiempo. ¡El impostor gana!';
        }
        
        this.showResults();
    },
    
    // Mostrar resultados
    showResults() {
        console.log('[impostor.js] Mostrando resultados...');
        this.gameState = 'results';
        
        // Detener todos los temporizadores
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        if (this.votingTimer) {
            clearInterval(this.votingTimer);
            this.votingTimer = null;
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
        
        console.log('[impostor.js] Resultados mostrados. Ganador:', impostorsWon ? 'Impostor' : 'Inocentes');
    },
    
    // Actualizar detalles del juego
    updateGameDetails() {
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };
        
        updateElement('game-duration', `${this.gameSettings.timeLimit} minutos`);
        updateElement('game-players', this.players.length);
        updateElement('game-impostors', this.impostors.length);
        updateElement('game-word', this.currentWord);
        updateElement('game-hint', this.currentHint);
        updateElement('game-category', this.capitalizeFirstLetter(this.gameSettings.category));
        updateElement('game-difficulty', this.capitalizeFirstLetter(this.gameSettings.difficulty));
        updateElement('game-result', this.gameResult === 'impostor_win' ? 'Impostor gana' : 'Inocentes ganan');
        updateElement('game-impostor-names', this.impostors.map(i => i.name).join(', '));
        
        // Actualizar mensajes de resultado
        updateElement('impostor-win-details', this.resultMessage);
        updateElement('innocent-win-details', this.resultMessage);
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
        console.log('[impostor.js] Jugar otra vez...');
        
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
        console.log('[impostor.js] Guardando partida...');
        
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
        console.log('[impostor.js] Cargando historial...');
        
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
        console.log('[impostor.js] Volviendo a configuración...');
        
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
        console.log('[impostor.js] Abriendo modal de compartir...');
        
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
    
    // ===== FUNCIÓN CRÍTICA CORREGIDA =====
    // Mostrar pantalla específica (VERSIÓN CORREGIDA)
    showScreen(screenId) {
        console.log('[impostor.js] showScreen llamada con:', screenId);
        
        // CORRECCIÓN CRÍTICA: 'setup' -> 'setup-screen'
        if (screenId === 'setup') {
            screenId = 'setup-screen';
            console.log('[impostor.js] Corregido: setup -> setup-screen');
        }
        
        // Ocultar TODAS las pantallas
        const allScreens = document.querySelectorAll('.game-screen');
        allScreens.forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
            screen.style.opacity = '0';
            screen.style.visibility = 'hidden';
        });
        
        // Mostrar la pantalla solicitada
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            targetScreen.style.display = 'block';
            targetScreen.style.opacity = '1';
            targetScreen.style.visibility = 'visible';
            
            console.log('[impostor.js] Pantalla ' + screenId + ' activada correctamente');
        } else {
            console.error('[impostor.js] ERROR: No existe pantalla con id:', screenId);
            
            // Fallback: mostrar setup-screen
            const setupScreen = document.getElementById('setup-screen');
            if (setupScreen) {
                setupScreen.classList.add('active');
                setupScreen.style.display = 'block';
                setupScreen.style.opacity = '1';
                setupScreen.style.visibility = 'visible';
                console.log('[impostor.js] Fallback a setup-screen');
            }
        }
        
        // Actualizar estado del juego
        this.gameState = screenId.replace('-screen', '');
        console.log('[impostor.js] gameState actualizado a:', this.gameState);
        
        return true;
    },
    
    // Mostrar notificación
    showNotification(message, type = 'success') {
        console.log('[impostor.js] Notificación:', type, '-', message);
        
        // Intentar usar la función común si existe
        if (typeof window.common !== 'undefined' && 
            typeof window.common.showNotification === 'function') {
            window.common.showNotification(message, type);
        } else {
            // Fallback: alert simple para debugging
            const types = {
                'success': '✅',
                'error': '❌',
                'warning': '⚠️',
                'info': 'ℹ️'
            };
            
            const icon = types[type] || '💬';
            alert(`${icon} ${message}`);
        }
    }
};

// Hacer el juego accesible globalmente
window.impostorGame = impostorGame;

// Función de inicialización global para compatibilidad
window.initImpostorGame = function() {
    if (window.impostorGame && typeof window.impostorGame.init === 'function') {
        console.log('Inicializando impostorGame desde initImpostorGame()');
        return window.impostorGame.init();
    } else {
        console.error('ERROR: No se puede inicializar impostorGame');
        return false;
    }
};
