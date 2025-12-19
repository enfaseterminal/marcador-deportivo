// /js/common.js (VERSIÓN CORREGIDA COMPLETA)
// Funciones que son idénticas en todos los marcadores

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const notificationEl = document.getElementById('notification');
    const notificationTextEl = document.getElementById('notification-text');
    
    if (!notificationEl || !notificationTextEl) return;
    
    notificationTextEl.textContent = message;
    notificationEl.className = `notification ${type}`;
    notificationEl.style.display = 'flex';
    
    setTimeout(() => {
        notificationEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notificationEl.style.display = 'none';
            notificationEl.style.animation = '';
        }, 300);
    }, 3000);
}

// Funciones para manejar el estado de los botones
function disableScoreButtons() {
    const team1AddBtn = document.getElementById('team1-add');
    const team1RemoveBtn = document.getElementById('team1-remove');
    const team2AddBtn = document.getElementById('team2-add');
    const team2RemoveBtn = document.getElementById('team2-remove');
    
    if (team1AddBtn) team1AddBtn.disabled = true;
    if (team1RemoveBtn) team1RemoveBtn.disabled = true;
    if (team2AddBtn) team2AddBtn.disabled = true;
    if (team2RemoveBtn) team2RemoveBtn.disabled = true;
    
    if (team1AddBtn) team1AddBtn.classList.add('disabled');
    if (team1RemoveBtn) team1RemoveBtn.classList.add('disabled');
    if (team2AddBtn) team2AddBtn.classList.add('disabled');
    if (team2RemoveBtn) team2RemoveBtn.classList.add('disabled');
}

function enableScoreButtons() {
    const team1AddBtn = document.getElementById('team1-add');
    const team1RemoveBtn = document.getElementById('team1-remove');
    const team2AddBtn = document.getElementById('team2-add');
    const team2RemoveBtn = document.getElementById('team2-remove');
    
    if (team1AddBtn) team1AddBtn.disabled = false;
    if (team1RemoveBtn) team1RemoveBtn.disabled = false;
    if (team2AddBtn) team2AddBtn.disabled = false;
    if (team2RemoveBtn) team2RemoveBtn.disabled = false;
    
    if (team1AddBtn) team1AddBtn.classList.remove('disabled');
    if (team1RemoveBtn) team1RemoveBtn.classList.remove('disabled');
    if (team2AddBtn) team2AddBtn.classList.remove('disabled');
    if (team2RemoveBtn) team2RemoveBtn.classList.remove('disabled');
}

// Funciones para el modal de edición de nombres
function openTeamNameModal(team) {
    const teamNameModal = document.getElementById('team-name-modal');
    const teamNameInput = document.getElementById('team-name-input');
    
    if (!teamNameModal || !teamNameInput) return;
    
    window.editingTeam = team;
    teamNameInput.value = window.currentMatch ? window.currentMatch[team].name : '';
    teamNameModal.style.display = 'flex';
}

function closeTeamNameModal() {
    const teamNameModal = document.getElementById('team-name-modal');
    if (teamNameModal) teamNameModal.style.display = 'none';
    window.editingTeam = null;
}

function saveTeamName() {
    const teamNameInput = document.getElementById('team-name-input');
    
    if (!teamNameInput || !window.editingTeam || !window.currentMatch) return;
    
    const newName = teamNameInput.value.trim();
    if (newName !== '') {
        window.currentMatch[window.editingTeam].name = newName;
        
        // Actualizar en la interfaz usando matchCore
        if (window.matchCore && window.matchCore.renderCurrentMatch) {
            window.matchCore.renderCurrentMatch();
        }
        
        // Guardar en cookies si la función está disponible
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
        
        showNotification(`Nombre cambiado a: ${newName}`);
    }
    closeTeamNameModal();
}

// Función de renderizado de sets
function renderSets(container, setsWon, maxSets) {
    if (!container) return;
    
    container.innerHTML = '';
    for (let i = 0; i < maxSets; i++) {
        const setEl = document.createElement('div');
        setEl.className = 'set';
        if (i < setsWon) {
            setEl.classList.add('won');
        }
        setEl.textContent = i + 1;
        container.appendChild(setEl);
    }
}

