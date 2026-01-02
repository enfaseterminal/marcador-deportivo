// dados.js - Lógica del simulador de dados

// Estado del simulador
const diceState = {
    numDice: 2,
    diceFaces: 6,
    rollsHistory: [],
    rollsToday: 0,
    totalSum: 0,
    averageRoll: 0,
    maxRoll: 0,
    autoRollInterval: null,
    isAutoRolling: false
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Simulador de dados cargado');
    
    // Cargar estado guardado
    loadSavedState();
    
    // Inicializar controles
    initControls();
    
    // Actualizar estadísticas iniciales
    updateStats();
    updateProbabilities();
    
    // Inicializar reloj si no se ha hecho
    if (typeof updateClock === 'function') {
        updateClock();
        setInterval(updateClock, 1000);
    }
});

// Cargar estado guardado
function loadSavedState() {
    const savedState = localStorage.getItem('diceState');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            diceState.rollsToday = parsed.rollsToday || 0;
            diceState.rollsHistory = parsed.rollsHistory || [];
            
            // Verificar si es un día diferente
            const lastRollDate = localStorage.getItem('lastRollDate');
            const today = new Date().toDateString();
            
            if (lastRollDate !== today) {
                diceState.rollsToday = 0;
                localStorage.setItem('lastRollDate', today);
            }
            
            updateHistoryDisplay();
        } catch (e) {
            console.error('Error cargando estado:', e);
        }
    }
}

// Guardar estado
function saveState() {
    const today = new Date().toDateString();
    localStorage.setItem('lastRollDate', today);
    
    const stateToSave = {
        rollsToday: diceState.rollsToday,
        rollsHistory: diceState.rollsHistory.slice(0, 50), // Guardar solo los últimos 50
        lastUpdate: new Date().toISOString()
    };
    
    localStorage.setItem('diceState', JSON.stringify(stateToSave));
}

// Inicializar controles
function initControls() {
    // Controles de número de dados
    const numDiceInput = document.getElementById('numDice');
    const diceRange = document.getElementById('diceRange');
    const decreaseBtn = document.getElementById('decrease-dice');
    const increaseBtn = document.getElementById('increase-dice');
    
    // Sincronizar input y range
    numDiceInput.addEventListener('input', function() {
        let value = parseInt(this.value) || 1;
        value = Math.max(1, Math.min(10, value));
        this.value = value;
        diceRange.value = value;
        diceState.numDice = value;
        updateProbabilities();
    });
    
    diceRange.addEventListener('input', function() {
        numDiceInput.value = this.value;
        diceState.numDice = parseInt(this.value);
        updateProbabilities();
    });
    
    decreaseBtn.addEventListener('click', function() {
        let value = parseInt(numDiceInput.value) - 1;
        if (value < 1) value = 1;
        numDiceInput.value = value;
        diceRange.value = value;
        diceState.numDice = value;
        updateProbabilities();
    });
    
    increaseBtn.addEventListener('click', function() {
        let value = parseInt(numDiceInput.value) + 1;
        if (value > 10) value = 10;
        numDiceInput.value = value;
        diceRange.value = value;
        diceState.numDice = value;
        updateProbabilities();
    });
    
    // Control de caras
    const diceFacesSelect = document.getElementById('diceFaces');
    diceFacesSelect.addEventListener('change', function() {
        diceState.diceFaces = parseInt(this.value);
        updateProbabilities();
    });
    
    // Botón de lanzar
    const rollBtn = document.getElementById('rollDice');
    rollBtn.addEventListener('click', rollDice);
    
    // Botón de auto-lanzar
    const autoRollBtn = document.getElementById('autoRoll');
    autoRollBtn.addEventListener('click', toggleAutoRoll);
    
    // Botón de reiniciar
    const resetBtn = document.getElementById('resetRoll');
    resetBtn.addEventListener('click', resetRoll);
    
    // Botón de limpiar historial
    const clearHistoryBtn = document.getElementById('clear-history');
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Botón de mostrar/ocultar historial
    const toggleHistoryBtn = document.getElementById('toggle-history');
    toggleHistoryBtn.addEventListener('click', function() {
        const historyPanel = document.getElementById('historyPanel');
        historyPanel.style.display = historyPanel.style.display === 'none' ? 'block' : 'none';
    });
    
    // Botón de compartir
    const shareBtn = document.getElementById('shareResults');
    shareBtn.addEventListener('click', shareResults);
    
    // Modal de compartir
    document.getElementById('copyText').addEventListener('click', copyShareText);
    document.getElementById('shareWhatsapp').addEventListener('click', shareToWhatsapp);
    document.getElementById('closeShare').addEventListener('click', closeShareModal);
    
    // Permitir lanzar con la barra espaciadora
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            rollDice();
        }
    });
}

