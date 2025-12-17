// /js/storage.js
// Funciones para manejar almacenamiento con cookies

function saveToCookies(cookieName, data, expirationDays = 30) {
    const jsonData = JSON.stringify(data);
    const date = new Date();
    date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    
    document.cookie = `${cookieName}=${encodeURIComponent(jsonData)}; ${expires}; path=/`;
}

function loadFromCookies(cookieName) {
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
            return null;
        }
    }
    return null;
}

// Función para guardar ubicación
function saveLocation() {
    const matchLocationInput = document.getElementById('match-location-input');
    const currentLocationEl = document.getElementById('current-location');
    
    if (!matchLocationInput || !currentLocationEl) return;
    
    const location = matchLocationInput.value.trim();
    if (location) {
        if (window.currentMatch) {
            window.currentMatch.location = location;
        }
        currentLocationEl.textContent = location;
        
        if (typeof window.saveToCookies === 'function') {
            window.saveToCookies();
        }
        
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Ubicación guardada: ${location}`);
        }
        matchLocationInput.value = '';
    } else {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Por favor, ingresa una ubicación válida", "warning");
        }
    }
}

// Exportar funciones
window.storage = {
    saveToCookies,
    loadFromCookies,
    saveLocation
};
