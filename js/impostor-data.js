// impostor/js/impostor-data.js
// Manejo de datos del juego del impostor - VERSIÓN MEJORADA

const impostorData = {
    gameData: null,
    dataUrl: '../impostor/data.json',
    
    // Cargar datos
    async loadGameData() {
        try {
            console.log('Cargando datos del juego desde:', this.dataUrl);
            const response = await fetch(this.dataUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.gameData = await response.json();
            console.log('Datos del juego cargados exitosamente:', 
                       this.gameData.palabras.length, 'palabras disponibles');
            
            // Cargar palabras personalizadas si existen
            this.loadCustomWords();
            
            return this.gameData;
            
        } catch (error) {
            console.error('Error al cargar datos:', error);
            
            // Datos por defecto en caso de error
            this.gameData = {
                palabras: this.getDefaultWords(),
                configuracion: {
                    tiempo_votacion: 30,
                    max_jugadores: 12,
                    min_jugadores: 3,
                    max_impostores: 3,
                    dificultades_disponibles: ["facil", "dificil", "mixto"]
                }
            };
            
            console.log('Usando datos por defecto:', this.gameData.palabras.length, 'palabras');
            return this.gameData;
        }
    },
    
    // Palabras por defecto (ampliadas)
    getDefaultWords() {
        return [
            // Fácil
            { palabra: "Fútbol", pista: "Deporte con balón que se juega con los pies", categoria: "deportes", dificultad: "facil" },
            { palabra: "Baloncesto", pista: "Deporte donde se encesta una pelota en un aro", categoria: "deportes", dificultad: "facil" },
            { palabra: "Tenis", pista: "Deporte con raqueta y pelota amarilla", categoria: "deportes", dificultad: "facil" },
            { palabra: "Natación", pista: "Deporte acuático donde se avanza en el agua", categoria: "deportes", dificultad: "facil" },
            { palabra: "Médico", pista: "Persona que cura enfermedades", categoria: "profesiones", dificultad: "facil" },
            { palabra: "Profesor", pista: "Persona que enseña en una escuela", categoria: "profesiones", dificultad: "facil" },
            { palabra: "Policía", pista: "Persona que mantiene el orden", categoria: "profesiones", dificultad: "facil" },
            { palabra: "Bombero", pista: "Persona que apaga incendios", categoria: "profesiones", dificultad: "facil" },
            { palabra: "Perro", pista: "Animal doméstico que ladra", categoria: "animales", dificultad: "facil" },
            { palabra: "Gato", pista: "Animal doméstico que maúlla", categoria: "animales", dificultad: "facil" },
            { palabra: "Elefante", pista: "Animal grande con trompa", categoria: "animales", dificultad: "facil" },
            { palabra: "León", pista: "Rey de la selva", categoria: "animales", dificultad: "facil" },
            { palabra: "Pizza", pista: "Comida italiana con masa y queso", categoria: "comida", dificultad: "facil" },
            { palabra: "Hamburguesa", pista: "Comida rápida con carne y pan", categoria: "comida", dificultad: "facil" },
            { palabra: "Manzana", pista: "Fruta roja o verde", categoria: "comida", dificultad: "facil" },
            { palabra: "Teléfono", pista: "Objeto para hablar a distancia", categoria: "objetos", dificultad: "facil" },
            { palabra: "Libro", pista: "Objeto con páginas para leer", categoria: "objetos", dificultad: "facil" },
            { palabra: "Escuela", pista: "Lugar donde se estudia", categoria: "lugares", dificultad: "facil" },
            { palabra: "Hospital", pista: "Lugar donde se curan enfermos", categoria: "lugares", dificultad: "facil" },
            { palabra: "Parque", pista: "Lugar con árboles y bancos", categoria: "lugares", dificultad: "facil" },
            
            // Difícil
            { palabra: "Caleidoscopio", pista: "Instrumento óptico con espejos que crea patrones simétricos", categoria: "objetos", dificultad: "dificil" },
            { palabra: "Filantropía", pista: "Amor a la humanidad que se manifiesta en ayudar a los demás", categoria: "conceptos", dificultad: "dificil" },
            { palabra: "Paralelepípedo", pista: "Figura geométrica con seis caras paralelogramas", categoria: "geometria", dificultad: "dificil" },
            { palabra: "Onomatopeya", pista: "Palabra que imita un sonido natural", categoria: "lenguaje", dificultad: "dificil" },
            { palabra: "Efímero", pista: "Que dura muy poco tiempo", categoria: "conceptos", dificultad: "dificil" },
            { palabra: "Serendipia", pista: "Hallazgo afortunado e inesperado que se produce cuando se busca otra cosa", categoria: "conceptos", dificultad: "dificil" },
            { palabra: "Ubicuidad", pista: "Capacidad de estar presente en todas partes al mismo tiempo", categoria: "conceptos", dificultad: "dificil" },
            { palabra: "Oxímoron", pista: "Figura retórica que une dos conceptos opuestos", categoria: "lenguaje", dificultad: "dificil" },
            { palabra: "Paleontólogo", pista: "Científico que estudia los fósiles", categoria: "profesiones", dificultad: "dificil" },
            { palabra: "Ornitólogo", pista: "Científico que estudia las aves", categoria: "profesiones", dificultad: "dificil" },
            { palabra: "Equinoccio", pista: "Momento del año en que el día y la noche tienen la misma duración", categoria: "ciencia", dificultad: "dificil" },
            { palabra: "Fotosíntesis", pista: "Proceso por el cual las plantas convierten la luz solar en energía", categoria: "ciencia", dificultad: "dificil" }
        ];
    },
    
    // Obtener datos
    getGameData() {
        if (!this.gameData) {
            console.warn('gameData no está cargado, cargando...');
            this.loadGameData();
        }
        return this.gameData;
    },
    
    // Obtener palabras filtradas
    getWords(category = 'all', difficulty = 'all') {
        if (!this.gameData || !this.gameData.palabras) {
            console.warn('No hay datos disponibles, usando palabras por defecto');
            return this.getDefaultWords();
        }
        
        let palabras = this.gameData.palabras;
        
        // Filtrar por categoría
        if (category !== 'all') {
            palabras = palabras.filter(word => 
                word.categoria === category
            );
        }
        
        // Filtrar por dificultad
        if (difficulty !== 'all') {
            if (difficulty === 'mixto') {
                // Para mixto, mantener todas las dificultades
                // No filtrar
            } else {
                palabras = palabras.filter(word => 
                    word.dificultad === difficulty
                );
            }
        }
        
        return palabras;
    },
    
    // Contar palabras disponibles
    countWords(category = 'all', difficulty = 'all') {
        return this.getWords(category, difficulty).length;
    },
    
    // Obtener categorías disponibles
    getCategories() {
        if (!this.gameData || !this.gameData.palabras) {
            return ['all', 'deportes', 'profesiones', 'animales', 'comida', 'objetos', 'lugares'];
        }
        
        const categories = ['all'];
        this.gameData.palabras.forEach(word => {
            if (word.categoria && !categories.includes(word.categoria)) {
                categories.push(word.categoria);
            }
        });
        
        return categories;
    },
    
    // Cargar palabras personalizadas desde localStorage
    loadCustomWords() {
        try {
            const savedWords = localStorage.getItem('impostor_custom_words');
            if (savedWords) {
                const customWords = JSON.parse(savedWords);
                
                // Marcar como personalizadas
                customWords.forEach(word => {
                    word.custom = true;
                });
                
                // Combinar con palabras existentes (evitar duplicados)
                customWords.forEach(customWord => {
                    const exists = this.gameData.palabras.some(
                        word => word.palabra.toLowerCase() === customWord.palabra.toLowerCase()
                    );
                    
                    if (!exists) {
                        this.gameData.palabras.push(customWord);
                    }
                });
                
                console.log('Palabras personalizadas cargadas:', customWords.length);
                return true;
            }
        } catch (error) {
            console.error('Error al cargar palabras personalizadas:', error);
        }
        
        return false;
    },
    
    // Añadir nueva palabra personalizada
    addCustomWord(palabra, pista, categoria = 'personalizado', dificultad = 'facil') {
        if (!this.gameData || !this.gameData.palabras) {
            this.gameData = { palabras: [] };
        }
        
        const newWord = {
            palabra: palabra.trim(),
            pista: pista.trim(),
            categoria: categoria,
            dificultad: dificultad,
            custom: true,
            timestamp: Date.now()
        };
        
        this.gameData.palabras.push(newWord);
        this.saveCustomWords();
        
        console.log('Palabra personalizada añadida:', newWord);
        return newWord;
    },
    
    // Guardar palabras personalizadas
    saveCustomWords() {
        try {
            if (!this.gameData || !this.gameData.palabras) return false;
            
            const customWords = this.gameData.palabras.filter(word => word.custom === true);
            
            if (customWords.length > 0) {
                localStorage.setItem('impostor_custom_words', JSON.stringify(customWords));
                console.log('Palabras personalizadas guardadas:', customWords.length);
                return true;
            }
        } catch (error) {
            console.error('Error al guardar palabras personalizadas:', error);
        }
        
        return false;
    },
    
    // Eliminar palabra personalizada
    removeCustomWord(palabra) {
        if (!this.gameData || !this.gameData.palabras) return false;
        
        const initialLength = this.gameData.palabras.length;
        this.gameData.palabras = this.gameData.palabras.filter(
            word => !(word.custom === true && word.palabra.toLowerCase() === palabra.toLowerCase())
        );
        
        const removed = initialLength !== this.gameData.palabras.length;
        if (removed) {
            this.saveCustomWords();
        }
        
        return removed;
    },
    
    // Obtener palabra aleatoria con filtros
    getRandomWord(category = 'all', difficulty = 'all') {
        const words = this.getWords(category, difficulty);
        
        if (words.length === 0) {
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * words.length);
        return words[randomIndex];
    }
};

// Cargar datos inmediatamente
impostorData.loadGameData().then(() => {
    console.log('Datos del impostor cargados y listos');
}).catch(error => {
    console.error('Error fatal al cargar datos:', error);
});

// Hacer los datos accesibles globalmente
window.impostorData = impostorData;
