// dados.js - VERSIÓN COMPLETA CON CONFIGURACIÓN INDIVIDUAL POR DADO FUNCIONAL
// Lógica del simulador de dados optimizado para móviles

// Estado del simulador
const diceState = {
    numDice: 2,
    diceFaces: 6,
    diceConfig: [], // Array de configuraciones individuales
    configMode: 'uniform', // 'uniform' o 'individual'
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Simulador de dados cargado - Configuración individual habilitada');
    
    // Detectar orientación inicial
    detectOrientation();
    
    // Escuchar cambios de orientación
    window.addEventListener('resize', function() {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(detectOrientation, 250);
    });
    
    window.addEventListener('orientationchange', function() {
        setTimeout(detectOrientation, 100);
    });
    
    // Inicializar configuración de dados
    initDiceConfig();
    
    // Inicializar controles
    initControls();
    
    // Cargar estado guardado
    loadSavedState();
    
    // Actualizar estadísticas iniciales
    updateStats();
    updateProbabilities();
    
    // Inicializar reloj
    if (typeof updateClock === 'function') {
        updateClock();
        setInterval(updateClock, 1000);
    }
});

// Detectar orientación
function detectOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    diceState.orientation = isLandscape ? 'landscape' : 'portrait';
    document.body.classList.toggle('landscape-mode', isLandscape);
    
    // Ajustar UI según orientación
    adjustUIForOrientation();
    
    return diceState.orientation;
}

// Ajustar UI según orientación
function adjustUIForOrientation() {
    const historyPanel = document.getElementById('historyPanel');
    const statsPanel = document.querySelector('.stats-panel');
    const infoCard = document.querySelector('.info-card');
    
    if (diceState.orientation === 'landscape' && window.innerHeight < 600) {
        // En landscape con pantalla pequeña, ocultar elementos secundarios
        if (historyPanel) historyPanel.style.display = 'none';
        if (statsPanel) statsPanel.style.display = 'none';
        if (infoCard) infoCard.style.display = 'none';
    } else {
        // Mostrar todo en portrait o pantallas grandes
        if (historyPanel) historyPanel.style.display = 'block';
        if (statsPanel) statsPanel.style.display = 'block';
        if (infoCard) infoCard.style.display = 'block';
    }
}

// Inicializar configuración de dados
function initDiceConfig() {
    // Configuración inicial: 2 dados D6
    diceState.diceConfig = [
        { faces: 6, value: 0 },
        { faces: 6, value: 0 }
    ];
}

