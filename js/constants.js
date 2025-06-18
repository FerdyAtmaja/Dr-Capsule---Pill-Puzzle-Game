// Game Constants
const GAME = {
    GRID_WIDTH: 8,
    GRID_HEIGHT: 16,
    CELL_SIZE: 30,
    MAX_LEVEL: 20,
    INITIAL_FALL_SPEED: 800,  // milliseconds between automatic drops (constant for all levels)
    SPEED_INCREASE_PER_LEVEL: 0,   // no speed increase per level
    MIN_FALL_SPEED: 100,  // minimum fall speed (not used with constant speed)
    MATCH_DELAY: 300,  // delay before clearing matches (ms)
    GRAVITY_DELAY: 200,  // delay before applying gravity (ms)
    FALL_ANIMATION_STEP: 100, // ms between each step of falling animation
    FALL_ANIMATION_STEPS: 3,  // number of visual steps in the falling animation
    POINTS: {
        MATCH: 100,      // points per matched block
        VIRUS: 400,      // additional points per virus cleared
        COMBO: 200,      // additional points per combo
        LEVEL_BONUS: 1000 // bonus for completing a level
    }
};

// Colors
const COLORS = ['red', 'blue', 'yellow'];

// Direction Constants
const DIRECTION = {
    LEFT: 'left',
    RIGHT: 'right',
    DOWN: 'down'
};

// Rotation States (0°, 90°, 180°, 270°)
const ROTATION = {
    HORIZONTAL_RIGHT: 0,  // →
    VERTICAL_DOWN: 1,     // ↓
    HORIZONTAL_LEFT: 2,   // ←
    VERTICAL_UP: 3        // ↑
};

// Game States
const GAME_STATE = {
    MENU: 'menu',
    LEVEL_SELECT: 'level_select',
    INSTRUCTIONS: 'instructions',
    PLAYING: 'playing',
    PAUSED: 'paused',
    MATCHING: 'matching',  // When matches are being processed
    FALLING: 'falling',    // When blocks are falling
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over'
};

// Key Codes
const KEY = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    P: 'KeyP',
    ESCAPE: 'Escape',
    SPACE: 'Space'
};

// Sound Effects
const SOUNDS = {
    MOVE: 'move-sound',
    ROTATE: 'rotate-sound',
    DROP: 'drop-sound',
    MATCH: 'match-sound',
    CLEAR_VIRUS: 'clear-virus-sound',
    LEVEL_COMPLETE: 'level-complete-sound',
    GAME_OVER: 'game-over-sound'
};