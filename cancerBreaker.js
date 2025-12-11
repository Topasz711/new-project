document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cancerCanvas');
    const container = document.getElementById('cancerGameContainer');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // UI Elements
    const scoreEl = document.getElementById('cancerScore');
    const livesEl = document.getElementById('cancerLives');
    const startScreen = document.getElementById('cancerStartScreen');
    const gameOverScreen = document.getElementById('cancerGameOverScreen');
    const finalScoreEl = document.getElementById('cancerFinalScore');
    const endTitleEl = document.getElementById('cancerEndTitle');
    const startBtn = document.getElementById('btn-start-cancer');
    const restartBtn = document.getElementById('btn-restart-cancer');

    let gameRunning = false;
    let animationId;
    let score = 0;
    let lives = 3;
    
    const ball = { x: 0, y: 0, dx: 4, dy: -4, radius: 6, color: '#38bdf8' };
    const paddle = { width: 80, height: 12, x: 0, y: 0, color: '#a78bfa' };
    let bricks = [];
    let particles = [];
    
    // เพิ่มตัวแปรเช็คการกดปุ่ม
    let rightPressed = false;
    let leftPressed = false;

    function resize() {
        if(!container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if(!gameRunning) resetPositions();
    }
    window.addEventListener('resize', resize);

    function initBricks() {
        bricks = [];
        const cols = 6;
        const rows = 5;
        const padding = 8;
        const w = (canvas.width - (padding*(cols+1))) / cols;
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#ec4899'];
        for(let c=0; c<cols; c++) {
            for(let r=0; r<rows; r++) {
                bricks.push({ x:0, y:0, status:1, color: colors[r], c, r, w, h: 20 });
            }
        }
    }

    function resetPositions() {
        paddle.width = canvas.width * 0.25;
        paddle.x = (canvas.width - paddle.width)/2;
        paddle.y = canvas.height - 30;
        ball.x = canvas.width/2;
        ball.y = canvas.height - 40;
        ball.dx = (Math.random() > 0.5 ? 4 : -4);
        ball.dy = -4;
    }

    function draw() {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Paddle
        ctx.fillStyle = paddle.color;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        
        // Bricks
        const padding = 8;
        const offsetTop = 50;
        const offsetLeft = padding; // Simplified layout
        bricks.forEach(b => {
            if(b.status === 1) {
                b.x = offsetLeft + (b.c * (b.w + padding));
                b.y = offsetTop + (b.r * (b.h + padding));
                ctx.fillStyle = b.color;
                ctx.beginPath();
                ctx.roundRect(b.x, b.y, b.w, b.h, 4);
                ctx.fill();
            }
        });
    }

    function update() {
        if(!gameRunning) return;
        
        // เพิ่ม Logic ขยับ Paddle ตามปุ่มที่กด
        if(rightPressed && paddle.x < canvas.width - paddle.width) {
            paddle.x += 7; // ความเร็วในการเลื่อน
        }
        else if(leftPressed && paddle.x > 0) {
            paddle.x -= 7;
        }

        ball.x += ball.dx;
        ball.y += ball.dy;

        // Walls
        if(ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) ball.dx = -ball.dx;
        if(ball.y + ball.dy < ball.radius) ball.dy = -ball.dy;
        
        // Paddle
        if(ball.y + ball.dy > canvas.height - ball.radius - paddle.height - 5) {
            if(ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                ball.dy = -ball.dy * 1.05; // Speed up
                // Angle change logic could go here
            } else if(ball.y + ball.dy > canvas.height) {
                lives--;
                livesEl.innerText = "❤️".repeat(lives);
                if(lives<=0) gameOver();
                else resetPositions();
            }
        }

        // Bricks
        bricks.forEach(b => {
            if(b.status === 1) {
                if(ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    scoreEl.innerText = score;
                    if(bricks.every(br => br.status === 0)) gameOver(true);
                }
            }
        });

        draw();
        animationId = requestAnimationFrame(update);
    }

    function startGame() {
        resize();
        initBricks();
        resetPositions();
        score = 0; lives = 3;
        scoreEl.innerText = 0;
        livesEl.innerText = "❤️❤️❤️";
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        gameRunning = true;
        update();
    }

    function gameOver(win) {
        gameRunning = false;
        cancelAnimationFrame(animationId);
        gameOverScreen.classList.remove('hidden');
        endTitleEl.innerText = win ? "Treatment Success!" : "Failed";
        finalScoreEl.innerText = score;
    }

    // Input
    // Input (แก้ไขเป็น Keyboard: ลูกศรซ้าย/ขวา หรือ A/D)
    document.addEventListener('keydown', (e) => {
        if(e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            rightPressed = true;
        } else if(e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            leftPressed = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if(e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            rightPressed = false;
        } else if(e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            leftPressed = false;
        }
    });
    if(startBtn) startBtn.addEventListener('click', startGame);
    if(restartBtn) restartBtn.addEventListener('click', startGame);

    window.initCancerGame = () => {
        startScreen.classList.remove('hidden');
        gameOverScreen.classList.add('hidden');
        resize();
    };
    window.stopCancerGame = () => {
        gameRunning = false;
        cancelAnimationFrame(animationId);
    };
});