// dados.js - Optimizado para móviles
// Lógica del simulador de dados

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
    isAutoRolling: false,
    currentResults: [],
    orientation: 'portrait'
};

// Detectar orientación
function detectOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    diceState.orientation = isLandscape ? 'landscape' : 'portrait';
    document.body.classList.toggle('landscape-mode', isLandscape);
    document.body.classList.toggle('portrait-mode', !isLandscape);
    
    // Ajustar UI según orientación
    adjustUIForOrientation();
    
    return diceState.orientation;
}

// Ajustar UI según orientación
function adjustUIForOrientation() {
    const historyPanel = document.getElementById('historyPanel');
    const statsPanel = document.querySelector('.stats-panel');
    const infoCard = document.querySelector('.info-card');
    const diceContainer = document.getElementById('diceContainer');
    const totalResult = document.getElementById('totalResult');
    
    if (diceState.orientation === 'landscape' && window.innerHeight < 600) {
        // En landscape con pantalla pequeña, ocultar elementos secundarios
        if (historyPanel) historyPanel.style.display = 'none';
        if (statsPanel) statsPanel.style.display = 'none';
        if (infoCard) infoCard.style.display = 'none';
        
        // Hacer dados y total más prominentes
        if (diceContainer) {
            diceContainer.style.gap = '8px';
            diceContainer.style.margin = '10px 0';
        }
        
        if (totalResult) {
            totalResult.style.fontSize = '4rem';
        }
    } else {
        // Mostrar todo en portrait o pantallas grandes
        if (historyPanel) historyPanel.style.display = 'block';
        if (statsPanel) statsPanel.style.display = 'block';
        if (infoCard) infoCard.style.display = 'block';
        
        if (diceContainer) {
            diceContainer.style.gap = '15px';
            diceContainer.style.margin = '20px 0';
        }
        
        if (totalResult) {
            totalResult.style.fontSize = '';
        }
    }
}

// Inicialización mejorada para móviles
document.addEventListener('DOMContentLoaded', function() {
    console.log('Simulador de dados cargado - Optimizado para móviles');
    
    // Detectar orientación inicial
    detectOrientation();
    
    // Escuchar cambios de orientación
    window.addEventListener('resize', function() {
        // Usar debounce para evitar llamadas excesivas
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            detectOrientation();
        }, 250);
    });
    
    // También detectar cambios explícitos de orientación
    window.addEventListener('orientationchange', function() {
        setTimeout(detectOrientation, 100);
    });
    
    // Cargar estado guardado
    loadSavedState();
    
    // Inicializar controles táctiles
    initTouchControls();
    
    // Actualizar estadísticas iniciales
    updateStats();
    updateProbabilities();
    
    // Inicializar reloj si no se ha hecho
    if (typeof updateClock === 'function') {
        updateClock();
        setInterval(updateClock, 1000);
    }
});

