(function() {
    // --- VARIABLES & CONFIG ---
    let canvas, ctx, container;
    let width, height;
    
    // Original Data
    const SONGS = [
        { id: 0, title: "Tell Your World", artist: "kz (livetune)", bpm: 150, color: "from-pink-400 to-cyan-400" },
        { id: 1, title: "World is Mine", artist: "ryo (supercell)", bpm: 165, color: "from-teal-400 to-emerald-500" },
        { id: 2, title: "Senbonzakura", artist: "Kurousa-P", bpm: 154, color: "from-rose-400 to-red-500" },
        { id: 3, title: "Ghost Rule", artist: "DECO*27", bpm: 210, color: "from-gray-600 to-gray-800" },
        { id: 4, title: "Romeo and Cinderella", artist: "doriko", bpm: 140, color: "from-purple-500 to-indigo-600" }
    ];

    const CHORDS = {
        'AM7': ['A3', 'C#4', 'E4', 'G#4'], 'B': ['B3', 'D#4', 'F#4'], 'G#m7': ['G#3', 'B3', 'D#4', 'F#4'], 'C#m7': ['C#4', 'E4', 'G#4', 'B4'],
        'Bm7': ['B3', 'D4', 'F#4', 'A4'], 'E7': ['E3', 'G#3', 'B3', 'D4'], 'G#7': ['G#3', 'C4', 'D#4', 'F#4'], 'F#m7': ['F#3', 'A3', 'C#4', 'E4'],
        'E': ['E3', 'G#3', 'B3'], 'A': ['A3', 'C#4', 'E4'], 'DbM7': ['C#4', 'F4', 'G#4', 'C5'], 'Eb': ['D#4', 'G4', 'A#4'], 'Fm': ['F3', 'G#3', 'C4'],
        'Ab': ['G#3', 'C4', 'D#4'], 'Bbm7': ['A#3', 'C#4', 'F4', 'G#4'], 'Fm7': ['F3', 'G#3', 'C4', 'D#4'], 'F#M7': ['F#3', 'A#3', 'C#4', 'F4'],
        'Bb': ['A#3', 'D4', 'F4'], 'C': ['C4', 'E4', 'G4'], 'Am7': ['A3', 'C4', 'E4', 'G4'], 'Dm': ['D4', 'F4', 'A4'], 'G': ['G3', 'B3', 'D4'],
        'Bm': ['B3', 'D4', 'F#4'], 'D': ['D4', 'F#4', 'A4'], 'Dmaj7': ['D4', 'F#4', 'A4', 'C#5'], 'A7': ['A3', 'C#4', 'E4', 'G4'],
        'C#7': ['C#4', 'F4', 'G#4', 'B4'], 'F#m': ['F#3', 'A3', 'C#4']
    };

    const MELODIES = {
        0: [{c:'AM7',d:0.8}, {c:'B',d:0.8}, {c:'G#m7',d:0.8}, {c:'C#m7',d:0.8}, {c:'AM7',d:0.8}, {c:'B',d:0.8}, {c:'C#m7',d:0.8}, {c:'Bm7',d:0.4}, {c:'E7',d:0.4}, {c:'AM7',d:0.8}, {c:'B',d:0.8}, {c:'G#7',d:0.8}, {c:'C#m7',d:0.8}, {c:'F#m7',d:0.8}, {c:'B',d:0.8}, {c:'E',d:0.8}, {c:'E7',d:0.8}],
        1: [{c:'DbM7',d:0.72}, {c:'Eb',d:0.72}, {c:'Fm',d:0.72}, {c:'Ab',d:0.72}, {c:'DbM7',d:0.72}, {c:'Bbm7',d:0.72}, {c:'Fm',d:0.72}, {c:'Ab',d:0.72}, {c:'DbM7',d:0.72}, {c:'Eb',d:0.72}, {c:'Fm',d:0.72}, {c:'DbM7',d:0.72}, {c:'Bbm7',d:0.72}, {c:'Fm7',d:0.72}, {c:'Ab',d:0.72}, {c:'F#M7',d:1.44}],
        2: [{c:'Bb',d:0.78}, {c:'C',d:0.78}, {c:'Am7',d:0.78}, {c:'Dm',d:0.78}, {c:'Bb',d:0.78}, {c:'C',d:0.78}, {c:'Dm',d:1.56}, {c:'Bb',d:0.78}, {c:'C',d:0.78}, {c:'Am7',d:0.78}, {c:'Dm',d:0.78}, {c:'Bb',d:0.78}, {c:'C',d:0.78}, {c:'Dm',d:1.56}],
        3: [{c:'G',d:0.57}, {c:'A',d:0.57}, {c:'Bm',d:1.14}, {c:'G',d:0.57}, {c:'A',d:0.57}, {c:'Bm',d:0.57}, {c:'D',d:0.57}, {c:'G',d:0.57}, {c:'A',d:0.57}, {c:'Bm',d:1.14}, {c:'G',d:0.57}, {c:'A',d:0.57}, {c:'Bm',d:0.57}, {c:'D',d:0.57}],
        4: [{c:'Bm7',d:1.7}, {c:'C#m7',d:0.86}, {c:'Dmaj7',d:0.86}, {c:'E',d:0.86}, {c:'Dmaj7',d:0.86}, {c:'E',d:0.86}, {c:'C#m7',d:0.86}, {c:'F#m7',d:0.86}, {c:'Bm7',d:0.86}, {c:'E',d:0.86}, {c:'A',d:0.86}, {c:'A7',d:0.86}, {c:'Dmaj7',d:0.86}, {c:'E',d:0.86}, {c:'C#7',d:0.86}, {c:'F#m7',d:0.86}, {c:'Bm7',d:0.86}, {c:'C#m7',d:0.86}, {c:'F#m',d:1.7}]
    };

    const noteToFreq = (note) => {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = parseInt(note.slice(-1));
        const key = note.slice(0, -1);
        const index = notes.indexOf(key);
        if(index === -1) return 440;
        const semitones = index - 9 + (octave - 4) * 12;
        return 440 * Math.pow(2, semitones / 12);
    };

    const State = {
        screen: 'entry', selectedSong: 0, difficulty: 1, speed: 6.0,
        isPlaying: false, isPaused: false, startTime: 0, audioCtx: null, 
        melodyTimer: null, melodyIdx: 0,
        score: 0, combo: 0, maxCombo: 0, hp: 1000,
        stats: { perfect:0, great:0, good:0, bad:0, miss:0 },
        chart: [], laneEffect: [0,0,0,0], inputState: [false,false,false,false], particles: []
    };

    const CONFIG = {
        LANES: 4, HIT_LINE_Y: 0.85,
        COLORS: {
            TAP: { grad: ['#38bdf8', '#0284c7'], border: '#bae6fd', shadow: 'rgba(56,189,248,0.8)' },
            CRIT: { grad: ['#facc15', '#ca8a04'], border: '#fef08a', shadow: 'rgba(250,204,21,0.8)' },
            HOLD: { grad: ['#4ade80', '#16a34a'], border: '#bbf7d0', shadow: 'rgba(74,222,128,0.8)', body: 'rgba(74,222,128,0.35)' }
        },
        WINDOWS: { PERFECT: 0.05, GREAT: 0.10, GOOD: 0.15, BAD: 0.20 }
    };

    let dom = {};

    // --- UTILS (FIXED SCREEN SWITCHING: Add display:none to hide ghost elements) ---
    function resize() {
        if (!container) return;
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function initAudio() {
        try {
            if(!State.audioCtx) {
                const AudioCtor = window.AudioContext || window.webkitAudioContext;
                if (AudioCtor) {
                    State.audioCtx = new AudioCtor();
                }
            }
            if(State.audioCtx && State.audioCtx.state === 'suspended') {
                State.audioCtx.resume();
            }
        } catch (e) {
            console.error("Audio init failed:", e);
        }
    }

    function switchScreen(name) {
        // Critical Fix: Force 'display: none' on hidden screens so they don't block clicks
        Object.values(dom.screens).forEach(el => {
            el.classList.add('sekai-hidden');
            el.style.display = 'none'; 
        });
        
        const target = dom.screens[name];
        if (target) {
            target.classList.remove('sekai-hidden');
            target.style.display = 'flex'; // Use flex to maintain layout
        }
        State.screen = name;
    }

    // --- RENDER MENU ---
    function renderSongList() {
        dom.menu.list.innerHTML = SONGS.map((s, i) => `
            <div class="sekai-song-item ${i === State.selectedSong ? 'active' : ''}" data-idx="${i}">
                <div class="song-cover bg-gradient-to-br ${s.color}"></div>
                <div><div class="font-bold text-gray-800">${s.title}</div><div class="text-xs text-gray-500">${s.artist}</div></div>
            </div>
        `).join('');
        
        dom.menu.list.querySelectorAll('.sekai-song-item').forEach(el => {
            el.addEventListener('click', () => {
                State.selectedSong = parseInt(el.dataset.idx);
                renderSongList();
                updateSongDetails();
            });
        });
    }

    function updateSongDetails() {
        const s = SONGS[State.selectedSong];
        dom.menu.title.innerText = s.title;
        dom.menu.artist.innerText = s.artist;
        dom.menu.bpm.innerText = s.bpm;
        dom.menu.cover.className = `w-32 h-32 rounded-lg shadow-lg mb-2 bg-gradient-to-br ${s.color} shrink-0`;
    }

    function generateChart() {
        const s = SONGS[State.selectedSong]; const diff = State.difficulty; const notes = [];
        const bpm = s.bpm; const beat = 60 / bpm; const duration = 90; const totalBeats = Math.floor(duration / beat);
        let seed = s.id * 100 + diff; const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
        let time = 2.0; let activeHoldEnd = 0;

        for(let i=0; i<totalBeats; i++) {
            const t = time + (i * beat);
            if(t < activeHoldEnd) continue;
            const r = random(); const barStep = i % 4; 
            let density = diff===0 ? 0.3 : (diff===1 ? 0.6 : 0.9);
            let makeNote = (barStep===0 || barStep===2) || (r < density);

            if(makeNote) {
                let isHold = (diff > 0) && (random() > 0.85);
                if(isHold) {
                    const dur = beat * (diff===2 ? 2 : 1);
                    const lane = Math.floor(random() * 4);
                    notes.push({ time: t, lane, type: 'hold', duration: dur, sound: 'synth' });
                    activeHoldEnd = t + dur + 0.1;
                } else {
                    let count = 1;
                    if((diff === 2 && random() > 0.7) || (diff === 1 && barStep === 0 && random() > 0.9)) count = 2;
                    const lane1 = Math.floor(random() * 4);
                    notes.push({ time: t, lane: lane1, type: (barStep===2?'crit':'tap'), sound: (barStep===2?'snare':'kick') });
                    if(count === 2) {
                        let lane2 = (lane1 + 1 + Math.floor(random()*2)) % 4;
                        notes.push({ time: t, lane: lane2, type: 'tap', sound: 'kick' });
                    }
                }
            }
            if(diff === 2 && random() > 0.6) {
                const t_sub = t + (beat/2);
                if(t_sub >= activeHoldEnd) notes.push({ time: t_sub, lane: Math.floor(random()*4), type: 'tap', sound: 'hat' });
            }
        }
        return notes.sort((a,b) => a.time - b.time);
    }

    // --- AUDIO SYSTEM ---
    function startMelody() {
        if(!State.audioCtx) return;
        if(State.audioCtx.state === 'suspended') State.audioCtx.resume();
        stopMelody(); State.melodyIdx = 0;
        const melody = MELODIES[State.selectedSong] || MELODIES[0];
        playNextChord(melody);
    }

    function playNextChord(melody) {
        if(!State.isPlaying || State.isPaused) return;
        const ctx = State.audioCtx;
        const step = melody[State.melodyIdx % melody.length];
        const chordName = step.c; const duration = step.d;
        const notes = CHORDS[chordName] || ['A3', 'E4'];

        notes.forEach((nStr) => {
            const freq = noteToFreq(nStr);
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            let type = 'triangle';
            if(State.selectedSong === 1 || State.selectedSong === 3) type = 'sawtooth';
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            const vol = 0.15 / notes.length;
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            if(type === 'sawtooth') {
                const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 800;
                osc.connect(filter); filter.connect(gain);
            } else { osc.connect(gain); }
            gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + duration);
        });

        State.melodyTimer = setTimeout(() => {
            State.melodyIdx++; playNextChord(melody);
        }, duration * 1000);
    }

    function stopMelody() { if(State.melodyTimer) { clearTimeout(State.melodyTimer); State.melodyTimer = null; } }

    function playSound(type, isHit=false) {
        if(!State.audioCtx) return;
        const ctx = State.audioCtx; const t = ctx.currentTime;
        if(ctx.state === 'suspended') ctx.resume();
        const gain = ctx.createGain(); gain.connect(ctx.destination);

        if(isHit) {
            const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, t);
            osc.frequency.exponentialRampToValueAtTime(100, t+0.05); gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t+0.05); osc.connect(gain); osc.start(t); osc.stop(t+0.05);
            return;
        }
        const osc = ctx.createOscillator();
        if(type === 'kick') {
            osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(0.01, t+0.3);
            gain.gain.setValueAtTime(0.7, t); gain.gain.exponentialRampToValueAtTime(0.01, t+0.3);
        } else if (type === 'snare') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(400, t); osc.frequency.exponentialRampToValueAtTime(100, t+0.1);
            gain.gain.setValueAtTime(0.5, t); gain.gain.exponentialRampToValueAtTime(0.01, t+0.1);
        } else {
            osc.type = 'sine'; osc.frequency.setValueAtTime(type==='hat'?800:600, t);
            gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.01, t+0.1);
        }
        osc.connect(gain); osc.start(t); osc.stop(t+0.3);
    }

    // --- GAMEPLAY CONTROL ---
    function startLive() {
        if(State.audioCtx && State.audioCtx.state === 'suspended') State.audioCtx.resume();
        State.chart = generateChart();
        State.chart.forEach(n => { n.hit=false; n.missed=false; n.holding=false; n.holdTicks=0; n.playedAudio=false; });
        State.score = 0; State.combo = 0; State.maxCombo = 0; State.hp = 1000;
        State.stats = { perfect:0, great:0, good:0, bad:0, miss:0 };
        State.particles = [];
        updateHUD(null);
        State.isPlaying = true; State.isPaused = false;
        State.startTime = State.audioCtx.currentTime + 2.0;
        startMelody();
        switchScreen('game');
        requestAnimationFrame(gameLoop);
    }

    function togglePause() {
        if(!State.isPlaying) return;
        State.isPaused = !State.isPaused;
        if(State.isPaused) { State.audioCtx.suspend(); stopMelody(); dom.screens.pause.classList.remove('sekai-hidden'); dom.screens.pause.style.display = 'flex'; }
        else { State.audioCtx.resume(); const melody = MELODIES[State.selectedSong] || MELODIES[0]; playNextChord(melody); dom.screens.pause.classList.add('sekai-hidden'); dom.screens.pause.style.display = 'none'; }
    }

    function retryGame() { 
        dom.screens.pause.classList.add('sekai-hidden'); dom.screens.pause.style.display = 'none';
        dom.screens.result.classList.add('sekai-hidden'); dom.screens.result.style.display = 'none';
        stopMelody(); startLive(); 
    }
    function quitGame() { State.isPlaying = false; stopMelody(); switchScreen('menu'); }

    function endGame() {
        State.isPlaying = false; stopMelody();
        dom.result.score.innerText = State.score.toLocaleString();
        dom.result.combo.innerText = State.maxCombo;
        dom.result.perfect.innerText = State.stats.perfect;
        dom.result.great.innerText = State.stats.great;
        dom.result.good.innerText = State.stats.good;
        dom.result.bad.innerText = State.stats.bad;
        dom.result.miss.innerText = State.stats.miss;
        let rank = 'D'; if(State.score > 200000) rank = 'S'; else if(State.score > 150000) rank = 'A'; else if(State.score > 100000) rank = 'B'; else if(State.score > 50000) rank = 'C';
        dom.result.rank.innerText = rank;
        switchScreen('result');
    }

    // --- DRAWING ---
    function project(lane, z) {
        const topW = width * 0.2; const botW = width * 0.9;
        const curW = topW + (botW - topW) * z;
        const x = (width/2) - (curW/2) + (curW/4)*lane + (curW/8);
        const y = z * height; return { x, y, w: curW/4 };
    }

    function drawNote(note, progress) {
        const hitY = CONFIG.HIT_LINE_Y;
        let zHead = Math.pow(progress, 3); if(note.holding) zHead = 1;
        let yHead = zHead * height * hitY; const pHead = project(note.lane, zHead * hitY);
        
        if(note.type === 'hold') {
            const scrollTime = 2.0 / (State.speed / 6.0);
            const tailProg = progress - (note.duration / scrollTime);
            let zTail = Math.pow(tailProg, 3); if(tailProg < 0) zTail = 0;
            const yTail = zTail * height * hitY; const pTail = project(note.lane, zTail * hitY);
            if(yTail < yHead) {
                ctx.fillStyle = CONFIG.COLORS.HOLD.body; ctx.beginPath();
                ctx.moveTo(pTail.x - pTail.w*0.4, yTail); ctx.lineTo(pTail.x + pTail.w*0.4, yTail);
                ctx.lineTo(pHead.x + pHead.w*0.4, yHead); ctx.lineTo(pHead.x - pHead.w*0.4, yHead);
                ctx.fill();
            }
        }
        if(note.holding) return;
        const size = 20 * (0.5 + zHead); const w = pHead.w * 0.9;
        let color = CONFIG.COLORS.TAP; if(note.type==='crit') color = CONFIG.COLORS.CRIT; if(note.type==='hold') color = CONFIG.COLORS.HOLD;
        
        const grad = ctx.createLinearGradient(0, yHead-size, 0, yHead);
        grad.addColorStop(0, color.grad[0]); grad.addColorStop(1, color.grad[1]);
        ctx.shadowBlur = 15; ctx.shadowColor = color.shadow;
        ctx.fillStyle = grad; ctx.fillRect(pHead.x - w/2, yHead - size, w, size);
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(pHead.x - w/2 + 2, yHead - size/2, w - 4, 3);
        ctx.shadowBlur = 0;
    }

    function drawJudgeLine() {
        const y = height * CONFIG.HIT_LINE_Y;
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); ctx.shadowBlur = 0;
    }

    function drawHoldBeam(lane) {
        const pBot = project(lane, CONFIG.HIT_LINE_Y); const pTop = project(lane, 0);
        const grad = ctx.createLinearGradient(0, pTop.y, 0, pBot.y);
        grad.addColorStop(0, 'rgba(74,222,128,0)'); grad.addColorStop(1, 'rgba(74,222,128,0.5)');
        ctx.fillStyle = grad; ctx.beginPath();
        ctx.moveTo(pTop.x - pTop.w/2, pTop.y); ctx.lineTo(pTop.x + pTop.w/2, pTop.y);
        ctx.lineTo(pBot.x + pBot.w/2, pBot.y); ctx.lineTo(pBot.x - pBot.w/2, pBot.y);
        ctx.fill();
    }

    function createParticle(lane, color, small=false) {
        const p = project(lane, CONFIG.HIT_LINE_Y); const n = small ? 3 : 10;
        for(let i=0; i<n; i++) { State.particles.push({ x: p.x, y: p.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-1)*15, life: 1.0, color: color }); }
    }

    function applyResult(judge) {
        if(judge === 'MISS' || judge === 'BAD') {
            State.hp = Math.max(0, State.hp - (judge==='MISS'?50:20));
            State.combo = 0;
            if(judge === 'MISS') State.stats.miss++; if(judge === 'BAD') State.stats.bad++;
        } else if(judge === 'GOOD') {
            State.combo = 0; State.score += 100; State.stats.good++;
        } else {
            State.hp = Math.min(1000, State.hp + 10); State.combo++;
            if(judge === 'PERFECT') { State.score += 500; State.stats.perfect++; }
            if(judge === 'GREAT') { State.score += 300; State.stats.great++; }
        }
        if(State.combo > State.maxCombo) State.maxCombo = State.combo;
        updateHUD(judge);
    }

    function updateHUD(judgeText) {
        dom.game.score.innerText = State.score.toString().padStart(6,'0');
        dom.game.hpFill.style.width = (State.hp / 1000 * 100) + '%';
        dom.game.hpVal.innerText = State.hp;
        if(State.combo > 0) { dom.game.combo.style.opacity = 1; dom.game.comboNum.innerText = State.combo; dom.game.comboNum.style.transform = 'scale(1.3)'; setTimeout(()=>dom.game.comboNum.style.transform='scale(1)', 80); } else { dom.game.combo.style.opacity = 0; }
        if(judgeText) {
            const j = dom.game.judge; j.innerText = judgeText; j.style.opacity = 1; j.style.transform = 'translate(-50%,-50%) scale(1.5)';
            let color = '#facc15'; if(judgeText === 'GREAT') color = '#ec4899'; if(judgeText === 'GOOD') color = '#4ade80'; if(judgeText === 'BAD') color = '#60a5fa'; if(judgeText === 'MISS') color = '#9ca3af';
            j.style.color = color; setTimeout(()=>j.style.opacity=0, 300);
        }
    }

    function gameLoop() {
        if(!State.isPlaying) return;
        requestAnimationFrame(gameLoop);
        if(State.isPaused) return;

        ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, width, height);
        
        // Draw Track
        State.laneEffect.forEach((val, i) => {
            if(val > 0) {
                State.laneEffect[i] -= 0.1;
                const p1 = project(i, 0); const p2 = project(i, 1);
                ctx.fillStyle = `rgba(255,255,255,${val * 0.2})`; ctx.beginPath();
                ctx.moveTo(p1.x - p1.w/2, p1.y); ctx.lineTo(p1.x + p1.w/2, p1.y); ctx.lineTo(p2.x + p2.w/2, p2.y); ctx.lineTo(p2.x - p2.w/2, p2.y); ctx.fill();
            }
        });
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
        for(let i=0; i<=4; i++) {
            const topX = (width/2) - (width*0.2/2) + (width*0.2/4)*i;
            const botX = (width/2) - (width*0.9/2) + (width*0.9/4)*i;
            ctx.beginPath(); ctx.moveTo(topX, 0); ctx.lineTo(botX, height); ctx.stroke();
        }

        const currentTime = State.audioCtx.currentTime; const songTime = currentTime - State.startTime; const scrollTime = 2.0 / (State.speed / 6.0);
        if(songTime > State.chart[State.chart.length-1].time + 2.0) { endGame(); return; }

        for(let i=State.chart.length-1; i>=0; i--) {
            const note = State.chart[i];
            if(note.missed || (note.hit && note.type !== 'hold') || (note.hit && note.type === 'hold' && songTime > note.time + note.duration + 0.2)) continue;
            const timeDiff = note.time - songTime; const progress = 1 - (timeDiff / scrollTime);
            if(timeDiff <= 0 && !note.playedAudio) { playSound(note.sound); note.playedAudio = true; }
            if(progress < 0) continue;
            if(!note.holding && !note.hit && timeDiff < -CONFIG.WINDOWS.BAD) { note.missed = true; applyResult('MISS'); continue; }
            if(note.holding) {
                note.holdTicks++;
                if(note.holdTicks % 5 === 0) { State.score += 20; updateHUD(); createParticle(note.lane, CONFIG.COLORS.HOLD.grad[0], true); }
                drawHoldBeam(note.lane);
            }
            drawNote(note, progress);
        }
        
        for(let i=State.particles.length-1; i>=0; i--) {
            const p = State.particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.05;
            if(p.life <= 0) { State.particles.splice(i,1); continue; }
            ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
        }

        drawJudgeLine();
        const keys = ['D', 'F', 'J', 'K']; const y = height * (CONFIG.HIT_LINE_Y + 0.05);
        ctx.font = '900 30px Nunito'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for(let i=0; i<4; i++) {
            const p = project(i, CONFIG.HIT_LINE_Y);
            if(State.inputState[i]) { ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 20; ctx.shadowColor = '#fff'; } else { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.shadowBlur = 0; }
            ctx.fillText(keys[i], p.x, y); ctx.shadowBlur = 0;
        }
    }

    // --- INPUT HANDLING ---
    function handleInput(x, y, isDown) {
        if (!container) return;
        const rect = canvas.getBoundingClientRect();
        // Calculate lane based on click position relative to canvas size
        const relativeX = x - rect.left;
        const lane = Math.floor(relativeX / (rect.width / 4));
        
        if(lane < 0 || lane > 3) return;
        if(isDown) {
            if(!State.inputState[lane]) {
                State.inputState[lane] = true; State.laneEffect[lane] = 1;
                if(State.isPlaying) checkHit(lane);
            }
        } else { State.inputState[lane] = false; if(State.isPlaying) checkRelease(lane); }
    }

    function checkHit(lane) {
        const songTime = State.audioCtx.currentTime - State.startTime;
        const note = State.chart.find(n => n.lane === lane && !n.hit && !n.missed && Math.abs(n.time - songTime) < CONFIG.WINDOWS.BAD);
        if(note) {
            const diff = Math.abs(note.time - songTime);
            let judge = 'BAD'; if(diff < CONFIG.WINDOWS.GOOD) judge = 'GOOD'; if(diff < CONFIG.WINDOWS.GREAT) judge = 'GREAT'; if(diff < CONFIG.WINDOWS.PERFECT) judge = 'PERFECT';
            if(note.type === 'hold') { note.holding = true; playSound(null, true); }
            else { note.hit = true; createParticle(lane, CONFIG.COLORS.TAP.grad[0]); applyResult(judge); playSound(null, true); }
        }
    }

    function checkRelease(lane) {
        const songTime = State.audioCtx.currentTime - State.startTime;
        const note = State.chart.find(n => n.lane === lane && n.holding);
        if(note) {
            note.holding = false;
            if(songTime >= note.time + note.duration - 0.2) { note.hit = true; createParticle(lane, CONFIG.COLORS.HOLD.grad[0]); applyResult('PERFECT'); playSound(null, true); }
            else { note.missed = true; applyResult('MISS'); }
        }
    }

    function handleKey(e, isDown) {
        if(State.screen !== 'game') return;
        if(e.repeat) return;
        const map = {'KeyD':0, 'KeyF':1, 'KeyJ':2, 'KeyK':3};
        if(map[e.code]!==undefined) {
             if (isDown) {
                 State.inputState[map[e.code]]=true; State.laneEffect[map[e.code]]=1; if(State.isPlaying) checkHit(map[e.code]); 
             } else {
                 State.inputState[map[e.code]]=false; if(State.isPlaying) checkRelease(map[e.code]);
             }
        }
    }

    // --- INITIALIZATION ---
    window.initSekaiGame = function() {
        container = document.getElementById('sekaiGameContainer');
        canvas = document.getElementById('sekaiGameCanvas');
        ctx = canvas.getContext('2d', { alpha: false });

        dom = {
            screens: { entry: document.getElementById('sekai-entry-screen'), menu: document.getElementById('sekai-menu-screen'), game: document.getElementById('sekai-game-hud'), pause: document.getElementById('sekai-pause-overlay'), result: document.getElementById('sekai-result-screen') },
            menu: { list: document.getElementById('sekai-song-list-container'), title: document.getElementById('sekai-selected-title'), artist: document.getElementById('sekai-selected-artist'), bpm: document.getElementById('sekai-selected-bpm'), cover: document.getElementById('sekai-selected-cover'), speedSlider: document.getElementById('sekai-speed-slider'), speedVal: document.getElementById('sekai-speed-val') },
            game: { score: document.getElementById('sekai-score-el'), hpFill: document.getElementById('sekai-hp-bar-fill'), hpVal: document.getElementById('sekai-hp-val'), combo: document.getElementById('sekai-combo-container'), comboNum: document.getElementById('sekai-combo-num'), judge: document.getElementById('sekai-judge-text') },
            result: { score: document.getElementById('sekai-result-score'), combo: document.getElementById('sekai-result-combo'), rank: document.getElementById('sekai-result-rank'), perfect: document.getElementById('sekai-cnt-perfect'), great: document.getElementById('sekai-cnt-great'), good: document.getElementById('sekai-cnt-good'), bad: document.getElementById('sekai-cnt-bad'), miss: document.getElementById('sekai-cnt-miss') }
        };

        // UI Bindings
        dom.screens.entry.onclick = () => { 
            initAudio(); 
            switchScreen('menu'); 
            renderSongList(); 
            updateSongDetails(); 
        };
        dom.menu.speedSlider.oninput = (e) => { State.speed = parseFloat(e.target.value); dom.menu.speedVal.innerText = State.speed.toFixed(1); };
        
        document.querySelectorAll('.sekai-diff-btn').forEach(btn => {
            btn.onclick = () => {
                State.difficulty = parseInt(btn.dataset.diff);
                document.querySelectorAll('.sekai-diff-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.diff) === State.difficulty));
            };
        });

        document.getElementById('sekai-start-btn').onclick = startLive;
        document.getElementById('sekai-pause-btn').onclick = togglePause;
        document.getElementById('sekai-resume-btn').onclick = togglePause;
        document.getElementById('sekai-retry-btn').onclick = retryGame;
        document.getElementById('sekai-quit-btn').onclick = quitGame;
        document.getElementById('sekai-res-retry-btn').onclick = retryGame;
        document.getElementById('sekai-res-next-btn').onclick = quitGame;

        // Input Listeners
        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('keydown', (e) => handleKey(e, true));
        window.addEventListener('keyup', (e) => handleKey(e, false));
        
        // Use clientX/Y directly; handleInput will normalize them
        canvas.addEventListener('mousedown', e => handleInput(e.clientX, e.clientY, true));
        canvas.addEventListener('mouseup', e => handleInput(e.clientX, e.clientY, false));
        canvas.addEventListener('touchstart', e => { e.preventDefault(); [...e.changedTouches].forEach(t => handleInput(t.clientX, t.clientY, true)); }, {passive:false});
        canvas.addEventListener('touchend', e => { e.preventDefault(); [...e.changedTouches].forEach(t => handleInput(t.clientX, t.clientY, false)); });

        // Force reset screens
        Object.values(dom.screens).forEach(el => el.style.display = 'none');
        switchScreen('entry');
    };

    window.stopSekaiGame = function() {
        State.isPlaying = false;
        stopMelody();
        // สั่งปิดระบบเสียงทันที (Kill switch)
        if(State.audioCtx) {
            try {
                State.audioCtx.close(); 
            } catch(e) { 
                // กัน Error กรณีมันปิดไปแล้ว
            }
            State.audioCtx = null; // ล้างค่าทิ้ง เพื่อให้สร้างใหม่เมื่อเข้าเกมครั้งหน้า
        }
    };
})();