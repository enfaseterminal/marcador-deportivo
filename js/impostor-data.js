// [file name]: impostor/js/impostor-data.js
// Manejo de datos del juego del impostor

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
            console.log('Datos del juego cargados exitosamente:', this.gameData.palabras.length, 'palabras');
            
            // Cargar también datos de localStorage si existen
            this.loadFromLocalStorage();
            
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
                    max_impostores: 3
                }
            };
            
            console.log('Usando datos por defecto:', this.gameData.palabras.length, 'palabras');
            return this.gameData;
        }
    },
    
    // Palabras por defecto
    getDefaultWords() {
        return [
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
            },
            {
                palabra: "Tenis",
                pista: "Deporte con raqueta y pelota amarilla",
                categoria: "deportes",
                dificultad: "facil"
            },
            {
                palabra: "Natación",
                pista: "Deporte acuático donde se avanza en el agua",
                categoria: "deportes",
                dificultad: "facil"
            },
            {
                palabra: "Médico",
                pista: "Persona que cura enfermedades",
                categoria: "profesiones",
                dificultad: "facil"
            },
            {
                palabra: "Profesor",
                pista: "Persona que enseña en una escuela",
                categoria: "profesiones",
                dificultad: "facil"
            },
            {
                palabra: "Policía",
                pista: "Persona que mantiene el orden",
                categoria: "profesiones",
                dificultad: "facil"
            },
            {
                palabra: "Perro",
                pista: "Animal doméstico que ladra",
                categoria: "animales",
                dificultad: "facil"
            },
            {
                palabra: "Gato",
                pista: "Animal doméstico que maúlla",
                categoria: "animales",
                dificultad: "facil"
            },
            {
                palabra: "Elefante",
                pista: "Animal grande con trompa",
                categoria: "animales",
                dificultad: "facil"
            },
            {
                palabra: "Pizza",
                pista: "Comida italiana con masa y queso",
                categoria: "comida",
                dificultad: "facil"
            },
            {
                palabra: "Hamburguesa",
                pista: "Comida rápida con carne y pan",
                categoria: "comida",
                dificultad: "facil"
            },
            {
                palabra: "Manzana",
                pista: "Fruta roja o verde",
                categoria: "comida",
                dificultad: "facil"
            },
            {
                palabra: "Teléfono",
                pista: "Objeto para hablar a distancia",
                categoria: "objetos",
                dificultad: "facil"
            },
            {
                palabra: "Libro",
                pista: "Objeto con páginas para leer",
                categoria: "objetos",
                dificultad: "facil"
            },
            // Palabras difíciles
            {
                palabra: "Caleidoscopio",
                pista: "Instrumento óptico con espejos que crea patrones simétricos",
                categoria: "objetos",
                dificultad: "dificil"
            },
            {
                palabra: "Filantropía",
                pista: "Amor a la humanidad que se manifiesta en ayudar a los demás",
                categoria: "conceptos",
                dificultad: "dificil"
            },
            {
                palabra: "Paralelepípedo",
                pista: "Figura geométrica con seis caras paralelogramas",
                categoria: "geometria",
                dificultad: "dificil"
            },
            {
                palabra: "Onomatopeya",
                pista: "Palabra que imita un sonido natural",
                categoria: "lenguaje",
                dificultad: "dificil"
            },
            {
                palabra: "Efímero",
                pista: "Que dura muy poco tiempo",
                categoria: "conceptos",
                dificultad: "dificil"
            }
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
    
    // Obtener palabras por categoría y dificultad
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
            palabras = palabras.filter(word => 
                word.dificultad === difficulty
            );
        }
        
        return palabras;
    },
    
    // Obtener categorías disponibles
    getCategories() {
        if (!this.gameData || !this.gameData.palabras) {
            return ['all', 'deportes', 'profesiones', 'animales', 'comida', 'objetos'];
        }
        
        const categories = ['all'];
        this.gameData.palabras.forEach(word => {
            if (word.categoria && !categories.includes(word.categoria)) {
                categories.push(word.categoria);
            }
        });
        
        return categories;
    },
    
    // Obtener palabras por dificultad
    getWordsByDifficulty(difficulty) {
        return this.getWords('all', difficulty);
    },
    
    // Obtener palabras por categoría
    getWordsByCategory(category) {
        return this.getWords(category, 'all');
    },
    
    // Contar palabras disponibles
    countWords(category = 'all', difficulty = 'all') {
        return this.getWords(category, difficulty).length;
    },
    
    // Guardar en localStorage
    saveToLocalStorage() {
        try {
            const customWords = this.gameData.palabras.filter(word => 
                word.custom === true
            );
            
            if (customWords.length > 0) {
                localStorage.setItem('impostor_custom_words', 
                    JSON.stringify(customWords));
                console.log('Palabras personalizadas guardadas:', customWords.length);
            }
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
                
                // Marcar como custom
                customWords.forEach(word => {
                    word.custom = true;
                });
                
                // Combinar con palabras existentes (evitar duplicados)
                customWords.forEach(customWord => {
                    const exists = this.gameData.palabras.some(
                        word => word.palabra === customWord.palabra
                    );
                    
                    if (!exists) {
                        this.gameData.palabras.push(customWord);
                    }
                });
                
                console.log('Palabras personalizadas cargadas:', customWords.length);
                return true;
            }
        } catch (error) {
            console.error('Error al cargar desde localStorage:', error);
        }
        
        return false;
    },
    
    // Añadir nueva palabra personalizada
    addCustomWord(palabra, pista, categoria = 'personalizado', dificultad = 'facil') {
        if (!this.gameData || !this.gameData.palabras) {
            this.gameData = { palabras: [] };
        }
        
        const newWord = {
            palabra,
            pista,
            categoria,
            dificultad,
            custom: true
        };
        
        this.gameData.palabras.push(newWord);
        this.saveToLocalStorage();
        
        console.log('Palabra personalizada añadida:', newWord);
        return newWord;
    }
};

// Cargar datos inmediatamente
impostorData.loadGameData().then(() => {
    console.log('Datos del impostor cargados y listos');
});

// Hacer los datos accesibles globalmente
window.impostorData = impostorData;
