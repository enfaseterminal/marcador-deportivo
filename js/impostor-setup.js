// impostor/js/impostor-setup.js
// Lógica para la página de configuración

const impostorSetup = {
    gameSettings: {
        playerCount: 6,
        impostorCount: 1,
        timeLimit: 5,
        category: 'all',
        difficulty: 'mixto',
        enableTimer: true,
        enableSound: true,
        autoSave: true
    },
    
    init() {
        console.log('=== IMPOSTOR SETUP INICIADO ===');
        
        // Cargar configuración guardada
        this.loadSavedSettings();
        
        // Configurar listeners
        this.setupEventListeners();
        
        // Actualizar UI
        this.updateUI();
        this.updatePlayerVisualization();
        this.updateWordCount();
        
        // Cargar historial
        this.loadHistory();
        
        console.log('Setup inicializado correctamente');
    },
    
    loadSavedSettings() {
        try {
            const saved = localStorage.getItem('impostor_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.gameSettings = { ...this.gameSettings, ...parsed };
            }
        } catch (e) {
            console.warn('No se pudo cargar configuración guardada:', e);
        }
    },
    
    saveSettings() {
        try {
            localStorage.setItem('impostor_settings', JSON.stringify(this.gameSettings));
            console.log('Configuración guardada');
        } catch (e) {
            console.error('Error al guardar configuración:', e);
        }
    },
    
    setupEventListeners() {
        // Botones de jugadores
        document.getElementById('increase-players')?.addEventListener('click', () => {
            this.changePlayerCount(1);
        });
        
        document.getElementById('decrease-players')?.addEventListener('click', () => {
            this.changePlayerCount(-1);
        });
        
        document.getElementById('playerCount')?.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 6;
            this.setPlayerCount(value);
        });
        
        // Botones de impostores
        document.getElementById('increase-impostors')?.addEventListener('click', () => {
            this.changeImpostorCount(1);
        });
        
        document.getElementById('decrease-impostors')?.addEventListener('click', () => {
            this.changeImpostorCount(-1);
        });
        
        document.getElementById('impostorCount')?.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 1;
            this.setImpostorCount(value);
        });
        
        // Botones de tiempo
        document.getElementById('increase-time')?.addEventListener('click', () => {
            this.changeTimeLimit(1);
        });
        
        document.getElementById('decrease-time')?.addEventListener('click', () => {
            this.changeTimeLimit(-1);
        });
        
        document.getElementById('timeLimit')?.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 5;
            this.setTimeLimit(value);
        });
        
        // Selectores
        document.getElementById('wordCategory')?.addEventListener('change', (e) => {
            this.gameSettings.category = e.target.value;
            this.updateWordCount();
            this.saveSettings();
        });
        
        document.getElementById('difficulty')?.addEventListener('change', (e) => {
            this.gameSettings.difficulty = e.target.value;
            this.updateWordCount();
            this.saveSettings();
        });
        
        // Toggles
        document.getElementById('enableTimer')?.addEventListener('change', (e) => {
            this.gameSettings.enableTimer = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('enableSound')?.addEventListener('change', (e) => {
            this.gameSettings.enableSound = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('autoSave')?.addEventListener('change', (e) => {
            this.gameSettings.autoSave = e.target.checked;
            this.saveSettings();
        });
        
        // Botones principales
        document.getElementById('start-game')?.addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('quick-start')?.addEventListener('click', () => {
            this.quickStart();
        });
        
        document.getElementById('clear-history')?.addEventListener('click', () => {
            this.clearHistory();
        });
    },
    
    changePlayerCount(delta) {
        let newCount = this.gameSettings.playerCount + delta;
        this.setPlayerCount(newCount);
    },
    
    setPlayerCount(count) {
        // Validar límites
        count = Math.max(3, Math.min(12, count));
        
        this.gameSettings.playerCount = count;
        document.getElementById('playerCount').value = count;
        
        // Ajustar impostores si es necesario
        this.adjustImpostorCount();
        
        // Actualizar UI
        this.updatePlayerVisualization();
        this.updateImpostorRatio();
        this.saveSettings();
    },
    
    changeImpostorCount(delta) {
        let newCount = this.gameSettings.impostorCount + delta;
        this.setImpostorCount(newCount);
    },
    
    setImpostorCount(count) {
        const maxImpostors = Math.min(3, Math.floor(this.gameSettings.playerCount / 2));
        count = Math.max(1, Math.min(maxImpostors, count));
        
        this.gameSettings.impostorCount = count;
        document.getElementById('impostorCount').value = count;
        
        // Actualizar UI
        this.updatePlayerVisualization();
        this.updateImpostorRatio();
        this.saveSettings();
    },
    
    adjustImpostorCount() {
        const maxImpostors = Math.min(3, Math.floor(this.gameSettings.playerCount / 2));
        if (this.gameSettings.impostorCount > maxImpostors) {
            this.setImpostorCount(maxImpostors);
        }
        
        // Actualizar máximo del input
        document.getElementById('impostorCount').max = maxImpostors;
    },
    
    changeTimeLimit(delta) {
        let newTime = this.gameSettings.timeLimit + delta;
        this.setTimeLimit(newTime);
    },
    
    setTimeLimit(minutes) {
        minutes = Math.max(2, Math.min(15, minutes));
        
        this.gameSettings.timeLimit = minutes;
        document.getElementById('timeLimit').value = minutes;
        this.saveSettings();
    },
    
    updateUI() {
        // Actualizar todos los controles con valores actuales
        document.getElementById('playerCount').value = this.gameSettings.playerCount;
        document.getElementById('impostorCount').value = this.gameSettings.impostorCount;
        document.getElementById('timeLimit').value = this.gameSettings.timeLimit;
        document.getElementById('wordCategory').value = this.gameSettings.category;
        document.getElementById('difficulty').value = this.gameSettings.difficulty;
        document.getElementById('enableTimer').checked = this.gameSettings.enableTimer;
        document.getElementById('enableSound').checked = this.gameSettings.enableSound;
        document.getElementById('autoSave').checked = this.gameSettings.autoSave;
        
        // Actualizar límites
        this.adjustImpostorCount();
        this.updateImpostorRatio();
    },
    
    updateImpostorRatio() {
        const playerCount = this.gameSettings.playerCount;
        const impostorCount = this.gameSettings.impostorCount;
        const ratio = Math.round(playerCount / impostorCount);
        
        document.getElementById('impostor-ratio').textContent = 
            `${impostorCount} impostor(es) entre ${playerCount} jugadores (1 por cada ${ratio})`;
    },
    
    updatePlayerVisualization() {
        const container = document.getElementById('player-visual');
        if (!container) return;
        
        const playerCount = this.gameSettings.playerCount;
        const impostorCount = this.gameSettings.impostorCount;
        
        // Crear array de índices para impostores aleatorios
        const impostorIndices = [];
        const allIndices = Array.from({length: playerCount}, (_, i) => i);
        
        // Seleccionar índices aleatorios para impostores
        for (let i = 0; i < impostorCount; i++) {
            const randomIndex = Math.floor(Math.random() * allIndices.length);
            impostorIndices.push(allIndices[randomIndex]);
            allIndices.splice(randomIndex, 1);
        }
        
        // Generar HTML
        let html = '';
        for (let i = 0; i < playerCount; i++) {
            const isImpostor = impostorIndices.includes(i);
            const playerNum = i + 1;
            
            html += `
                <div class="player-circle ${isImpostor ? 'impostor' : ''}" 
                     title="Jugador ${playerNum} ${isImpostor ? '(Impostor)' : '(Ciudadano)'}">
                    ${playerNum}
                    ${isImpostor ? '<i class="fas fa-user-secret" style="font-size: 0.8rem; margin-left: 2px;"></i>' : ''}
                </div>
            `;
        }
        
        container.innerHTML = html;
    },
    
    updateWordCount() {
        if (!window.impostorData || typeof window.impostorData.countWords !== 'function') {
            document.getElementById('word-count').textContent = 'Cargando palabras...';
            setTimeout(() => this.updateWordCount(), 500);
            return;
        }
        
        try {
            const count = window.impostorData.countWords(
                this.gameSettings.category,
                this.gameSettings.difficulty
            );
            
            let message = `${count} palabras disponibles`;
            
            if (this.gameSettings.category !== 'all') {
                const categoryName = this.getCategoryName(this.gameSettings.category);
                message += ` en ${categoryName}`;
            }
            
            if (this.gameSettings.difficulty !== 'mixto') {
                const difficultyName = this.getDifficultyName(this.gameSettings.difficulty);
                message += ` (${difficultyName})`;
            }
            
            if (count === 0) {
                message = '⚠️ No hay palabras con estos filtros';
            }
            
            document.getElementById('word-count').textContent = message;
        } catch (e) {
            console.error('Error al contar palabras:', e);
            document.getElementById('word-count').textContent = 'Error al cargar palabras';
        }
    },
    
    getCategoryName(category) {
        const names = {
            'all': 'todas las categorías',
            'deportes': 'deportes',
            'profesiones': 'profesiones',
            'animales': 'animales',
            'comida': 'comida',
            'objetos': 'objetos',
            'lugares': 'lugares',
            'conceptos': 'conceptos'
        };
        return names[category] || category;
    },
    
    getDifficultyName(difficulty) {
        const names = {
            'facil': 'fácil',
            'dificil': 'difícil',
            'mixto': 'mixto'
        };
        return names[difficulty] || difficulty;
    },
    
    startGame() {
        // Validar configuración
        if (this.gameSettings.playerCount < 3) {
            this.showError('Se necesitan al menos 3 jugadores');
            return;
        }
        
        if (this.gameSettings.impostorCount >= this.gameSettings.playerCount) {
            this.showError('Debe haber más jugadores que impostores');
            return;
        }
        
        // Verificar que hay palabras disponibles
        if (!this.checkAvailableWords()) {
            this.showError('No hay palabras disponibles con los filtros seleccionados');
            return;
        }
        
        // Guardar configuración para el juego
        this.prepareGameData();
        
        // Redirigir a la página del juego
        window.location.href = 'game.html';
    },
    
    checkAvailableWords() {
        try {
            if (!window.impostorData || !window.impostorData.countWords) return true;
            
            const count = window.impostorData.countWords(
                this.gameSettings.category,
                this.gameSettings.difficulty
            );
            
            return count > 0;
        } catch (e) {
            return true; // Si hay error, asumimos que hay palabras
        }
    },
    
    prepareGameData() {
        const gameData = {
            settings: { ...this.gameSettings },
            timestamp: Date.now(),
            status: 'setup'
        };
        
        // Guardar datos temporales para el juego
        sessionStorage.setItem('impostor_current_game', JSON.stringify(gameData));
        
        // También guardar en localStorage por si se recarga la página
        localStorage.setItem('impostor_current_settings', JSON.stringify(this.gameSettings));
    },
    
    quickStart() {
        // Configuración rápida por defecto
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
        
        this.updateUI();
        this.startGame();
    },
    
    loadHistory() {
        if (!window.impostorStorage || typeof window.impostorStorage.getHistory !== 'function') {
            return;
        }
        
        try {
            const history = window.impostorStorage.getHistory();
            const container = document.getElementById('history-container');
            
            if (!container) return;
            
            if (!history || history.length === 0) {
                container.innerHTML = `
                    <div class="empty-history">
                        <i class="fas fa-history fa-2x"></i>
                        <p>No hay partidas guardadas todavía.</p>
                        <p class="small">Juega una partida para comenzar el historial</p>
                    </div>
                `;
                return;
            }
            
            // Mostrar solo las últimas 5 partidas
            const recentGames = history.slice(0, 5);
            let html = '';
            
            recentGames.forEach((game, index) => {
                const date = new Date(game.timestamp || Date.now());
                const dateStr = date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                const timeStr = date.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const isImpostorWin = game.result && game.result.includes('Impostor');
                
                html += `
                    <div class="history-item">
                        <div class="history-header">
                            <span class="history-date">${dateStr} ${timeStr}</span>
                            <span class="history-result ${isImpostorWin ? 'impostor-win' : 'innocent-win'}">
                                ${game.result || 'Sin resultado'}
                            </span>
                        </div>
                        <div class="history-details">
                            <span><i class="fas fa-users"></i> ${game.players || '?'} jugadores</span>
                            <span><i class="fas fa-user-secret"></i> ${game.impostors || '?'} impostor(es)</span>
                            <span><i class="fas fa-key"></i> "${game.word || '???'}"</span>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            
        } catch (e) {
            console.error('Error al cargar historial:', e);
        }
    },
    
    clearHistory() {
        if (!confirm('¿Estás seguro de que quieres borrar todo el historial de partidas? Esta acción no se puede deshacer.')) {
            return;
        }
        
        if (window.impostorStorage && typeof window.impostorStorage.clearHistory === 'function') {
            window.impostorStorage.clearHistory();
            this.loadHistory();
            this.showNotification('Historial borrado correctamente', 'success');
        }
    },
    
    showError(message) {
        alert(`❌ ${message}`);
    },
    
    showNotification(message, type = 'info') {
        // Usar notificación común si existe
        if (window.common && window.common.showNotification) {
            window.common.showNotification(message, type);
        } else {
            // Fallback simple
            const icons = {
                'success': '✅',
                'error': '❌',
                'warning': '⚠️',
                'info': 'ℹ️'
            };
            alert(`${icons[type] || ''} ${message}`);
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    impostorSetup.init();
});