// Cargar estado guardado
function loadSavedState() {
    const savedState = localStorage.getItem('diceState');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            
            // Cargar configuración si existe
            if (parsed.diceConfig) {
                diceState.diceConfig = parsed.diceConfig;
                diceState.numDice = parsed.diceConfig.length;
                
                // Actualizar controles
                document.getElementById('numDice').value = diceState.numDice;
                document.getElementById('diceRange').value = diceState.numDice;
            }
            
            if (parsed.configMode) {
                diceState.configMode = parsed.configMode;
                setConfigMode(parsed.configMode);
            }
            
            if (parsed.diceFaces) {
                diceState.diceFaces = parsed.diceFaces;
                document.getElementById('diceFaces').value = diceState.diceFaces;
            }
            
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
        diceConfig: diceState.diceConfig,
        configMode: diceState.configMode,
        diceFaces: diceState.diceFaces,
        numDice: diceState.numDice,
        rollsToday: diceState.rollsToday,
        rollsHistory: diceState.rollsHistory.slice(0, 50),
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
        updateDiceCount(value);
    });
    
    diceRange.addEventListener('input', function() {
        numDiceInput.value = this.value;
        updateDiceCount(parseInt(this.value));
        
        // Feedback táctil
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    });
    
    decreaseBtn.addEventListener('click', function() {
        let value = parseInt(numDiceInput.value) - 1;
        if (value < 1) value = 1;
        numDiceInput.value = value;
        diceRange.value = value;
        updateDiceCount(value);
        
        // Feedback táctil
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    });
    
    increaseBtn.addEventListener('click', function() {
        let value = parseInt(numDiceInput.value) + 1;
        if (value > 10) value = 10;
        numDiceInput.value = value;
        diceRange.value = value;
        updateDiceCount(value);
        
        // Feedback táctil
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    });
    
    // Selector de modo
    const modeUniformBtn = document.getElementById('mode-uniform');
    const modeIndividualBtn = document.getElementById('mode-individual');
    const uniformSection = document.getElementById('uniform-section');
    const individualSection = document.getElementById('individual-section');
    const diceFacesSelect = document.getElementById('diceFaces');
    
    modeUniformBtn.addEventListener('click', function() {
        setConfigMode('uniform');
        
        // Feedback táctil
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    });
    
    modeIndividualBtn.addEventListener('click', function() {
        setConfigMode('individual');
        
        // Feedback táctil
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    });
    
    diceFacesSelect.addEventListener('change', function() {
        diceState.diceFaces = parseInt(this.value);
        if (diceState.configMode === 'uniform') {
            // Actualizar todos los dados
            diceState.diceConfig.forEach(dice => {
                dice.faces = diceState.diceFaces;
            });
            updateIndividualDiceList();
        }
        updateProbabilities();
        
        // Feedback táctil
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    });
    
    // Preconfiguraciones rápidas
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const preset = this.dataset.preset;
            applyPreset(preset);
            
            // Feedback táctil
            if ('vibrate' in navigator) {
                navigator.vibrate(30);
            }
        });
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
    
    // Permitir lanzar con toque en el área de resultados
    const diceContainer = document.getElementById('diceContainer');
    diceContainer.addEventListener('touchstart', function(e) {
        if (!e.target.closest('.dice') && !e.target.closest('button')) {
            this.style.transform = 'scale(0.99)';
        }
    });
    
    diceContainer.addEventListener('touchend', function(e) {
        this.style.transform = '';
        
        if (!e.target.closest('.dice') && !e.target.closest('button')) {
            rollDice();
        }
    });
    
    // Permitir lanzar con la barra espaciadora
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            rollDice();
        }
    });
}

// Actualizar número de dados
function updateDiceCount(count) {
    const oldCount = diceState.diceConfig.length;
    diceState.numDice = count;
    
    if (count > oldCount) {
        // Añadir nuevos dados
        for (let i = oldCount; i < count; i++) {
            const newFace = diceState.configMode === 'uniform' ? 
                diceState.diceFaces : 6; // Default D6 para nuevos dados individuales
            
            diceState.diceConfig.push({
                faces: newFace,
                value: 0
            });
        }
    } else if (count < oldCount) {
        // Eliminar dados del final
        diceState.diceConfig = diceState.diceConfig.slice(0, count);
    }
    
    // Actualizar según el modo actual
    if (diceState.configMode === 'uniform') {
        // Sincronizar todas las caras con el valor uniforme
        diceState.diceConfig.forEach(dice => {
            dice.faces = diceState.diceFaces;
        });
    }
    
    updateIndividualDiceList();
    updateProbabilities();
    saveState();
}

