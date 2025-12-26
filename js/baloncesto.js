// Marcador de Baloncesto - Liga Escolar

document.addEventListener('DOMContentLoaded', function() {
    // Variables del juego
    let localScore = 0;
    let visitorScore = 0;
    let quarter = 1;
    let localFouls = 0;
    let visitorFouls = 0;
    let gameTime = 600; // 10 minutos en segundos
    let timerInterval = null;
    let isTimerRunning = false;
    
    // Elementos DOM
    const localScoreEl = document.querySelector('.team-local .score');
    const visitorScoreEl = document.querySelector('.team-visitor .score');
    const quarterEl = document.querySelector('.quarter-number');
    const gameClockEl = document.getElementById('game-clock');
    const localFoulsEl = document.querySelectorAll('.fouls-count')[0];
    const visitorFoulsEl = document.querySelectorAll('.fouls-count')[1];
    const historyLog = document.getElementById('history-log');
    
    // Inicializar
    updateDisplay();
    
    // Event Listeners para puntos
    document.querySelectorAll('.btn-points').forEach(button => {
        button.addEventListener('click', function() {
            const points = parseInt(this.dataset.points);
            const team = this.closest('.team').classList.contains('team-local') ? 'local' : 'visitor';
            addPoints(team, points);
        });
    });
    
    // Event Listeners para faltas
    document.querySelectorAll('.btn-foul').forEach(button => {
        button.addEventListener('click', function() {
            const team = this.closest('.team-fouls').querySelector('h4').textContent.toLowerCase();
            addFoul(team);
        });
    });
    
    document.querySelectorAll('.btn-foul-remove').forEach(button => {
        button.addEventListener('click', function() {
            const team = this.closest('.team-fouls').querySelector('h4').textContent.toLowerCase();
            removeFoul(team);
        });
    });
    
    // Controles de cuartos
    document.getElementById('prev-quarter').addEventListener('click', prevQuarter);
    document.getElementById('next-quarter').addEventListener('click', nextQuarter);
    
    // Controles de tiempo
    document.getElementById('start-timer').addEventListener('click', startTimer);
    document.getElementById('pause-timer').addEventListener('click', pauseTimer);
    document.getElementById('reset-timer').addEventListener('click', resetTimer);
    
    // Controles del juego
    document.getElementById('reset-game').addEventListener('click', resetGame);
    document.getElementById('save-game').addEventListener('click', saveGame);
    
    // Funciones
    function addPoints(team, points) {
        if (team === 'local') {
            localScore += points;
            addToHistory(`Local anota ${points} punto${points > 1 ? 's' : ''}`);
        } else {
            visitorScore += points;
            addToHistory(`Visitante anota ${points} punto${points > 1 ? 's' : ''}`);
        }
        updateDisplay();
        
        // Efecto visual
        const scoreEl = team === 'local' ? localScoreEl : visitorScoreEl;
        scoreEl.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreEl.style.transform = 'scale(1)';
        }, 300);
    }
    
    function addFoul(team) {
        if (team === 'local') {
            localFouls++;
            addToHistory(`Falta del Local (Total: ${localFouls})`);
        } else {
            visitorFouls++;
            addToHistory(`Falta del Visitante (Total: ${visitorFouls})`);
        }
        updateDisplay();
    }
    
    function removeFoul(team) {
        if (team === 'local' && localFouls > 0) {
            localFouls--;
            addToHistory(`Falta retirada del Local`);
        } else if (team === 'visitor' && visitorFouls > 0) {
            visitorFouls--;
            addToHistory(`Falta retirada del Visitante`);
        }
        updateDisplay();
    }
    
    function prevQuarter() {
        if (quarter > 1) {
            quarter--;
            addToHistory(`Cuarto ${quarter + 1} → Cuarto ${quarter}`);
            updateDisplay();
        }
    }
    
    function nextQuarter() {
        if (quarter < 4) {
            quarter++;
            addToHistory(`Cuarto ${quarter - 1} → Cuarto ${quarter}`);
            updateDisplay();
        }
    }
    
    function startTimer() {
        if (!isTimerRunning) {
            isTimerRunning = true;
            timerInterval = setInterval(() => {
                if (gameTime > 0) {
                    gameTime--;
                    updateTimerDisplay();
                } else {
                    pauseTimer();
                    addToHistory('¡Fin del tiempo!');
                }
            }, 1000);
            addToHistory('Tiempo iniciado');
        }
    }
    
    function pauseTimer() {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            addToHistory('Tiempo pausado');
        }
    }
    
    function resetTimer() {
        pauseTimer();
        gameTime = 600; // 10 minutos
        updateTimerDisplay();
        addToHistory('Tiempo reiniciado');
    }
    
    function resetGame() {
        if (confirm('¿Estás seguro de reiniciar el partido? Se perderán todos los datos.')) {
            localScore = 0;
            visitorScore = 0;
            quarter = 1;
            localFouls = 0;
            visitorFouls = 0;
            resetTimer();
            historyLog.innerHTML = '<p>Partido reiniciado</p>';
            updateDisplay();
        }
    }
    
    function saveGame() {
        const gameData = {
            localScore,
            visitorScore,
            quarter,
            localFouls,
            visitorFouls,
            time: gameTime,
            date: new Date().toLocaleString()
        };
        
        localStorage.setItem('baloncesto_last_game', JSON.stringify(gameData));
        addToHistory('Partido guardado localmente');
        alert('Partido guardado correctamente');
    }
    
    function loadGame() {
        const saved = localStorage.getItem('baloncesto_last_game');
        if (saved) {
            const gameData = JSON.parse(saved);
            localScore = gameData.localScore;
            visitorScore = gameData.visitorScore;
            quarter = gameData.quarter;
            localFouls = gameData.localFouls;
            visitorFouls = gameData.visitorFouls;
            gameTime = gameData.time;
            addToHistory('Partido cargado desde memoria');
            updateDisplay();
        }
    }
    
    function updateDisplay() {
        localScoreEl.textContent = localScore;
        visitorScoreEl.textContent = visitorScore;
        quarterEl.textContent = quarter;
        localFoulsEl.textContent = localFouls;
        visitorFoulsEl.textContent = visitorFouls;
        updateTimerDisplay();
        
        // Actualizar título con marcador
        document.title = `Baloncesto: ${localScore}-${visitorScore} | Liga Escolar`;
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        gameClockEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function addToHistory(message) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const entry = document.createElement('p');
        entry.textContent = `[${timeStr}] ${message}`;
        historyLog.prepend(entry);
        
        // Limitar historial a 50 entradas
        if (historyLog.children.length > 50) {
            historyLog.removeChild(historyLog.lastChild);
        }
    }
    
    // Cargar partido guardado al inicio
    loadGame();
});
