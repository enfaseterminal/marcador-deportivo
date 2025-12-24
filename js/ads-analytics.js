/**
 * ads-analytics.js - Versión Robusta
 */

const GA_MEASUREMENT_ID = 'G-X1Y91HQML1'; 
const ADSENSE_PUB_ID = 'pub-4118238634514264'; 

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// 1. CARGA DE SCRIPTS (Solo se llama tras aceptar)
function loadGoogleScripts() {
    console.log("Cargando servicios de Google...");
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
        'analytics_storage': 'granted'
    });
}

// 2. CREAR EL BANNER
function createCookieBanner() {
    const consent = localStorage.getItem('cookie_consent_granted');
    
    // Si ya aceptó, cargar scripts y mostrar botón de ajustes
    if (consent === 'true') {
        loadGoogleScripts();
        createConfigButton();
        return;
    }
    
    // Si ya rechazó, solo mostrar botón de ajustes
    if (consent === 'false') {
        createConfigButton();
        return;
    }

    // Si no hay decisión, mostrar banner
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.style.cssText = "position:fixed; bottom:20px; left:20px; right:20px; background:white; color:#333; padding:20px; border-radius:12px; z-index:999999; box-shadow:0 10px 30px rgba(0,0,0,0.5); border-left:8px solid #1a2a6c; display:flex; flex-direction:column; align-items:center; text-align:center; font-family: sans-serif;";
    
    banner.innerHTML = `
        <div style="margin-bottom:15px;">
            <strong style="font-size:18px; color:#1a2a6c;">Privacidad en Liga Escolar</strong><br>
            <p style="margin-top:10px; font-size:14px;">Utilizamos cookies para analizar el tráfico y mostrar anuncios. ¿Permites su uso?</p>
        </div>
        <div style="display:flex; gap:10px;">
            <button onclick="acceptCookies()" style="background:#1a2a6c; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">Aceptar todas</button>
            <button onclick="rejectCookies()" style="background:#eee; color:#333; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">Solo técnicas</button>
        </div>
    `;
    document.body.appendChild(banner);
}

// 3. BOTÓN FLOTANTE (🍪)
function createConfigButton() {
    if (document.getElementById('cookie-settings-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'cookie-settings-btn';
    btn.innerHTML = '🍪'; 
    Object.assign(btn.style, {
        position: 'fixed', bottom: '20px', right: '20px', width: '45px', height: '45px',
        borderRadius: '50%', border: 'none', backgroundColor: '#1a2a6c', color: 'white',
        cursor: 'pointer', zIndex: '99999', fontSize: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    });
    btn.onclick = () => {
        localStorage.removeItem('cookie_consent_granted');
        location.reload();
    };
    document.body.appendChild(btn);
}

// 4. FUNCIONES DE ACCIÓN
window.acceptCookies = () => {
    localStorage.setItem('cookie_consent_granted', 'true');
    location.reload();
};

window.rejectCookies = () => {
    localStorage.setItem('cookie_consent_granted', 'false');
    location.reload();
};

// 5. INICIO (Usamos 'load' para asegurar que el DOM esté listo)
window.addEventListener('load', createCookieBanner);
