// moneda.js - Lógica del lanzador de moneda virtual
// Versión completa optimizada para móviles

// Estado del lanzador
const coinState = {
    totalFlips: 0,
    headsCount: 0,
    tailsCount: 0,
    currentResult: null,
    flipHistory: [],
    isFlipping: false,
    soundEnabled: true,
    vibrationEnabled: true,
    autoFlipEnabled: false,
    autoFlipInterval: null,
    orientation: 'portrait'
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Lanzador de moneda cargado');

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

    // Inicializar controles
    initControls();

    // Cargar estado guardado
    loadSavedState();

    // Actualizar estadísticas iniciales
    updateStats();

    // Configurar botones de ayuda
    setupHelpButtons();

    // Configurar PWA
    setupPWA();

    // Mostrar mensaje de bienvenida
    showNotification('¡Lanzador de moneda listo! Toca el botón para comenzar.', 'info');
});

// Detectar orientación
function detectOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    coinState.orientation = isPortrait ? 'portrait' : 'landscape';

    // Ajustar animaciones según orientación
    const coin = document.querySelector('.coin');
    if (coin) {
        if (coinState.orientation === 'landscape') {
            coin.style.transform = 'scale(0.8)';
        } else {
            coin.style.transform = 'scale(1)';
        }
    }
}

// Inicializar controles
function initControls() {
    const flipBtn = document.getElementById('flip-btn');
    const resetBtn = document.getElementById('reset-btn');
    const soundToggle = document.getElementById('sound-toggle');
    const vibrationToggle = document.getElementById('vibration-toggle');
    const coinElement = document.querySelector('.coin');

    if (flipBtn) {
        flipBtn.addEventListener('click', flipCoin);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetStats);
    }

    if (soundToggle) {
        soundToggle.addEventListener('click', toggleSound);
    }

    if (vibrationToggle) {
        vibrationToggle.addEventListener('click', toggleVibration);
    }

    if (coinElement) {
        coinElement.addEventListener('click', flipCoin);
    }

    // Configurar toggle switches
    setupToggleSwitches();
}

// Configurar toggle switches
function setupToggleSwitches() {
    const toggles = document.querySelectorAll('.toggle-switch');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            this.classList.toggle('active');
            const setting = this.dataset.setting;

            if (setting === 'sound') {
                coinState.soundEnabled = this.classList.contains('active');
            } else if (setting === 'vibration') {
                coinState.vibrationEnabled = this.classList.contains('active');
            }

            saveState();
        });
    });
}

// Lanzar moneda
function flipCoin() {
    if (coinState.isFlipping) return;

    coinState.isFlipping = true;

    const coin = document.querySelector('.coin');
    const resultText = document.querySelector('.result-text');
    const flipBtn = document.getElementById('flip-btn');

    // Deshabilitar botón durante la animación
    if (flipBtn) flipBtn.disabled = true;

    // Ocultar resultado anterior
    if (resultText) {
        resultText.classList.remove('show');
    }

    // Agregar clase de animación
    coin.classList.add('flipping');

    // Efectos de sonido y vibración
    if (coinState.soundEnabled) {
        playSound('flip');
    }

    if (coinState.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate(100);
    }

    // Generar resultado después de un delay
    setTimeout(() => {
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        coinState.currentResult = result;

        // Actualizar estadísticas
        coinState.totalFlips++;
        if (result === 'heads') {
            coinState.headsCount++;
        } else {
            coinState.tailsCount++;
        }

        // Agregar al historial
        coinState.flipHistory.unshift(result);
        if (coinState.flipHistory.length > 20) {
            coinState.flipHistory.pop();
        }

        // Mostrar resultado
        coin.classList.remove('flipping');
        coin.classList.remove('show-heads', 'show-tails');
        coin.classList.add(`show-${result}`);

        // Mostrar texto del resultado
        if (resultText) {
            resultText.textContent = result === 'heads' ? '¡CARA!' : '¡CRUZ!';
            resultText.classList.add('show');
        }

        // Actualizar UI
        updateStats();
        updateHistory();

        // Efectos finales
        if (coinState.soundEnabled) {
            playSound(result);
        }

        if (coinState.vibrationEnabled && 'vibrate' in navigator) {
            navigator.vibrate([50, 50, 50]);
        }

        // Rehabilitar botón
        coinState.isFlipping = false;
        if (flipBtn) flipBtn.disabled = false;

        // Guardar estado
        saveState();

        // Celebrar si es un hito
        checkMilestone();

    }, 2000);
}

// Actualizar estadísticas
function updateStats() {
    const totalElement = document.getElementById('total-flips');
    const headsElement = document.getElementById('heads-count');
    const tailsElement = document.getElementById('tails-count');
    const headsPercentElement = document.getElementById('heads-percent');
    const tailsPercentElement = document.getElementById('tails-percent');

    if (totalElement) totalElement.textContent = coinState.totalFlips;
    if (headsElement) headsElement.textContent = coinState.headsCount;
    if (tailsElement) tailsElement.textContent = coinState.tailsCount;

    // Calcular porcentajes
    const headsPercent = coinState.totalFlips > 0 ? Math.round((coinState.headsCount / coinState.totalFlips) * 100) : 0;
    const tailsPercent = coinState.totalFlips > 0 ? Math.round((coinState.tailsCount / coinState.totalFlips) * 100) : 0;

    if (headsPercentElement) headsPercentElement.textContent = `${headsPercent}%`;
    if (tailsPercentElement) tailsPercentElement.textContent = `${tailsPercent}%`;
}

