/**
 * ads-analytics.js - Versión Corregida
 */

const GA_MEASUREMENT_ID = 'G-X1Y91HQML1'; 
const ADSENSE_PUB_ID = 'pub-4118238634514264'; 

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// 1. Verificar estado al cargar
const consentStatus = localStorage.getItem('cookie_consent_granted');

if (consentStatus === null) {
    gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
    });
}

// 2. Carga de Scripts
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
}

// 3. El Banner (Aseguramos que se vea)
function createCookieBanner() {
    if (localStorage.getItem('cookie_consent_granted') !== null) {
        if (localStorage.getItem('cookie_consent_granted') === 'true') {
            loadGoogleScripts();
        }
        createConfigButton();
        return;
    }

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    // Estilos de emergencia por si el CSS no carga
    banner.style.cssText = "position:fixed; bottom:20px; left:20px; right:20px; background:white; color:black; padding:20px; border-radius:12px; z-index:99999; box-shadow:0 0 20px rgba(0,0,0,0.5); border-left:8px solid #1a2a6c;";
    
    banner.innerHTML = `
        <div style="max-width:800px; margin:0 auto;">
            <p style="margin-bottom:15px; font-family:sans-serif;"><strong>Privacidad en Liga Escolar</strong><br>
            Usamos cookies para estadísticas y publicidad. ¿Aceptas su uso?</p>
            <button onclick="acceptCookies()" style="background:#1a2a6c; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold; margin-right:10px;">Aceptar todas</button>
            <button onclick="rejectCookies()" style="background:#eee; color:#333; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">Solo técnicas</button>
        </div>
    `;
    document.body.appendChild(banner);
}

// 4. Botón Flotante (Icono de Galleta)
function createConfigButton() {
    if (document.getElementById('cookie-settings-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'cookie-settings-btn';
    btn.innerHTML = '🍪'; 
    Object.assign(btn.style, {
        position: 'fixed', bottom: '20px', right: '20px', width: '45px', height: '45px',
        borderRadius: '50%', border: 'none', backgroundColor: '#1a2a6c', color: 'white',
        cursor: 'pointer', zIndex: '9999', fontSize: '20px'
    });
    btn.onclick = () => { localStorage.removeItem('cookie_consent_granted'); location.reload(); };
    document.body.appendChild(btn);
}

window.acceptCookies = () => { localStorage.setItem('cookie_consent_granted', 'true'); location.reload(); };
window.rejectCookies = () => { localStorage.setItem('cookie_consent_granted', 'false'); location.reload(); };

window.addEventListener('load', createCookieBanner);
