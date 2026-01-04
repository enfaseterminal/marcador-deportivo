// impostor/js/impostor-storage.js
// Gestión de almacenamiento para el juego del impostor - VERSIÓN MEJORADA

const impostorStorage = {
    STORAGE_KEY: 'impostor_game_history',
    SETTINGS_KEY: 'impostor_settings',
    CUSTOM_WORDS_KEY: 'impostor_custom_words',
    
    // Guardar partida
    saveGame(gameData) {
        try {
            let history = this.getHistory();
            
            // Añadir ID único y timestamp si no los tiene
            if (!gameData.id) {
                gameData.id = 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            if (!gameData.timestamp) {
                gameData.timestamp = Date.now();
            }
            
            // Añadir nueva partida al inicio
            history.unshift(gameData);
            
            // Mantener solo las últimas 50 partidas
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            // Guardar en localStorage
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
            
            console.log('Partida guardada:', gameData);
            return { success: true, id: gameData.id };
            
        } catch (error) {
            console.error('Error al guardar partida:', error);
            return { success: false, error: error.message };
        }
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
    
    // Obtener partida por ID
    getGameById(gameId) {
        try {
            const history = this.getHistory();
            return history.find(game => game.id === gameId) || null;
        } catch (error) {
            console.error('Error al buscar partida:', error);
            return null;
        }
    },
    
    // Eliminar partida
    deleteGame(gameId) {
        try {
            let history = this.getHistory();
            const initialLength = history.length;
            
            history = history.filter(game => game.id !== gameId);
            
            if (history.length !== initialLength) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
                return { success: true, deleted: true };
            }
            
            return { success: true, deleted: false, message: 'Partida no encontrada' };
            
        } catch (error) {
            console.error('Error al eliminar partida:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Limpiar historial
    clearHistory() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return { success: true };
        } catch (error) {
            console.error('Error al limpiar historial:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Guardar configuración
    saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            return { success: true };
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Cargar configuración
    loadSettings() {
        try {
            const settings = localStorage.getItem(this.SETTINGS_KEY);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Error al cargar configuración:', error);
            return null;
        }
    },
    
    // Exportar historial a JSON
    exportHistory() {
        try {
            const history = this.getHistory();
            const dataStr = JSON.stringify(history, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `impostor_history_${new Date().getTime()}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            return { success: true, filename: exportFileDefaultName };
            
        } catch (error) {
            console.error('Error al exportar historial:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Importar historial desde archivo
    importHistory(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    if (Array.isArray(importedData)) {
                        // Validar datos básicos
                        const isValid = importedData.every(game => 
                            game.date && (game.players || game.result)
                        );
                        
                        if (isValid) {
                            // Combinar con historial existente
                            const currentHistory = this.getHistory();
                            const combinedHistory = [...importedData, ...currentHistory];
                            
                            // Mantener solo las últimas 50
                            const finalHistory = combinedHistory.slice(0, 50);
                            
                            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(finalHistory));
                            resolve({ 
                                success: true, 
                                imported: importedData.length,
                                total: finalHistory.length 
                            });
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
    },
    
    // Obtener estadísticas
    getStatistics() {
        try {
            const history = this.getHistory();
            
            if (history.length === 0) {
                return {
                    totalGames: 0,
                    innocentWins: 0,
                    impostorWins: 0,
                    winRateInnocent: 0,
                    winRateImpostor: 0,
                    averagePlayers: 0,
                    mostUsedWord: null
                };
            }
            
            let innocentWins = 0;
            let impostorWins = 0;
            let totalPlayers = 0;
            const wordCount = {};
            
            history.forEach(game => {
                if (game.result) {
                    if (game.result.includes('Ciudadano') || game.result.includes('Inocente')) {
                        innocentWins++;
                    } else if (game.result.includes('Impostor')) {
                        impostorWins++;
                    }
                }
                
                if (game.players) {
                    totalPlayers += game.players;
                }
                
                if (game.word) {
                    wordCount[game.word] = (wordCount[game.word] || 0) + 1;
                }
            });
            
            // Encontrar palabra más usada
            let mostUsedWord = null;
            let maxCount = 0;
            Object.entries(wordCount).forEach(([word, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    mostUsedWord = word;
                }
            });
            
            return {
                totalGames: history.length,
                innocentWins: innocentWins,
                impostorWins: impostorWins,
                winRateInnocent: Math.round((innocentWins / history.length) * 100),
                winRateImpostor: Math.round((impostorWins / history.length) * 100),
                averagePlayers: Math.round(totalPlayers / history.length),
                mostUsedWord: mostUsedWord,
                mostUsedWordCount: maxCount
            };
            
        } catch (error) {
            console.error('Error al calcular estadísticas:', error);
            return null;
        }
    }
};

// Hacer el almacenamiento accesible globalmente
window.impostorStorage = impostorStorage;
