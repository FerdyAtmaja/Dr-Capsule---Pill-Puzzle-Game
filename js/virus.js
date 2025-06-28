class VirusManager {
    constructor(grid) {
        this.grid = grid;
    }

    // Place viruses on the grid based on level data
    placeViruses(levelData) {
        for (const virus of levelData.viruses) {
            this.grid.setCellContent(virus.x, virus.y, {
                type: 'virus',
                color: virus.color
            });
        }
    }

    // Generate random viruses for a level
    generateRandomViruses(count, maxY) {
        const viruses = [];
        const positions = new Set();
        
        // Ensure we don't place viruses in the top 4 rows
        const minY = 4;
        maxY = maxY || GAME.GRID_HEIGHT - 1;
        
        // Calculate color distribution (try to make it even)
        const colorCounts = {};
        COLORS.forEach(color => colorCounts[color] = 0);
        
        while (viruses.length < count) {
            const x = Math.floor(Math.random() * GAME.GRID_WIDTH);
            const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
            const posKey = `${x},${y}`;
            
            // Ensure we don't place viruses in the same position
            if (!positions.has(posKey)) {
                // Find the color with the lowest count
                let minColor = COLORS[0];
                COLORS.forEach(color => {
                    if (colorCounts[color] < colorCounts[minColor]) {
                        minColor = color;
                    }
                });
                
                // Randomly select a color, but with higher probability for underrepresented colors
                let selectedColor;
                const rand = Math.random();
                if (rand < 0.7) {
                    // 70% chance to pick the underrepresented color
                    selectedColor = minColor;
                } else {
                    // 30% chance to pick a random color
                    selectedColor = COLORS[Math.floor(Math.random() * COLORS.length)];
                }
                
                // Validate that this color won't create more than 3 consecutive viruses
                if (this.isValidVirusPlacement(viruses, x, y, selectedColor)) {
                    positions.add(posKey);
                    colorCounts[selectedColor]++;
                    
                    viruses.push({
                        x,
                        y,
                        color: selectedColor
                    });
                } else {
                    // Try other colors if the preferred one creates too many consecutive
                    let validColorFound = false;
                    for (const color of COLORS) {
                        if (this.isValidVirusPlacement(viruses, x, y, color)) {
                            positions.add(posKey);
                            colorCounts[color]++;
                            viruses.push({ x, y, color });
                            validColorFound = true;
                            break;
                        }
                    }
                    // If no valid color found, skip this position
                    if (!validColorFound) {
                        continue;
                    }
                }
            }
        }
        
        return viruses;
    }

    // Generate a pattern of viruses (for specific level designs)
    generatePatternViruses(level) {
        const viruses = [];
        const positions = new Set();
        
        // Different patterns based on level
        switch (level % 5) {
            case 0: // Every 5th level - special pattern
                return this.generateSpecialPattern(level);
            case 1: // Scattered pattern
                return this.generateRandomViruses(level * 4, GAME.GRID_HEIGHT - 1);
            case 2: // Bottom heavy
                return this.generateBottomHeavyPattern(level);
            case 3: // Columns pattern
                return this.generateColumnsPattern(level);
            case 4: // Checkerboard pattern
                return this.generateCheckerboardPattern(level);
        }
        
        return viruses;
    }
    
    // Generate a special pattern for milestone levels
    generateSpecialPattern(level) {
        const viruses = [];
        const positions = new Set();
        const virusCount = level * 4;
        
        // Create a smiley face or other pattern
        const centerX = Math.floor(GAME.GRID_WIDTH / 2);
        const centerY = Math.floor(GAME.GRID_HEIGHT / 2) + 2;
        
        // Add eyes
        this.addVirusIfPossible(viruses, positions, centerX - 2, centerY - 2, 'blue');
        this.addVirusIfPossible(viruses, positions, centerX + 2, centerY - 2, 'blue');
        
        // Add smile
        for (let i = -2; i <= 2; i++) {
            if (i !== 0) {
                this.addVirusIfPossible(viruses, positions, centerX + i, centerY + 2, 'red');
            }
        }
        this.addVirusIfPossible(viruses, positions, centerX - 3, centerY + 1, 'red');
        this.addVirusIfPossible(viruses, positions, centerX + 3, centerY + 1, 'red');
        
        // Fill in the rest randomly
        const remainingCount = virusCount - viruses.length;
        if (remainingCount > 0) {
            const randomViruses = this.generateRandomViruses(remainingCount, GAME.GRID_HEIGHT - 1);
            randomViruses.forEach(virus => {
                const posKey = `${virus.x},${virus.y}`;
                if (!positions.has(posKey)) {
                    positions.add(posKey);
                    viruses.push(virus);
                }
            });
        }
        
        return viruses;
    }
    
    // Generate a bottom-heavy pattern
    generateBottomHeavyPattern(level) {
        const viruses = [];
        const positions = new Set();
        const virusCount = level * 4;
        
        // More viruses at the bottom, fewer at the top
        const bottomRows = Math.min(GAME.GRID_HEIGHT - 4, 8);
        
        // Fill bottom rows more densely
        for (let y = GAME.GRID_HEIGHT - 1; y >= GAME.GRID_HEIGHT - bottomRows; y--) {
            const rowDensity = 1 - ((GAME.GRID_HEIGHT - 1 - y) / bottomRows);
            const rowVirusCount = Math.floor(GAME.GRID_WIDTH * rowDensity);
            
            const rowPositions = new Set();
            while (rowPositions.size < rowVirusCount && viruses.length < virusCount) {
                const x = Math.floor(Math.random() * GAME.GRID_WIDTH);
                if (!rowPositions.has(x)) {
                    rowPositions.add(x);
                    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                    this.addVirusIfPossible(viruses, positions, x, y, color);
                    rowPositions.add(x);
                }
            }
        }
        
        // Fill remaining viruses randomly
        const remainingCount = virusCount - viruses.length;
        if (remainingCount > 0) {
            const randomViruses = this.generateRandomViruses(remainingCount, GAME.GRID_HEIGHT - 1);
            randomViruses.forEach(virus => {
                const posKey = `${virus.x},${virus.y}`;
                if (!positions.has(posKey)) {
                    positions.add(posKey);
                    viruses.push(virus);
                }
            });
        }
        
        return viruses;
    }
    
    // Generate a columns pattern
    generateColumnsPattern(level) {
        const viruses = [];
        const positions = new Set();
        const virusCount = level * 4;
        
        // Create columns of viruses with max 3 consecutive
        for (let x = 0; x < GAME.GRID_WIDTH; x++) {
            const columnHeight = Math.min(3, 2 + Math.floor(Math.random() * 2)); // Max 3 high
            const columnColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            
            for (let y = GAME.GRID_HEIGHT - 1; y >= GAME.GRID_HEIGHT - columnHeight && viruses.length < virusCount; y--) {
                this.addVirusIfPossible(viruses, positions, x, y, columnColor);
            }
        }
        
        // Fill remaining viruses randomly
        const remainingCount = virusCount - viruses.length;
        if (remainingCount > 0) {
            const randomViruses = this.generateRandomViruses(remainingCount, GAME.GRID_HEIGHT - 1);
            randomViruses.forEach(virus => {
                const posKey = `${virus.x},${virus.y}`;
                if (!positions.has(posKey)) {
                    positions.add(posKey);
                    viruses.push(virus);
                }
            });
        }
        
        return viruses;
    }
    
    // Generate a checkerboard pattern
    generateCheckerboardPattern(level) {
        const viruses = [];
        const positions = new Set();
        const virusCount = level * 4;
        
        // Create a checkerboard pattern
        for (let y = GAME.GRID_HEIGHT - 1; y >= 4 && viruses.length < virusCount; y--) {
            for (let x = (y % 2); x < GAME.GRID_WIDTH && viruses.length < virusCount; x += 2) {
                const posKey = `${x},${y}`;
                if (!positions.has(posKey)) {
                    positions.add(posKey);
                    viruses.push({
                        x,
                        y,
                        color: COLORS[(x + y) % COLORS.length]
                    });
                }
            }
        }
        
        // Fill remaining viruses randomly
        const remainingCount = virusCount - viruses.length;
        if (remainingCount > 0) {
            const randomViruses = this.generateRandomViruses(remainingCount, GAME.GRID_HEIGHT - 1);
            randomViruses.forEach(virus => {
                const posKey = `${virus.x},${virus.y}`;
                if (!positions.has(posKey)) {
                    positions.add(posKey);
                    viruses.push(virus);
                }
            });
        }
        
        return viruses;
    }
    
    // Helper method to add a virus if the position is valid
    addVirusIfPossible(virusList, positionSet, x, y, color) {
        if (x >= 0 && x < GAME.GRID_WIDTH && y >= 4 && y < GAME.GRID_HEIGHT) {
            const posKey = `${x},${y}`;
            if (!positionSet.has(posKey) && this.isValidVirusPlacement(virusList, x, y, color)) {
                positionSet.add(posKey);
                virusList.push({
                    x,
                    y,
                    color
                });
                return true;
            }
        }
        return false;
    }

    // Check if placing a virus at position (x,y) with given color would create more than 3 consecutive
    isValidVirusPlacement(existingViruses, x, y, color) {
        // Create a temporary grid to check consecutive count
        const tempGrid = {};
        existingViruses.forEach(virus => {
            tempGrid[`${virus.x},${virus.y}`] = virus.color;
        });
        
        // Check horizontal consecutive count
        let horizontalCount = 1;
        // Count left
        for (let i = x - 1; i >= 0; i--) {
            if (tempGrid[`${i},${y}`] === color) {
                horizontalCount++;
            } else {
                break;
            }
        }
        // Count right
        for (let i = x + 1; i < GAME.GRID_WIDTH; i++) {
            if (tempGrid[`${i},${y}`] === color) {
                horizontalCount++;
            } else {
                break;
            }
        }
        
        // Check vertical consecutive count
        let verticalCount = 1;
        // Count up
        for (let i = y - 1; i >= 0; i--) {
            if (tempGrid[`${x},${i}`] === color) {
                verticalCount++;
            } else {
                break;
            }
        }
        // Count down
        for (let i = y + 1; i < GAME.GRID_HEIGHT; i++) {
            if (tempGrid[`${x},${i}`] === color) {
                verticalCount++;
            } else {
                break;
            }
        }
        
        // Return false if either direction would have more than 3 consecutive
        return horizontalCount <= 3 && verticalCount <= 3;
    }
}