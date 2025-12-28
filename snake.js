// snake.js (เวอร์ชันแก้ไขสมบูรณ์)
document.addEventListener('DOMContentLoaded', () => {
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
    
        init() {
            if (!this.board) return;
            this.resetState();
            this.setupInputListeners();
            this.startGameLoop();
            this.board.focus();
        },
    
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
    
        createGameElements() {
            this.gameState.snake.forEach((_, index) => this.createSnakeElement(index));
            const foodElement = document.createElement('div');
            foodElement.id = 'food';
            foodElement.classList.add('food');
            this.board.appendChild(foodElement);
        },
    
        createSnakeElement(index) {
            const snakeElement = document.createElement('div');
            snakeElement.id = `snake-${index}`;
            snakeElement.classList.add('snake');
            this.board.appendChild(snakeElement);
        },
    
        addSnakeSegment() {
            // *** FIX: Use the correct index for the new segment ***
            const newIndex = this.gameState.snake.length - 1;
            this.createSnakeElement(newIndex);
        },
    
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
    
        checkCollision() {
            const head = this.gameState.snake[0];
            return (
                head.x < 1 || head.x > this.gridSize || head.y < 1 || head.y > this.gridSize ||
                this.gameState.snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
            );
        },
    
        updateDisplay() {
            if (this.scoreDisplay) this.scoreDisplay.textContent = this.gameState.score;
            if (this.highScoreDisplay) this.highScoreDisplay.textContent = this.gameState.highScore;
            if (this.pauseResumeBtn) this.pauseResumeBtn.textContent = this.gameState.isPaused ? 'Resume' : 'Pause';
        },
    
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
    
        processInput() {
            const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
            if (this.nextDirection && this.nextDirection !== opposite[this.gameState.direction]) {
                this.gameState.direction = this.nextDirection;
                this.nextDirection = null;
            }
        },
    
        handleKeyDown(e) {
            if (this.gameState.isGameOver) return;
            
            // ใช้ e.code แทน e.key เพื่อรองรับทั้งภาษาไทยและอังกฤษ
            // KeyW, KeyA, KeyS, KeyD หรือ ArrowUp, ArrowDown...
            const key = e.code; 
            
            const keyMap = {
                'ArrowUp': 'up',    'KeyW': 'up',
                'ArrowDown': 'down',  'KeyS': 'down',
                'ArrowLeft': 'left',  'KeyA': 'left',
                'ArrowRight': 'right', 'KeyD': 'right'
            };

            if (keyMap[key]) {
                e.preventDefault();
                this.nextDirection = keyMap[key];
            }
        },
    
        handleTouchStart(e) {
            if (this.gameState.isGameOver) return;
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        },
    
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
    
    window.initGame = () => game.init();
});