// Establecer modo de configuración (FUNCIÓN CORREGIDA)
function setConfigMode(mode) {
    diceState.configMode = mode;
    
    // Actualizar botones
    document.getElementById('mode-uniform').classList.toggle('active', mode === 'uniform');
    document.getElementById('mode-individual').classList.toggle('active', mode === 'individual');
    
    // Mostrar/ocultar secciones
    document.getElementById('uniform-section').style.display = mode === 'uniform' ? 'block' : 'none';
    document.getElementById('individual-section').style.display = mode === 'individual' ? 'block' : 'none';
    
    if (mode === 'uniform') {
        // Cambiar a modo uniforme: todos los dados toman la cara seleccionada
        const uniformFaces = parseInt(document.getElementById('diceFaces').value);
        diceState.diceConfig.forEach(dice => {
            dice.faces = uniformFaces;
        });
        diceState.diceFaces = uniformFaces;
    } else if (mode === 'individual') {
        // Cambiar a modo individual: mantener la configuración actual
        // Si no hay configuración individual, usar la uniforme como base
        if (diceState.diceConfig.length === 0 || 
            diceState.diceConfig.every(d => d.faces === diceState.diceFaces)) {
            // Inicializar con la configuración uniforme actual
            diceState.diceConfig = [];
            for (let i = 0; i < diceState.numDice; i++) {
                diceState.diceConfig.push({
                    faces: diceState.diceFaces,
                    value: 0
                });
            }
        }
    }
    
    updateIndividualDiceList();
    updateProbabilities();
    saveState();
}

// Actualizar lista de dados individuales (FUNCIÓN CORREGIDA)
function updateIndividualDiceList() {
    const diceList = document.getElementById('individualDiceList');
    
    // Limpiar lista
    diceList.innerHTML = '';
    
    // Crear elementos para cada dado
    diceState.diceConfig.forEach((dice, index) => {
        const diceItem = document.createElement('div');
        diceItem.className = 'dice-config-item';
        diceItem.dataset.index = index;
        
        diceItem.innerHTML = `
            <span class="dice-number">Dado ${index + 1}:</span>
            <select class="dice-face-select">
                <option value="4" ${dice.faces === 4 ? 'selected' : ''}>D4</option>
                <option value="6" ${dice.faces === 6 ? 'selected' : ''}>D6</option>
                <option value="8" ${dice.faces === 8 ? 'selected' : ''}>D8</option>
                <option value="10" ${dice.faces === 10 ? 'selected' : ''}>D10</option>
                <option value="12" ${dice.faces === 12 ? 'selected' : ''}>D12</option>
                <option value="20" ${dice.faces === 20 ? 'selected' : ''}>D20</option>
                <option value="100" ${dice.faces === 100 ? 'selected' : ''}>D100</option>
            </select>
            <button class="btn btn-small btn-icon swap-up" title="Mover arriba" ${index === 0 ? 'disabled' : ''}>
                <i class="fas fa-arrow-up"></i>
            </button>
            <button class="btn btn-small btn-icon swap-down" title="Mover abajo" ${index === diceState.diceConfig.length - 1 ? 'disabled' : ''}>
                <i class="fas fa-arrow-down"></i>
            </button>
        `;
        
        diceList.appendChild(diceItem);
        
        // Añadir event listener al select
        const select = diceItem.querySelector('.dice-face-select');
        select.addEventListener('change', function() {
            const newFaces = parseInt(this.value);
            diceState.diceConfig[index].faces = newFaces;
            
            // Si estamos en modo uniforme, cambiar a individual automáticamente
            if (diceState.configMode === 'uniform') {
                setConfigMode('individual');
            }
            
            updateProbabilities();
            saveState();
            
            // Feedback táctil
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        });
        
        // Botones para mover dados
        const upBtn = diceItem.querySelector('.swap-up');
        const downBtn = diceItem.querySelector('.swap-down');
        
        upBtn.addEventListener('click', function() {
            if (index > 0) {
                swapDice(index, index - 1);
            }
        });
        
        downBtn.addEventListener('click', function() {
            if (index < diceState.diceConfig.length - 1) {
                swapDice(index, index + 1);
            }
        });
    });
}

// Intercambiar posición de dos dados
function swapDice(index1, index2) {
    if (index1 < 0 || index2 < 0 || 
        index1 >= diceState.diceConfig.length || 
        index2 >= diceState.diceConfig.length) {
        return;
    }
    
    // Intercambiar posiciones
    const temp = diceState.diceConfig[index1];
    diceState.diceConfig[index1] = diceState.diceConfig[index2];
    diceState.diceConfig[index2] = temp;
    
    // Actualizar interfaz
    updateIndividualDiceList();
    saveState();
    
    // Feedback táctil
    if ('vibrate' in navigator) {
        navigator.vibrate(20);
    }
}

