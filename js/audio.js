class AudioManager {
    constructor() {
        this.sounds = {};
        this.muted = true;
        this.initialize();
    }

    initialize() {
        // Load all sound elements
        for (const [key, id] of Object.entries(SOUNDS)) {
            this.sounds[key] = document.getElementById(id);
            
            // Set default volume
            if (this.sounds[key]) {
                this.sounds[key].volume = 0.5;
            }
        }
        
        // Add error handling
        for (const sound of Object.values(this.sounds)) {
            if (sound) {
                sound.addEventListener('error', () => {
                    console.warn('Error loading sound effect');
                });
            }
        }
    }

    play(soundName) {
        if (this.muted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // Reset the sound to the beginning if it's already playing
            sound.currentTime = 0;
            
            // Play the sound
            sound.play().catch(error => {
                console.warn('Error playing sound:', error);
            });
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    setMute(muted) {
        this.muted = muted;
    }

    isMuted() {
        return this.muted;
    }
}