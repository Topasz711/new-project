// test/immuneGame.js - Remastered Version
(function() {
    let canvas, ctx;
    let animationId;
    let score = 0;
    let health = 100;
    let gameActive = false;
    let frameCount = 0;
    let difficultyMultiplier = 1;

    // UI Elements
    let scoreEl, startModal, gameOverModal, startBtn, restartBtn, finalScoreDisplay, healthEl;

    // Input State
    let keys = { w: false, a: false, s: false, d: false };
    let mouse = { x: 0, y: 0 };
    let joystick = { active: false, x: 0, y: 0, originX: 0, originY: 0, id: null };

    // Game Objects
    let player;
    let projectiles = [];
    let enemies = [];
    let particles = [];
    let shockwaves = [];
    let bgParticles = [];

    // --- Classes ---
    class BackgroundParticle {
        constructor(w, h) {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.radius = Math.random() * 2 + 0.5;
            this.alpha = Math.random() * 0.3 + 0.05;
            this.velocity = {
                x: (Math.random() - 0.5) * 0.2,
                y: (Math.random() - 0.5) * 0.2
            };
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 200, 255, ${this.alpha})`;
            ctx.fill();
        }
        update() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
            this.draw();
        }
    }

    class Player {
        constructor(x, y, radius) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.angle = 0;
            this.wobblePhase = 0;
            this.speed = 4;
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            
            // Organic Wobbly Membrane
            ctx.beginPath();
            const points = 20;
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const wobble = Math.sin(angle * 5 + this.wobblePhase) * 2;
                const r = this.radius + wobble;
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            
            const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.2, 0, 0, this.radius);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#00ffff');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
            
            ctx.fillStyle = gradient;
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#00ffff';
            ctx.fill();

            // Nucleus Core
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            // Pseudopod Launcher
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(this.radius + 15, 0); 
            ctx.lineTo(0, 5);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fill();
            
            ctx.restore();
        }
        update() {
            let dx = 0; let dy = 0;
            if (keys.w) dy -= 1;
            if (keys.s) dy += 1;
            if (keys.a) dx -= 1;
            if (keys.d) dx += 1;

            if (joystick.active) {
                dx = joystick.x;
                dy = joystick.y;
            }

            const mag = Math.hypot(dx, dy);
            if (mag > 0.1) {
                const speedMultiplier = joystick.active ? 1 : (1 / mag);
                this.x += dx * speedMultiplier * this.speed;
                this.y += dy * speedMultiplier * this.speed;
            }

            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

            const angleDx = mouse.x - this.x;
            const angleDy = mouse.y - this.y;
            this.angle = Math.atan2(angleDy, angleDx);
            
            this.wobblePhase += 0.1;
            this.draw();
        }
    }

    class Projectile {
        constructor(x, y, velocity) {
            this.x = x;
            this.y = y;
            this.radius = 5;
            this.velocity = velocity;
            this.angle = Math.atan2(velocity.y, velocity.x);
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.strokeStyle = '#ffd700'; 
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffd700';
            ctx.moveTo(-10, 0);
            ctx.lineTo(0, 0);
            ctx.lineTo(10, -8);
            ctx.moveTo(0, 0);
            ctx.lineTo(10, 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI*2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();
        }
        update() {
            this.draw();
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            if (Math.random() < 0.3) {
                 particles.push(new Particle(this.x, this.y, Math.random()*2, 'rgba(255, 215, 0, 0.4)', {x:0, y:0}, 0.3));
            }
        }
    }

    class Enemy {
        constructor(x, y, radius, color) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = color;
            this.velocity = {x:0, y:0};
            this.spikeCount = Math.floor(Math.random() * 4) + 6;
            this.spin = 0;
            this.spinSpeed = (Math.random() - 0.5) * 0.05;
            this.pulse = 0;
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            this.spin += this.spinSpeed;
            this.pulse += 0.1;
            ctx.rotate(this.spin);
            const pulseScale = 1 + Math.sin(this.pulse) * 0.05;
            ctx.scale(pulseScale, pulseScale);
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            for (let i = 0; i < this.spikeCount; i++) {
                const angle = (i / this.spikeCount) * Math.PI * 2;
                const innerR = this.radius * 0.5;
                const outerR = this.radius;
                const x_outer = Math.cos(angle) * outerR;
                const y_outer = Math.sin(angle) * outerR;
                const x_inner = Math.cos(angle + Math.PI/this.spikeCount) * innerR;
                const y_inner = Math.sin(angle + Math.PI/this.spikeCount) * innerR;
                if (i===0) ctx.moveTo(x_outer, y_outer);
                else ctx.quadraticCurveTo(x_inner*1.2, y_inner*1.2, x_outer, y_outer);
                ctx.lineTo(x_inner, y_inner);
            }
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#111';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.1, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fill();
            ctx.restore();
        }
        update() {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            const speed = (Math.random() * 1.5 + 1) * difficultyMultiplier;
            this.velocity.x = Math.cos(angle) * speed;
            this.velocity.y = Math.sin(angle) * speed;
            this.draw();
            this.x += this.velocity.x;
            this.y += this.velocity.y;
        }
    }

    class Particle {
        constructor(x, y, radius, color, velocity, life = 1) {
            this.x = x; this.y = y; this.radius = radius; this.color = color;
            this.velocity = velocity; this.alpha = life;
            this.decay = Math.random() * 0.02 + 0.015;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
        update() {
            this.draw();
            this.velocity.x *= 0.95;
            this.velocity.y *= 0.95;
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.alpha -= this.decay;
        }
    }

    class Shockwave {
        constructor(x, y, color) {
            this.x = x; this.y = y; this.radius = 5; this.color = color; this.alpha = 1;
        }
        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = this.alpha;
            ctx.stroke();
            ctx.restore();
        }
        update() {
            this.draw();
            this.radius += 2;
            this.alpha -= 0.05;
        }
    }

    // --- Core Logic ---
    function spawnEnemies() {
        const spawnRate = Math.max(25, 90 - Math.floor(score / 50)); 
        if (frameCount % spawnRate === 0) {
            const radius = Math.random() * 10 + 20;
            let x, y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
                y = Math.random() * canvas.height;
            } else {
                x = Math.random() * canvas.width;
                y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
            }
            const color = Math.random() > 0.5 ? '#ff0055' : '#bf00ff'; 
            enemies.push(new Enemy(x, y, radius, color));
        }
    }

    function createExplosion(x, y, color, count) {
         for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, Math.random() * 3 + 1, color, {
                x: (Math.random() - 0.5) * (Math.random() * 8),
                y: (Math.random() - 0.5) * (Math.random() * 8)
            }));
        }
    }

    function drawJoystick() {
        ctx.beginPath();
        ctx.arc(joystick.originX, joystick.originY, 40, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(joystick.originX + joystick.x * 40, joystick.originY + joystick.y * 40, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fill();
    }

    function animate() {
        if (!gameActive) return;
        animationId = requestAnimationFrame(animate);
        frameCount++;
        if (frameCount % 600 === 0) difficultyMultiplier += 0.1;

        ctx.fillStyle = 'rgba(5, 5, 10, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        bgParticles.forEach(p => p.update());
        player.update();

        particles.forEach((p, i) => { if (p.alpha <= 0) particles.splice(i, 1); else p.update(); });
        shockwaves.forEach((s, i) => { if (s.alpha <= 0) shockwaves.splice(i, 1); else s.update(); });

        projectiles.forEach((p, i) => {
            p.update();
            if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                setTimeout(() => projectiles.splice(i, 1), 0);
            }
        });

        enemies.forEach((enemy, index) => {
            enemy.update();
            const distPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (distPlayer - enemy.radius - player.radius < 1) {
                createExplosion(enemy.x, enemy.y, enemy.color, 15);
                enemies.splice(index, 1);
                health -= 20;
                healthEl.style.width = `${health}%`;
                ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                ctx.fillRect(0,0,canvas.width, canvas.height);
                if (health <= 30) healthEl.style.background = 'linear-gradient(90deg, #ff3333, #ff0000)';
                if (health <= 0) {
                    gameActive = false;
                    cancelAnimationFrame(animationId);
                    finalScoreDisplay.innerText = `Viruses Eliminated: ${score}`;
                    gameOverModal.classList.remove('hidden');
                }
            }
            projectiles.forEach((p, pIndex) => {
                const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
                if (dist - enemy.radius - p.radius < 5) {
                    createExplosion(p.x, p.y, enemy.color, 10);
                    shockwaves.push(new Shockwave(enemy.x, enemy.y, enemy.color));
                    enemies.splice(index, 1);
                    projectiles.splice(pIndex, 1);
                    score += 10;
                    scoreEl.innerText = score;
                }
            });
        });
        spawnEnemies();
        if (joystick.active) drawJoystick();
    }

    function resetGame() {
        player = new Player(canvas.width / 2, canvas.height / 2, 25);
        projectiles = [];
        enemies = [];
        particles = [];
        shockwaves = [];
        bgParticles = [];
        for(let i=0; i<50; i++) bgParticles.push(new BackgroundParticle(canvas.width, canvas.height));
        score = 0;
        health = 100;
        difficultyMultiplier = 1;
        frameCount = 0;
        scoreEl.innerText = score;
        healthEl.style.width = '100%';
        healthEl.style.background = 'linear-gradient(90deg, #00ffaa, #00ffff)';
        gameActive = true;
        animate();
    }

    // --- Event Handlers (Named for removal) ---
    function handleKeyDown(e) {
        if(!gameActive) return;
        // ใช้ e.code เพื่อเช็กปุ่มโดยไม่สนภาษา (KeyW, ArrowUp)
        switch(e.code) {
            case 'KeyW': case 'ArrowUp': keys.w = true; break;
            case 'KeyA': case 'ArrowLeft': keys.a = true; break;
            case 'KeyS': case 'ArrowDown': keys.s = true; break;
            case 'KeyD': case 'ArrowRight': keys.d = true; break;
        }
    }
    
    function handleKeyUp(e) {
        switch(e.code) {
            case 'KeyW': case 'ArrowUp': keys.w = false; break;
            case 'KeyA': case 'ArrowLeft': keys.a = false; break;
            case 'KeyS': case 'ArrowDown': keys.s = false; break;
            case 'KeyD': case 'ArrowRight': keys.d = false; break;
        }
    }
    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }
    function handleMouseDown(e) {
        if (!gameActive) return;
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        const velocity = { x: Math.cos(angle) * 15, y: Math.sin(angle) * 15 };
        projectiles.push(new Projectile(player.x, player.y, velocity));
    }
    // Touch events for mobile are tricky to remove if anonymous, so simplified for this structure:
    function handleTouchStart(e) {
         if (!gameActive) return;
         // Prevent default only if inside canvas to allow page scroll elsewhere if needed
         if(e.target === canvas) e.preventDefault();
         const rect = canvas.getBoundingClientRect();
         for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            const tx = t.clientX - rect.left;
            const ty = t.clientY - rect.top;
            if (tx < canvas.width / 2) {
                joystick.id = t.identifier;
                joystick.active = true;
                joystick.originX = tx;
                joystick.originY = ty;
                joystick.x = 0; joystick.y = 0;
            } else {
                mouse.x = tx; mouse.y = ty;
                const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
                projectiles.push(new Projectile(player.x, player.y, { x: Math.cos(angle) * 15, y: Math.sin(angle) * 15 }));
            }
        }
    }
    function handleTouchMove(e) {
        if (!gameActive) return;
        if(e.target === canvas) e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (joystick.active && t.identifier === joystick.id) {
                const tx = t.clientX - rect.left;
                const ty = t.clientY - rect.top;
                const dx = tx - joystick.originX;
                const dy = ty - joystick.originY;
                const dist = Math.hypot(dx, dy);
                const maxDist = 40;
                const clampedDist = Math.min(dist, maxDist);
                const angle = Math.atan2(dy, dx);
                joystick.x = (Math.cos(angle) * clampedDist) / maxDist;
                joystick.y = (Math.sin(angle) * clampedDist) / maxDist;
            } else {
                 const tx = t.clientX - rect.left;
                 if (tx >= canvas.width / 2) {
                     mouse.x = tx; 
                     mouse.y = t.clientY - rect.top;
                 }
            }
        }
    }
    function handleTouchEnd(e) {
        if(e.target === canvas) e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (joystick.active && e.changedTouches[i].identifier === joystick.id) {
                joystick.active = false; joystick.x = 0; joystick.y = 0;
            }
        }
    }

    // --- Global Methods ---
    window.initImmuneGame = function() {
        canvas = document.getElementById('immuneGameCanvas');
        ctx = canvas.getContext('2d');
        scoreEl = document.getElementById('immuneScoreEl');
        healthEl = document.getElementById('immuneHealthEl');
        startModal = document.getElementById('immuneStartModal');
        gameOverModal = document.getElementById('immuneGameOverModal');
        startBtn = document.getElementById('immuneStartBtn');
        restartBtn = document.getElementById('immuneRestartBtn');
        finalScoreDisplay = document.getElementById('immuneFinalScoreDisplay');
        
        // Reset container size
        const container = document.getElementById('immuneGameContainer');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        startModal.classList.remove('hidden');
        gameOverModal.classList.add('hidden');
        gameActive = false; // Wait for start button

        // Attach Events
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
        canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
        canvas.addEventListener('touchend', handleTouchEnd, {passive: false});

        startBtn.onclick = () => {
            startModal.classList.add('hidden');
            resetGame();
        };
        restartBtn.onclick = () => {
            gameOverModal.classList.add('hidden');
            resetGame();
        };
    };

    window.stopImmuneGame = function() {
        gameActive = false;
        cancelAnimationFrame(animationId);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if(canvas) {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        }
    };
})();