// [file name]: impostor/js/impostor-data.js
// Manejo de datos del juego del impostor

const impostorData = {
    gameData: null,
    dataUrl: '../impostor/data.json',
    
    // Cargar datos
    async loadGameData() {
        try {
            const response = await fetch(this.dataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.gameData = await response.json();
            console.log('Datos del juego cargados exitosamente');
            return this.gameData;
        } catch (error) {
            console.error('Error al cargar datos:', error);
            
            // Datos por defecto en caso de error
            this.gameData = {
                palabras: [
                    {
                        palabra: "Fútbol",
                        pista: "Deporte con balón que se juega con los pies",
                        categoria: "deportes",
                        dificultad: "facil"
                    },
                    {
                        palabra: "Baloncesto",
                        pista: "Deporte donde se encesta una pelota en un aro",
                        categoria: "deportes",
                        dificultad: "facil"
                    }
                ],
                configuracion: {
                    tiempo_votacion: 30,
                    max_jugadores: 12,
                    min_jugadores: 3,
                    max_impostores: 3
                }
            };
            
            return this.gameData;
        }
    },
    
    // Obtener datos
    getGameData() {
        if (!this.gameData) {
            this.loadGameData();
        }
        return this.gameData;
    },
    
    // Obtener palabras por categoría
    getWordsByCategory(category) {
        if (!this.gameData || !this.gameData.palabras) {
            return [];
        }
        
        if (category === 'all') {
            return this.gameData.palabras;
        }
        
        return this.gameData.palabras.filter(word => 
            word.categoria === category);
    },
    
    // Obtener categorías disponibles
    getCategories() {
        if (!this.gameData || !this.gameData.palabras) {
            return ['all'];
        }
        
        const categories = ['all'];
        this.gameData.palabras.forEach(word => {
            if (word.categoria && !categories.includes(word.categoria)) {
                categories.push(word.categoria);
            }
        });
        
        return categories;
    },
    
    // Añadir nueva palabra
    addWord(palabra, pista, categoria = 'general', dificultad = 'facil') {
        if (!this.gameData || !this.gameData.palabras) {
            this.gameData = { palabras: [] };
        }
        
        const newWord = {
            palabra,
            pista,
            categoria,
            dificultad
        };
        
        this.gameData.palabras.push(newWord);
        this.saveToLocalStorage();
        
        return newWord;
    },
    
    // Eliminar palabra
    removeWord(palabra) {
        if (!this.gameData || !this.gameData.palabras) {
            return false;
        }
        
        const initialLength = this.gameData.palabras.length;
        this.gameData.palabras = this.gameData.palabras.filter(
            word => word.palabra !== palabra
        );
        
        if (this.gameData.palabras.length < initialLength) {
            this.saveToLocalStorage();
            return true;
        }
        
        return false;
    },
    
    // Guardar en localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('impostor_custom_words', 
                JSON.stringify(this.gameData.palabras));
            return true;
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
            return false;
        }
    },
    
    // Cargar desde localStorage
    loadFromLocalStorage() {
        try {
            const savedWords = localStorage.getItem('impostor_custom_words');
            if (savedWords) {
                const customWords = JSON.parse(savedWords);
                
                // Combinar con palabras por defecto
                if (this.gameData && this.gameData.palabras) {
                    // Evitar duplicados
                    customWords.forEach(customWord => {
                        const exists = this.gameData.palabras.some(
                            word => word.palabra === customWord.palabra
                        );
                        
                        if (!exists) {
                            this.gameData.palabras.push(customWord);
                        }
                    });
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error al cargar desde localStorage:', error);
        }
        
        return false;
    },
    
    // Exportar datos
    exportData() {
        if (!this.gameData) {
            return null;
        }
        
        const dataStr = JSON.stringify(this.gameData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ 
            encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `impostor_data_${new Date().getTime()}.json`;
        
        return {
            data: dataStr,
            filename: exportFileDefaultName,
            uri: dataUri
        };
    },
    
    // Importar datos
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Validar estructura básica
                    if (importedData.palabras && Array.isArray(importedData.palabras)) {
                        this.gameData = importedData;
                        this.saveToLocalStorage();
                        resolve(true);
                    } else {
                        reject(new Error('Estructura de datos inválida'));
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

// Cargar datos al inicio
impostorData.loadGameData().then(() => {
    console.log('Datos del impostor cargados y listos');
});

// Hacer los datos accesibles globalmente
window.impostorData = impostorData;
