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
                    } else if (content.type === 'capsule') {
                        contentElement.className = `capsule-part ${content.color}`;
                        
                        // Add connection visual cues if needed
                        if (content.connected) {
                            contentElement.dataset.connected = content.connected;
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
        
        // Only check vertical matches (4 in a vertical line)
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
        
        matches.forEach(match => {
            const [x, y] = match.split(',').map(Number);
            
            if (this.cells[y][x] && this.cells[y][x].type === 'virus') {
                virusesCleared++;
            }
            
            this.cells[y][x] = null;
        });
        
        return virusesCleared;
    }

    applyGravity() {
        let blocksFell = false;
        
        // First, identify disconnected capsule parts
        const disconnectedParts = this.findDisconnectedParts();
        
        // Process each column separately, bottom to top
        for (let x = 0; x < this.width; x++) {
            // Start from the bottom-second row and move up
            for (let y = this.height - 2; y >= 0; y--) {
                const cell = this.cells[y][x];
                
                // Skip empty cells and viruses (viruses don't fall)
                if (!cell || cell.type === 'virus') continue;
                
                // Only process disconnected capsule parts
                if (cell.type === 'capsule' && !disconnectedParts.has(`${x},${y}`)) continue;
                
                // Check if there's empty space below
                let fallDistance = 0;
                let yBelow = y + 1;
                
                while (yBelow < this.height && this.cells[yBelow][x] === null) {
                    fallDistance++;
                    yBelow++;
                }
                
                if (fallDistance > 0) {
                    // Move the block down
                    this.cells[y + fallDistance][x] = cell;
                    this.cells[y][x] = null;
                    blocksFell = true;
                }
            }
        }
        
        return blocksFell;
    }
    
    // Find capsule parts that are disconnected (should fall)
    findDisconnectedParts() {
        const disconnectedParts = new Set();
        
        // First pass: Find all capsule parts that have been split
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
                    
                    // If no connection found, this is a disconnected piece
                    if (!hasConnection) {
                        disconnectedParts.add(`${x},${y}`);
                    }
                }
            }
        }
        
        // Second pass: Check for unsupported capsule parts
        // (capsule parts with nothing below them)
        for (let x = 0; x < this.width; x++) {
            for (let y = this.height - 1; y >= 0; y--) {
                const cell = this.cells[y][x];
                
                // Skip empty cells and viruses
                if (!cell || cell.type === 'virus') continue;
                
                if (cell.type === 'capsule') {
                    // Check if there's empty space below
                    if (y < this.height - 1 && this.cells[y + 1][x] === null) {
                        disconnectedParts.add(`${x},${y}`);
                    }
                }
            }
        }
        
        return disconnectedParts;
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