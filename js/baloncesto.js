// BALONCESTO - Sistema completo con faltas por dorsal
document.addEventListener('DOMContentLoaded', function() {
    // ===== CONFIGURACIÓN INICIAL =====
    const config = {
        quarterLength: 600, // 10 minutos en segundos
        maxQuarters: 4,
        foulsForExpulsion: 5,
        startQuarter: 1
    };

    // ===== ESTADO DEL JUEGO =====
    const gameState = {
        // Marcador
        local: { score: 0, teamFouls: 0, players: {} },
        visitor: { score: 0, teamFouls: 0, players: {} },
        
        // Tiempo
        quarter: config.startQuarter,
        timeRemaining: config.quarterLength,
        timerRunning: false,
        timerInterval: null,
        
        // Posesión
        possession: 'local', // 'local' o 'visitor'
        
        // Historial
        history: [],
        expelledPlayers: []
    };

    // ===== ELEMENTOS DOM =====
    // Marcador
    const localScoreEl = document.getElementById('team1-score');
    const visitorScoreEl = document.getElementById('team2-score');
    const localFoulsEl = document.getElementById('team1-fouls');
    const visitorFoulsEl = document.getElementById('team2-fouls');
    const localNameEl = document.getElementById('team1-name');
    const visitorNameEl = document.getElementById('team2-name');
    
    // Tiempo
    const quarterEl = document.getElementById('current-quarter');
    const timerEl = document.getElementById('game-clock');
    const timerStatusEl = document.getElementById('timer-status');
    
    // Controles
    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');
    const resetBtn = document.getElementById('reset-timer');
    const prevQuarterBtn = document.getElementById('prev-quarter');
    const nextQuarterBtn = document.getElementById('next-quarter');
    
    // Posesión
    const possessionEl = document.getElementById('possession-indicator');
    
    // Faltas
    const playerNumberInput = document.getElementById('player-number');
    const playerTeamSelect = document.getElementById('player-team');
    const addFoulBtn = document.getElementById('add-foul');
    
    // Listas de jugadores
    const localPlayersEl = document.getElementById('team1-players');
    const visitorPlayersEl = document.getElementById('team2-players');
    const expelledPlayersEl = document.getElementById('expelled-players');
    
    // Historial
    const historyLogEl = document.getElementById('history-log');
    const resetGameBtn = document.getElementById('reset-game');
    const saveGameBtn = document.getElementById('save-game');
    const shareGameBtn = document.getElementById('share-game');
    
    // Modales
    const teamNameModal = document.getElementById('team-name-modal');
    const expulsionModal = document.getElementById('expulsion-modal');
    
    // ===== FUNCIONES DE TIEMPO =====
    function startTimer() {
        if (gameState.timerRunning) return;
        
        gameState.timerRunning = true;
        timerStatusEl.textContent = 'En juego';
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        prevQuarterBtn.disabled = true;
        nextQuarterBtn.disabled = true;
        
        gameState.timerInterval = setInterval(() => {
            if (gameState.timeRemaining > 0) {
                gameState.timeRemaining--;
                updateTimerDisplay();
            } else {
                endQuarter();
            }
        }, 1000);
        
        addHistoryEntry('Tiempo iniciado', 'info');
    }
    
    function pauseTimer() {
        if (!gameState.timerRunning) return;
        
        gameState.timerRunning = false;
        clearInterval(gameState.timerInterval);
        timerStatusEl.textContent = 'Pausado';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        addHistoryEntry('Tiempo pausado', 'warning');
    }
    
    function resetTimer() {
        pauseTimer();
        gameState.timeRemaining = config.quarterLength;
        updateTimerDisplay();
        timerStatusEl.textContent = 'Detenido';
        prevQuarterBtn.disabled = gameState.quarter === 1;
        nextQuarterBtn.disabled = gameState.quarter === config.maxQuarters;
        
        addHistoryEntry('Tiempo reiniciado', 'info');
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(gameState.timeRemaining / 60);
        const seconds = gameState.timeRemaining % 60;
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Cambiar color cuando queda poco tiempo
        if (gameState.timeRemaining <= 60) {
            timerEl.style.color = '#e74c3c';
            timerEl.classList.add('pulse');
        } else if (gameState.timeRemaining <= 180) {
            timerEl.style.color = '#f39c12';
        } else {
            timerEl.style.color = '#2ecc71';
            timerEl.classList.remove('pulse');
        }
    }
    
    function endQuarter() {
        pauseTimer();
        
        if (gameState.quarter < config.maxQuarters) {
            setTimeout(() => {
                nextQuarter();
                addHistoryEntry(`Final del cuarto ${gameState.quarter - 1}`, 'info');
            }, 1000);
        } else {
            addHistoryEntry('¡FIN DEL PARTIDO!', 'success');
            showNotification('Partido finalizado', 'success');
            
            // Deshabilitar controles
            startBtn.disabled = true;
            pauseBtn.disabled = true;
            nextQuarterBtn.disabled = true;
            
            // Guardar automáticamente
            setTimeout(saveGame, 2000);
        }
    }
    
    // ===== CONTROL DE CUARTOS =====
    function prevQuarter() {
        if (gameState.quarter > 1) {
            gameState.quarter--;
            resetTimer();
            updateQuarterDisplay();
            addHistoryEntry(`Cambio al cuarto ${gameState.quarter}`, 'info');
        }
    }
    
    function nextQuarter() {
        if (gameState.quarter < config.maxQuarters && !gameState.timerRunning) {
            gameState.quarter++;
            resetTimer();
            updateQuarterDisplay();
            addHistoryEntry(`Cambio al cuarto ${gameState.quarter}`, 'info');
        }
    }
    
    function updateQuarterDisplay() {
        quarterEl.textContent = gameState.quarter;
        
        // Actualizar estado del juego
        document.getElementById('game-status').textContent = `Cuarto ${gameState.quarter}`;
        
        // Controlar botones
        prevQuarterBtn.disabled = gameState.quarter === 1;
        nextQuarterBtn.disabled = gameState.quarter === config.maxQuarters || gameState.timerRunning;
    }
    
    // ===== PUNTUACIÓN =====
    function addPoints(team, points) {
        if (!gameState.timerRunning && gameState.quarter <= config.maxQuarters) {
            showNotification('Inicia el tiempo antes de añadir puntos', 'warning');
            return;
        }
        
        gameState[team].score += points;
        updateScoreDisplay();
        
        // Efecto visual
        const scoreEl = team === 'local' ? localScoreEl : visitorScoreEl;
        scoreEl.classList.add('bounce');
        setTimeout(() => scoreEl.classList.remove('bounce'), 500);
        
        // Historial
        const teamName = team === 'local' ? localNameEl.textContent : visitorNameEl.textContent;
        addHistoryEntry(`${teamName} anota ${points} punto${points > 1 ? 's' : ''}`, 'points');
        
        // Cambiar posesión
        changePossession(team === 'local' ? 'visitor' : 'local');
    }
    
    function updateScoreDisplay() {
        localScoreEl.textContent = gameState.local.score;
        visitorScoreEl.textContent = gameState.visitor.score;
    }
    
    // ===== FALTAS POR DORSAL =====
    function addFoul() {
        const dorsal = parseInt(playerNumberInput.value);
        const team = playerTeamSelect.value; // 'local' o 'visitor'
        
        if (!dorsal || dorsal < 0 || dorsal > 99) {
            showNotification('Ingresa un dorsal válido (0-99)', 'warning');
            playerNumberInput.focus();
            return;
        }
        
        // Pausar tiempo automáticamente
        if (gameState.timerRunning) {
            pauseTimer();
            addHistoryEntry('Tiempo pausado por falta', 'warning');
        }
        
        // Añadir falta al jugador
        if (!gameState[team].players[dorsal]) {
            gameState[team].players[dorsal] = {
                fouls: 0,
                expelled: false
            };
        }
        
        gameState[team].players[dorsal].fouls++;
        
        // Añadir falta al equipo
        gameState[team].teamFouls++;
        
        // Verificar expulsión
        if (gameState[team].players[dorsal].fouls >= config.foulsForExpulsion) {
            gameState[team].players[dorsal].expelled = true;
            gameState.expelledPlayers.push({
                team: team,
                dorsal: dorsal,
                quarter: gameState.quarter
            });
            showExpulsionModal(team, dorsal);
        }
        
        // Actualizar displays
        updateFoulsDisplay();
        updatePlayersList();
        playerNumberInput.value = '';
        playerNumberInput.focus();
        
        // Historial
        const teamName = team === 'local' ? localNameEl.textContent : visitorNameEl.textContent;
        addHistoryEntry(`Falta #${gameState[team].players[dorsal].fouls} al dorsal ${dorsal} (${teamName})`, 'foul');
    }
    
    function removeFoul(team, dorsal) {
        if (gameState[team].players[dorsal] && gameState[team].players[dorsal].fouls > 0) {
            gameState[team].players[dorsal].fouls--;
            
            // Si estaba expulsado y ahora tiene menos de 5 faltas
            if (gameState[team].players[dorsal].expelled && gameState[team].players[dorsal].fouls < config.foulsForExpulsion) {
                gameState[team].players[dorsal].expelled = false;
                gameState.expelledPlayers = gameState.expelledPlayers.filter(p => !(p.team === team && p.dorsal === dorsal));
            }
            
            // Actualizar displays
            updateFoulsDisplay();
            updatePlayersList();
            
            addHistoryEntry(`Falta retirada al dorsal ${dorsal}`, 'info');
        }
    }
    
    function updateFoulsDisplay() {
        localFoulsEl.textContent = gameState.local.teamFouls;
        visitorFoulsEl.textContent = gameState.visitor.teamFouls;
    }
    
    function updatePlayersList() {
        // Local
        localPlayersEl.innerHTML = '';
        for (const [dorsal, player] of Object.entries(gameState.local.players)) {
            if (player.fouls > 0) {
                const playerEl = createPlayerElement('local', dorsal, player);
                localPlayersEl.appendChild(playerEl);
            }
        }
        
        // Visitante
        visitorPlayersEl.innerHTML = '';
        for (const [dorsal, player] of Object.entries(gameState.visitor.players)) {
            if (player.fouls > 0) {
                const playerEl = createPlayerElement('visitor', dorsal, player);
                visitorPlayersEl.appendChild(playerEl);
            }
        }
        
        // Expulsados
        updateExpelledList();
    }
    
    function createPlayerElement(team, dorsal, player) {
        const div = document.createElement('div');
        div.className = 'player-item';
        
        // Puntos de falta
        const foulsDots = [];
        for (let i = 0; i < config.foulsForExpulsion; i++) {
            const dot = document.createElement('span');
            dot.className = 'foul-dot';
            if (i < player.fouls) {
                dot.classList.add('active');
                if (i >= config.foulsForExpulsion - 1) {
                    dot.classList.add('expelled');
                }
            }
            foulsDots.push(dot.outerHTML);
        }
        
        div.innerHTML = `
            <div class="player-info">
                <div class="player-dorsal">${dorsal}</div>
                <div class="player-fouls">${foulsDots.join('')}</div>
            </div>
            <button class="btn-remove-foul" data-team="${team}" data-dorsal="${dorsal}">
                <i class="fas fa-minus-circle"></i>
            </button>
        `;
        
        return div;
    }
    
    function updateExpelledList() {
        expelledPlayersEl.innerHTML = '';
        
        if (gameState.expelledPlayers.length === 0) {
            document.getElementById('expelled-container').style.display = 'none';
            return;
        }
        
        document.getElementById('expelled-container').style.display = 'block';
        
        gameState.expelledPlayers.forEach(expelled => {
            const div = document.createElement('div');
            div.className = 'expelled-player';
            
            const teamName = expelled.team === 'local' ? localNameEl.textContent : visitorNameEl.textContent;
            div.textContent = `Dorsal ${expelled.dorsal} (${teamName}) - Expulsado C${expelled.quarter}`;
            
            expelledPlayersEl.appendChild(div);
        });
    }
    
    function showExpulsionModal(team, dorsal) {
        const teamName = team === 'local' ? localNameEl.textContent : visitorNameEl.textContent;
        document.getElementById('expulsion-text').textContent = 
            `¡El dorsal ${dorsal} (${teamName}) ha sido expulsado por acumular 5 faltas!`;
        
        expulsionModal.style.display = 'flex';
        
        // Sonido de expulsión
        playExpulsionSound();
    }
    
    // ===== POSESIÓN =====
    function changePossession(newPossession) {
        gameState.possession = newPossession;
        
        // Actualizar visualmente
        if (newPossession === 'local') {
            possessionEl.innerHTML = '<i class="fas fa-basketball-ball"></i> Posesión LOCAL';
            possessionEl.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        } else {
            possessionEl.innerHTML = '<i class="fas fa-basketball-ball"></i> Posesión VISITANTE';
            possessionEl.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        }
        
        // Efecto visual
        possessionEl.classList.add('bounce');
        setTimeout(() => possessionEl.classList.remove('bounce'), 500);
    }
    
    // ===== HISTORIAL =====
    function addHistoryEntry(text, type = 'info') {
        const now = new Date();
        const timeStr = `[${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
        
        const entry = {
            time: timeStr,
            text: text,
            type: type,
            timestamp: now.getTime()
        };
        
        gameState.history.unshift(entry);
        
        // Mantener máximo 50 entradas
        if (gameState.history.length > 50) {
            gameState.history.pop();
        }
        
        updateHistoryDisplay();
    }
    
    function updateHistoryDisplay() {
        historyLogEl.innerHTML = '';
        
        gameState.history.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'history-entry';
            
            let icon = '';
            switch(entry.type) {
                case 'points': icon = '<i class="fas fa-basketball-ball"></i>'; break;
                case 'foul': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
                case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
                case 'warning': icon = '<i class="fas fa-exclamation-circle"></i>'; break;
                default: icon = '<i class="fas fa-info-circle"></i>';
            }
            
            div.innerHTML = `
                <span class="history-time">${entry.time}</span>
                <span class="history-icon">${icon}</span>
                <span class="history-text">${entry.text}</span>
            `;
            
            historyLogEl.appendChild(div);
        });
    }
    
    // ===== GUARDAR / CARGAR =====
    function saveGame() {
        const gameData = {
            state: gameState,
            config: config,
            savedAt: new Date().toISOString(),
            localName: localNameEl.textContent,
            visitorName: visitorNameEl.textContent
        };
        
        localStorage.setItem('baloncesto_last_game', JSON.stringify(gameData));
        showNotification('Partido guardado localmente', 'success');
        addHistoryEntry('Partido guardado', 'success');
    }
    
    function loadGame() {
        const saved = localStorage.getItem('baloncesto_last_game');
        if (saved) {
            try {
                const gameData = JSON.parse(saved);
                
                // Cargar estado
                Object.assign(gameState, gameData.state);
                
                // Cargar nombres
                if (gameData.localName) localNameEl.textContent = gameData.localName;
                if (gameData.visitorName) visitorNameEl.textContent = gameData.visitorName;
                
                // Actualizar todo
                updateScoreDisplay();
                updateFoulsDisplay();
                updateQuarterDisplay();
                updateTimerDisplay();
                updatePlayersList();
                updateHistoryDisplay();
                changePossession(gameState.possession);
                
                showNotification('Partido cargado', 'info');
            } catch (e) {
                console.error('Error cargando partido:', e);
            }
        }
    }
    
    // ===== REINICIAR =====
    function resetGame() {
        if (confirm('¿Estás seguro de reiniciar el partido? Se perderán todos los datos.')) {
            // Reiniciar estado
            gameState.local = { score: 0, teamFouls: 0, players: {} };
            gameState.visitor = { score: 0, teamFouls: 0, players: {} };
            gameState.quarter = config.startQuarter;
            gameState.timeRemaining = config.quarterLength;
            gameState.history = [];
            gameState.expelledPlayers = [];
            gameState.possession = 'local';
            
            // Detener tiempo
            if (gameState.timerRunning) {
                clearInterval(gameState.timerInterval);
                gameState.timerRunning = false;
            }
            
            // Actualizar todo
            updateScoreDisplay();
            updateFoulsDisplay();
            updateQuarterDisplay();
            updateTimerDisplay();
            updatePlayersList();
            updateHistoryDisplay();
            changePossession('local');
            
            // Resetear controles
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            timerStatusEl.textContent = 'Detenido';
            
            addHistoryEntry('Partido reiniciado', 'info');
            showNotification('Partido reiniciado', 'info');
        }
    }
    
    // ===== COMPARTIR =====
    function shareGame() {
        const shareText = generateShareText();
        
        if (navigator.share) {
            navigator.share({
                title: `Partido de Baloncesto - ${localNameEl.textContent} vs ${visitorNameEl.textContent}`,
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: copiar al portapapeles
            navigator.clipboard.writeText(shareText)
                .then(() => showNotification('Resultado copiado al portapapeles', 'success'))
                .catch(() => showNotification('No se pudo copiar el resultado', 'error'));
        }
    }
    
    function generateShareText() {
        let text = `🏀 PARTIDO DE BALONCESTO 🏀\n`;
        text += `📅 ${new Date().toLocaleDateString()} 🕒 ${new Date().toLocaleTimeString()}\n\n`;
        text += `=== MARCADOR ===\n`;
        text += `${localNameEl.textContent}: ${gameState.local.score}\n`;
        text += `${visitorNameEl.textContent}: ${gameState.visitor.score}\n\n`;
        text += `=== INFORMACIÓN ===\n`;
        text += `Cuarto: ${gameState.quarter}/${config.maxQuarters}\n`;
        text += `Tiempo: ${Math.floor(gameState.timeRemaining / 60)}:${(gameState.timeRemaining % 60).toString().padStart(2, '0')}\n`;
        text += `Faltas equipo: ${gameState.local.teamFouls}-${gameState.visitor.teamFouls}\n\n`;
        
        if (gameState.expelledPlayers.length > 0) {
            text += `=== EXPULSADOS ===\n`;
            gameState.expelledPlayers.forEach(p => {
                const teamName = p.team === 'local' ? localNameEl.textContent : visitorNameEl.textContent;
                text += `Dorsal ${p.dorsal} (${teamName}) - C${p.quarter}\n`;
            });
            text += `\n`;
        }
        
        text += `📱 Generado con Marcador de Baloncesto - Liga Escolar\n`;
        text += `🔗 ${window.location.href}`;
        
        return text;
    }
    
    // ===== SONIDOS =====
    function playExpulsionSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(100, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Silenciar errores de audio
        }
    }
    
    // ===== NOTIFICACIONES =====
    function showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Estilos
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#2ecc71' : type === 'warning' ? '#f39c12' : '#3498db',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '300px',
            animation: 'slideIn 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // ===== EVENT LISTENERS =====
    function initEventListeners() {
        // Tiempo
        startBtn.addEventListener('click', startTimer);
        pauseBtn.addEventListener('click', pauseTimer);
        resetBtn.addEventListener('click', resetTimer);
        
        // Cuartos
        prevQuarterBtn.addEventListener('click', prevQuarter);
        nextQuarterBtn.addEventListener('click', nextQuarter);
        
        // Puntos
        document.querySelectorAll('.btn-point').forEach(btn => {
            btn.addEventListener('click', function() {
                const points = parseInt(this.dataset.points);
                const team = this.dataset.team === '1' ? 'local' : 'visitor';
                addPoints(team, points);
            });
        });
        
        // Faltas
        addFoulBtn.addEventListener('click', addFoul);
        playerNumberInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addFoul();
        });
        
        // Delegación de eventos para botones de eliminar falta
        document.addEventListener('click', function(e) {
            if (e.target.closest('.btn-remove-foul')) {
                const btn = e.target.closest('.btn-remove-foul');
                const team = btn.dataset.team;
                const dorsal = parseInt(btn.dataset.dorsal);
                removeFoul(team, dorsal);
            }
        });
        
        // Posesión
        possessionEl.addEventListener('click', function() {
            changePossession(gameState.possession === 'local' ? 'visitor' : 'local');
            addHistoryEntry(`Cambio de posesión a ${gameState.possession === 'local' ? 'LOCAL' : 'VISITANTE'}`, 'info');
        });
        
        // Nombres de equipos
        document.querySelectorAll('.editable').forEach(el => {
            el.addEventListener('click', function() {
                const team = this.id.includes('team1') ? 'local' : 'visitor';
                openTeamNameModal(team);
            });
        });
        
        document.querySelectorAll('.btn-edit-name').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const team = this.dataset.team === '1' ? 'local' : 'visitor';
                openTeamNameModal(team);
            });
        });
        
        // Modales
        document.getElementById('cancel-edit').addEventListener('click', () => {
            teamNameModal.style.display = 'none';
        });
        
        document.getElementById('save-name').addEventListener('click', saveTeamName);
        
        document.getElementById('close-expulsion').addEventListener('click', () => {
            expulsionModal.style.display = 'none';
        });
        
        // Controles del juego
        resetGameBtn.addEventListener('click', resetGame);
        saveGameBtn.addEventListener('click', saveGame);
        shareGameBtn.addEventListener('click', shareGame);
        
        // Ayuda
        document.getElementById('show-help').addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Usa los botones +1/+2/+3 para puntos. Pausa tiempo para añadir faltas por dorsal.', 'info');
        });
        
        // Cerrar modales al hacer clic fuera
        window.addEventListener('click', function(e) {
            if (e.target === teamNameModal) teamNameModal.style.display = 'none';
            if (e.target === expulsionModal) expulsionModal.style.display = 'none';
        });
    }
    
    // ===== FUNCIONES MODALES =====
    let editingTeam = null;
    
    function openTeamNameModal(team) {
        editingTeam = team;
        const input = document.getElementById('team-name-input');
        input.value = team === 'local' ? localNameEl.textContent : visitorNameEl.textContent;
        input.focus();
        teamNameModal.style.display = 'flex';
    }
    
    function saveTeamName() {
        if (!editingTeam) return;
        
        const input = document.getElementById('team-name-input');
        const newName = input.value.trim() || (editingTeam === 'local' ? 'LOCAL' : 'VISITANTE');
        
        if (editingTeam === 'local') {
            localNameEl.textContent = newName;
        } else {
            visitorNameEl.textContent = newName;
        }
        
        teamNameModal.style.display = 'none';
        addHistoryEntry(`Nombre cambiado: ${newName}`, 'info');
        showNotification(`Equipo renombrado a: ${newName}`, 'success');
    }
    
    // ===== INICIALIZACIÓN =====
    function init() {
        // Inicializar displays
        updateScoreDisplay();
        updateFoulsDisplay();
        updateQuarterDisplay();
        updateTimerDisplay();
        updatePlayersList();
        updateHistoryDisplay();
        changePossession('local');
        
        // Cargar partido guardado
        loadGame();
        
        // Inicializar event listeners
        initEventListeners();
        
        // Añadir entrada inicial
        addHistoryEntry('Partido iniciado - Listo para jugar', 'success');
        
        // Mostrar ayuda inicial en móvil
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                showNotification('Gira el dispositivo para mejor visualización', 'info');
            }, 1000);
        }
        
        console.log('Marcador de Baloncesto inicializado');
    }
    
    // Iniciar todo
    init();
    
    // Añadir animaciones CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification-success { background: #2ecc71 !important; }
        .notification-warning { background: #f39c12 !important; }
        .notification-info { background: #3498db !important; }
        .notification-foul { background: #e74c3c !important; }
        .notification-points { background: #9b59b6 !important; }
    `;
    document.head.appendChild(style);
});
