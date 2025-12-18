// /js/init.js
// Inicializador global para resolver problemas de dependencias

document.addEventListener('DOMContentLoaded', function() {
    // Verificar que todos los módulos estén cargados
    const modules = ['common', 'storage', 'matchCore', 'modalManager', 'scoreManager'];
    let missingModules = [];
    
    modules.forEach(module => {
        if (!window[module]) {
            missingModules.push(module);
        }
    });
    
    if (missingModules.length > 0) {
        console.error('Módulos faltantes:', missingModules);
        
        // Intentar cargar los módulos manualmente
        if (!window.common) {
            console.log('Cargando módulos comunes...');
            // Las funciones básicas ya deberían estar definidas
        }
    }
    
    // Inicializar funciones globales
    if (window.showNotification && !window.common?.showNotification) {
        window.common = window.common || {};
        window.common.showNotification = window.showNotification;
    }
    
    console.log('Sistema inicializado. Módulos disponibles:', 
        Object.keys(window).filter(key => 
            typeof window[key] === 'object' && 
            !key.startsWith('_') && 
            key !== 'window'
        )
    );
});
