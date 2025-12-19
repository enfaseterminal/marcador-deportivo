// /js/modal-manager.js
// Gestión de modales para guardar partidos

function openSaveMatchModal() {
    const saveMatchModal = document.getElementById('save-match-modal');
    const saveMatchResultEl = document.getElementById('save-match-result');
    const saveMatchLocationEl = document.getElementById('save-match-location');
    const cancelSaveBtn = document.getElementById('cancel-save');
    
    if (!saveMatchModal || !saveMatchResultEl || !saveMatchLocationEl) return;
    
    // Mostrar el resultado en el modal
    if (window.currentMatch) {
        saveMatchResultEl.textContent = `${window.currentMatch.team1.name} ${window.currentMatch.team1.sets} - ${window.currentMatch.team2.sets} ${window.currentMatch.team2.name}`;
        saveMatchLocationEl.textContent = window.currentMatch.location;
    }
    
    // Si se completó el partido, forzar guardado y ocultar botón cancelar
    if (typeof window.savingMatchAfterWin !== 'undefined' && window.savingMatchAfterWin) {
        if (cancelSaveBtn) cancelSaveBtn.style.display = 'none';
        
        // Mostrar mensaje explicativo
        const message = document.createElement('p');
        message.textContent = "Partido finalizado. Debes guardar para continuar.";
        message.style.color = '#4CAF50';
        message.style.marginTop = '10px';
        message.style.fontWeight = 'bold';
        message.className = 'force-save-message';
        
        // Asegurarse de que no se añada múltiples veces
        const modalContent = saveMatchModal.querySelector('.modal-content');
        const existingMessage = modalContent.querySelector('.force-save-message');
        if (!existingMessage && modalContent) {
            modalContent.appendChild(message);
        }
    } else {
        if (cancelSaveBtn) cancelSaveBtn.style.display = 'block';
        // Remover mensaje si existe
        const existingMessage = document.querySelector('.force-save-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }
    
    saveMatchModal.style.display = 'flex';
}

function closeSaveMatchModal() {
    const saveMatchModal = document.getElementById('save-match-modal');
    
    // Si se completó el partido, no permitir cerrar el modal sin guardar
    if (typeof window.savingMatchAfterWin !== 'undefined' && window.savingMatchAfterWin) {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Debes guardar el partido para continuar.", "warning");
        }
        return;
    }
    
    if (saveMatchModal) saveMatchModal.style.display = 'none';
    if (typeof window.savingMatchAfterWin !== 'undefined') {
        window.savingMatchAfterWin = false;
    }
}

function saveCurrentMatch() {
    if (!window.currentMatch || !window.matchHistory) return;
    
    const now = new Date();
    const matchData = {
        team1: {...window.currentMatch.team1},
        team2: {...window.currentMatch.team2},
        currentSet: window.currentMatch.currentSet,
        setHistory: window.currentMatch.setHistory ? [...window.currentMatch.setHistory] : [],
        winner: window.currentMatch.winner,
        location: window.currentMatch.location,
        date: now.toLocaleString(),
        timestamp: now.getTime(),
        duration: Math.round((now - window.currentMatch.startTime) / 1000 / 60) // Duración en minutos
    };
    
    // Añadir información del deporte si está definida
    if (typeof window.sportName !== 'undefined') {
        matchData.sport = window.sportName;
    }
    
    window.matchHistory.unshift(matchData);
    
    // Mantener solo los últimos 20 partidos
    if (window.matchHistory.length > 20) {
        window.matchHistory = window.matchHistory.slice(0, 20);
    }
    
    if (typeof window.renderMatchHistory === 'function') {
        window.renderMatchHistory();
    }
    
    if (typeof window.saveToCookies === 'function') {
        window.saveToCookies();
    }
    
    // Cerrar el modal
    closeSaveMatchModal();
    
    // Mostrar notificación
    if (typeof window.showNotification === 'function') {
        window.showNotification("Partido guardado correctamente en el historial");
    }
    
    // Si se estaba guardando después de completar el partido, reiniciar
    if (typeof window.savingMatchAfterWin !== 'undefined' && window.savingMatchAfterWin) {
        setTimeout(() => {
            if (typeof window.performReset === 'function') {
                window.performReset();
            }
            window.savingMatchAfterWin = false;
        }, 500);
    }
}

function clearMatchHistory() {
    if (!window.matchHistory) return;
    
    const sportName = window.sportName || "deporte";
    if (confirm(`¿Estás seguro de que quieres borrar todo el historial de partidos de ${sportName}?`)) {
        window.matchHistory = [];
        
        if (typeof window.renderMatchHistory === 'function') {
            window.renderMatchHistory();
        }
        
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
        
        if (typeof window.showNotification === 'function') {
            window.showNotification("Historial de partidos borrado correctamente");
        }
    }
}

// Inicializar event listeners de modales
function initModalEventListeners() {
    // Evitar inicialización duplicada
    if (window.modalManager && window.modalManager.initialized) {
        console.log('Modal event listeners ya inicializados');
        return;
    }
    
    console.log('Inicializando modal event listeners...');
    
    const cancelSaveBtn = document.getElementById('cancel-save');
    const confirmSaveBtn = document.getElementById('confirm-save');
    const clearHistoryBtn = document.getElementById('clear-history');
    const newSetBtn = document.getElementById('new-set');
    const resetMatchBtn = document.getElementById('reset-match');
    const saveMatchBtn = document.getElementById('save-match');
    
    // Remover event listeners previos si existen
    if (cancelSaveBtn) cancelSaveBtn.removeEventListener('click', closeSaveMatchModal);
    if (confirmSaveBtn) confirmSaveBtn.removeEventListener('click', saveCurrentMatch);
    if (clearHistoryBtn) clearHistoryBtn.removeEventListener('click', clearMatchHistory);
    if (newSetBtn) newSetBtn.removeEventListener('click', handleNewSet);
    if (resetMatchBtn) resetMatchBtn.removeEventListener('click', window.resetCurrentMatch);
    if (saveMatchBtn) saveMatchBtn.removeEventListener('click', openSaveMatchModal);
    
    // Agregar event listeners
    if (cancelSaveBtn) cancelSaveBtn.addEventListener('click', closeSaveMatchModal);
    if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', saveCurrentMatch);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearMatchHistory);
    
    if (resetMatchBtn && typeof window.resetCurrentMatch === 'function') {
        resetMatchBtn.addEventListener('click', window.resetCurrentMatch);
    }
    
    if (saveMatchBtn) saveMatchBtn.addEventListener('click', openSaveMatchModal);
    
    // Función para manejar nuevo set
    function handleNewSet() {
        if (!window.currentMatch) return;
        
        if (window.currentMatch.team1.score === 0 && window.currentMatch.team2.score === 0) {
            if (typeof window.showNotification === 'function') {
                window.showNotification("No hay puntos en el set actual. Agrega puntos antes de comenzar un nuevo set.", "warning");
            }
        } else {
            if (typeof window.forceEndCurrentSet === 'function') {
                window.forceEndCurrentSet();
            } else {
                openSaveMatchModal();
            }
        }
    }
    
    if (newSetBtn) {
        newSetBtn.addEventListener('click', handleNewSet);
    }
    
    window.modalManager.initialized = true; // Marcar como inicializado
    console.log('Modal event listeners inicializados');
}

// Exportar funciones
window.modalManager = {
    openSaveMatchModal,
    closeSaveMatchModal,
    saveCurrentMatch,
    clearMatchHistory,
    initModalEventListeners,
    initialized: false // AÑADIR ESTA PROPIEDAD
};
