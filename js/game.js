class Game {
    constructor() {
        this.grid = new Grid();
        this.virusManager = new VirusManager(this.grid);
        this.levelManager = new LevelManager(this.grid, this.virusManager);
        this.audioManager = new AudioManager();
        this.ui = new UI(this);
        
        this.currentCapsule = null;
        this.nextCapsule = null;
        this.score = 0;
        this.combo = 0;
        this.gameState = GAME_STATE.MENU;
        this.gameLoop = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.addEventListener('keydown', (event) => {
            // Handle global key events (like ESC to pause)
            if (event.code === KEY.ESCAPE) {
                if (this.gameState === GAME_STATE.PLAYING) {
                    this.pauseGame();
                    event.preventDefault();
                } else if (this.gameState === GAME_STATE.PAUSED) {
                    this.resumeGame();
                    event.preventDefault();
                }
                return;
            }
            
            // Handle game-specific key events
            if (this.gameState === GAME_STATE.PLAYING) {
                switch (event.code) {
                    case KEY.LEFT:
                        this.moveCapsule(DIRECTION.LEFT);
                        this.audioManager.play('MOVE');
                        event.preventDefault();
                        break;
                    case KEY.RIGHT:
                        this.moveCapsule(DIRECTION.RIGHT);
                        this.audioManager.play('MOVE');
                        event.preventDefault();
                        break;
                    case KEY.UP:
                        this.rotateCapsule();
                        this.audioManager.play('ROTATE');
                        event.preventDefault();
                        break;
                    case KEY.DOWN:
                        this.moveCapsule(DIRECTION.DOWN);
                        event.preventDefault();
                        break;
                    case KEY.SPACE:
                        this.hardDropCapsule();
                        this.audioManager.play('DROP');
                        event.preventDefault();
                        break;
                    case KEY.P:
                        this.pauseGame();
                        event.preventDefault();
                        break;
                }
            }
        });
    }

    startGame(level) {
        this.levelManager.loadLevel(level);
        this.score = 0;
        this.combo = 0;
        this.gameState = GAME_STATE.PLAYING;
        this.ui.showScreen('gameScreen');
        
        // Create the first capsule
        this.createNextCapsule();
        this.spawnCapsule();
        
        // Update UI
        this.updateUI();
        
        // Start the game loop
        this.startGameLoop();
    }

    pauseGame() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            clearInterval(this.gameLoop);
            this.ui.showScreen('pauseMenu');
        }
    }

    resumeGame() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.gameState = GAME_STATE.PLAYING;
            this.ui.showScreen('gameScreen');
            this.startGameLoop();
        }
    }

    restartLevel() {
        this.startGame(this.levelManager.getCurrentLevelNumber());
    }

    quitToMenu() {
        this.gameState = GAME_STATE.MENU;
        clearInterval(this.gameLoop);
        this.ui.showScreen('mainMenu');
    }

    nextLevel() {
        const nextLevelNumber = this.levelManager.getCurrentLevelNumber() + 1;
        if (nextLevelNumber <= this.levelManager.getMaxLevel()) {
            this.startGame(nextLevelNumber);
        } else {
            // Player beat all levels
            this.quitToMenu();
        }
    }

    startGameLoop() {
        clearInterval(this.gameLoop);
        
        // Make sure we have a valid capsule
        if (!this.currentCapsule || !this.currentCapsule.active) {
            this.spawnCapsule();
        }
        
        // Get the fall speed for the current level
        const fallSpeed = this.levelManager.getCurrentFallSpeed();
        
        this.gameLoop = setInterval(() => {
            this.update();
        }, fallSpeed);
    }

    update() {
        if (this.gameState !== GAME_STATE.PLAYING) return;
        
        // Move the capsule down
        if (this.currentCapsule && this.currentCapsule.active) {
            const moved = this.moveCapsule(DIRECTION.DOWN);
            
            // If the capsule couldn't move down, it's placed
            if (!moved) {
                this.audioManager.play('DROP');
                this.handlePlacedCapsule();
            }
        } else {
            // If there's no active capsule, spawn a new one
            this.spawnCapsule();
        }
    }

    moveCapsule(direction) {
        if (!this.currentCapsule || !this.currentCapsule.active) return false;
        
        this.currentCapsule.clear();
        const moved = this.currentCapsule.move(direction);
        this.currentCapsule.draw();
        this.grid.render();
        
        return moved;
    }

    rotateCapsule() {
        if (!this.currentCapsule || !this.currentCapsule.active) return false;
        
        this.currentCapsule.clear();
        const rotated = this.currentCapsule.rotate();
        this.currentCapsule.draw();
        this.grid.render();
        
        return rotated;
    }

    hardDropCapsule() {
        if (!this.currentCapsule || !this.currentCapsule.active) return false;
        
        this.currentCapsule.clear();
        this.currentCapsule.hardDrop();
        this.grid.render();
        
        // Handle the placed capsule
        this.handlePlacedCapsule();
        
        return true;
    }

    createNextCapsule() {
        this.nextCapsule = new Capsule(this.grid);
        this.ui.showNextCapsule(this.nextCapsule);
    }

    spawnCapsule() {
        // Check if the game is over (can't place a new capsule)
        if (this.grid.isGameOver()) {
            this.gameOver();
            return;
        }
        
        if (this.nextCapsule) {
            this.currentCapsule = this.nextCapsule;
            this.createNextCapsule();
        } else {
            this.currentCapsule = new Capsule(this.grid);
            this.createNextCapsule();
        }
        
        // Try to draw the capsule, if it can't be drawn, game over
        if (!this.currentCapsule.draw()) {
            this.gameOver();
            return;
        }
        
        this.grid.render();
    }

    handlePlacedCapsule() {
        // Process matches and gravity until the board stabilizes
        setTimeout(() => {
            this.processMatchesAndGravity();
        }, GAME.MATCH_DELAY);
    }

    processMatchesAndGravity() {
        // Set game state to matching
        this.gameState = GAME_STATE.MATCHING;
        
        // Check for matches
        const matches = this.grid.checkForMatches();
        
        if (matches.size > 0) {
            // Show match effect
            this.ui.showMatchEffect(matches, this.grid);
            
            // Play match sound
            this.audioManager.play('MATCH');
            
            // Wait a moment to show the match animation
            setTimeout(() => {
                // Clear matches and update score
                const virusesCleared = this.grid.clearMatches(matches);
                
                // Increase combo if viruses were cleared
                if (virusesCleared > 0) {
                    this.combo++;
                    this.audioManager.play('CLEAR_VIRUS');
                    this.levelManager.addVirusesCleared(virusesCleared);
                }
                
                // Calculate score
                this.score += matches.size * GAME.POINTS.MATCH;  // Points for each matched block
                this.score += virusesCleared * GAME.POINTS.VIRUS;  // Additional points for viruses
                if (this.combo > 1) {
                    this.score += (this.combo - 1) * GAME.POINTS.COMBO;  // Combo bonus
                }
                
                // Apply gravity after a short delay
                setTimeout(() => {
                    this.gameState = GAME_STATE.FALLING;
                    const blocksFell = this.grid.applyGravity();
                    this.grid.render();
                    
                    // Update UI
                    this.updateUI();
                    
                    // If blocks fell, check for more matches
                    if (blocksFell) {
                        setTimeout(() => {
                            this.processMatchesAndGravity();
                        }, GAME.GRAVITY_DELAY);
                    } else {
                        // Reset combo if no viruses were cleared
                        if (virusesCleared === 0) {
                            this.combo = 0;
                        }
                        
                        // Check if all viruses are cleared
                        if (this.grid.countViruses() === 0) {
                            this.levelComplete();
                        } else {
                            // Continue the game
                            this.gameState = GAME_STATE.PLAYING;
                            this.spawnCapsule();
                        }
                    }
                }, GAME.GRAVITY_DELAY);
            }, GAME.MATCH_DELAY);
        } else {
            // No matches, reset combo and continue
            this.combo = 0;
            this.gameState = GAME_STATE.PLAYING;
            
            // Check if all viruses are cleared (unlikely but possible)
            if (this.grid.countViruses() === 0) {
                this.levelComplete();
            } else {
                // Spawn a new capsule
                this.spawnCapsule();
            }
        }
    }

    updateUI() {
        const level = this.levelManager.getCurrentLevelNumber();
        const virusCount = this.grid.countViruses();
        this.ui.updateGameInfo(level, this.score, virusCount);
    }

    levelComplete() {
        // Add level completion bonus
        this.score += GAME.POINTS.LEVEL_BONUS;
        
        // Update UI
        this.updateUI();
        
        // Stop the game loop
        this.gameState = GAME_STATE.LEVEL_COMPLETE;
        clearInterval(this.gameLoop);
        
        // Play level complete sound
        this.audioManager.play('LEVEL_COMPLETE');
        
        // Show level complete screen
        const virusesCleared = this.levelManager.getVirusesClearedInLevel();
        this.ui.showLevelComplete(this.score, virusesCleared);
    }

    gameOver() {
        this.gameState = GAME_STATE.GAME_OVER;
        clearInterval(this.gameLoop);
        
        // Play game over sound
        this.audioManager.play('GAME_OVER');
        
        // Show game over screen
        const level = this.levelManager.getCurrentLevelNumber();
        this.ui.showGameOver(level, this.score);
    }
}