// impostor/js/impostor-setup.js
// Lógica para la página de configuración (index.html)

const impostorSetup = {
    gameSettings: {
        playerCount: 6,
        impostorCount: 1,
        timeLimit: 5,
        category: 'all',
        difficulty: 'all',
        enableHints: true,
        enableVoting: true
    },
    
    init() {
        console.log('Inicializando configuración del impostor...');
        this.loadSettings();
        this.setupEventListeners();
        this.updateWordCount();
        this.loadHistory();
    },
    
    loadSettings() {
        // Cargar configuración guardada
        const saved = localStorage.getItem('impostor_settings');
        if (saved) {
            this.gameSettings = {...this.gameSettings, ...JSON.parse(saved)};
            this.updateUI();
        }
    },
    
    saveSettings() {
        localStorage.setItem('impostor_settings', JSON.stringify(this.gameSettings));
    },
    
    updateUI() {
        // Actualizar controles con valores guardados
        document.getElementById('playerCount').value = this.gameSettings.playerCount;
        document.getElementById('impostorCount').value = this.gameSettings.impostorCount;
        document.getElementById('timeLimit').value = this.gameSettings.timeLimit;
        document.getElementById('wordCategory').value = this.gameSettings.category;
        document.getElementById('difficulty').value = this.gameSettings.difficulty;
        document.getElementById('enableHints').checked = this.gameSettings.enableHints;
        document.getElementById('enableVoting').checked = this.gameSettings.enableVoting;
        
        this.updateImpostorRatio();
    },
    
    setupEventListeners() {
        // Jugadores
        document.getElementById('playerCount').addEventListener('change', (e) => {
            this.gameSettings.playerCount = parseInt(e.target.value);
            this.updateImpostorRatio();
            this.saveSettings();
        });
        
        document.getElementById('decrease-players').addEventListener('click', () => {
            let value = parseInt(document.getElementById('playerCount').value) - 1;
            if (value < 3) value = 3;
            document.getElementById('playerCount').value = value;
            this.gameSettings.playerCount = value;
            this.updateImpostorRatio();
            this.saveSettings();
        });
        
        document.getElementById('increase-players').addEventListener('click', () => {
            let value = parseInt(document.getElementById('playerCount').value) + 1;
            if (value > 12) value = 12;
            document.getElementById('playerCount').value = value;
            this.gameSettings.playerCount = value;
            this.updateImpostorRatio();
            this.saveSettings();
        });
        
        // Impostores
        document.getElementById('impostorCount').addEventListener('change', (e) => {
            this.gameSettings.impostorCount = parseInt(e.target.value);
            this.updateImpostorRatio();
            this.saveSettings();
        });
        
        // Categoría
        document.getElementById('wordCategory').addEventListener('change', (e) => {
            this.gameSettings.category = e.target.value;
            this.updateWordCount();
            this.saveSettings();
        });
        
        // Dificultad
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.gameSettings.difficulty = e.target.value;
            this.updateWordCount();
            this.saveSettings();
        });
        
        // Botones
        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('quick-start').addEventListener('click', () => {
            this.quickStart();
        });
        
        document.getElementById('clear-history').addEventListener('click', () => {
            this.clearHistory();
        });
    },
    
    updateImpostorRatio() {
        const playerCount = this.gameSettings.playerCount;
        const impostorCount = this.gameSettings.impostorCount;
        
        // Ajustar máximo de impostores
        const maxImpostors = Math.min(3, Math.floor(playerCount / 2));
        const impostorInput = document.getElementById('impostorCount');
        
        if (impostorCount > maxImpostors) {
            this.gameSettings.impostorCount = maxImpostors;
            impostorInput.value = maxImpostors;
        }
        
        impostorInput.max = maxImpostors;
        
        // Actualizar ratio
        const ratioElement = document.getElementById('impostor-ratio');
        if (ratioElement && playerCount > 0 && impostorCount > 0) {
            const ratio = Math.round(playerCount / impostorCount);
            ratioElement.textContent = `Ratio: 1 impostor por cada ${ratio} jugadores`;
        }
    },
    
    updateWordCount() {
        if (!window.impostorData || !window.impostorData.getGameData) {
            setTimeout(() => this.updateWordCount(), 500);
            return;
        }
        
        const gameData = window.impostorData.getGameData();
        if (!gameData || !gameData.palabras) {
            document.getElementById('word-count').textContent = 'Error cargando palabras';
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
        
        const count = palabrasFiltradas.length;
        let message = `${count} palabras disponibles`;
        
        if (count === 0) {
            message = '⚠️ No hay palabras con estos filtros';
        }
        
        document.getElementById('word-count').textContent = message;
    },
    
    quickStart() {
        this.gameSettings = {
            playerCount: 6,
            impostorCount: 1,
            timeLimit: 5,
            category: 'all',
            difficulty: 'all',
            enableHints: true,
            enableVoting: true
        };
        
        this.updateUI();
        this.saveSettings();
        this.startGame();
    },
    
    startGame() {
        // Validar configuración
        if (this.gameSettings.playerCount < 3) {
            alert('Se necesitan al menos 3 jugadores');
            return;
        }
        
        if (this.gameSettings.impostorCount >= this.gameSettings.playerCount) {
            alert('Debe haber más jugadores que impostores');
            return;
        }
        
        // Guardar configuración para el juego
        localStorage.setItem('impostor_current_settings', JSON.stringify(this.gameSettings));
        
        // Redirigir a la página del juego
        window.location.href = 'game.html';
    },
    
    loadHistory() {
        if (!window.impostorStorage) return;
        
        const history = window.impostorStorage.getHistory();
        const historyList = document.getElementById('impostor-history-list');
        
        if (!historyList) return;
        
        if (!history || history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <p>No hay partidas guardadas todavía.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        const recentGames = history.slice(0, 5); // Mostrar solo 5
        
        recentGames.forEach((game, index) => {
            const date = new Date(game.timestamp || Date.now());
            const dateStr = date.toLocaleDateString();
            
            html += `
                <div class="history-item">
                    <div class="history-game">
                        <strong>Partida ${index + 1}</strong> - ${dateStr}
                    </div>
                    <div class="history-result ${game.result.includes('Impostor') ? 'impostor-win' : 'innocent-win'}">
                        ${game.result}
                    </div>
                    <div class="history-details">
                        ${game.players} jugadores, ${game.impostors} impostor(es)
                    </div>
                </div>
            `;
        });
        
        historyList.innerHTML = html;
    },
    
    clearHistory() {
        if (confirm('¿Borrar todo el historial de partidas?')) {
            if (window.impostorStorage) {
                window.impostorStorage.clearHistory();
                this.loadHistory();
            }
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    impostorSetup.init();
});
