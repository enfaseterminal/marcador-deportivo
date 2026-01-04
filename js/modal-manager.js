// /js/modal-manager.js
// Gestión de modales para guardar partidos - VERSIÓN ACTUALIZADA CON TARJETAS

function openSaveMatchModal() {
    const saveMatchModal = document.getElementById('save-match-modal');
    const saveMatchResultEl = document.getElementById('save-match-result');
    const saveMatchLocationEl = document.getElementById('save-match-location');
    const saveMatchDurationEl = document.getElementById('save-match-duration');
    const cancelSaveBtn = document.getElementById('cancel-save');
    
    if (!saveMatchModal || !saveMatchResultEl || !saveMatchLocationEl) return;
    
    // Mostrar el resultado en el modal
    if (window.currentMatch) {
        saveMatchResultEl.textContent = `${window.currentMatch.team1.name} ${window.currentMatch.team1.score} - ${window.currentMatch.team2.score} ${window.currentMatch.team2.name}`;
        saveMatchLocationEl.textContent = window.currentMatch.location;
        
        // Calcular duración
        const now = new Date();
        const duration = Math.round((now - window.currentMatch.startTime) / 1000 / 60);
        if (saveMatchDurationEl) {
            saveMatchDurationEl.textContent = `${duration} minutos`;
        }
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
    
    if (saveMatchModal) {
        saveMatchModal.style.display = 'none';
    }
    
    // Limpiar el estado de guardado después de victoria
    if (typeof window.savingMatchAfterWin !== 'undefined') {
        window.savingMatchAfterWin = false;
    }
    
    // Remover mensaje si existe
    const existingMessage = document.querySelector('.force-save-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// Función específica para guardar partido de fútbol sala
function saveFutbolSalaMatch() {
    if (!window.currentMatch || !window.matchHistory) return;
    
    // Deshabilitar el botón para evitar múltiples clics
    const confirmSaveBtn = document.getElementById('confirm-save');
    if (confirmSaveBtn) {
        confirmSaveBtn.disabled = true;
        confirmSaveBtn.textContent = 'Guardando...';
    }
    
    const now = new Date();
    const duration = Math.round((now - window.currentMatch.startTime) / 1000 / 60);
    
    // Crear copia profunda del partido para guardar
    const matchData = {
        team1: {
            name: window.currentMatch.team1.name,
            score: window.currentMatch.team1.score,
            timeouts: window.currentMatch.team1.timeouts,
            fouls: window.currentMatch.team1.fouls,
            yellowCards: [...window.currentMatch.team1.yellowCards],
            blueCards: [...window.currentMatch.team1.blueCards],
            expulsions: [...window.currentMatch.team1.expulsions]
        },
        team2: {
            name: window.currentMatch.team2.name,
            score: window.currentMatch.team2.score,
            timeouts: window.currentMatch.team2.timeouts,
            fouls: window.currentMatch.team2.fouls,
            yellowCards: [...window.currentMatch.team2.yellowCards],
            blueCards: [...window.currentMatch.team2.blueCards],
            expulsions: [...window.currentMatch.team2.expulsions]
        },
        currentPeriod: window.currentMatch.currentPeriod,
        isOvertime: window.currentMatch.isOvertime,
        matchStatus: window.currentMatch.matchStatus,
        winner: window.currentMatch.winner,
        location: window.currentMatch.location,
        date: now.toLocaleString(),
        timestamp: now.getTime(),
        duration: duration,
        events: [...window.currentMatch.events]
    };
    
    // Añadir información del deporte
    if (typeof window.sportName !== 'undefined') {
        matchData.sport = window.sportName;
    }
    
    window.matchHistory.unshift(matchData);
    
    // Mantener solo los últimos 20 partidos
    if (window.matchHistory.length > 20) {
        window.matchHistory = window.matchHistory.slice(0, 20);
    }
    
    // Renderizar historial usando matchCore
    if (typeof window.matchCore?.renderMatchHistory === 'function') {
        window.matchCore.renderMatchHistory();
    }
    
    if (typeof window.saveToCookies === 'function') {
        window.saveToCookies();
    }
    
    // Cerrar el modal
    closeSaveMatchModal();
    
    // Restaurar el botón
    if (confirmSaveBtn) {
        setTimeout(() => {
            confirmSaveBtn.disabled = false;
            confirmSaveBtn.textContent = 'Guardar Partido';
        }, 1000);
    }
    
    // Mostrar notificación
    if (typeof window.showNotification === 'function') {
        window.showNotification("Partido guardado correctamente en el historial");
    }
    
    // Si se estaba guardando después de completar el partido, reiniciar
    if (typeof window.savingMatchAfterWin !== 'undefined' && window.savingMatchAfterWin) {
        setTimeout(() => {
            if (typeof window.resetMatch === 'function') {
                window.resetMatch();
            }
            window.savingMatchAfterWin = false;
        }, 1000);
    }
}

function clearMatchHistory() {
    if (!window.matchHistory) return;
    
    const sportName = window.sportName || "fútbol sala";
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
    const resetMatchBtn = document.getElementById('reset-match');
    const saveMatchBtn = document.getElementById('save-match');
    
    // Remover event listeners previos si existen
    if (cancelSaveBtn) cancelSaveBtn.removeEventListener('click', closeSaveMatchModal);
    if (confirmSaveBtn) confirmSaveBtn.removeEventListener('click', saveFutbolSalaMatch);
    if (clearHistoryBtn) clearHistoryBtn.removeEventListener('click', clearMatchHistory);
    if (resetMatchBtn) resetMatchBtn.removeEventListener('click', window.resetCurrentMatch);
    if (saveMatchBtn) saveMatchBtn.removeEventListener('click', openSaveMatchModal);
    
    // Agregar event listeners
    if (cancelSaveBtn) cancelSaveBtn.addEventListener('click', closeSaveMatchModal);
    if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', saveFutbolSalaMatch);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearMatchHistory);
    
    if (resetMatchBtn && typeof window.resetCurrentMatch === 'function') {
        resetMatchBtn.addEventListener('click', window.resetCurrentMatch);
    }
    
    if (saveMatchBtn) saveMatchBtn.addEventListener('click', openSaveMatchModal);
    
    window.modalManager.initialized = true; // Marcar como inicializado
    console.log('Modal event listeners inicializados');
}

// Exportar funciones
window.modalManager = {
    openSaveMatchModal,
    closeSaveMatchModal,
    saveCurrentMatch: saveFutbolSalaMatch, // Alias para compatibilidad
    saveFutbolSalaMatch,
    clearMatchHistory,
    initModalEventListeners,
    initialized: false
};