// Inicializar controles táctiles
function initTouchControls() {
    // Controles de número de dados
    const numDiceInput = document.getElementById('numDice');
    const diceRange = document.getElementById('diceRange');
    const decreaseBtn = document.getElementById('decrease-dice');
    const increaseBtn = document.getElementById('increase-dice');
    
    // Hacer inputs más táctiles
    numDiceInput.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.focus();
        // En móviles, mostrar teclado numérico
        this.type = 'number';
        this.setAttribute('pattern', '[0-9]*');
        this.setAttribute('inputmode', 'numeric');
    });
    
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
        
        // Feedback táctil
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    });
    
    // Botones +/- con feedback táctil
    [decreaseBtn, increaseBtn].forEach(btn => {
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.classList.add('active');
            
            let value = parseInt(numDiceInput.value);
            if (this.id === 'decrease-dice') {
                value = Math.max(1, value - 1);
            } else {
                value = Math.min(10, value + 1);
            }
            
            numDiceInput.value = value;
            diceRange.value = value;
            diceState.numDice = value;
            updateProbabilities();
            
            // Feedback táctil
            if ('vibrate' in navigator) {
                navigator.vibrate(20);
            }
        });
        
        btn.addEventListener('touchend', function() {
            this.classList.remove('active');
        });
    });
    
    // Control de caras
    const diceFacesSelect = document.getElementById('diceFaces');
    diceFacesSelect.addEventListener('change', function() {
        diceState.diceFaces = parseInt(this.value);
        updateProbabilities();
        
        // Feedback táctil
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    });
    
    // Botón de lanzar con feedback táctil mejorado
    const rollBtn = document.getElementById('rollDice');
    rollBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.classList.add('active');
        
        // Feedback táctil inmediato
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
    });
    
    rollBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        this.classList.remove('active');
        rollDice();
    });
    
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
        const isHidden = historyPanel.style.display === 'none';
        historyPanel.style.display = isHidden ? 'block' : 'none';
        this.innerHTML = isHidden ? 
            '<i class="fas fa-eye-slash"></i> Ocultar' : 
            '<i class="fas fa-eye"></i> Mostrar';
        
        // Feedback táctil
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    });
    
    // Botón de compartir
    const shareBtn = document.getElementById('shareResults');
    shareBtn.addEventListener('click', shareResults);
    
    // Modal de compartir
    document.getElementById('copyText').addEventListener('click', copyShareText);
    document.getElementById('shareWhatsapp').addEventListener('click', shareToWhatsapp);
    document.getElementById('closeShare').addEventListener('click', closeShareModal);
    
    // Permitir lanzar con toque en cualquier parte (opcional)
    const rollArea = document.querySelector('.roll-area');
    rollArea.addEventListener('touchstart', function(e) {
        // Solo si no es un botón u input
        if (!e.target.closest('button') && !e.target.closest('input') && !e.target.closest('select')) {
            // Pequeño feedback visual
            this.style.transform = 'scale(0.99)';
        }
    });
    
    rollArea.addEventListener('touchend', function(e) {
        this.style.transform = '';
        
        // Solo si no es un botón u input y fue un toque rápido
        if (!e.target.closest('button') && !e.target.closest('input') && !e.target.closest('select')) {
            if (e.changedTouches && e.changedTouches[0]) {
                const touch = e.changedTouches[0];
                const now = Date.now();
                
                // Verificar que fue un toque rápido (no desplazamiento)
                if (now - this.lastTouch < 300) {
                    rollDice();
                }
                this.lastTouch = now;
            }
        }
    });
    
    // Gestos para limpiar historial (opcional)
    let touchStartY = 0;
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length === 3) { // Tres dedos
            touchStartY = e.touches[0].clientY;
        }
    });
    
    document.addEventListener('touchend', function(e) {
        if (e.touches.length === 0 && touchStartY > 0) {
            // Gestos de tres dedos podrían usarse para acciones rápidas
            touchStartY = 0;
        }
    });
}

// Lanzar dados optimizado para móviles
function rollDice() {
    // Efecto visual mejorado
    const rollBtn = document.getElementById('rollDice');
    const diceContainer = document.getElementById('diceContainer');
    const totalResult = document.getElementById('totalResult');
    
    rollBtn.classList.add('shake');
    diceContainer.classList.add('shake');
    totalResult.classList.add('shake');
    
    // Feedback táctil fuerte
    if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
    }
    
    setTimeout(() => {
        rollBtn.classList.remove('shake');
        diceContainer.classList.remove('shake');
        totalResult.classList.remove('shake');
    }, 500);
    
    // Generar resultados
    const results = [];
    let total = 0;
    
    for (let i = 0; i < diceState.numDice; i++) {
        const roll = Math.floor(Math.random() * diceState.diceFaces) + 1;
        results.push(roll);
        total += roll;
    }
    
    // Guardar resultados actuales
    diceState.currentResults = results;
    diceState.totalSum = total;
    diceState.rollsToday++;
    
    // Agregar al historial
    const now = new Date();
    const rollRecord = {
        results: [...results],
        total: total,
        numDice: diceState.numDice,
        faces: diceState.diceFaces,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString(),
        fullTime: now.getTime()
    };
    
    diceState.rollsHistory.unshift(rollRecord);
    
    // Limitar historial a 50 elementos
    if (diceState.rollsHistory.length > 50) {
        diceState.rollsHistory = diceState.rollsHistory.slice(0, 50);
    }
    
    // Actualizar estadísticas
    updateStats();
    
    // Mostrar resultados con animación mejorada
    displayResults(results, total);
    
    // Actualizar historial
    updateHistoryDisplay();
    
    // Guardar estado
    saveState();
    
    // Sonido opcional (solo si no está en silencio)
    playDiceSound();
    
    // En landscape, mostrar temporalmente el historial si estaba oculto
    if (diceState.orientation === 'landscape' && window.innerHeight < 600) {
        const historyPanel = document.getElementById('historyPanel');
        if (historyPanel.style.display === 'none') {
            historyPanel.style.display = 'block';
            historyPanel.classList.add('force-show');
            
            // Ocultar después de 3 segundos
            setTimeout(() => {
                if (!historyPanel.matches(':hover')) {
                    historyPanel.style.display = 'none';
                    historyPanel.classList.remove('force-show');
                }
            }, 3000);
        }
    }
}

