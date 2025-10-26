// snake.js (เวอร์ชันแก้ไขสมบูรณ์)
/**
 * @file Contains all the logic for the Snake mini-game.
 */
document.addEventListener('DOMContentLoaded', () => {
    /**
     * @namespace game
     * @description The main object containing all properties and methods for the snake game.
     */
    const game = {
        // DOM Elements
        board: document.getElementById('game-board'),
        scoreDisplay: document.getElementById('score'),
        highScoreDisplay: document.getElementById('high-score'),
        pauseResumeBtn: document.getElementById('pause-resume-btn'),
        restartGameBtn: document.getElementById('restart-game-btn'),
    
        // Game State & Constants
        gridSize: 20,
        gameSpeed: 125,
        gameState: {},
        gameLoopId: null,
        lastUpdateTime: 0,
    
        // Input State
        nextDirection: null,
        touchStartX: 0,
        touchStartY: 0,
        
        // Bound event handler to be able to remove it later
        boundKeyDownHandler: null,
    
        /**
         * Initializes the game, resets the state, and starts the game loop.
         */
        init() {
            if (!this.board) return;
            this.resetState();
            this.setupInputListeners();
            this.startGameLoop();
            this.board.focus();
        },
    
        /**
         * Resets the game state to its initial values.
         */
        resetState() {
            this.gameState = {
                snake: [{ x: 10, y: 10 }],
                food: { x: 15, y: 15 },
                direction: 'right',
                score: 0,
                highScore: localStorage.getItem('snakeHighScore') || 0,
                isPaused: false,
                isGameOver: false,
            };
            this.nextDirection = null;
            this.board.innerHTML = '';
            this.createGameElements();
            this.updateDisplay();
        },
    
        /**
         * Starts the main game loop using requestAnimationFrame.
         */
        startGameLoop() {
            if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
            const gameLoop = (currentTime) => {
                this.gameLoopId = requestAnimationFrame(gameLoop);
                if (this.gameState.isPaused || this.gameState.isGameOver) return;
    
                if (currentTime - this.lastUpdateTime > this.gameSpeed) {
                    this.lastUpdateTime = currentTime;
                    this.update();
                    this.draw();
                }
            };
            this.gameLoopId = requestAnimationFrame(gameLoop);
        },
    
        /**
         * Updates the game state on each tick, moving the snake and checking for collisions or food.
         */
        update() {
            this.processInput();
            const head = { ...this.gameState.snake[0] };
            switch (this.gameState.direction) {
                case 'up': head.y--; break;
                case 'down': head.y++; break;
                case 'left': head.x--; break;
                case 'right': head.x++; break;
            }
            this.gameState.snake.unshift(head);
    
            if (this.checkCollision()) {
                this.gameOver();
                return;
            }
    
            if (head.x === this.gameState.food.x && head.y === this.gameState.food.y) {
                this.gameState.score++;
                this.gameState.food = this.generateFood();
                this.addSnakeSegment();
            } else {
                this.gameState.snake.pop();
            }
            this.updateDisplay();
        },
    
        /**
         * Renders the current game state (snake and food) on the board.
         */
        draw() {
            this.gameState.snake.forEach((segment, index) => {
                const segmentElement = document.getElementById(`snake-${index}`);
                if (segmentElement) {
                    segmentElement.style.gridRowStart = segment.y;
                    segmentElement.style.gridColumnStart = segment.x;
                }
            });
            const foodElement = document.getElementById('food');
            if (foodElement) {
                foodElement.style.gridRowStart = this.gameState.food.y;
                foodElement.style.gridColumnStart = this.gameState.food.x;
            }
        },
    
        /**
         * Handles the game over state, updating high scores and stopping the game.
         */
        gameOver() {
            this.gameState.isGameOver = true;
            if (this.gameState.score > this.gameState.highScore) {
                this.gameState.highScore = this.gameState.score;
                localStorage.setItem('snakeHighScore', this.gameState.highScore);
            }
            this.updateDisplay();
            const headElement = document.getElementById('snake-0');
            if (headElement) {
                headElement.innerHTML = '❌';
                headElement.classList.add('dead-snake');
            }
            // Remove keydown listener when game is over
            if(this.boundKeyDownHandler) {
                document.removeEventListener('keydown', this.boundKeyDownHandler);
            }
        },
    
        /**
         * Creates the initial DOM elements for the snake and food.
         */
        createGameElements() {
            this.gameState.snake.forEach((_, index) => this.createSnakeElement(index));
            const foodElement = document.createElement('div');
            foodElement.id = 'food';
            foodElement.classList.add('food');
            this.board.appendChild(foodElement);
        },
    
        /**
         * Creates a DOM element for a single snake segment.
         * @param {number} index - The index of the snake segment.
         */
        createSnakeElement(index) {
            const snakeElement = document.createElement('div');
            snakeElement.id = `snake-${index}`;
            snakeElement.classList.add('snake');
            this.board.appendChild(snakeElement);
        },
    
        /**
         * Adds a new segment to the snake's body in the DOM.
         */
        addSnakeSegment() {
            // *** FIX: Use the correct index for the new segment ***
            const newIndex = this.gameState.snake.length - 1;
            this.createSnakeElement(newIndex);
        },
    
        /**
         * Generates a new food item at a random position on the board.
         * @returns {{x: number, y: number}} The coordinates of the new food.
         */
        generateFood() {
            let newFood;
            do {
                newFood = {
                    x: Math.floor(Math.random() * this.gridSize) + 1,
                    y: Math.floor(Math.random() * this.gridSize) + 1,
                };
            } while (this.gameState.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
            return newFood;
        },
    
        /**
         * Checks for collisions with the wall or the snake's own body.
         * @returns {boolean} True if a collision is detected, false otherwise.
         */
        checkCollision() {
            const head = this.gameState.snake[0];
            return (
                head.x < 1 || head.x > this.gridSize || head.y < 1 || head.y > this.gridSize ||
                this.gameState.snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
            );
        },
    
        /**
         * Updates the score, high score, and pause button text in the UI.
         */
        updateDisplay() {
            if (this.scoreDisplay) this.scoreDisplay.textContent = this.gameState.score;
            if (this.highScoreDisplay) this.highScoreDisplay.textContent = this.gameState.highScore;
            if (this.pauseResumeBtn) this.pauseResumeBtn.textContent = this.gameState.isPaused ? 'Resume' : 'Pause';
        },
    
        /**
         * Sets up event listeners for keyboard and touch input.
         */
        setupInputListeners() {
            // *** FIX: Ensure keydown listener is only attached once ***
            if (this.boundKeyDownHandler) {
                document.removeEventListener('keydown', this.boundKeyDownHandler);
            }
            this.boundKeyDownHandler = this.handleKeyDown.bind(this);
            document.addEventListener('keydown', this.boundKeyDownHandler);

            // Use .onclick to avoid stacking listeners on restart
            this.board.ontouchstart = e => this.handleTouchStart(e);
            this.board.ontouchmove = e => this.handleTouchMove(e);
            this.pauseResumeBtn.onclick = () => this.togglePause();
            this.restartGameBtn.onclick = () => this.init();
        },
    
        /**
         * Processes the next queued direction input.
         */
        processInput() {
            const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
            if (this.nextDirection && this.nextDirection !== opposite[this.gameState.direction]) {
                this.gameState.direction = this.nextDirection;
                this.nextDirection = null;
            }
        },
    
        /**
         * Handles the keydown event for controlling the snake.
         * @param {KeyboardEvent} e - The keyboard event object.
         */
        handleKeyDown(e) {
            if (this.gameState.isGameOver) return;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                this.nextDirection = e.key.replace('Arrow', '').toLowerCase();
            }
        },
    
        /**
         * Handles the touchstart event for swipe controls.
         * @param {TouchEvent} e - The touch event object.
         */
        handleTouchStart(e) {
            if (this.gameState.isGameOver) return;
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        },
    
        /**
         * Handles the touchmove event to detect swipe direction.
         * @param {TouchEvent} e - The touch event object.
         */
        handleTouchMove(e) {
            if (this.gameState.isGameOver || !this.touchStartX || !this.touchStartY) return;
            e.preventDefault();
            const dx = e.touches[0].clientX - this.touchStartX;
            const dy = e.touches[0].clientY - this.touchStartY;
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                this.nextDirection = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
                this.touchStartX = 0; 
                this.touchStartY = 0;
            }
        },
    
        /**
         * Toggles the paused state of the game.
         */
        togglePause() {
            if (this.gameState.isGameOver) return;
            this.gameState.isPaused = !this.gameState.isPaused;
            this.updateDisplay();
            if (!this.gameState.isPaused) {
                this.board.focus();
                this.lastUpdateTime = performance.now();
            }
        }
    };
    
    /**
     * Exposes the game's init function to the global window object.
     */
    window.initGame = () => game.init();
});