// Lanzar dados
function rollDice() {
    // Efecto visual
    const rollBtn = document.getElementById('rollDice');
    const diceContainer = document.getElementById('diceContainer');
    
    rollBtn.classList.add('shake');
    diceContainer.classList.add('shake');
    
    setTimeout(() => {
        rollBtn.classList.remove('shake');
        diceContainer.classList.remove('shake');
    }, 500);
    
    // Generar resultados
    const results = [];
    let total = 0;
    
    for (let i = 0; i < diceState.numDice; i++) {
        const roll = Math.floor(Math.random() * diceState.diceFaces) + 1;
        results.push(roll);
        total += roll;
    }
    
    // Actualizar estado
    diceState.totalSum = total;
    diceState.rollsToday++;
    
    // Agregar al historial
    const rollRecord = {
        results: results,
        total: total,
        numDice: diceState.numDice,
        faces: diceState.diceFaces,
        timestamp: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString()
    };
    
    diceState.rollsHistory.unshift(rollRecord);
    
    // Limitar historial a 50 elementos
    if (diceState.rollsHistory.length > 50) {
        diceState.rollsHistory = diceState.rollsHistory.slice(0, 50);
    }
    
    // Actualizar estadísticas
    updateStats();
    
    // Mostrar resultados
    displayResults(results, total);
    
    // Actualizar historial
    updateHistoryDisplay();
    
    // Guardar estado
    saveState();
    
    // Sonido opcional
    playDiceSound();
}

// Mostrar resultados
function displayResults(results, total) {
    const diceContainer = document.getElementById('diceContainer');
    const totalResult = document.getElementById('totalResult');
    
    // Limpiar contenedor
    diceContainer.innerHTML = '';
    
    // Crear dados
    results.forEach((result, index) => {
        const dice = document.createElement('div');
        dice.className = `dice d${diceState.diceFaces} dice-animation`;
        dice.textContent = result;
        dice.style.animationDelay = `${index * 0.1}s`;
        
        diceContainer.appendChild(dice);
    });
    
    // Actualizar total
    totalResult.textContent = total;
    totalResult.classList.add('dice-animation');
    
    setTimeout(() => {
        totalResult.classList.remove('dice-animation');
        diceContainer.querySelectorAll('.dice').forEach(d => {
            d.classList.remove('dice-animation');
        });
    }, 1000);
}

// Auto-lanzar
function toggleAutoRoll() {
    const autoRollBtn = document.getElementById('autoRoll');
    
    if (!diceState.isAutoRolling) {
        // Iniciar auto-lanzamiento
        diceState.isAutoRolling = true;
        autoRollBtn.innerHTML = '<i class="fas fa-stop"></i> DETENER AUTO';
        autoRollBtn.classList.remove('btn-secondary');
        autoRollBtn.classList.add('btn-error');
        
        diceState.autoRollInterval = setInterval(rollDice, 2000);
    } else {
        // Detener auto-lanzamiento
        diceState.isAutoRolling = false;
        autoRollBtn.innerHTML = '<i class="fas fa-sync-alt"></i> AUTO-LANZAR';
        autoRollBtn.classList.remove('btn-error');
        autoRollBtn.classList.add('btn-secondary');
        
        clearInterval(diceState.autoRollInterval);
    }
}

// Reiniciar
function resetRoll() {
    const diceContainer = document.getElementById('diceContainer');
    const totalResult = document.getElementById('totalResult');
    
    diceContainer.innerHTML = `
        <div class="dice-placeholder">
            <i class="fas fa-dice"></i>
            <p>Configura los dados y haz clic en "LANZAR"</p>
        </div>
    `;
    
    totalResult.textContent = '0';
    diceState.totalSum = 0;
    
    updateStats();
}

// Actualizar estadísticas
function updateStats() {
    document.getElementById('rollsToday').textContent = diceState.rollsToday;
    
    // Calcular promedio
    if (diceState.rollsHistory.length > 0) {
        const sum = diceState.rollsHistory.reduce((acc, roll) => acc + roll.total, 0);
        diceState.averageRoll = (sum / diceState.rollsHistory.length).toFixed(2);
        
        // Calcular máximo
        diceState.maxRoll = Math.max(...diceState.rollsHistory.map(r => r.total));
    } else {
        diceState.averageRoll = 0;
        diceState.maxRoll = 0;
    }
    
    document.getElementById('averageRoll').textContent = diceState.averageRoll;
    document.getElementById('maxRoll').textContent = diceState.maxRoll;
    
    // Actualizar distribución
    updateDistribution();
}

// Actualizar distribución
function updateDistribution() {
    const distributionText = document.getElementById('distributionText');
    const min = diceState.numDice;
    const max = diceState.numDice * diceState.diceFaces;
    
    distributionText.textContent = `Rango: ${min}-${max}`;
}

