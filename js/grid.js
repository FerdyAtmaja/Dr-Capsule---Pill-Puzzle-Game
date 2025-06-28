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
        // Only clear and recreate if grid structure changed
        if (this.element.children.length !== this.width * this.height) {
            this.fullRender();
            return;
        }
        
        // Update existing cells without recreating virus elements
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellIndex = y * this.width + x;
                const cell = this.element.children[cellIndex];
                const content = this.cells[y][x];
                
                // Skip if this is a virus and element already exists (preserve animation)
                if (content && content.type === 'virus' && cell.children.length > 0) {
                    continue;
                }
                
                // Clear content if not a virus or virus doesn't exist yet
                if (!content || content.type !== 'virus' || cell.children.length === 0) {
                    cell.innerHTML = '';
                }
                
                if (content) {
                    if (content.type === 'virus' && cell.children.length === 0) {
                        const contentElement = document.createElement('div');
                        contentElement.className = `virus ${content.color}`;
                        
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
                        
                        cell.appendChild(contentElement);
                    } else if (content.type === 'capsule') {
                        const contentElement = document.createElement('div');
                        contentElement.className = `capsule-part ${content.color}`;
                        
                        if (content.connected) {
                            const direction = this.getConnectionDirection(x, y, content.connected);
                            if (direction) {
                                contentElement.dataset.connected = direction;
                            }
                        } else if (content.remainingSide) {
                            contentElement.dataset.remaining = content.remainingSide;
                        }
                        
                        cell.appendChild(contentElement);
                    }
                }
            }
        }
    }
    
    fullRender() {
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
        let blocksFell = false;
        let stillFalling = true;
        
        // Keep applying gravity until no more blocks fall
        while (stillFalling) {
            stillFalling = false;
            
            // Process each column from bottom to top
            for (let x = 0; x < this.width; x++) {
                for (let y = this.height - 2; y >= 0; y--) {
                    const cell = this.cells[y][x];
                    
                    if (cell && cell.type === 'capsule') {
                        if (!cell.connected) {
                            // Standalone capsule block
                            if (this.cells[y + 1][x] === null) {
                                this.cells[y + 1][x] = cell;
                                this.cells[y][x] = null;
                                blocksFell = true;
                                stillFalling = true;
                            }
                        } else {
                            // Connected capsule block - use OR logic
                            if (this.shouldConnectedCapsuleFall(x, y, cell.connected)) {
                                // Move both parts of the connected capsule
                                const partnerPos = this.findConnectedPartner(x, y, cell.connected);
                                if (partnerPos && this.cells[y + 1][x] === null && this.cells[partnerPos.y + 1][partnerPos.x] === null) {
                                    // Move both parts down
                                    this.cells[y + 1][x] = cell;
                                    this.cells[partnerPos.y + 1][partnerPos.x] = this.cells[partnerPos.y][partnerPos.x];
                                    this.cells[y][x] = null;
                                    this.cells[partnerPos.y][partnerPos.x] = null;
                                    blocksFell = true;
                                    stillFalling = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (blocksFell) {
            this.render();
        }
        
        return blocksFell;
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
                        // Ensure the final position is valid
                        if (block.endY >= 0 && block.endY < this.height && 
                            block.startX >= 0 && block.startX < this.width) {
                            this.cells[block.endY][block.startX] = {
                                type: block.cell.type,
                                color: block.cell.color,
                                connected: block.cell.connected,
                                remainingSide: block.cell.remainingSide
                            };
                        }
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
        
        // First pass: Find capsule parts that have been split due to matches
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                
                // Skip empty cells and viruses
                if (!cell || cell.type === 'virus') continue;
                
                if (cell.type === 'capsule' && cell.connected) {
                    // Check if this capsule part still has its connected partner
                    let hasConnection = false;
                    
                    // Check all four directions for connected partner
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
                    
                    // If no connection found, convert to standalone block
                    if (!hasConnection) {
                        standaloneBlocks.add(`${x},${y}`);
                        // Convert to standalone by removing connection and adding remainingSide
                        const originalDirection = this.getConnectionDirection(x, y, cell.connected);
                        this.cells[y][x].connected = null;
                        if (originalDirection) {
                            this.cells[y][x].remainingSide = this.getOppositeSide(originalDirection);
                        }
                    }
                } else if (cell.type === 'capsule' && !cell.connected) {
                    // Already a standalone block
                    standaloneBlocks.add(`${x},${y}`);
                }
            }
        }
        
        // Second pass: Identify all blocks that need to fall using multiple passes
        // Continue until no new falling blocks are found
        let foundNewFallingBlocks = true;
        while (foundNewFallingBlocks) {
            foundNewFallingBlocks = false;
            
            for (let x = 0; x < this.width; x++) {
                for (let y = this.height - 2; y >= 0; y--) {
                    const cell = this.cells[y][x];
                    
                    // Skip if already marked as falling, empty, or virus
                    if (!cell || cell.type === 'virus' || disconnectedParts.has(`${x},${y}`)) continue;
                    
                    // Only process standalone capsule blocks
                    if (cell.type === 'capsule' && !cell.connected) {
                        // Check if space below is empty
                        if (this.cells[y + 1][x] === null) {
                            disconnectedParts.add(`${x},${y}`);
                            foundNewFallingBlocks = true;
                        }
                        // Check if block below is also falling
                        else if (this.cells[y + 1][x] && 
                                this.cells[y + 1][x].type === 'capsule' && 
                                !this.cells[y + 1][x].connected &&
                                disconnectedParts.has(`${x},${y+1}`)) {
                            disconnectedParts.add(`${x},${y}`);
                            foundNewFallingBlocks = true;
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

    // Check if connected capsule should fall using OR logic
    shouldConnectedCapsuleFall(x, y, connectionId) {
        const partnerPos = this.findConnectedPartner(x, y, connectionId);
        if (!partnerPos) return false;
        
        // Check if either part has no foundation (OR logic)
        const currentHasFoundation = this.hasFoundation(x, y);
        const partnerHasFoundation = this.hasFoundation(partnerPos.x, partnerPos.y);
        
        // Fall if either part lacks foundation
        return !currentHasFoundation || !partnerHasFoundation;
    }

    // Find the connected partner of a capsule part
    findConnectedPartner(x, y, connectionId) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (this.isValidPosition(nx, ny)) {
                const neighbor = this.cells[ny][nx];
                if (neighbor && neighbor.type === 'capsule' && neighbor.connected === connectionId) {
                    return { x: nx, y: ny };
                }
            }
        }
        
        return null;
    }

    // Check if a position has foundation (something solid below it)
    hasFoundation(x, y) {
        // Check if at bottom of grid
        if (y >= this.height - 1) return true;
        
        // Check if there's something solid below
        const below = this.cells[y + 1][x];
        return below !== null;
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