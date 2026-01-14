// /js/storage.js - VERSIÓN MEJORADA
// Funciones para manejar almacenamiento con cookies y localStorage

function saveToCookies(cookieName, data, expirationDays = 30) {
    const jsonData = JSON.stringify(data);
    const date = new Date();
    date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    
    document.cookie = `${cookieName}=${encodeURIComponent(jsonData)}; ${expires}; path=/; SameSite=Lax`;
    
    // También guardar en localStorage como backup
    try {
        localStorage.setItem(cookieName, jsonData);
    } catch (e) {
        console.warn('No se pudo guardar en localStorage:', e);
    }
}

function loadFromCookies(cookieName) {
    // Primero intentar con cookies
    const cookies = document.cookie.split(';');
    let cookieValue = null;
    
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === cookieName) {
            cookieValue = value;
            break;
        }
    }
    
    if (cookieValue) {
        try {
            return JSON.parse(decodeURIComponent(cookieValue));
        } catch (e) {
            console.error(`Error al cargar datos de cookies para ${cookieName}:`, e);
        }
    }
    
    // Fallback a localStorage
    try {
        const localData = localStorage.getItem(cookieName);
        if (localData) {
            return JSON.parse(localData);
        }
    } catch (e) {
        console.error(`Error al cargar datos de localStorage para ${cookieName}:`, e);
    }
    
    return null;
}

function deleteCookie(cookieName) {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    // También eliminar de localStorage
    try {
        localStorage.removeItem(cookieName);
    } catch (e) {
        console.warn('No se pudo eliminar de localStorage:', e);
    }
}

// Función para guardar ubicación específica para fútbol sala
function saveLocation() {
    const matchLocationInput = document.getElementById('match-location-input');
    const currentLocationEl = document.getElementById('current-location');
    
    if (!matchLocationInput || !currentLocationEl) return;
    
    const location = matchLocationInput.value.trim();
    if (location) {
        if (window.currentMatch) {
            window.currentMatch.location = location;
            
            // Si existe saveState, llamarlo
            if (typeof window.saveState === 'function') {
                window.saveState();
            }
        }
        
        currentLocationEl.textContent = location;
        
        // Guardar en cookies independiente
        saveToCookies('futsal_location', { location: location, timestamp: new Date().toISOString() });
        
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Ubicación guardada: ${location}`, 'success');
        }
        
        matchLocationInput.value = '';
        matchLocationInput.blur();
    } else {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Por favor, ingresa una ubicación válida", "warning");
        }
    }
}

// Función para cargar ubicación guardada
function loadSavedLocation() {
    const savedLocation = loadFromCookies('futsal_location');
    const currentLocationEl = document.getElementById('current-location');
    
    if (savedLocation && savedLocation.location && currentLocationEl) {
        currentLocationEl.textContent = savedLocation.location;
        
        if (window.currentMatch) {
            window.currentMatch.location = savedLocation.location;
        }
    }
}

// Función para limpiar todo el almacenamiento del deporte
function clearSportStorage() {
    // Cookies
    deleteCookie('futsal_match');
    deleteCookie('futsal_history');
    deleteCookie('futsal_location');
    
    // localStorage
    try {
        localStorage.removeItem('futsal_match');
        localStorage.removeItem('futsal_history');
        localStorage.removeItem('futsal_location');
    } catch (e) {
        console.warn('Error al limpiar localStorage:', e);
    }
    
    console.log('Almacenamiento de fútbol sala limpiado');
}

// Backup automático cada 30 segundos si hay cambios
let lastBackupTime = 0;
const BACKUP_INTERVAL = 30000; // 30 segundos

function autoBackup() {
    const now = Date.now();
    
    if (now - lastBackupTime > BACKUP_INTERVAL && window.currentMatch) {
        try {
            saveToCookies('futsal_backup', {
                match: window.currentMatch,
                history: window.matchHistory || [],
                timestamp: new Date().toISOString()
            }, 7); // Expira en 7 días
            
            lastBackupTime = now;
            console.log('Backup automático realizado');
        } catch (e) {
            console.error('Error en backup automático:', e);
        }
    }
}

// Iniciar backup automático
setInterval(autoBackup, 10000); // Verificar cada 10 segundos

// Cargar desde backup si no hay datos actuales
function restoreFromBackup() {
    const backup = loadFromCookies('futsal_backup');
    
    if (backup && backup.match) {
        // Verificar si el backup es más reciente que los datos actuales
        const currentMatch = loadFromCookies('futsal_match');
        
        if (!currentMatch || (backup.timestamp > currentMatch.timestamp)) {
            console.log('Restaurando desde backup...');
            
            if (confirm('Se encontró un backup reciente. ¿Restaurar los datos?')) {
                window.currentMatch = backup.match;
                window.matchHistory = backup.history || [];
                
                // Guardar en almacenamiento principal
                saveToCookies('futsal_match', window.currentMatch);
                saveToCookies('futsal_history', window.matchHistory);
                
                location.reload();
            }
        }
    }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    loadSavedLocation();
    
    // Intentar restaurar desde backup después de 2 segundos
    setTimeout(restoreFromBackup, 2000);
});

// Exportar funciones
window.storage = {
    saveToCookies,
    loadFromCookies,
    deleteCookie,
    saveLocation,
    loadSavedLocation,
    clearSportStorage,
    autoBackup,
    restoreFromBackup
};

// Hacer funciones globales
window.saveLocation = saveLocation;
window.loadSavedLocation = loadSavedLocation;