// Actualizar probabilidades
function updateProbabilities() {
    const probabilitiesText = document.getElementById('probabilitiesText');
    const tipText = document.getElementById('tipText');
    
    const min = diceState.numDice;
    const max = diceState.numDice * diceState.diceFaces;
    const avg = (min + max) / 2;
    
    probabilitiesText.textContent = `Mín: ${min} | Máx: ${max} | Media: ${avg.toFixed(1)}`;
    
    // Consejo según configuración
    if (diceState.numDice === 1) {
        tipText.textContent = '¡Un solo dado! Cada resultado es igualmente probable.';
    } else if (diceState.numDice > 3) {
        tipText.textContent = 'Con muchos dados, los resultados tienden a agruparse alrededor de la media.';
    } else {
        tipText.textContent = 'La distribución de probabilidad tiene forma de campana (normal).';
    }
    
    updateDistribution();
}

// Actualizar historial
function updateHistoryDisplay() {
    const historyList = document.getElementById('rollHistory');
    
    if (diceState.rollsHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-clipboard-list fa-2x"></i>
                <p>No hay lanzamientos registrados todavía.</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = '';
    
    diceState.rollsHistory.forEach(roll => {
        const historyItem = document.createElement('div');
        historyItem.className = 'roll-history-item';
        
        const diceValues = roll.results.map(r => 
            `<div class="dice-mini">${r}</div>`
        ).join('');
        
        historyItem.innerHTML = `
            <div>
                <div class="roll-dice-values">${diceValues}</div>
                <div class="roll-time">${roll.date} ${roll.timestamp}</div>
            </div>
            <div class="roll-total">${roll.total}</div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Limpiar historial
function clearHistory() {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial de lanzamientos?')) {
        diceState.rollsHistory = [];
        updateHistoryDisplay();
        saveState();
        
        // Mostrar notificación
        showNotification('Historial de lanzamientos borrado correctamente');
    }
}

// Compartir resultados
function shareResults() {
    const shareModal = document.getElementById('shareModal');
    const shareText = document.getElementById('shareText');
    
    if (diceState.rollsHistory.length === 0) {
        showNotification('No hay resultados para compartir', 'warning');
        return;
    }
    
    const lastRoll = diceState.rollsHistory[0];
    const diceEmoji = getDiceEmoji(diceState.diceFaces);
    
    let text = `🎲 RESULTADOS DE DADOS VIRTUALES 🎲\n`;
    text += `📅 ${lastRoll.date} 🕒 ${lastRoll.timestamp}\n\n`;
    text += `Configuración: ${diceState.numDice} dado(s) D${diceState.diceFaces}\n`;
    text += `Resultados: ${lastRoll.results.join(', ')}\n`;
    text += `🎯 SUMA TOTAL: ${lastRoll.total}\n\n`;
    text += `📊 Estadísticas del día:\n`;
    text += `• Lanzamientos: ${diceState.rollsToday}\n`;
    text += `• Promedio: ${diceState.averageRoll}\n`;
    text += `• Máximo: ${diceState.maxRoll}\n\n`;
    text += `🎲 Generado con Simulador de Dados - Liga Escolar\n`;
    text += `🔗 https://www.ligaescolar.es/dados/`;
    
    shareText.value = text;
    shareModal.style.display = 'flex';
}

// Obtener emoji según tipo de dado
function getDiceEmoji(faces) {
    const emojis = {
        4: '🎲',
        6: '🎲',
        8: '🎲',
        10: '🎲',
        12: '🎲',
        20: '🎲',
        100: '🎯'
    };
    return emojis[faces] || '🎲';
}

// Copiar texto al portapapeles
function copyShareText() {
    const shareText = document.getElementById('shareText');
    shareText.select();
    shareText.setSelectionRange(0, 99999);
    
    try {
        navigator.clipboard.writeText(shareText.value);
        showNotification('Texto copiado al portapapeles');
    } catch (err) {
        // Fallback para navegadores antiguos
        document.execCommand('copy');
        showNotification('Texto copiado al portapapeles');
    }
}

// Compartir por WhatsApp
function shareToWhatsapp() {
    const shareText = document.getElementById('shareText');
    const text = encodeURIComponent(shareText.value);
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
}

// Cerrar modal de compartir
function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
}

// Sonido de dados (opcional)
function playDiceSound() {
    try {
        // Crear contexto de audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Sonido de dados
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Silenciar errores de audio
        console.log('Audio no disponible');
    }
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    // Crear notificación si no existe
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Configurar notificación
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span id="notification-text">${message}</span>
    `;
    
    notification.className = 'notification';
    if (type !== 'success') {
        notification.classList.add(type);
    }
    
    // Mostrar notificación
    notification.style.display = 'flex';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.style.display = 'none';
            notification.style.animation = '';
        }, 300);
    }, 3000);
}

// Hacer funciones globales
window.rollDice = rollDice;
window.toggleAutoRoll = toggleAutoRoll;
window.resetRoll = resetRoll;
window.clearHistory = clearHistory;
window.shareResults = shareResults;
window.copyShareText = copyShareText;
window.shareToWhatsapp = shareToWhatsapp;
window.closeShareModal = closeShareModal;
