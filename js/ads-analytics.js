/**
 * Gestión Centralizada de Publicidad y Analítica - Liga Escolar
 * Cumple con RGPD y Google Consent Mode v2
 */

// 1. CONFIGURACIÓN - REEMPLAZA CON TUS DATOS
const GA_MEASUREMENT_ID = 'G-X1Y91HQML1'; // Tu ID de Analytics
const ADSENSE_PUB_ID = 'pub-4118238634514264'; // Tu ID de AdSense

// 2. CONSENT MODE POR DEFECTO (Bloqueo inicial)
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

// 3. FUNCIÓN PARA CARGAR LOS SCRIPTS DE GOOGLE
function loadGoogleScripts() {
    // Cargar Google Analytics
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);

    // Cargar Google AdSense
    const adsScript = document.createElement('script');
    adsScript.async = true;
    adsScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`;
    adsScript.crossOrigin = "anonymous";
    document.head.appendChild(adsScript);
    
    // Actualizar consentimiento a concedido
    gtag('consent', 'update', {
        'ad_storage': 'granted',
        'analytics_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
    });
}

// 4. CREACIÓN DINÁMICA DEL BANNER DE COOKIES
function createCookieBanner() {
    if (localStorage.getItem('cookie_consent_granted')) {
        loadGoogleScripts(); // Si ya aceptó antes, cargar scripts directamente
        return;
    }

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-content">
            <p><strong>Configuración de Cookies</strong><br>
            Utilizamos cookies propias para el funcionamiento de la web y de terceros (Google) para analizar el tráfico y mostrar publicidad personalizada según tus hábitos de navegación.</p>
            <div class="cookie-buttons">
                <button onclick="acceptCookies()" class="btn-accept">Aceptar todas</button>
                <button onclick="rejectCookies()" class="btn-reject">Solo técnicas</button>
            </div>
        </div>
    `;
    document.body.appendChild(banner);
}

// 5. ACCIONES DEL BANNER
window.acceptCookies = function() {
    localStorage.setItem('cookie_consent_granted', 'true');
    document.getElementById('cookie-banner').remove();
    loadGoogleScripts();
};

window.rejectCookies = function() {
    localStorage.setItem('cookie_consent_granted', 'false');
    document.getElementById('cookie-banner').remove();
    // No cargamos los scripts de Google, solo se mantienen las locales técnicas
};

// Iniciar al cargar la página
window.addEventListener('DOMContentLoaded', createCookieBanner);

// Función para crear el botón flotante de configuración
function createConfigButton() {
    // Si ya existe, no crearlo de nuevo
    if (document.getElementById('cookie-settings-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'cookie-settings-btn';
    btn.innerHTML = '<i class="fas fa-cookie-bite"></i>';
    btn.title = 'Configuración de Cookies';
    
    // Estilos inline para asegurar visibilidad (o puedes moverlo a base.css)
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: '#1a2a6c',
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
        location.reload(); // Recarga para resetear scripts y mostrar banner
    };

    document.body.appendChild(btn);
}

// Modificamos la función createCookieBanner existente para llamar al botón
const originalCreateBanner = createCookieBanner;
createCookieBanner = function() {
    originalCreateBanner();
    createConfigButton();
};
