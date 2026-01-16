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

// Función para abrir modal de compartir historial
function openShareHistoryModal() {
    const shareModal = document.getElementById('share-modal');
    const shareTextEl = document.getElementById('share-text');
    const shareHistoryBtn = document.getElementById('share-history-btn');
    const modalTitle = document.getElementById('share-modal-title');
    const previewTitle = document.getElementById('share-preview-title');
    
    if (!shareModal || !shareTextEl || !modalTitle || !previewTitle) return;
    
    // Cambiar título del modal
    modalTitle.textContent = 'Compartir Historial (Voleibol)';
    previewTitle.textContent = 'Vista previa del historial:';
    
    // Generar texto del historial
    let text = `🏐 HISTORIAL DE PARTIDOS DE VOLEIBOL 🏐\n`;
    text += `📅 ${new Date().toLocaleDateString()} 🕒 ${new Date().toLocaleTimeString()}\n\n`;
    
    if (window.matchHistory.length === 0) {
        text += `No hay partidos guardados.\n\n`;
    } else {
        text += `=== PARTIDOS GUARDADOS ===\n\n`;
        
        window.matchHistory.forEach((match, index) => {
            const matchDate = new Date(match.timestamp).toLocaleDateString();
            text += `PARTIDO ${index + 1}\n`;
            text += `Fecha: ${matchDate}\n`;
            text += `${match.team1.name} ${match.team1.sets} - ${match.team2.sets} ${match.team2.name}\n`;
            if (match.location && match.location !== "No especificada") {
                text += `📍 ${match.location}\n`;
            }
            if (match.duration) {
                text += `⏱️ ${match.duration} minutos\n`;
            }
            text += `\n---\n\n`;
        });
    }
    
    text += `📱 Generado con Marcador de Voleibol - Liga Escolar\n`;
    text += `🔗 ${window.sportUrl || "https://www.ligaescolar.es/voleibol/"}`;
    
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
    modalTitle.textContent = 'Compartir Resultados (Voleibol)';
    previewTitle.textContent = 'Vista previa del resultado:';
    
    // Generar texto usando la función específica del deporte
    if (typeof window.generateShareText === 'function') {
        shareTextEl.textContent = window.generateShareText();
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
            text = `🏐 HISTORIAL DE PARTIDOS DE VOLEIBOL 🏐\n`;
            text += `📅 ${new Date().toLocaleDateString()} 🕒 ${new Date().toLocaleTimeString()}\n\n`;
            
            if (window.matchHistory.length === 0) {
                text += `No hay partidos guardados.\n\n`;
            } else {
                text += `=== PARTIDOS GUARDADOS ===\n\n`;
                
                window.matchHistory.forEach((match, index) => {
                    const matchDate = new Date(match.timestamp).toLocaleDateString();
                    text += `PARTIDO ${index + 1}\n`;
                    text += `Fecha: ${matchDate}\n`;
                    text += `${match.team1.name} ${match.team1.sets} - ${match.team2.sets} ${match.team2.name}\n`;
                    if (match.location && match.location !== "No especificada") {
                        text += `📍 ${match.location}\n`;
                    }
                    if (match.duration) {
                        text += `⏱️ ${match.duration} minutos\n`;
                    }
                    text += `\n---\n\n`;
                });
            }
            
            text += `📱 Generado con Marcador de Voleibol - Liga Escolar\n`;
            text += `🔗 ${window.sportUrl || "https://www.ligaescolar.es/voleibol/"}`;
        }
    } else {
        // Compartir partido actual
        if (typeof window.generateShareText !== 'function') return;
        text = window.generateShareText();
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
    const shareCurrentBtn = document.getElementById('share-results');
    const shareHistoryBtn = document.getElementById('share-history');
    const shareWhatsappBtn = document.getElementById('share-whatsapp');
    const copyTextBtn = document.getElementById('copy-text');
    const shareNativeBtn = document.getElementById('share-native');
    const closeShareBtn = document.getElementById('close-share');
    const shareHistoryModalBtn = document.getElementById('share-history-btn');
    
    if (shareCurrentBtn) shareCurrentBtn.addEventListener('click', openShareCurrentModal);
    if (shareHistoryBtn) shareHistoryBtn.addEventListener('click', openShareHistoryModal);
    if (shareWhatsappBtn) shareWhatsappBtn.addEventListener('click', shareToWhatsapp);
    if (copyTextBtn) copyTextBtn.addEventListener('click', copyShareText);
    if (shareNativeBtn) shareNativeBtn.addEventListener('click', shareViaNative);
    if (closeShareBtn) closeShareBtn.addEventListener('click', closeShareModal);
    if (shareHistoryModalBtn) shareHistoryModalBtn.addEventListener('click', toggleShareContent);
    
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

// Función para mostrar ayuda
function showHelp() {
    const helpModal = document.createElement('div');
    helpModal.id = 'help-modal';
    helpModal.className = 'modal';
    helpModal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-question-circle"></i> Ayuda y Reglas</h2>
            <div style="text-align: left; line-height: 1.6;">
                <p><strong>Instrucciones básicas:</strong></p>
                <ul>
                    <li>Haz clic en los nombres de los equipos para cambiarlos</li>
                    <li>Usa los botones + y - para modificar las puntuaciones</li>
                    <li>Los partidos se guardan automáticamente</li>
                    <li>Revisa el historial para ver partidos anteriores</li>
                </ul>
                <p><strong>Reglas específicas del deporte:</strong></p>
                <p>Consulta las reglas oficiales en la normativa correspondiente a tu deporte.</p>
                <p><strong>Soporte:</strong> Para más ayuda, contacta con el administrador de la Liga Escolar.</p>
            </div>
            <div class="modal-buttons">
                <button class="btn btn-primary" onclick="closeHelpModal()">Cerrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(helpModal);
    helpModal.style.display = 'flex';
}

// Función para cerrar el modal de ayuda
function closeHelpModal() {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.remove();
    }
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
    showHelp,
    closeHelpModal,
    initCommonEventListeners,
    initialized: false // Bandera para evitar inicialización duplicada
};
