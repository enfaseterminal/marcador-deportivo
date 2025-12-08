// celebrate.js - Sistema de celebración con confeti
class Celebration {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    }

    // Crear partícula de confeti
    createParticle(x, y) {
        return {
            x: x,
            y: y,
            size: Math.random() * 10 + 5,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 3 + 2,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            shape: Math.random() > 0.5 ? 'circle' : 'rect',
            rotation: 0,
            rotationSpeed: Math.random() * 0.2 - 0.1
        };
    }

    // Inicializar el canvas
    init() {
        // Crear canvas para el confeti
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'celebration-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Crear partículas iniciales
        const particleCount = 150;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height - this.canvas.height
            ));
        }
    }

    // Dibujar partícula
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = 0.8;

        if (particle.shape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        }

        this.ctx.restore();
    }

    // Actualizar partícula
    updateParticle(particle) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;

        // Agregar un poco de gravedad
        particle.speedY += 0.1;

        // Agregar resistencia del aire
        particle.speedX *= 0.99;
        particle.speedY *= 0.99;

        // Rebote en el suelo
        if (particle.y > this.canvas.height - particle.size / 2) {
            particle.y = this.canvas.height - particle.size / 2;
            particle.speedY *= -0.7; // Rebote con pérdida de energía
            particle.speedX *= 0.95; // Fricción
        }

        // Rebote en las paredes
        if (particle.x < particle.size / 2 || particle.x > this.canvas.width - particle.size / 2) {
            particle.speedX *= -0.9;
            particle.x = Math.max(particle.size / 2, Math.min(this.canvas.width - particle.size / 2, particle.x));
        }

        return particle.y < this.canvas.height + 50;
    }

    // Animar
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Actualizar y dibujar partículas
        this.particles = this.particles.filter(particle => this.updateParticle(particle));
        this.particles.forEach(particle => this.drawParticle(particle));

        // Si quedan partículas, continuar animación
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.stop();
        }
    }

    // Iniciar celebración
    start() {
        this.init();
        this.animate();
        
        // Detener automáticamente después de 5 segundos
        setTimeout(() => {
            this.stop();
        }, 5000);
    }

    // Detener celebración
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        this.particles = [];
    }
}

// Función global para iniciar la celebración
function showCelebration() {
    const celebration = new Celebration();
    celebration.start();
    
    // También agregar efecto de sonido (opcional)
    if (typeof createCelebrationSound === 'function') {
        createCelebrationSound();
    }
}

// Efecto de sonido opcional
function createCelebrationSound() {
    try {
        // Crear un contexto de audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Crear oscilador para sonido de celebración
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configurar el sonido
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // Do
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // Mi
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // Sol
        
        // Configurar volumen
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        // Reproducir sonido
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        // Silenciar errores de audio (puede fallar en algunos navegadores)
        console.log('Audio no disponible');
    }
}

// Hacer la función globalmente accesible
window.showCelebration = showCelebration;