// Mostrar resultados con animaciones mejoradas
function displayResults(results, total) {
    const diceContainer = document.getElementById('diceContainer');
    const totalResult = document.getElementById('totalResult');
    
    // Limpiar contenedor con animación
    diceContainer.style.opacity = '0.5';
    setTimeout(() => {
        diceContainer.innerHTML = '';
        
        // Crear dados con animación escalonada
        results.forEach((result, index) => {
            setTimeout(() => {
                const dice = document.createElement('div');
                dice.className = `dice d${diceState.diceFaces} dice-animation`;
                dice.textContent = result;
                dice.style.animationDelay = `${index * 0.1}s`;
                
                // Efecto de brillo en el dado con el número más alto
                if (result === Math.max(...results)) {
                    dice.style.boxShadow += ', 0 0 20px rgba(255, 215, 0, 0.7)';
                }
                
                diceContainer.appendChild(dice);
                
                // Feedback táctil para cada dado (opcional)
                if ('vibrate' in navigator && index === results.length - 1) {
                    navigator.vibrate(10);
                }
            }, index * 100);
        });
        
        diceContainer.style.opacity = '1';
    }, 200);
    
    // Animación del total
    totalResult.style.transform = 'scale(1.2)';
    totalResult.style.color = '#FFD700'; // Dorado temporal
    
    // Contar hacia arriba si es un número grande
    if (total > 10) {
        let current = 0;
        const increment = Math.ceil(total / 20);
        const counter = setInterval(() => {
            current += increment;
            if (current >= total) {
                current = total;
                clearInterval(counter);
                
                // Efecto final
                totalResult.textContent = total;
                totalResult.style.transform = 'scale(1)';
                totalResult.style.color = '';
                
                // Efecto de confeti para totales altos
                if (total > diceState.numDice * diceState.diceFaces * 0.8) {
                    showMiniCelebration();
                }
            } else {
                totalResult.textContent = current;
            }
        }, 30);
    } else {
        totalResult.textContent = total;
        setTimeout(() => {
            totalResult.style.transform = 'scale(1)';
            totalResult.style.color = '';
        }, 300);
    }
}

// Mini celebración para resultados altos
function showMiniCelebration() {
    const totalResult = document.getElementById('totalResult');
    
    // Efecto de partículas simples
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: gold;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
            `;
            document.body.appendChild(particle);
            
            // Animación
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 40;
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance;
            
            particle.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { 
                    transform: `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) scale(0)`,
                    opacity: 0 
                }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.2, 0, 0.8, 1)'
            }).onfinish = () => particle.remove();
        }, i * 100);
    }
    
    // Feedback táctil
    if ('vibrate' in navigator) {
        navigator.vibrate([30, 50, 30]);
    }
}

// El resto de funciones permanecen iguales (loadSavedState, saveState, updateStats, etc.)
// Solo asegúrate de que todas las funciones estén definidas

// Nota: Asegúrate de que todas las demás funciones del archivo anterior estén presentes aquí
// (loadSavedState, saveState, updateStats, updateProbabilities, updateHistoryDisplay, 
// clearHistory, shareResults, copyShareText, shareToWhatsapp, closeShareModal, 
// playDiceSound, showNotification, etc.)

// Al final del archivo, exporta las funciones necesarias
window.rollDice = rollDice;
window.toggleAutoRoll = toggleAutoRoll;
window.resetRoll = resetRoll;
window.clearHistory = clearHistory;
window.shareResults = shareResults;
window.copyShareText = copyShareText;
window.shareToWhatsapp = shareToWhatsapp;
window.closeShareModal = closeShareModal;
window.detectOrientation = detectOrientation;
