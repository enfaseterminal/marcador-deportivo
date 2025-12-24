/**
 * Gestión Centralizada de Publicidad y Analítica - Liga Escolar
 * Incluye: Consent Mode v2, Google Analytics, AdSense y Botón de Configuración
 */

const GA_MEASUREMENT_ID = 'G-X1Y91HQML1'; 
const ADSENSE_PUB_ID = 'pub-4118238634514264'; 

// 1. Configuración de Consentimiento
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

if (!localStorage.getItem('cookie_consent_granted')) {
    gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
    });
}

// 2. Carga de Scripts de Google
function loadGoogleScripts() {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);

    const adsScript = document.createElement('script');
    adsScript.async = true;
    adsScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`;
    adsScript.crossOrigin = "anonymous";
    document.head.appendChild(adsScript);
    
    gtag('consent', 'update', {
        'ad_storage': 'granted',
        'analytics_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
    });
}

// 3. Crear Botón de Configuración (Icono de Galleta)
function createConfigButton() {
    if (document.getElementById('cookie-settings-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'cookie-settings-btn';
    btn.innerHTML = '<i class="fas fa-cookie-bite"></i>';
    btn.title = 'Configuración de Cookies';
    
    // Estilos para que combine con Liga Escolar
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: '#1a2a6c', // Azul oscuro de tu tema
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        zIndex: '9999',
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justify-content: 'center',
        transition: '0.3s'
    });

    btn.onclick = function() {
        localStorage.removeItem('cookie_consent_granted');
        location.reload(); 
    };

    document.body.appendChild(btn);
}

// 4. Crear Banner de Cookies
function createCookieBanner() {
    // Si ya existe una decisión, cargamos scripts y el botón de reset
    if (localStorage.getItem('cookie_consent_granted') !== null) {
        if (localStorage.getItem('cookie_consent_granted') === 'true') {
            loadGoogleScripts();
        }
        createConfigButton();
        return;
    }

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-content">
            <p><strong>Configuración de Cookies</strong><br>
            Usamos cookies para mejorar tu experiencia y mostrar publicidad. Puedes cambiar tu elección en cualquier momento.</p>
            <div class="cookie-buttons">
                <button onclick="acceptCookies()" class="btn-accept">Aceptar todas</button>
                <button onclick="rejectCookies()" class="btn-reject">Solo técnicas</button>
            </div>
        </div>
    `;
    document.body.appendChild(banner);
}

window.acceptCookies = function() {
    localStorage.setItem('cookie_consent_granted', 'true');
    location.reload(); 
};

window.rejectCookies = function() {
    localStorage.setItem('cookie_consent_granted', 'false');
    location.reload();
};

// Inicialización al cargar la página
window.addEventListener('DOMContentLoaded', createCookieBanner);
