// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create placeholder audio files to prevent errors
    createPlaceholderAudio();
    
    // Initialize the game
    const game = new Game();
    
    // Show the main menu
    game.ui.showScreen('mainMenu');
    
    console.log('Dr. Capsule game initialized!');
});

// Create placeholder audio files if they don't exist
function createPlaceholderAudio() {
    const audioElements = document.querySelectorAll('audio');
    
    audioElements.forEach(audio => {
        // Set a data URL as source if the file doesn't exist
        audio.onerror = () => {
            // Create a short silent MP3
            const silentMP3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs4EqNAAAAAAAAAAAAAAAAAAAA';
            audio.src = silentMP3;
            console.log(`Created placeholder for audio: ${audio.id}`);
        };
    });
}