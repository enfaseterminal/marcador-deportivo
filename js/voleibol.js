// INICIALIZACIÓN - VERSIÓN CORREGIDA
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando voleibol...');
    
    // Cargar datos guardados
    if (typeof window.loadFromCookies === 'function') {
        window.loadFromCookies();
    }
    
    // Inicializar funciones de módulos comunes - SOLO UNA VEZ
    if (window.matchCore && window.matchCore.renderCurrentMatch) {
        window.matchCore.renderCurrentMatch();
    }
    if (window.matchCore && window.matchCore.renderMatchHistory) {
        window.matchCore.renderMatchHistory();
    }
    
    // INICIALIZAR EVENT LISTENERS UNA SOLA VEZ
    if (window.scoreManager && window.scoreManager.initScoreEventListeners) {
        window.scoreManager.initScoreEventListeners();
    }
    
    // Inicializar modalManager SOLO SI NO SE HA INICIALIZADO ANTES
    if (window.modalManager && window.modalManager.initModalEventListeners && 
        !window.modalManager.initialized) {
        window.modalManager.initModalEventListeners();
        window.modalManager.initialized = true; // Marcar como inicializado
    }
    
    // Inicializar common SOLO SI NO SE HA INICIALIZADO ANTES
    if (window.common && window.common.initCommonEventListeners && 
        !window.common.initialized) {
        window.common.initCommonEventListeners();
        window.common.initialized = true; // Marcar como inicializado
    }
    
    // Configurar botón "Nuevo Set" - COMENTAR ESTE BLOQUE COMPLETO
    /*
    const newSetBtn = document.getElementById('new-set');
    if (newSetBtn) {
        newSetBtn.addEventListener('click', () => {
            if (window.currentMatch.team1.score === 0 && window.currentMatch.team2.score === 0) {
                if (window.common && window.common.showNotification) {
                    window.common.showNotification("No hay puntos en el set actual. Agrega puntos antes de comenzar un nuevo set.", "warning");
                }
            } else {
                // En voleibol regular, abrir modal para guardar
                if (window.modalManager && window.modalManager.openSaveMatchModal) {
                    window.modalManager.openSaveMatchModal();
                }
            }
        });
    }
    */
    
    // Asignar funciones específicas al objeto global
    window.getTargetScore = getTargetScore;
    window.checkSetWin = checkSetWin;
    window.checkMatchWin = checkMatchWin;
    window.startNewSet = startNewSet;
    window.generateShareText = generateShareText;
    window.saveToCookies = saveToCookies;
    window.loadFromCookies = loadFromCookies;
    
    if (window.matchCore && window.matchCore.resetCurrentMatch) {
        window.resetCurrentMatch = window.matchCore.resetCurrentMatch;
    }
    
    // Eliminar el fallback manual si scoreManager ya está cargado
    if (window.scoreManager) {
        console.log('scoreManager cargado correctamente');
    } else {
        console.warn('scoreManager no está disponible');
    }
    
    console.log("Voleibol modular inicializado correctamente");
});
