(function() {
    let canvas, ctx, container;
    let animationId;
    let audioCtx;
    
    // Game State
    let isRunning = false;
    let score = 0;
    let combo = 0;
    let health = 100;
    let gameTime = 0;
    let beatTime = 0;
    let lastSpawnedBeat = 0;
    let beatCount = 0;
    
    // Config
    const BPM = 128; 
    const BEAT_INTERVAL = 60 / BPM;
    const NOTE_SPEED = 600; 
    let HIT_X = 0;
    
    const PERFECT_WINDOW = 0.08; 
    const GOOD_WINDOW = 0.18; 

    // Entities
    let notes = [];
    let particles = [];
    let shockwaves = [];
    
    const COLORS = {
        perfect: '#00ffff',
        good: '#ff00cc',
        miss: '#ff0000',
        bgLine: '#003333'
    };

    // UI Elements Refs
    let ui = {};

    function initAudio() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) {
            audioCtx = new AudioContext();
        } else if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        if (!audioCtx) return;
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'beat') {
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
            gain.gain.setValueAtTime(0.8, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            osc.start(t);
            osc.stop(t + 0.5);
        } else if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
        } else if (type === 'perfect') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.linearRampToValueAtTime(1800, t + 0.05);
            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(2400, t);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            gain2.gain.setValueAtTime(0.1, t);
            gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc2.start(t);
            osc2.stop(t + 0.3);

            osc.start(t);
            osc.stop(t + 0.3);
        } else if (type === 'miss') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.2);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
        }
    }

    class Note {
        constructor(spawnTime) {
            this.spawnTime = spawnTime;
            this.hit = false;
            this.missed = false;
        }
        getX(currentTime) {
            const timeDiff = this.spawnTime - currentTime;
            return HIT_X + (timeDiff * NOTE_SPEED);
        }
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.life = 1.0;
            this.decay = Math.random() * 0.03 + 0.02;
            this.color = color;
            this.size = Math.random() * 3 + 1;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            this.vy += 0.2; // gravity
            this.life -= this.decay;
        }
        draw(ctx) {
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    class Shockwave {
        constructor(x, y, color) {
            this.x = x; this.y = y;
            this.radius = 10; this.maxRadius = 200;
            this.alpha = 1; this.color = color;
        }
        update() {
            this.radius += 8;
            this.alpha -= 0.04;
        }
        draw(ctx) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 5 * this.alpha;
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawECG(ctx, time) {
        ctx.beginPath();
        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffaa';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        let started = false;
        // Draw optimization: Step by 3 pixels
        for (let x = 0; x <= canvas.width; x += 3) {
            const t = time + (x - HIT_X) / NOTE_SPEED;
            let y = canvas.height / 2;
            
            const adjustedT = t + 10000; 
            const phase = adjustedT % BEAT_INTERVAL;
            const normalizedPhase = phase / BEAT_INTERVAL;

            // PQRST Complex Simulation
            if (normalizedPhase > 0.1 && normalizedPhase < 0.2) {
                y -= 15 * Math.sin((normalizedPhase - 0.1) * Math.PI / 0.1);
            }
            else if (normalizedPhase > 0.2 && normalizedPhase < 0.3) {
                if (normalizedPhase < 0.22) y += 10;
                else if (normalizedPhase < 0.26) y -= 120; // R Wave
                else y += 25;
            }
            else if (normalizedPhase > 0.4 && normalizedPhase < 0.6) {
                y -= 25 * Math.sin((normalizedPhase - 0.4) * Math.PI / 0.2);
            }
            
            y += (Math.sin(x * 0.5) + Math.cos(t * 20)) * 2; // Noise

            if (!started) { ctx.moveTo(x, y); started = true; } 
            else { ctx.lineTo(x, y); }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function createExplosion(x, y, color) {
        for(let i=0; i<12; i++) {
            particles.push(new Particle(x, y, color));
        }
        shockwaves.push(new Shockwave(x, y, color));
    }

    function createFloatingText(text, x, y, color) {
        const el = document.createElement('div');
        el.innerText = text;
        el.className = 'cardio-feedback';
        el.style.color = color;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        document.getElementById('cardioGameContainer').appendChild(el);
        setTimeout(() => el.remove(), 600);
    }

    function spawnNoteLogic() {
        const spawnAheadTime = 2.0;
        const nextBeatIndex = Math.ceil((gameTime + spawnAheadTime) / BEAT_INTERVAL);
        const nextBeatTime = nextBeatIndex * BEAT_INTERVAL;

        if (nextBeatIndex > beatCount) {
            if (nextBeatIndex % 4 === 0 || Math.random() > 0.3) {
                 notes.push(new Note(nextBeatTime));
            }
            beatCount = nextBeatIndex;
        }
    }

    function update(dt) {
        gameTime += dt;
        beatTime += dt;

        if (beatTime >= BEAT_INTERVAL) {
            beatTime -= BEAT_INTERVAL;
            playSound('beat'); 
            
            container.style.transform = "scale(1.01)";
            setTimeout(() => container.style.transform = "scale(1)", 50);
            
            const hitZone = document.getElementById('cardioHitZone');
            if(hitZone) {
                hitZone.style.transform = "translate(-50%, -50%) scale(1.2)";
                setTimeout(() => hitZone.style.transform = "translate(-50%, -50%) scale(1)", 100);
            }
            
            ui.bpmDisplay.innerText = `HR: ${128 + Math.floor(Math.random() * 3)} BPM`;
        }

        spawnNoteLogic();

        for (let i = notes.length - 1; i >= 0; i--) {
            const note = notes[i];
            if (!note.hit && !note.missed) {
                if (gameTime > note.spawnTime + GOOD_WINDOW) {
                    note.missed = true;
                    handleMiss();
                    notes.splice(i, 1);
                }
            }
        }

        particles.forEach((p, i) => { p.update(); if (p.life <= 0) particles.splice(i, 1); });
        shockwaves.forEach((sw, i) => { sw.update(); if (sw.alpha <= 0) shockwaves.splice(i, 1); });

        // UI Updates
        ui.score.innerText = score.toLocaleString();
        ui.comboVal.innerText = combo;
        
        if (combo > 5) {
            ui.comboContainer.style.opacity = 1;
            ui.comboContainer.style.transform = `translate(-50%, -50%) scale(${1 + (combo % 10) * 0.05})`;
        } else {
            ui.comboContainer.style.opacity = 0;
        }

        const hpPercent = Math.max(0, health);
        ui.healthFill.style.width = hpPercent + '%';
        if (health < 30) {
            ui.healthContainer.parentElement.classList.add('cardio-critical');
        } else {
            ui.healthContainer.parentElement.classList.remove('cardio-critical');
        }

        if (health <= 0 && isRunning) gameOver();
    }

    function handleMiss() {
        health = Math.max(0, health - 15);
        combo = 0;
        createFloatingText("ARRHYTHMIA", HIT_X, canvas.height/2 - 80, COLORS.miss);
        playSound('miss');
        container.style.filter = "hue-rotate(90deg)";
        setTimeout(() => container.style.filter = "none", 100);
    }

    function handleHit() {
        if (!isRunning) return;
        
        let hitNote = null;
        let noteIndex = -1;
        let minDiff = Infinity;

        // Simple Hit Detection
        for(let i=0; i<notes.length; i++) {
            const note = notes[i];
            const diff = Math.abs(gameTime - note.spawnTime);
            if (diff <= GOOD_WINDOW && diff < minDiff) {
                minDiff = diff;
                hitNote = note;
                noteIndex = i;
            }
        }

        if (hitNote) {
            hitNote.hit = true;
            if (minDiff <= PERFECT_WINDOW) {
                score += 300 + (combo * 10);
                combo++;
                health = Math.min(100, health + 5);
                createExplosion(HIT_X, canvas.height/2, COLORS.perfect);
                createFloatingText("SINUS RHYTHM!", HIT_X, canvas.height/2 - 80, COLORS.perfect);
                playSound('perfect');
            } else {
                score += 100;
                combo++;
                health = Math.min(100, health + 2);
                createExplosion(HIT_X, canvas.height/2, COLORS.good);
                createFloatingText("GOOD", HIT_X, canvas.height/2 - 80, COLORS.good);
                playSound('hit');
            }
            notes.splice(noteIndex, 1);
        } else {
            health = Math.max(0, health - 2);
        }
    }

    function draw() {
        ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Grid
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<canvas.width; i+=100) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
        for(let i=0; i<canvas.height; i+=100) { ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); }
        ctx.stroke();

        // Heart Pulse BG
        const pulseSize = 100 + (Math.max(0, (0.3 - (beatTime / BEAT_INTERVAL))) * 50);
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.moveTo(0, -pulseSize/3);
        ctx.bezierCurveTo(pulseSize/2, -pulseSize, pulseSize, -pulseSize/4, 0, pulseSize);
        ctx.bezierCurveTo(-pulseSize, -pulseSize/4, -pulseSize/2, -pulseSize, 0, -pulseSize/3);
        ctx.fill();
        ctx.restore();

        drawECG(ctx, gameTime);
        shockwaves.forEach(sw => sw.draw(ctx));

        // Draw Notes
        ctx.shadowBlur = 0;
        notes.forEach(note => {
            const x = note.getX(gameTime);
            if (x > -50 && x < canvas.width + 50) {
                const dist = Math.abs(x - HIT_X);
                const isClose = dist < (NOTE_SPEED * GOOD_WINDOW);
                ctx.beginPath();
                ctx.arc(x, canvas.height/2, 20, 0, Math.PI * 2);
                ctx.strokeStyle = isClose ? '#ffffff' : '#00ffff';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, canvas.height/2, 10, 0, Math.PI * 2);
                ctx.fillStyle = '#003333';
                ctx.fill();
            }
        });

        // Hit Zone Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(HIT_X, 0);
        ctx.lineTo(HIT_X, canvas.height);
        ctx.stroke();

        particles.forEach(p => p.draw(ctx));
    }

    let lastTime = 0;
    function loop(timestamp) {
        if (!isRunning) return;
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        update(dt);
        draw();
        animationId = requestAnimationFrame(loop);
    }

    function resize() {
        if (!canvas) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        HIT_X = canvas.width * 0.2;
        const hitZone = document.getElementById('cardioHitZone');
        if(hitZone) hitZone.style.left = '20%';
    }

    // --- Input Handlers ---
    function handleKeyDown(e) {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault(); // Stop scrolling!
            handleHit();
        }
    }
    function handleTouchStart(e) { e.preventDefault(); handleHit(); }
    function handleMouseDown(e) { handleHit(); }

    function startGame() {
        initAudio();
        score = 0; combo = 0; health = 100;
        gameTime = 0; beatTime = 0; beatCount = 0;
        notes = []; particles = []; shockwaves = [];
        
        ui.startScreen.style.display = 'none';
        ui.tapZone.style.display = 'block';
        ui.healthContainer.parentElement.classList.remove('cardio-critical');
        
        isRunning = true;
        lastTime = performance.now();
        loop(lastTime);
    }

    function gameOver() {
        isRunning = false;
        cancelAnimationFrame(animationId);
        ui.startScreen.style.display = 'flex';
        ui.tapZone.style.display = 'none';
        
        // Change content of start screen to Game Over message
        ui.startScreen.innerHTML = `
            <h1 style="font-size: 4rem; color:#ff0055; margin-bottom: 0;">ASYSTOLE</h1>
            <p class="text-gray-400 mb-4 text-xl">PATIENT LOST</p>
            <div class="text-4xl font-bold text-white mb-8 border-b-2 border-red-500 pb-2">SCORE: ${score.toLocaleString()}</div>
            <button id="cardioRetryBtn" class="cardio-btn-start">DEFIBRILLATE (RETRY)</button>
        `;
        
        // Re-bind retry button since innerHTML wiped the old one
        document.getElementById('cardioRetryBtn').addEventListener('click', () => {
            // Restore Start Screen
            ui.startScreen.innerHTML = `
                <h1 class="cardio-title">CARDIO<br>BEAT</h1>
                <p class="text-cyan-200 tracking-widest text-xl mb-2 font-bold font-orbitron">MEDICAL TECHNO RHYTHM</p>
                <p class="text-gray-400 mb-8 text-sm">SYNC YOUR INPUT WITH THE R-WAVE</p>
                <div class="grid grid-cols-2 gap-8 text-center text-sm text-blue-300 mb-8 border border-gray-800 p-6 rounded bg-black/50">
                    <div><div class="text-white font-bold text-lg mb-1">DESKTOP</div><div>Spacebar / Mouse Click</div></div>
                    <div><div class="text-white font-bold text-lg mb-1">MOBILE</div><div>Tap Anywhere</div></div>
                </div>
                <button id="cardioBtnStart" class="cardio-btn-start">INITIALIZE SYSTEM</button>
            `;
            // Re-bind start
            document.getElementById('cardioBtnStart').addEventListener('click', startGame);
            startGame();
        });
    }

    // --- Global Methods for Main.js ---
    window.initCardioGame = function() {
        if (typeof window.stopCardioGame === 'function') window.stopCardioGame();
        container = document.getElementById('cardioGameContainer');
        canvas = document.getElementById('cardioGameCanvas');
        ctx = canvas.getContext('2d');
        
        // Bind UI
        ui = {
            score: document.getElementById('cardioScore'),
            comboVal: document.getElementById('cardioComboVal'),
            comboContainer: document.getElementById('cardioComboContainer'),
            startScreen: document.getElementById('cardioStartScreen'),
            tapZone: document.getElementById('cardioTapZone'),
            healthFill: document.getElementById('cardioHealthFill'),
            healthContainer: document.getElementById('cardioHealthContainer'),
            btnStart: document.getElementById('cardioBtnStart'),
            bpmDisplay: document.getElementById('cardioBpmDisplay')
        };

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('keydown', handleKeyDown);
        ui.tapZone.addEventListener('touchstart', handleTouchStart, {passive:false});
        ui.tapZone.addEventListener('mousedown', handleMouseDown);
        
        // Initial Start Binding
        if(ui.btnStart) ui.btnStart.onclick = startGame;
    };

    window.stopCardioGame = function() {
        isRunning = false;
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', handleKeyDown);
        if(ui.tapZone) {
            ui.tapZone.removeEventListener('touchstart', handleTouchStart);
            ui.tapZone.removeEventListener('mousedown', handleMouseDown);
        }
        if(audioCtx) audioCtx.suspend();
    };
})();