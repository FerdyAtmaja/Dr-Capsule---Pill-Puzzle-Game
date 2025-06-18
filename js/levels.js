class LevelManager {
    constructor(grid, virusManager) {
        this.grid = grid;
        this.virusManager = virusManager;
        this.currentLevel = 1;
        this.maxLevel = GAME.MAX_LEVEL;
        this.levels = {};
        this.virusesClearedInLevel = 0;
    }

    // Generate a specific level
    generateLevel(levelNumber) {
        if (levelNumber < 1 || levelNumber > this.maxLevel) {
            console.error(`Level ${levelNumber} is out of range`);
            return null;
        }
        
        // Calculate virus count based on level
        const baseVirusCount = 4;
        const virusCount = baseVirusCount + (levelNumber - 1) * 4;
        
        // Calculate max height for viruses based on level
        const maxY = Math.min(GAME.GRID_HEIGHT - 1, 8 + Math.floor(levelNumber / 2));
        
        // Generate viruses based on level pattern
        const viruses = this.virusManager.generatePatternViruses(levelNumber);
        
        return {
            number: levelNumber,
            viruses: viruses,
            fallSpeed: GAME.INITIAL_FALL_SPEED
        };
    }

    // Load a specific level
    loadLevel(levelNumber) {
        if (levelNumber < 1 || levelNumber > this.maxLevel) {
            console.error(`Level ${levelNumber} does not exist`);
            return false;
        }
        
        this.currentLevel = levelNumber;
        this.virusesClearedInLevel = 0;
        
        // Generate the level if it doesn't exist
        if (!this.levels[levelNumber]) {
            this.levels[levelNumber] = this.generateLevel(levelNumber);
        }
        
        // Reset the grid and place viruses
        this.grid.initialize();
        this.virusManager.placeViruses(this.levels[levelNumber]);
        
        return true;
    }

    // Move to the next level
    nextLevel() {
        if (this.currentLevel < this.maxLevel) {
            return this.loadLevel(this.currentLevel + 1);
        }
        return false;
    }

    // Get the current level number
    getCurrentLevelNumber() {
        return this.currentLevel;
    }

    // Get the current level data
    getCurrentLevel() {
        return this.levels[this.currentLevel];
    }

    // Get the maximum level number
    getMaxLevel() {
        return this.maxLevel;
    }

    // Track viruses cleared in the current level
    addVirusesCleared(count) {
        this.virusesClearedInLevel += count;
        return this.virusesClearedInLevel;
    }

    // Get the number of viruses cleared in the current level
    getVirusesClearedInLevel() {
        return this.virusesClearedInLevel;
    }

    // Get the fall speed for the current level
    getCurrentFallSpeed() {
        if (this.levels[this.currentLevel]) {
            return this.levels[this.currentLevel].fallSpeed;
        }
        return GAME.INITIAL_FALL_SPEED;
    }
}