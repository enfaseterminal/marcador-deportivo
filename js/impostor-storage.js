// [file name]: impostor/js/impostor-storage.js
// Gestión de almacenamiento para el juego del impostor

const impostorStorage = {
    STORAGE_KEY: 'impostor_game_history',
    
    // Guardar partida
    saveGame(gameData) {
        let history = this.getHistory();
        
        // Añadir nueva partida al inicio
        history.unshift(gameData);
        
        // Mantener solo las últimas 50 partidas
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        // Guardar en localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        
        console.log('Partida guardada:', gameData);
        return true;
    },
    
    // Obtener historial
    getHistory() {
        try {
            const history = localStorage.getItem(this.STORAGE_KEY);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error al cargar historial:', error);
            return [];
        }
    },
    
    // Limpiar historial
    clearHistory() {
        localStorage.removeItem(this.STORAGE_KEY);
        return true;
    },
    
    // Exportar historial
    exportHistory() {
        const history = this.getHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `impostor_history_${new Date().getTime()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        return true;
    },
    
    // Importar historial
    importHistory(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    if (Array.isArray(importedData)) {
                        // Validar datos
                        const isValid = importedData.every(game => 
                            game.date && game.players && game.result);
                        
                        if (isValid) {
                            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(importedData));
                            resolve(true);
                        } else {
                            reject(new Error('Formato de archivo inválido'));
                        }
                    } else {
                        reject(new Error('El archivo no contiene un array de partidas'));
                    }
                } catch (error) {
                    reject(new Error('Error al procesar el archivo JSON'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error al leer el archivo'));
            };
            
            reader.readAsText(file);
        });
    }
};

// Hacer el almacenamiento accesible globalmente
window.impostorStorage = impostorStorage;
