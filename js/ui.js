class UI {
    constructor(game) {
        this.game = game;
        this.screens = {
            mainMenu: document.getElementById('main-menu'),
            levelSelect: document.getElementById('level-select'),
            instructions: document.getElementById('instructions'),
            gameScreen: document.getElementById('game-screen'),
            pauseMenu: document.getElementById('pause-menu'),
            levelComplete: document.getElementById('level-complete'),
            gameOver: document.getElementById('game-over')
        };
        
        this.elements = {
            levelDisplay: document.getElementById('level-display'),
            scoreDisplay: document.getElementById('score-display'),
            virusCount: document.getElementById('virus-count'),
            levelButtons: document.getElementById('level-buttons'),
            nextCapsule: document.getElementById('next-capsule'),
            finalScore: document.getElementById('final-score'),
            virusesCleared: document.getElementById('viruses-cleared'),
            gameOverScore: document.getElementById('game-over-score'),
            gameOverLevel: document.getElementById('game-over-level')
        };
        
        this.initializeButtons();
        this.addAnimationEffects();
    }

    initializeButtons() {
        // Main Menu Buttons
        document.getElementById('play-button').addEventListener('click', () => {
            this.game.startGame(1);
        });
        
        document.getElementById('level-select-button').addEventListener('click', () => {
            this.showLevelSelect();
        });
        
        document.getElementById('instructions-button').addEventListener('click', () => {
            this.showScreen('instructions');
        });
        
        // Level Select Buttons
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        // Instructions Button
        document.getElementById('back-from-instructions').addEventListener('click', () => {
            this.showScreen('mainMenu');
            console.log('Back from instructions clicked');
        });
        
        // Game Screen Buttons
        document.getElementById('pause-button').addEventListener('click', () => {
            this.game.pauseGame();
        });
        
        document.getElementById('restart-level-button').addEventListener('click', () => {
            this.game.restartLevel();
        });
        
        // Pause Menu Buttons
        document.getElementById('resume-button').addEventListener('click', () => {
            this.game.resumeGame();
        });
        
        document.getElementById('restart-button').addEventListener('click', () => {
            this.game.restartLevel();
        });
        
        document.getElementById('quit-button').addEventListener('click', () => {
            this.game.quitToMenu();
        });
        
        // Level Complete Buttons
        document.getElementById('next-level-button').addEventListener('click', () => {
            this.game.nextLevel();
        });
        
        document.getElementById('level-select-from-complete').addEventListener('click', () => {
            this.showLevelSelect();
        });
        
        // Game Over Buttons
        document.getElementById('retry-button').addEventListener('click', () => {
            this.game.restartLevel();
        });
        
        document.getElementById('menu-from-game-over').addEventListener('click', () => {
            this.game.quitToMenu();
        });
    }

    addAnimationEffects() {
        // Add hover effects to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.classList.add('hover');
            });
            
            button.addEventListener('mouseleave', () => {
                button.classList.remove('hover');
            });
        });
        
        // Add pulse animation to the play button
        const playButton = document.getElementById('play-button');
        if (playButton) {
            playButton.classList.add('pulse');
        }
    }

    showScreen(screenName) {
        // Hide all screens with a fade effect
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show the requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
            
            // Add entrance animation for certain screens
            if (screenName === 'levelComplete' || screenName === 'gameOver') {
                const elements = this.screens[screenName].querySelectorAll('h2, .result-stats, .menu-buttons');
                elements.forEach((el, index) => {
                    el.style.opacity = '0';
                    el.classList.add('fall-in');
                    setTimeout(() => {
                        el.style.opacity = '1';
                    }, index * 200);
                });
            }
        }
    }

    showLevelSelect() {
        // Generate level buttons
        this.elements.levelButtons.innerHTML = '';
        
        for (let i = 1; i <= this.game.levelManager.getMaxLevel(); i++) {
            const button = document.createElement('button');
            button.textContent = `${i}`;
            button.className = 'btn';
            
            // Highlight the current level
            if (i === this.game.levelManager.getCurrentLevelNumber()) {
                button.classList.add('primary-btn');
            }
            
            button.addEventListener('click', () => {
                this.game.startGame(i);
            });
            
            this.elements.levelButtons.appendChild(button);
        }
        
        this.showScreen('levelSelect');
    }

    updateGameInfo(level, score, virusCount) {
        this.elements.levelDisplay.textContent = level;
        this.elements.scoreDisplay.textContent = score.toLocaleString();
        this.elements.virusCount.textContent = virusCount;
    }

    showNextCapsule(nextCapsule) {
        if (!nextCapsule) return;
        
        this.elements.nextCapsule.innerHTML = '';
        
        for (let i = 0; i < 2; i++) {
            const capsulePart = document.createElement('div');
            capsulePart.className = `capsule-part ${nextCapsule.colors[i]}`;
            this.elements.nextCapsule.appendChild(capsulePart);
        }
    }

    showLevelComplete(score, virusesCleared) {
        this.elements.finalScore.textContent = score.toLocaleString();
        this.elements.virusesCleared.textContent = virusesCleared;
        this.showScreen('levelComplete');
    }

    showGameOver(level, score) {
        this.elements.gameOverLevel.textContent = level;
        this.elements.gameOverScore.textContent = score.toLocaleString();
        this.showScreen('gameOver');
    }

    // Show a visual effect for matches
    showMatchEffect(matches, grid) {
        grid.highlightMatches(matches);
    }

    // Show a visual effect for virus clear
    showVirusClearEffect() {
        // Add visual effect for virus clear (could be implemented with CSS animations)
    }

    // Show a visual effect for level transition
    showLevelTransitionEffect() {
        // Add visual effect for level transition (could be implemented with CSS animations)
    }
}