// Aplicar preconfiguración (FUNCIÓN CORREGIDA)
function applyPreset(preset) {
    switch(preset) {
        case 'dnd':
            diceState.numDice = 1;
            diceState.diceConfig = [{ faces: 20, value: 0 }];
            diceState.configMode = 'individual';
            break;
            
        case 'damage':
            diceState.numDice = 2;
            diceState.diceConfig = [
                { faces: 6, value: 0 },
                { faces: 6, value: 0 }
            ];
            diceState.configMode = 'uniform';
            diceState.diceFaces = 6;
            break;
            
        case 'percent':
            diceState.numDice = 1;
            diceState.diceConfig = [{ faces: 100, value: 0 }];
            diceState.configMode = 'individual';
            break;
            
        case 'mixed':
            diceState.numDice = 2;
            diceState.diceConfig = [
                { faces: 20, value: 0 },
                { faces: 6, value: 0 }
            ];
            diceState.configMode = 'individual';
            break;
    }
    
    // Actualizar controles UI
    document.getElementById('numDice').value = diceState.numDice;
    document.getElementById('diceRange').value = diceState.numDice;
    
    if (diceState.configMode === 'uniform') {
        document.getElementById('diceFaces').value = diceState.diceFaces;
    }
    
    // Establecer modo visual
    setConfigMode(diceState.configMode);
    
    updateProbabilities();
    
    showNotification(`Preconfiguración "${preset}" aplicada`);
}

