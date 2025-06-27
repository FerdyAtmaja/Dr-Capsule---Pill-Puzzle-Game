class Grid {
    constructor() {
        this.width = GAME.GRID_WIDTH;
        this.height = GAME.GRID_HEIGHT;
        this.cells = [];
        this.element = document.getElementById('game-board');
        this.initialize();
    }

    initialize() {
        // Clear the grid
        this.cells = Array(this.height).fill().map(() => Array(this.width).fill(null));
        this.render();
    }

    render() {
        // Clear the game board
        this.element.innerHTML = '';
        this.element.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
        this.element.style.gridTemplateRows = `repeat(${this.height}, 1fr)`;

        // Create cells
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                const content = this.cells[y][x];
                if (content) {
                    const contentElement = document.createElement('div');
                    
                    if (content.type === 'virus') {
                        contentElement.className = `virus ${content.color}`;
                        
                        // Add eye highlights for cartoon effect
                        const leftHighlight = document.createElement('div');
                        leftHighlight.className = 'eye-highlight';
                        leftHighlight.style.position = 'absolute';
                        leftHighlight.style.left = '18%';
                        leftHighlight.style.top = '23%';
                        contentElement.appendChild(leftHighlight);
                        
                        const rightHighlight = document.createElement('div');
                        rightHighlight.className = 'eye-highlight';
                        rightHighlight.style.position = 'absolute';
                        rightHighlight.style.right = '18%';
                        rightHighlight.style.top = '23%';
                        contentElement.appendChild(rightHighlight);
                    } else if (content.type === 'capsule') {
                        contentElement.className = `capsule-part ${content.color}`;
                        
                        // Add connection direction for proper shape
                        if (content.connected) {
                            const direction = this.getConnectionDirection(x, y, content.connected);
                            if (direction) {
                                contentElement.dataset.connected = direction;
                            }
                        } else if (content.remainingSide) {
                            contentElement.dataset.remaining = content.remainingSide;
                        }
                    }
                    
                    cell.appendChild(contentElement);
                }
                
                this.element.appendChild(cell);
            }
        }
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    isCellEmpty(x, y) {
        return this.isValidPosition(x, y) && this.cells[y][x] === null;
    }

    setCellContent(x, y, content) {
        if (this.isValidPosition(x, y)) {
            this.cells[y][x] = content;
        }
    }

    getCellContent(x, y) {
        if (this.isValidPosition(x, y)) {
            return this.cells[y][x];
        }
        return null;
    }

    checkForMatches() {
        const matches = new Set();
        
        // Check vertical matches (4 in a vertical line)
        for (let x = 0; x < this.width; x++) {
            let currentColor = null;
            let matchLength = 0;
            let matchStart = 0;
            
            for (let y = 0; y < this.height; y++) {
                const cell = this.cells[y][x];
                
                if (cell && cell.color === currentColor) {
                    matchLength++;
                } else {
                    // Check if previous sequence was a match
                    if (matchLength >= 4) {
                        for (let i = matchStart; i < y; i++) {
                            matches.add(`${x},${i}`);
                        }
                    }
                    
                    // Start new potential match
                    if (cell) {
                        currentColor = cell.color;
                        matchLength = 1;
                        matchStart = y;
                    } else {
                        currentColor = null;
                        matchLength = 0;
                    }
                }
            }
            
            // Check match at the end of column
            if (matchLength >= 4) {
                for (let i = matchStart; i < this.height; i++) {
                    matches.add(`${x},${i}`);
                }
            }
        }
        
        // Check horizontal matches (4 in a horizontal line)
        for (let y = 0; y < this.height; y++) {
            let currentColor = null;
            let matchLength = 0;
            let matchStart = 0;
            
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                
                if (cell && cell.color === currentColor) {
                    matchLength++;
                } else {
                    // Check if previous sequence was a match
                    if (matchLength >= 4) {
                        for (let i = matchStart; i < x; i++) {
                            matches.add(`${i},${y}`);
                        }
                    }
                    
                    // Start new potential match
                    if (cell) {
                        currentColor = cell.color;
                        matchLength = 1;
                        matchStart = x;
                    } else {
                        currentColor = null;
                        matchLength = 0;
                    }
                }
            }
            
            // Check match at the end of row
            if (matchLength >= 4) {
                for (let i = matchStart; i < this.width; i++) {
                    matches.add(`${i},${y}`);
                }
            }
        }
        
        return matches;
    }

    highlightMatches(matches) {
        // Add visual highlight to matched cells
        matches.forEach(match => {
            const [x, y] = match.split(',').map(Number);
            const cellElement = this.element.querySelector(`[data-x="${x}"][data-y="${y}"] > div`);
            
            if (cellElement) {
                cellElement.classList.add('match');
            }
        });
    }

    clearMatches(matches) {
        let virusesCleared = 0;
        
        // Store connection directions before clearing
        const connectionDirections = new Map();
        
        // First pass: store all connection directions for affected capsules
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                if (cell && cell.type === 'capsule' && cell.connected) {
                    const direction = this.getConnectionDirection(x, y, cell.connected);
                    if (direction) {
                        connectionDirections.set(`${x},${y}`, direction);
                    }
                }
            }
        }
        
        // Collect affected connection IDs
        const affectedConnections = new Set();
        matches.forEach(match => {
            const [x, y] = match.split(',').map(Number);
            const cell = this.cells[y][x];
            if (cell && cell.type === 'capsule' && cell.connected) {
                affectedConnections.add(cell.connected);
            }
        });
        
        // Clear the matches
        matches.forEach(match => {
            const [x, y] = match.split(',').map(Number);
            if (this.cells[y][x] && this.cells[y][x].type === 'virus') {
                virusesCleared++;
            }
            this.cells[y][x] = null;
        });
        
        // Check for disconnected capsule parts
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                
                if (cell && cell.type === 'capsule' && cell.connected && affectedConnections.has(cell.connected)) {
                    // Check if still has connection
                    let hasConnection = false;
                    const directions = [
                        { name: 'left', dx: -1, dy: 0 },
                        { name: 'right', dx: 1, dy: 0 },
                        { name: 'up', dx: 0, dy: -1 },
                        { name: 'down', dx: 0, dy: 1 }
                    ];
                    
                    for (const dir of directions) {
                        const nx = x + dir.dx;
                        const ny = y + dir.dy;
                        const neighbor = this.getCellContent(nx, ny);
                        if (neighbor && neighbor.type === 'capsule' && neighbor.connected === cell.connected) {
                            hasConnection = true;
                            break;
                        }
                    }
                    
                    if (!hasConnection) {
                        const originalDirection = connectionDirections.get(`${x},${y}`);
                        this.cells[y][x].connected = null;
                        this.cells[y][x].remainingSide = this.getOppositeSide(originalDirection);
                    }
                }
            }
        }
        
        return virusesCleared;
    }

    applyGravity() {
        // First, identify disconnected capsule parts that should fall
        const disconnectedParts = this.findDisconnectedParts();
        
        // If no disconnected parts, return immediately
        if (disconnectedParts.size === 0) {
            return false;
        }
        
        // Create a map of falling blocks and their destinations
        const fallingBlocks = [];
        
        // Process each column separately, bottom to top
        for (let x = 0; x < this.width; x++) {
            // Start from the bottom-second row and move up
            for (let y = this.height - 2; y >= 0; y--) {
                const cell = this.cells[y][x];
                
                // Skip empty cells and viruses (viruses don't fall)
                if (!cell || cell.type === 'virus') continue;
                
                // Only process blocks that were identified as needing to fall
                if (!disconnectedParts.has(`${x},${y}`)) continue;
                
                // Check if there's empty space below
                let fallDistance = 0;
                let yBelow = y + 1;
                
                while (yBelow < this.height && this.cells[yBelow][x] === null) {
                    fallDistance++;
                    yBelow++;
                }
                
                if (fallDistance > 0) {
                    // Add to falling blocks list
                    fallingBlocks.push({
                        startX: x,
                        startY: y,
                        endY: y + fallDistance,
                        cell: { 
                            type: cell.type,
                            color: cell.color,
                            connected: cell.connected ? cell.connected : null,
                            remainingSide: cell.remainingSide || null
                        }
                    });
                    
                    // Clear the original position
                    this.cells[y][x] = null;
                }
            }
        }
        
        // If no blocks are falling, return false
        if (fallingBlocks.length === 0) {
            return false;
        }
        
        // Animate the falling blocks
        return this.animateFallingBlocks(fallingBlocks);
    }
    
    // Animate falling blocks with a smooth transition
    animateFallingBlocks(fallingBlocks) {
        return new Promise(resolve => {
            // Create a temporary state for animation
            const animationSteps = GAME.FALL_ANIMATION_STEPS;
            let currentStep = 0;
            
            const animateStep = () => {
                currentStep++;
                
                // If we've completed all steps, place blocks in final positions
                if (currentStep > animationSteps) {
                    // Place all blocks in their final positions
                    fallingBlocks.forEach(block => {
                        this.cells[block.endY][block.startX] = block.cell;
                    });
                    
                    // Render the final state
                    this.render();
                    
                    // Always resolve with true to indicate blocks have fallen
                    resolve(true);
                    return;
                }
                
                // Render the intermediate animation state
                this.renderFallingAnimation(fallingBlocks, currentStep, animationSteps);
                
                // Schedule the next animation step
                setTimeout(animateStep, GAME.FALL_ANIMATION_STEP);
            };
            
            // Start the animation
            animateStep();
        });
    }
    
    // Render an intermediate state of falling animation
    renderFallingAnimation(fallingBlocks, currentStep, totalSteps) {
        // Clear the game board
        this.element.innerHTML = '';
        this.element.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
        this.element.style.gridTemplateRows = `repeat(${this.height}, 1fr)`;
        
        // Create a temporary grid for rendering
        const tempGrid = Array(this.height).fill().map(() => Array(this.width).fill(null));
        
        // Copy the current grid state
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                tempGrid[y][x] = this.cells[y][x];
            }
        }
        
        // Calculate intermediate positions for falling blocks
        fallingBlocks.forEach(block => {
            const progress = currentStep / totalSteps;
            const currentY = Math.floor(block.startY + (block.endY - block.startY) * progress);
            
            // Place the block at its current position for this animation frame
            tempGrid[currentY][block.startX] = block.cell;
        });
        
        // Render the temporary grid
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                const content = tempGrid[y][x];
                if (content) {
                    const contentElement = document.createElement('div');
                    
                    if (content.type === 'virus') {
                        contentElement.className = `virus ${content.color}`;
                        
                        // Add eye highlights for cartoon effect
                        const leftHighlight = document.createElement('div');
                        leftHighlight.className = 'eye-highlight';
                        leftHighlight.style.position = 'absolute';
                        leftHighlight.style.left = '18%';
                        leftHighlight.style.top = '23%';
                        contentElement.appendChild(leftHighlight);
                        
                        const rightHighlight = document.createElement('div');
                        rightHighlight.className = 'eye-highlight';
                        rightHighlight.style.position = 'absolute';
                        rightHighlight.style.right = '18%';
                        rightHighlight.style.top = '23%';
                        contentElement.appendChild(rightHighlight);
                    } else if (content.type === 'capsule') {
                        contentElement.className = `capsule-part ${content.color}`;
                        
                        // Add connection direction for proper shape
                        if (content.connected) {
                            const direction = this.getConnectionDirection(x, y, content.connected, tempGrid);
                            if (direction) {
                                contentElement.dataset.connected = direction;
                            }
                        } else if (content.remainingSide) {
                            contentElement.dataset.remaining = content.remainingSide;
                        }
                        
                        // Add falling animation class if this is a falling block
                        const isFalling = fallingBlocks.some(block => 
                            block.startX === x && 
                            Math.floor(block.startY + (block.endY - block.startY) * (currentStep / totalSteps)) === y
                        );
                        
                        if (isFalling) {
                            contentElement.classList.add('falling');
                        }
                    }
                    
                    cell.appendChild(contentElement);
                }
                
                this.element.appendChild(cell);
            }
        }
    }
    
    // Find capsule parts that are disconnected (should fall)
    findDisconnectedParts() {
        const disconnectedParts = new Set();
        const standaloneBlocks = new Set();
        
        // First pass: Find only capsule parts that have been split due to matches
        // (no longer connected to their other half)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                
                // Skip empty cells and viruses
                if (!cell || cell.type === 'virus') continue;
                
                if (cell.type === 'capsule' && cell.connected) {
                    // Check if this is a disconnected capsule part
                    // (no other part with the same connection ID)
                    let hasConnection = false;
                    
                    // Check all four directions
                    const directions = ['left', 'right', 'up', 'down'];
                    for (const dir of directions) {
                        let nx = x, ny = y;
                        
                        switch (dir) {
                            case 'left': nx--; break;
                            case 'right': nx++; break;
                            case 'up': ny--; break;
                            case 'down': ny++; break;
                        }
                        
                        const neighbor = this.getCellContent(nx, ny);
                        if (neighbor && 
                            neighbor.type === 'capsule' && 
                            neighbor.connected === cell.connected) {
                            hasConnection = true;
                            break;
                        }
                    }
                    
                    // If no connection found, this is a disconnected piece due to a match
                    if (!hasConnection) {
                        standaloneBlocks.add(`${x},${y}`);
                        // Mark this as a standalone block by removing the connection ID
                        this.cells[y][x].connected = null;
                    }
                } else if (cell.type === 'capsule' && !cell.connected) {
                    // Already a standalone block
                    standaloneBlocks.add(`${x},${y}`);
                }
            }
        }
        
        // Second pass: Only check for gravity on standalone blocks
        // Connected capsule parts should never fall individually
        for (let x = 0; x < this.width; x++) {
            // Process from bottom to top to properly handle stacked blocks
            for (let y = this.height - 2; y >= 0; y--) {
                const cell = this.cells[y][x];
                
                // Skip empty cells and viruses
                if (!cell || cell.type === 'virus') continue;
                
                if (cell.type === 'capsule') {
                    // Check if this is a standalone block (not part of a connected capsule)
                    if (!cell.connected || standaloneBlocks.has(`${x},${y}`)) {
                        // Check if there's empty space below
                        if (this.cells[y + 1][x] === null) {
                            disconnectedParts.add(`${x},${y}`);
                        }
                        // Also check if the part below is a disconnected part that will fall
                        else if (this.cells[y + 1][x] && 
                                this.cells[y + 1][x].type === 'capsule' && 
                                disconnectedParts.has(`${x},${y+1}`)) {
                            disconnectedParts.add(`${x},${y}`);
                        }
                    }
                }
            }
        }
        
        return disconnectedParts;
    }

    // Check for matches and clear them immediately
    checkAndClearMatches() {
        const matches = this.checkForMatches();
        if (matches.size > 0) {
            return this.clearMatches(matches);
        }
        return 0;
    }

    countViruses() {
        let count = 0;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                if (cell && cell.type === 'virus') {
                    count++;
                }
            }
        }
        
        return count;
    }

    isGameOver() {
        // Check if the capsule's starting position is already occupied
        const startX = Math.floor(this.width / 2) - 1;
        const startY = 0;
        
        // Check both cells where a new capsule would spawn (horizontal orientation)
        return !this.isCellEmpty(startX, startY) || !this.isCellEmpty(startX + 1, startY);
    }

    // Get connection direction for capsule shape
    getConnectionDirection(x, y, connectionId, grid = null) {
        const cells = grid || this.cells;
        const directions = [
            { name: 'left', dx: -1, dy: 0 },
            { name: 'right', dx: 1, dy: 0 },
            { name: 'top', dx: 0, dy: -1 },
            { name: 'bottom', dx: 0, dy: 1 }
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                const neighbor = cells[ny][nx];
                if (neighbor && 
                    neighbor.type === 'capsule' && 
                    neighbor.connected === connectionId) {
                    return dir.name;
                }
            }
        }
        
        return null;
    }

    // Get opposite side direction
    getOppositeSide(direction) {
        const opposites = {
            'left': 'right',
            'right': 'left',
            'top': 'bottom',
            'bottom': 'top'
        };
        return opposites[direction] || null;
    }

    // Check if a cell has a connection in a specific direction
    hasConnection(x, y, direction) {
        const cell = this.getCellContent(x, y);
        if (!cell || cell.type !== 'capsule') return false;
        
        let neighborX = x;
        let neighborY = y;
        
        switch (direction) {
            case 'left':
                neighborX = x - 1;
                break;
            case 'right':
                neighborX = x + 1;
                break;
            case 'up':
                neighborY = y - 1;
                break;
            case 'down':
                neighborY = y + 1;
                break;
        }
        
        const neighbor = this.getCellContent(neighborX, neighborY);
        
        return neighbor && 
               neighbor.type === 'capsule' && 
               neighbor.color === cell.color &&
               neighbor.connected === cell.connected;
    }
}