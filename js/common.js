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

// CORRECCIÓN: Funciones para el modal de edición de nombres (COMPLETAMENTE FUNCIONAL)
function openTeamNameModal(team) {
    window.editingTeam = team;
    
    const teamNameModal = document.getElementById('team-name-modal');
    const teamNameInput = document.getElementById('team-name-input');
    
    if (!teamNameModal || !teamNameInput) {
        console.error('Modal de nombre no encontrado');
        return;
    }
    
    // Obtener el nombre actual del equipo
    const currentName = window.currentMatch[team].name || '';
    teamNameInput.value = currentName;
    
    // Mostrar el modal
    teamNameModal.style.display = 'flex';
    
    // Enfocar el input automáticamente
    setTimeout(() => {
        teamNameInput.focus();
        teamNameInput.select();
    }, 100);
}

function closeTeamNameModal() {
    const teamNameModal = document.getElementById('team-name-modal');
    if (teamNameModal) {
        teamNameModal.style.display = 'none';
    }
    window.editingTeam = null;
}

function saveTeamName() {
    const teamNameInput = document.getElementById('team-name-input');
    
    if (!teamNameInput || !window.editingTeam || !window.currentMatch) {
        console.error('Error: Elementos no encontrados');
        closeTeamNameModal();
        return;
    }
    
    const newName = teamNameInput.value.trim();
    if (newName !== '') {
        // Actualizar el nombre en el objeto currentMatch
        window.currentMatch[window.editingTeam].name = newName;
        
        // Actualizar en la interfaz usando updateDisplay (que está en futbol-sala.js)
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
        
        // Guardar en cookies si la función está disponible
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
        
        if (typeof showNotification === 'function') {
            showNotification(`Nombre cambiado a: ${newName}`);
        }
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

// Función para abrir modal de compartir historial
function openShareHistoryModal() {
    const shareModal = document.getElementById('share-modal');
    const shareTextEl = document.getElementById('share-text');
    const shareHistoryBtn = document.getElementById('share-history-btn');
    const modalTitle = document.getElementById('share-modal-title');
    const previewTitle = document.getElementById('share-preview-title');
    
    if (!shareModal || !shareTextEl || !modalTitle || !previewTitle) return;
    
    // Cambiar título del modal
    modalTitle.textContent = 'Compartir Historial (Fútbol Sala)';
    previewTitle.textContent = 'Vista previa del historial:';
    
    // Generar texto del historial
    let text = `⚽ HISTORIAL DE FÚTBOL SALA ⚽\n`;
    text += `📅 ${new Date().toLocaleDateString()} 🕒 ${new Date().toLocaleTimeString()}\n\n`;
    
    if (!window.matchHistory || window.matchHistory.length === 0) {
        text += `No hay partidos guardados.\n\n`;
    } else {
        text += `=== PARTIDOS GUARDADOS ===\n\n`;
        
        window.matchHistory.forEach((match, index) => {
            const matchDate = new Date(match.timestamp).toLocaleDateString();
            text += `PARTIDO ${index + 1}\n`;
            text += `Fecha: ${matchDate}\n`;
            text += `${match.team1.name} ${match.team1.score} - ${match.team2.score} ${match.team2.name}\n`;
            if (match.location && match.location !== "No especificada") {
                text += `📍 ${match.location}\n`;
            }
            if (match.duration) {
                text += `⏱️ ${match.duration} minutos\n`;
            }
            text += `\n---\n\n`;
        });
    }
    
    text += `📱 Generado con Marcador de Fútbol Sala - Liga Escolar\n`;
    text += `🔗 ${window.sportUrl || "https://www.ligaescolar.es/futbol-sala/"}`;
    
    shareTextEl.textContent = text;
    shareModal.style.display = 'flex';
    
    // Ocultar botón de compartir historial dentro del modal
    if (shareHistoryBtn) {
        shareHistoryBtn.style.display = 'none';
    }
}

// Función para abrir modal de compartir partido actual
function openShareCurrentModal() {
    const shareModal = document.getElementById('share-modal');
    const shareTextEl = document.getElementById('share-text');
    const shareHistoryBtn = document.getElementById('share-history-btn');
    const modalTitle = document.getElementById('share-modal-title');
    const previewTitle = document.getElementById('share-preview-title');
    
    if (!shareModal || !shareTextEl || !modalTitle || !previewTitle) return;
    
    // Cambiar título del modal
    modalTitle.textContent = 'Compartir Resultados (Fútbol Sala)';
    previewTitle.textContent = 'Vista previa del resultado:';
    
    // Generar texto usando la función específica del deporte
    if (typeof window.generateShareText === 'function') {
        shareTextEl.textContent = window.generateShareText();
    } else {
        // Texto por defecto si no hay función específica
        shareTextEl.textContent = 'No hay información disponible para compartir.';
    }
    
    shareModal.style.display = 'flex';
    
    // Mostrar botón de compartir historial dentro del modal
    if (shareHistoryBtn) {
        shareHistoryBtn.style.display = 'inline-block';
    }
}

// Funciones para compartir (comunes)
function openShareModal() {
    // Esta función ahora se usa para abrir el modal de compartir partido actual
    openShareCurrentModal();
}

function closeShareModal() {
    const shareModal = document.getElementById('share-modal');
    if (shareModal) shareModal.style.display = 'none';
}

function copyShareText() {
    const shareTextEl = document.getElementById('share-text');
    if (!shareTextEl) return;
    
    const text = shareTextEl.textContent;
    navigator.clipboard.writeText(text).then(() => {
        showNotification("Texto copiado al portapapeles. Puedes pegarlo en cualquier aplicación.");
    }).catch(err => {
        console.error('Error al copiar texto: ', err);
        showNotification("No se pudo copiar el texto. Intenta manualmente.", "error");
    });
}

function shareViaNative() {
    const shareTextEl = document.getElementById('share-text');
    if (!shareTextEl) return;
    
    const text = shareTextEl.textContent;
    const sportName = window.sportName || "Fútbol Sala";
    const sportUrl = window.sportUrl || "https://www.ligaescolar.es/futbol-sala/";
    
    if (navigator.share) {
        navigator.share({
            title: `Resultado de ${sportName} - Liga Escolar`,
            text: text,
            url: sportUrl
        }).then(() => {
            console.log('Contenido compartido exitosamente');
        }).catch((error) => {
            console.log('Error al compartir:', error);
            copyShareText();
        });
    } else {
        // Fallback para navegadores que no soportan la Web Share API
        copyShareText();
    }
}

function shareToWhatsapp() {
    let text;
    
    // Verificar si estamos en el modal de historial
    const modalTitle = document.getElementById('share-modal-title');
    const shareTextEl = document.getElementById('share-text');
    
    if (modalTitle && modalTitle.textContent.includes('Historial')) {
        // Usar el texto del modal de historial
        if (shareTextEl) {
            text = shareTextEl.textContent;
        } else {
            // Generar texto del historial si no hay elemento de texto
            text = `⚽ HISTORIAL DE FÚTBOL SALA ⚽\n`;
            text += `📅 ${new Date().toLocaleDateString()} 🕒 ${new Date().toLocaleTimeString()}\n\n`;
            
            if (!window.matchHistory || window.matchHistory.length === 0) {
                text += `No hay partidos guardados.\n\n`;
            } else {
                text += `=== PARTIDOS GUARDADOS ===\n\n`;
                
                window.matchHistory.forEach((match, index) => {
                    const matchDate = new Date(match.timestamp).toLocaleDateString();
                    text += `PARTIDO ${index + 1}\n`;
                    text += `Fecha: ${matchDate}\n`;
                    text += `${match.team1.name} ${match.team1.score} - ${match.team2.score} ${match.team2.name}\n`;
                    if (match.location && match.location !== "No especificada") {
                        text += `📍 ${match.location}\n`;
                    }
                    if (match.duration) {
                        text += `⏱️ ${match.duration} minutos\n`;
                    }
                    text += `\n---\n\n`;
                });
            }
            
            text += `📱 Generado con Marcador de Fútbol Sala - Liga Escolar\n`;
            text += `🔗 ${window.sportUrl || "https://www.ligaescolar.es/futbol-sala/"}`;
        }
    } else {
        // Compartir partido actual
        if (typeof window.generateShareText !== 'function') {
            text = 'No hay información disponible para compartir.';
        } else {
            text = window.generateShareText();
        }
    }
    
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
}

// Función para alternar entre compartir partido actual e historial dentro del modal
function toggleShareContent() {
    const modalTitle = document.getElementById('share-modal-title');
    if (!modalTitle) return;
    
    if (modalTitle.textContent.includes('Historial')) {
        openShareCurrentModal();
    } else {
        openShareHistoryModal();
    }
}

// CORRECCIÓN: Inicializar event listeners comunes (incluyendo el modal de nombres)
function initCommonEventListeners() {
    console.log('Inicializando common event listeners...');
    
    // Nombres de equipos (edición) - Asegurar que los listeners estén bien configurados
    const team1NameEl = document.getElementById('team1-name');
    const team2NameEl = document.getElementById('team2-name');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveNameBtn = document.getElementById('save-name');
    
    // Remover listeners previos si existen
    if (team1NameEl) {
        team1NameEl.removeEventListener('click', () => openTeamNameModal('team1'));
        team1NameEl.addEventListener('click', () => openTeamNameModal('team1'));
    }
    
    if (team2NameEl) {
        team2NameEl.removeEventListener('click', () => openTeamNameModal('team2'));
        team2NameEl.addEventListener('click', () => openTeamNameModal('team2'));
    }
    
    // CORRECCIÓN CRÍTICA: Asegurar que los botones del modal funcionen
    if (cancelEditBtn) {
        cancelEditBtn.removeEventListener('click', closeTeamNameModal);
        cancelEditBtn.addEventListener('click', closeTeamNameModal);
    }
    
    if (saveNameBtn) {
        saveNameBtn.removeEventListener('click', saveTeamName);
        saveNameBtn.addEventListener('click', saveTeamName);
    }
    
    // Compartir
    const shareCurrentBtn = document.getElementById('share-results');
    const shareHistoryBtn = document.getElementById('share-history');
    const shareWhatsappBtn = document.getElementById('share-whatsapp');
    const copyTextBtn = document.getElementById('copy-text');
    const shareNativeBtn = document.getElementById('share-native');
    const closeShareBtn = document.getElementById('close-share');
    const shareHistoryModalBtn = document.getElementById('share-history-btn');
    
    if (shareCurrentBtn) {
        shareCurrentBtn.removeEventListener('click', openShareCurrentModal);
        shareCurrentBtn.addEventListener('click', openShareCurrentModal);
    }
    
    if (shareHistoryBtn) {
        shareHistoryBtn.removeEventListener('click', openShareHistoryModal);
        shareHistoryBtn.addEventListener('click', openShareHistoryModal);
    }
    
    if (shareWhatsappBtn) {
        shareWhatsappBtn.removeEventListener('click', shareToWhatsapp);
        shareWhatsappBtn.addEventListener('click', shareToWhatsapp);
    }
    
    if (copyTextBtn) {
        copyTextBtn.removeEventListener('click', copyShareText);
        copyTextBtn.addEventListener('click', copyShareText);
    }
    
    if (shareNativeBtn) {
        shareNativeBtn.removeEventListener('click', shareViaNative);
        shareNativeBtn.addEventListener('click', shareViaNative);
    }
    
    if (closeShareBtn) {
        closeShareBtn.removeEventListener('click', closeShareModal);
        closeShareBtn.addEventListener('click', closeShareModal);
    }
    
    if (shareHistoryModalBtn) {
        shareHistoryModalBtn.removeEventListener('click', toggleShareContent);
        shareHistoryModalBtn.addEventListener('click', toggleShareContent);
    }
    
    // Ubicación
    const saveLocationBtn = document.getElementById('save-location');
    const matchLocationInput = document.getElementById('match-location-input');
    
    if (saveLocationBtn && typeof window.saveLocation === 'function') {
        saveLocationBtn.removeEventListener('click', window.saveLocation);
        saveLocationBtn.addEventListener('click', window.saveLocation);
    }
    
    if (matchLocationInput && typeof window.saveLocation === 'function') {
        matchLocationInput.removeEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.saveLocation();
        });
        matchLocationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.saveLocation();
        });
    }
    
    // También permitir cerrar modales haciendo clic fuera de ellos
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // Permitir cerrar con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                }
            });
        }
    });
    
    console.log('Common event listeners inicializados correctamente');
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
    openShareCurrentModal,
    openShareHistoryModal,
    toggleShareContent,
    initCommonEventListeners
};