// Lanzar dados
function rollDice() {
    // Efectos visuales
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
    
    // Generar resultados según cada dado
    const results = [];
    let total = 0;
    
    diceState.diceConfig.forEach((dice, index) => {
        const roll = Math.floor(Math.random() * dice.faces) + 1;
        dice.value = roll;
        results.push({
            value: roll,
            faces: dice.faces,
            index: index
        });
        total += roll;
    });
    
    // Guardar en estado
    diceState.currentResults = results;
    diceState.totalSum = total;
    diceState.rollsToday++;
    
    // Agregar al historial
    const now = new Date();
    const rollRecord = {
        results: results.map(r => ({ value: r.value, faces: r.faces })),
        total: total,
        numDice: diceState.numDice,
        configMode: diceState.configMode,
        diceConfig: JSON.parse(JSON.stringify(diceState.diceConfig)),
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString(),
        fullTime: now.getTime()
    };
    
    diceState.rollsHistory.unshift(rollRecord);
    
    // Limitar historial
    if (diceState.rollsHistory.length > 50) {
        diceState.rollsHistory = diceState.rollsHistory.slice(0, 50);
    }
    
    // Actualizar estadísticas y mostrar resultados
    updateStats();
    displayResults(results, total);
    updateHistoryDisplay();
    saveState();
    
    // Sonido opcional
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

// Mostrar resultados
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
                const diceWrapper = document.createElement('div');
                diceWrapper.className = 'dice-result-item';
                
                const dice = document.createElement('div');
                dice.className = `dice d${result.faces} dice-animation`;
                dice.textContent = result.value;
                dice.style.animationDelay = `${index * 0.1}s`;
                
                const typeLabel = document.createElement('div');
                typeLabel.className = 'dice-type-label';
                typeLabel.textContent = `D${result.faces}`;
                
                diceWrapper.appendChild(typeLabel);
                diceWrapper.appendChild(dice);
                diceContainer.appendChild(diceWrapper);
                
                // Efecto especial para resultados máximos
                if (result.value === result.faces) {
                    dice.style.boxShadow += ', 0 0 20px rgba(255, 215, 0, 0.7)';
                    typeLabel.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
                }
                
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
    totalResult.style.color = '#FFD700';
    
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
                if (total > getExpectedAverage() * 1.5) {
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

// Calcular promedio esperado
function getExpectedAverage() {
    let sum = 0;
    diceState.diceConfig.forEach(dice => {
        sum += (dice.faces + 1) / 2;
    });
    return sum;
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
    const max = diceState.diceConfig.reduce((sum, dice) => sum + dice.faces, 0);
    
    distributionText.textContent = `Rango: ${min}-${max}`;
}

// Actualizar probabilidades
function updateProbabilities() {
    const probabilitiesText = document.getElementById('probabilitiesText');
    const tipText = document.getElementById('tipText');
    
    const min = diceState.numDice;
    const max = diceState.diceConfig.reduce((sum, dice) => sum + dice.faces, 0);
    const expectedAvg = getExpectedAverage();
    
    probabilitiesText.textContent = `Mín: ${min} | Máx: ${max} | Media: ${expectedAvg.toFixed(1)}`;
    
    // Verificar si hay dados diferentes
    const hasDifferentDice = diceState.diceConfig.some(dice => 
        dice.faces !== diceState.diceConfig[0].faces
    );
    
    // Consejo según configuración
    if (diceState.diceConfig.length === 1) {
        tipText.textContent = 'Un solo dado: todos los resultados son igualmente probables.';
    } else if (hasDifferentDice) {
        tipText.textContent = 'Dados diferentes: distribución asimétrica.';
        
        // Mostrar detalles de dados diferentes
        const diceTypes = {};
        diceState.diceConfig.forEach(dice => {
            diceTypes[`D${dice.faces}`] = (diceTypes[`D${dice.faces}`] || 0) + 1;
        });
        
        const typeSummary = Object.entries(diceTypes)
            .map(([type, count]) => `${count}${type}`)
            .join(' + ');
        
        distributionText.textContent = `Rango: ${min}-${max} (${typeSummary})`;
    } else {
        tipText.textContent = 'Dados iguales: distribución normal (campana).';
    }
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
        
        // Mostrar tipos de dados en el historial
        const diceSummary = roll.results.map(r => 
            `<div class="dice-mini d${r.faces}">${r.value}<span class="mini-type">D${r.faces}</span></div>`
        ).join('');
        
        historyItem.innerHTML = `
            <div>
                <div class="roll-dice-values">${diceSummary}</div>
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
    
    let text = `🎲 RESULTADOS DE DADOS VIRTUALES 🎲\n`;
    text += `📅 ${lastRoll.date} 🕒 ${lastRoll.timestamp}\n\n`;
    
    text += `Configuración (${lastRoll.configMode === 'uniform' ? 'todos iguales' : 'individual'}):\n`;
    lastRoll.diceConfig.forEach((dice, index) => {
        text += `• Dado ${index + 1}: D${dice.faces}\n`;
    });
    
    text += `\n🎯 Resultados:\n`;
    lastRoll.results.forEach((result, index) => {
        text += `• Dado ${index + 1} (D${result.faces}): ${result.value}\n`;
    });
    
    text += `\n⭐ SUMA TOTAL: ${lastRoll.total}\n\n`;
    
    // Estadísticas adicionales si hay resultados interesantes
    const maxPossible = lastRoll.diceConfig.reduce((sum, dice) => sum + dice.faces, 0);
    const percentage = Math.round((lastRoll.total / maxPossible) * 100);
    
    if (percentage > 80) {
        text += `🔥 ¡Excelente lanzamiento! (${percentage}% del máximo)\n\n`;
    }
    
    text += `📊 Estadísticas del día:\n`;
    text += `• Lanzamientos: ${diceState.rollsToday}\n`;
    text += `• Promedio: ${diceState.averageRoll}\n`;
    text += `• Máximo: ${diceState.maxRoll}\n\n`;
    
    text += `🎲 Generado con Simulador de Dados - Liga Escolar\n`;
    text += `🔗 https://www.ligaescolar.es/dados/`;
    
    shareText.value = text;
    shareModal.style.display = 'flex';
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