// Actualizar historial
function updateHistory() {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;

    historyList.innerHTML = '';

    coinState.flipHistory.forEach(result => {
        const item = document.createElement('div');
        item.className = `history-item ${result}`;
        item.textContent = result === 'heads' ? '👑' : '💰';
        historyList.appendChild(item);
    });
}

// Resetear estadísticas
function resetStats() {
    if (confirm('¿Estás seguro de que quieres resetear todas las estadísticas?')) {
        coinState.totalFlips = 0;
        coinState.headsCount = 0;
        coinState.tailsCount = 0;
        coinState.flipHistory = [];
        coinState.currentResult = null;

        updateStats();
        updateHistory();
        saveState();

        showNotification('Estadísticas reseteadas', 'info');
    }
}

// Toggle sonido
function toggleSound() {
    coinState.soundEnabled = !coinState.soundEnabled;
    saveState();
    showNotification(`Sonido ${coinState.soundEnabled ? 'activado' : 'desactivado'}`, 'info');
}

// Toggle vibración
function toggleVibration() {
    coinState.vibrationEnabled = !coinState.vibrationEnabled;
    saveState();
    showNotification(`Vibración ${coinState.vibrationEnabled ? 'activada' : 'desactivada'}`, 'info');
}

// Reproducir sonidos
function playSound(type) {
    // Crear sonidos simples usando Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'flip':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'heads':
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'tails':
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
        }
    } catch (e) {
        console.log('Web Audio API no soportada');
    }
}

// Verificar hitos
function checkMilestone() {
    const milestones = [10, 25, 50, 100, 250, 500, 1000];

    if (milestones.includes(coinState.totalFlips)) {
        showNotification(`¡Hito alcanzado! ${coinState.totalFlips} lanzamientos`, 'success');
        celebrate();
    }
}

// Guardar estado
function saveState() {
    try {
        const state = {
            totalFlips: coinState.totalFlips,
            headsCount: coinState.headsCount,
            tailsCount: coinState.tailsCount,
            flipHistory: coinState.flipHistory.slice(0, 10), // Solo guardar los últimos 10
            soundEnabled: coinState.soundEnabled,
            vibrationEnabled: coinState.vibrationEnabled
        };
        localStorage.setItem('coinState', JSON.stringify(state));
    } catch (e) {
        console.error('Error guardando estado:', e);
    }
}

// Cargar estado
function loadSavedState() {
    try {
        const saved = localStorage.getItem('coinState');
        if (saved) {
            const state = JSON.parse(saved);
            Object.assign(coinState, state);

            // Actualizar toggles
            const soundToggle = document.querySelector('[data-setting="sound"]');
            const vibrationToggle = document.querySelector('[data-setting="vibration"]');

            if (soundToggle) {
                if (coinState.soundEnabled) {
                    soundToggle.classList.add('active');
                } else {
                    soundToggle.classList.remove('active');
                }
            }

            if (vibrationToggle) {
                if (coinState.vibrationEnabled) {
                    vibrationToggle.classList.add('active');
                } else {
                    vibrationToggle.classList.remove('active');
                }
            }
        }
    } catch (e) {
        console.error('Error cargando estado:', e);
    }
}

// Configurar botones de ayuda
function setupHelpButtons() {
    // Configurar modal de ayuda si existe
    const helpBtn = document.querySelector('.floating-help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }
}

// Mostrar ayuda
function showHelp() {
    const helpContent = `
        <h3><i class="fas fa-coins"></i> Cómo usar el Lanzador de Moneda</h3>
        <ul>
            <li><strong>Lanzar moneda:</strong> Toca el botón "LANZAR MONEDA" o haz clic en la moneda</li>
            <li><strong>Ver resultados:</strong> La moneda girará y mostrará cara (👑) o cruz (💰)</li>
            <li><strong>Estadísticas:</strong> Revisa el conteo total y porcentajes en tiempo real</li>
            <li><strong>Historial:</strong> Los últimos 20 lanzamientos se muestran abajo</li>
            <li><strong>Configuración:</strong> Activa/desactiva sonido y vibración</li>
            <li><strong>Reset:</strong> Borra todas las estadísticas con el botón reset</li>
        </ul>
        <p><strong>¿Sabías que?</strong> Una moneda justa tiene 50% de probabilidad para cara y cruz.</p>
    `;

    showModal('Ayuda - Lanzador de Moneda', helpContent);
}

// Configurar PWA
function setupPWA() {
    // Registrar service worker si no está registrado
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            const hasMonedaSW = registrations.some(reg => reg.scope.includes('/moneda/'));
            if (!hasMonedaSW) {
                navigator.serviceWorker.register('/moneda/sw.js')
                    .then(reg => console.log('Service Worker de moneda registrado:', reg))
                    .catch(err => console.error('Error registrando SW de moneda:', err));
            }
        });
    }

    // Manejar instalación PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Mostrar botón de instalación si existe
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'block';
            installBtn.addEventListener('click', () => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('Usuario aceptó instalar PWA');
                    }
                    deferredPrompt = null;
                });
            });
        }
    });

    // Manejar actualización PWA
    const updateBtn = document.getElementById('pwa-update-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }
}

// Funciones de utilidad
function showNotification(message, type = 'info') {
    if (typeof showNotification === 'function') {
        showNotification(message, type);
    } else {
        console.log(`Notificación: ${message} (${type})`);
    }
}

function showModal(title, content) {
    if (typeof showModal === 'function') {
        showModal(title, content);
    } else {
        alert(`${title}\n\n${content.replace(/<[^>]*>/g, '')}`);
    }
}

function celebrate() {
    if (typeof celebrate === 'function') {
        celebrate();
    } else {
        console.log('¡Celebración!');
    }
}