// Funciones para compartir (comunes)
function openShareModal() {
    const shareModal = document.getElementById('share-modal');
    const shareTextEl = document.getElementById('share-text');
    
    if (!shareModal || !shareTextEl) return;
    
    // Generar texto usando la función específica del deporte
    if (typeof window.generateShareText === 'function') {
        shareTextEl.textContent = window.generateShareText();
    }
    shareModal.style.display = 'flex';
}

function closeShareModal() {
    const shareModal = document.getElementById('share-modal');
    if (shareModal) shareModal.style.display = 'none';
}

function copyShareText() {
    if (typeof window.generateShareText !== 'function') return;
    
    const text = window.generateShareText();
    navigator.clipboard.writeText(text).then(() => {
        showNotification("Texto copiado al portapapeles. Puedes pegarlo en cualquier aplicación.");
    }).catch(err => {
        console.error('Error al copiar texto: ', err);
        showNotification("No se pudo copiar el texto. Intenta manualmente.", "error");
    });
}

function shareViaNative() {
    if (typeof window.generateShareText !== 'function') return;
    
    const text = window.generateShareText();
    const sportName = window.sportName || "Deporte";
    const sportUrl = window.sportUrl || "https://www.ligaescolar.es/";
    
    if (navigator.share) {
        navigator.share({
            title: `Resultado de ${sportName} - Liga Escolar`,
            text: text,
            url: sportUrl
        }).then(() => {
            console.log('Contenido compartido exitosamente');
        }).catch((error) => {
            console.log('Error al compartir:', error);
        });
    } else {
        // Fallback para navegadores que no soportan la Web Share API
        copyShareText();
    }
}

function shareToWhatsapp() {
    if (typeof window.generateShareText !== 'function') return;
    
    const text = window.generateShareText();
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
}

// Inicializar event listeners comunes
function initCommonEventListeners() {
    // Evitar inicialización duplicada
    if (window.common && window.common.initialized) {
        console.log('Common event listeners ya inicializados');
        return;
    }
    
    console.log('Inicializando common event listeners...');
    
    // Nombres de equipos (edición)
    const team1NameEl = document.getElementById('team1-name');
    const team2NameEl = document.getElementById('team2-name');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveNameBtn = document.getElementById('save-name');
    
    if (team1NameEl) team1NameEl.addEventListener('click', () => openTeamNameModal('team1'));
    if (team2NameEl) team2NameEl.addEventListener('click', () => openTeamNameModal('team2'));
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeTeamNameModal);
    if (saveNameBtn) saveNameBtn.addEventListener('click', saveTeamName);
    
    // Compartir
    const shareResultsBtn = document.getElementById('share-results');
    const shareWhatsappBtn = document.getElementById('share-whatsapp');
    const copyTextBtn = document.getElementById('copy-text');
    const shareNativeBtn = document.getElementById('share-native');
    const closeShareBtn = document.getElementById('close-share');
    
    if (shareResultsBtn) shareResultsBtn.addEventListener('click', openShareModal);
    if (shareWhatsappBtn) shareWhatsappBtn.addEventListener('click', shareToWhatsapp);
    if (copyTextBtn) copyTextBtn.addEventListener('click', copyShareText);
    if (shareNativeBtn) shareNativeBtn.addEventListener('click', shareViaNative);
    if (closeShareBtn) closeShareBtn.addEventListener('click', closeShareModal);
    
    // Ubicación
    const saveLocationBtn = document.getElementById('save-location');
    const matchLocationInput = document.getElementById('match-location-input');
    
    if (saveLocationBtn && typeof window.saveLocation === 'function') {
        saveLocationBtn.addEventListener('click', window.saveLocation);
    }
    
    if (matchLocationInput && typeof window.saveLocation === 'function') {
        matchLocationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.saveLocation();
            }
        });
    }
    
    window.common.initialized = true; // Marcar como inicializado
    console.log('Common event listeners inicializados');
}

// Exportar funciones
window.common = {
    showNotification,
    disableScoreButtons,
    enableScoreButtons,
    openTeamNameModal,
    closeTeamNameModal,
    saveTeamName,
    renderSets,
    openShareModal,
    closeShareModal,
    copyShareText,
    shareViaNative,
    shareToWhatsapp,
    initCommonEventListeners,
    initialized: false // Bandera para evitar inicialización duplicada
};
