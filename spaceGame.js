document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('spaceGameCanvas');
    const container = document.getElementById('spaceGameContainer');
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let gameRunning = false;
    let score = 0;
    let highScore = localStorage.getItem('spaceEvasionHighScore') || 0;
    let frameCount = 0;

    // Game State Entities
    const player = { x: 0, y: 0, radius: 15, tail: [] };
    let enemies = [];
    let coins = [];
    let particles = [];
    let stars = [];
    let targetX = 0;
    let targetY = 0;

    // UI Elements
    const scoreDisplay = document.getElementById('spaceScoreDisplay');
    const highScoreDisplay = document.getElementById('spaceHighScoreDisplay');
    const finalScoreDisplay = document.getElementById('spaceFinalScore');
    const startScreen = document.getElementById('space-start-screen');
    const gameOverScreen = document.getElementById('space-game-over-screen');

    // Update Highscore UI on load
    if (highScoreDisplay) highScoreDisplay.innerText = highScore;

    function resizeCanvas() {
        if (!container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        // Reset player position if resized
        if (!gameRunning) {
            player.x = canvas.width / 2;
            player.y = canvas.height - 100;
            targetX = player.x;
            targetY = player.y;
        }
    }
    window.addEventListener('resize', resizeCanvas);

    // --- Input Handling ---
    function handleInput(e) {
        if (!gameRunning) return;
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Map coordinates relative to canvas
        targetX = clientX - rect.left;
        targetY = clientY - rect.top;
        
        // Boundary checks
        targetX = Math.max(player.radius, Math.min(canvas.width - player.radius, targetX));
        targetY = Math.max(player.radius, Math.min(canvas.height - player.radius, targetY));
    }

    canvas.addEventListener('mousemove', handleInput);
    canvas.addEventListener('touchmove', handleInput, { passive: false });
    canvas.addEventListener('touchstart', handleInput, { passive: false });

    // --- Classes ---
    class Star {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2;
            this.speed = Math.random() * 3 + 0.5;
            this.opacity = Math.random();
        }
        update() {
            this.y += this.speed;
            if (this.y > canvas.height) {
                this.y = 0;
                this.x = Math.random() * canvas.width;
            }
        }
        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class Enemy {
        constructor() {
            this.radius = Math.random() * 15 + 10;
            this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
            this.y = -this.radius;
            this.speed = Math.random() * 2 + 2 + (score / 1000);
            this.rotation = 0;
            this.rotationSpeed = Math.random() * 0.1 - 0.05;
        }
        update() {
            this.y += this.speed;
            this.rotation += this.rotationSpeed;
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.strokeStyle = '#ef4444'; // Red
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ef4444';
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * 2 * Math.PI) / 6;
                const r = this.radius * (i % 2 === 0 ? 1 : 0.6);
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
    }

    class Coin {
        constructor() {
            this.radius = 8;
            this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
            this.y = -this.radius;
            this.speed = 3;
        }
        update() { this.y += this.speed; }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fcd34d';
            ctx.fillStyle = '#fcd34d';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.velocity = { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 };
            this.alpha = 1;
        }
        update() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.alpha -= 0.03;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // --- Game Functions ---
    function init() {
        resizeCanvas();
        stars = Array.from({ length: 50 }, () => new Star());
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
        targetX = player.x;
        targetY = player.y;
    }

    function startGame() {
        if (gameRunning) return;
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        gameRunning = true;
        score = 0;
        frameCount = 0;
        enemies = [];
        coins = [];
        particles = [];
        player.tail = [];
        
        if(scoreDisplay) scoreDisplay.innerText = '0';
        animate();
    }

    function stopGame() {
        gameRunning = false;
        cancelAnimationFrame(animationId);
    }

    function gameOver() {
        gameRunning = false;
        createExplosion(player.x, player.y, '#0ea5e9', 20);
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('spaceEvasionHighScore', highScore);
            if(highScoreDisplay) highScoreDisplay.innerText = highScore;
        }

        if(finalScoreDisplay) finalScoreDisplay.innerText = score;
        setTimeout(() => {
            gameOverScreen.classList.remove('hidden');
        }, 500);
    }

    function createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
    }

    function animate() {
        if (!gameRunning) return;
        animationId = requestAnimationFrame(animate);
        frameCount++;
        ctx.fillStyle = '#0f172a'; // Dark background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Background
        stars.forEach(star => { star.update(); star.draw(); });

        // Player
        player.x += (targetX - player.x) * 0.1;
        player.y += (targetY - player.y) * 0.1;
        
        // Tail
        player.tail.push({x: player.x, y: player.y});
        if (player.tail.length > 10) player.tail.shift();
        
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
        ctx.lineWidth = player.radius;
        ctx.lineCap = 'round';
        if(player.tail.length) {
            ctx.moveTo(player.tail[0].x, player.tail[0].y);
            for(let p of player.tail) ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0ea5e9';
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Enemies
        if (frameCount % Math.max(20, 60 - Math.floor(score/200)) === 0) enemies.push(new Enemy());
        enemies.forEach((enemy, i) => {
            enemy.update();
            enemy.draw();
            if (enemy.y > canvas.height + 50) {
                enemies.splice(i, 1);
                score += 10;
                if(scoreDisplay) scoreDisplay.innerText = score;
            }
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < player.radius + enemy.radius - 5) gameOver();
        });

        // Coins
        if (frameCount % 120 === 0) coins.push(new Coin());
        coins.forEach((coin, i) => {
            coin.update();
            coin.draw();
            if (coin.y > canvas.height + 50) coins.splice(i, 1);
            const dist = Math.hypot(player.x - coin.x, player.y - coin.y);
            if (dist < player.radius + coin.radius) {
                coins.splice(i, 1);
                score += 50;
                if(scoreDisplay) scoreDisplay.innerText = score;
                createExplosion(coin.x, coin.y, '#fcd34d', 5);
            }
        });

        // Particles
        particles.forEach((p, i) => {
            p.update();
            p.draw();
            if (p.alpha <= 0) particles.splice(i, 1);
        });
    }

    // Global Access
    window.initSpaceGame = () => {
        init();
        startScreen.classList.remove('hidden');
        gameOverScreen.classList.add('hidden');
    };
    window.stopSpaceGame = stopGame;

    // Button Listeners
    const startBtn = document.getElementById('btn-start-space');
    const restartBtn = document.getElementById('btn-restart-space');
    if(startBtn) startBtn.addEventListener('click', startGame);
    if(restartBtn) restartBtn.addEventListener('click', startGame);
    
    // Initial resize
    resizeCanvas();
});