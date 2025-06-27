class Capsule {
    constructor(grid) {
        this.grid = grid;
        this.x = Math.floor(GAME.GRID_WIDTH / 2) - 1; // Start in the middle-top
        this.y = 0;
        this.rotation = ROTATION.HORIZONTAL_RIGHT; // Start horizontal
        this.colors = [
            COLORS[Math.floor(Math.random() * COLORS.length)],
            COLORS[Math.floor(Math.random() * COLORS.length)]
        ];
        this.active = true;
        this.id = Date.now(); // Unique identifier for this capsule
    }

    // Get the positions of both capsule parts based on current position and rotation
    getPositions() {
        let positions = [];
        
        // First part is always at the current position
        positions.push({ x: this.x, y: this.y });
        
        // Second part position depends on rotation
        switch (this.rotation) {
            case ROTATION.HORIZONTAL_RIGHT:
                positions.push({ x: this.x + 1, y: this.y });
                break;
            case ROTATION.VERTICAL_DOWN:
                positions.push({ x: this.x, y: this.y + 1 });
                break;
            case ROTATION.HORIZONTAL_LEFT:
                positions.push({ x: this.x - 1, y: this.y });
                break;
            case ROTATION.VERTICAL_UP:
                positions.push({ x: this.x, y: this.y - 1 });
                break;
        }
        
        return positions;
    }

    // Check if the capsule can move to a new position
    canMove(direction) {
        const positions = this.getPositions();
        let newX, newY;
        
        switch (direction) {
            case DIRECTION.LEFT:
                for (const pos of positions) {
                    newX = pos.x - 1;
                    if (newX < 0 || !this.grid.isCellEmpty(newX, pos.y)) {
                        return false;
                    }
                }
                break;
            case DIRECTION.RIGHT:
                for (const pos of positions) {
                    newX = pos.x + 1;
                    if (newX >= GAME.GRID_WIDTH || !this.grid.isCellEmpty(newX, pos.y)) {
                        return false;
                    }
                }
                break;
            case DIRECTION.DOWN:
                for (const pos of positions) {
                    newY = pos.y + 1;
                    if (newY >= GAME.GRID_HEIGHT || !this.grid.isCellEmpty(pos.x, newY)) {
                        return false;
                    }
                }
                break;
        }
        
        return true;
    }

    // Move the capsule in the specified direction
    move(direction) {
        if (!this.active) return false;
        
        if (this.canMove(direction)) {
            switch (direction) {
                case DIRECTION.LEFT:
                    this.x--;
                    break;
                case DIRECTION.RIGHT:
                    this.x++;
                    break;
                case DIRECTION.DOWN:
                    this.y++;
                    break;
            }
            return true;
        }
        
        // If we can't move down, the capsule is placed
        if (direction === DIRECTION.DOWN) {
            this.place();
            return false;
        }
        
        return false;
    }

    // Check if the capsule can rotate
    canRotate() {
        const nextRotation = (this.rotation + 1) % 4;
        let newX = this.x;
        let newY = this.y;
        
        // Calculate the position of the second part after rotation
        switch (nextRotation) {
            case ROTATION.HORIZONTAL_RIGHT:
                if (newX + 1 >= GAME.GRID_WIDTH || !this.grid.isCellEmpty(newX + 1, newY)) {
                    // Try wall kick - move left if we're at the right edge
                    if (newX + 1 >= GAME.GRID_WIDTH && this.grid.isCellEmpty(newX - 1, newY)) {
                        this.x--;
                        return true;
                    }
                    return false;
                }
                break;
            case ROTATION.VERTICAL_DOWN:
                if (newY + 1 >= GAME.GRID_HEIGHT || !this.grid.isCellEmpty(newX, newY + 1)) {
                    // If at bottom, try moving up
                    if (newY + 1 >= GAME.GRID_HEIGHT && this.grid.isCellEmpty(newX, newY - 1)) {
                        this.y--;
                        return true;
                    }
                    return false;
                }
                break;
            case ROTATION.HORIZONTAL_LEFT:
                if (newX - 1 < 0 || !this.grid.isCellEmpty(newX - 1, newY)) {
                    // Try wall kick - move right if we're at the left edge
                    if (newX - 1 < 0 && this.grid.isCellEmpty(newX + 1, newY)) {
                        this.x++;
                        return true;
                    }
                    return false;
                }
                break;
            case ROTATION.VERTICAL_UP:
                if (newY - 1 < 0 || !this.grid.isCellEmpty(newX, newY - 1)) {
                    return false;
                }
                break;
        }
        
        return true;
    }

    // Rotate the capsule clockwise
    rotate() {
        if (!this.active) return false;
        
        if (this.canRotate()) {
            this.rotation = (this.rotation + 1) % 4;
            return true;
        }
        
        return false;
    }

    // Place the capsule on the grid
    place() {
        if (!this.active) return;
        
        const positions = this.getPositions();
        
        // Make sure we have both parts of the capsule
        if (positions.length !== 2) {
            console.error("Error: Capsule should have exactly 2 parts");
            return;
        }
        
        // Place both parts of the capsule
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            if (this.grid.isValidPosition(pos.x, pos.y)) {
                this.grid.setCellContent(pos.x, pos.y, {
                    type: 'capsule',
                    color: this.colors[i],
                    connected: this.id // Mark both parts as connected to each other
                });
            }
        }
        
        this.active = false;
    }

    // Draw the capsule on the grid
    draw() {
        if (!this.active) return false;
        
        const positions = this.getPositions();
        
        // Check if all positions are valid and empty before drawing
        for (const pos of positions) {
            if (!this.grid.isValidPosition(pos.x, pos.y) || !this.grid.isCellEmpty(pos.x, pos.y)) {
                return false; // Can't draw the capsule
            }
        }
        
        // Draw both parts of the capsule
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            this.grid.setCellContent(pos.x, pos.y, {
                type: 'capsule',
                color: this.colors[i],
                connected: this.id
            });
        }
        
        return true; // Successfully drew the capsule
    }

    // Clear the capsule from the grid (for redrawing)
    clear() {
        if (!this.active) return;
        
        const positions = this.getPositions();
        
        // Clear both parts of the capsule
        for (const pos of positions) {
            if (this.grid.isValidPosition(pos.x, pos.y)) {
                this.grid.setCellContent(pos.x, pos.y, null);
            }
        }
    }

    // Hard drop the capsule (instantly place it at the lowest possible position)
    hardDrop() {
        if (!this.active) return false;
        
        // Find the maximum distance the capsule can drop
        let maxDropDistance = 0;
        let canDrop = true;
        
        while (canDrop) {
            // Check if the capsule can move down one more row
            const positions = this.getPositions();
            canDrop = true;
            
            for (const pos of positions) {
                const newY = pos.y + maxDropDistance + 1;
                if (newY >= GAME.GRID_HEIGHT || !this.grid.isCellEmpty(pos.x, newY)) {
                    canDrop = false;
                    break;
                }
            }
            
            if (canDrop) {
                maxDropDistance++;
            }
        }
        
        // Move the capsule down by the maximum distance
        if (maxDropDistance > 0) {
            this.y += maxDropDistance;
        }
        
        // Place the capsule
        this.place();
        
        return true;
    }
}