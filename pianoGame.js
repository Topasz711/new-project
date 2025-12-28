// pianoGame.js - Final Fix: Properly Remove Event Listeners
(function() {
    let audioContextRef = { current: null };
    let activeOscillators = new Map();
    let sequenceTimeouts = [];
    let isPlaying = false;
    let isInputFocused = false;
    let currentSong = null;
    let playbackSpeed = 1.1;
    let isMouseDown = false;
    let lastTouchedKey = null;

    const noteFrequencies = {
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
        'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
        'A#4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33,
        'D#5': 622.25, 'E5': 659.25, 'F5': 698.46
    };

    const keyMappings = {
        'KeyA': 'C4', 'KeyW': 'C#4', 'KeyS': 'D4', 'KeyE': 'D#4', 'KeyD': 'E4',
        'KeyF': 'F4', 'KeyT': 'F#4', 'KeyG': 'G4', 'KeyY': 'G#4', 'KeyH': 'A4',
        'KeyU': 'A#4', 'KeyJ': 'B4', 'KeyK': 'C5', 'KeyO': 'C#5', 'KeyL': 'D5',
        'KeyP': 'D#5', 'Semicolon': 'E5', 'Quote': 'F5'
    };

    const keyStructure = [
        { white: 'C4', black: 'C#4', keyW: 'A', keyB: 'W' },
        { white: 'D4', black: 'D#4', keyW: 'S', keyB: 'E' },
        { white: 'E4', black: null,   keyW: 'D', keyB: null },
        { white: 'F4', black: 'F#4', keyW: 'F', keyB: 'T' },
        { white: 'G4', black: 'G#4', keyW: 'G', keyB: 'Y' },
        { white: 'A4', black: 'A#4', keyW: 'H', keyB: 'U' },
        { white: 'B4', black: null,   keyW: 'J', keyB: null },
        { white: 'C5', black: 'C#5', keyW: 'K', keyB: 'O' },
        { white: 'D5', black: 'D#5', keyW: 'L', keyB: 'P' },
        { white: 'E5', black: null,   keyW: ';', keyB: null },
        { white: 'F5', black: null,   keyW: "'", keyB: null }
    ];

    const SONG_LIBRARY = {
        "happy birthday": {
            title: "Happy Birthday",
            notes: [
                { note: "C4", duration: 0.4, time: 0 }, { note: "C4", duration: 0.4, time: 0.5 },
                { note: "D4", duration: 0.8, time: 1 }, { note: "C4", duration: 0.8, time: 2 },
                { note: "F4", duration: 0.8, time: 3 }, { note: "E4", duration: 1.5, time: 4 },
                { note: "C4", duration: 0.4, time: 6 }, { note: "C4", duration: 0.4, time: 6.5 },
                { note: "D4", duration: 0.8, time: 7 }, { note: "C4", duration: 0.8, time: 8 },
                { note: "G4", duration: 0.8, time: 9 }, { note: "F4", duration: 1.5, time: 10 }
            ]
        },
        "star wars": {
            title: "Star Wars",
            notes: [
                { note: "C4", duration: 0.3, time: 0 }, { note: "C4", duration: 0.3, time: 0.35 },
                { note: "C4", duration: 0.3, time: 0.7 }, { note: "G4", duration: 1.5, time: 1.2 },
                { note: "D5", duration: 1.5, time: 3 }, { note: "C5", duration: 0.25, time: 4.8 },
                { note: "B4", duration: 0.25, time: 5.1 }, { note: "A4", duration: 0.25, time: 5.4 },
                { note: "G5", duration: 1.5, time: 5.8 }, { note: "D5", duration: 0.8, time: 7.6 },
                { note: "C5", duration: 0.25, time: 8.6 }, { note: "B4", duration: 0.25, time: 8.9 },
                { note: "A4", duration: 0.25, time: 9.2 }, { note: "G5", duration: 1.5, time: 9.6 },
                { note: "D5", duration: 0.8, time: 11.4 }, { note: "C5", duration: 0.25, time: 12.4 },
                { note: "B4", duration: 0.25, time: 12.7 }, { note: "C5", duration: 0.25, time: 13.0 },
                { note: "A4", duration: 1.5, time: 13.4 }
            ]
        },
        "twinkle": {
            title: "Twinkle Twinkle",
            notes: [
                { note: "C4", duration: 0.4, time: 0 }, { note: "C4", duration: 0.4, time: 0.5 },
                { note: "G4", duration: 0.4, time: 1 }, { note: "G4", duration: 0.4, time: 1.5 },
                { note: "A4", duration: 0.4, time: 2 }, { note: "A4", duration: 0.4, time: 2.5 },
                { note: "G4", duration: 0.8, time: 3 }, { note: "F4", duration: 0.4, time: 4 },
                { note: "F4", duration: 0.4, time: 4.5 }, { note: "E4", duration: 0.4, time: 5 },
                { note: "E4", duration: 0.4, time: 5.5 }, { note: "D4", duration: 0.4, time: 6 },
                { note: "D4", duration: 0.4, time: 6.5 }, { note: "C4", duration: 0.8, time: 7 }
            ]
        },
        "mario": {
            title: "Super Mario",
            notes: [
                { note: "E5", duration: 0.15, time: 0 }, { note: "E5", duration: 0.15, time: 0.3 },
                { note: "E5", duration: 0.15, time: 0.6 }, { note: "C5", duration: 0.15, time: 0.8 },
                { note: "E5", duration: 0.3, time: 1.0 }, { note: "G5", duration: 0.3, time: 1.4 },
                { note: "G4", duration: 0.3, time: 2.0 }
            ]
        }
    };

    // --- Separate Handlers for Proper Removal (FIXED) ---
    // แยกฟังก์ชันออกมา เพื่อให้ removeEventListener ทำงานได้จริง
    const handleKeyDown = (e) => {
        if (isInputFocused || e.repeat) return;
        const note = keyMappings[e.code];
        if (note) startNote(note);
    };

    const handleKeyUp = (e) => {
        if (isInputFocused) return;
        const note = keyMappings[e.code];
        if (note) stopNote(note);
    };
    // ----------------------------------------------------

    function renderKeys() {
        const whiteContainer = document.getElementById('white-keys-container');
        const blackContainer = document.getElementById('black-keys-container');
        if(!whiteContainer || !blackContainer) return;
        
        whiteContainer.innerHTML = '';
        blackContainer.innerHTML = '';

        keyStructure.forEach((group) => {
            const whiteBtn = document.createElement('div');
            whiteBtn.className = "flex-1 h-full relative group px-[1px] sm:px-[2px]";
            whiteBtn.innerHTML = `
                <button id="key-${group.white}" class="w-full h-full bg-white/90 rounded-b-lg sm:rounded-b-xl border-b-4 border-l border-r border-white/20 shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_-10px_20px_rgba(255,255,255,0.8)] active:scale-[0.98] transition-all flex flex-col justify-end items-center pb-4 select-none touch-none relative overflow-hidden">
                    <span class="text-xs sm:text-sm font-bold mb-1 uppercase text-gray-400 pointer-events-none tracking-wider">${group.keyW}</span>
                    <span class="text-[8px] sm:text-[10px] font-mono font-bold text-cyan-600/60 pointer-events-none">${group.white}</span>
                    <div class="glass-reflection absolute top-2 left-2 right-2 h-1/2 bg-gradient-to-b from-white/80 to-transparent rounded-md pointer-events-none opacity-50"></div>
                </button>
            `;
            whiteContainer.appendChild(whiteBtn);

            const blackSlot = document.createElement('div');
            blackSlot.className = "flex-1 h-full relative pointer-events-none";
            
            if (group.black) {
                const blackBtn = document.createElement('button');
                blackBtn.id = `key-${group.black}`;
                blackBtn.className = "absolute top-0 right-0 translate-x-1/2 w-[60%] h-[60%] bg-gradient-to-b from-gray-700 via-gray-900 to-black rounded-b-lg border-x border-b border-gray-600 shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-20 pointer-events-auto flex flex-col justify-end items-center pb-3 active:scale-95 transition-transform touch-none";
                blackBtn.innerHTML = `
                    <span class="text-[8px] sm:text-[10px] font-bold mb-0.5 text-gray-400 pointer-events-none">${group.keyB}</span>
                    <span class="text-[6px] sm:text-[8px] font-mono text-gray-500 pointer-events-none">${group.black}</span>
                    <div class="glass-reflection absolute top-1 left-1 right-1 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-sm pointer-events-none"></div>
                `;
                addKeyListeners(blackBtn, group.black);
                blackSlot.appendChild(blackBtn);
            }
            blackContainer.appendChild(blackSlot);

            addKeyListeners(whiteBtn.firstElementChild, group.white);
        });
    }

    function initAudio() {
        if (!audioContextRef.current) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioContext();
            } catch (error) { console.error(error); }
        }
        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
    }

    function startNote(note) {
        initAudio();
        if (!audioContextRef.current || activeOscillators.has(note)) return;
        const context = audioContextRef.current;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(noteFrequencies[note], context.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        const now = context.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        oscillator.start(now);
        activeOscillators.set(note, { oscillator, gainNode });
        updateKeyVisual(note, true);
    }

    function stopNote(note) {
        const active = activeOscillators.get(note);
        if (active && audioContextRef.current) {
            const { oscillator, gainNode } = active;
            const now = audioContextRef.current.currentTime;
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            oscillator.stop(now + 0.1);
            activeOscillators.delete(note);
            updateKeyVisual(note, false);
        }
    }

    function playTone(note, duration) {
        initAudio();
        if (!audioContextRef.current) return;
        const context = audioContextRef.current;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(noteFrequencies[note], context.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        const now = context.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        oscillator.start(now);
        updateKeyVisual(note, true);
        setTimeout(() => {
            const releaseTime = context.currentTime;
            gainNode.gain.cancelScheduledValues(releaseTime);
            gainNode.gain.setValueAtTime(gainNode.gain.value, releaseTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, releaseTime + 0.1);
            oscillator.stop(releaseTime + 0.1);
            updateKeyVisual(note, false);
        }, duration * 1000 * 0.9);
    }

    function addKeyListeners(element, note) {
        element.addEventListener('mousedown', (e) => { e.preventDefault(); isMouseDown = true; startNote(note); });
        element.addEventListener('mouseenter', (e) => { if (isMouseDown) startNote(note); });
        element.addEventListener('mouseleave', () => { if (activeOscillators.has(note)) stopNote(note); });
        element.addEventListener('mouseup', () => { if (activeOscillators.has(note)) stopNote(note); });
    }

    function handleGlobalMouseUp() {
        isMouseDown = false;
        activeOscillators.forEach((_, note) => stopNote(note));
    }

    function handleTouchStart(e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const keyBtn = target?.closest('button');
            if (keyBtn && keyBtn.id.startsWith('key-')) {
                startNote(keyBtn.id.replace('key-', ''));
            }
        }
    }

    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const keyBtn = target?.closest('button');
        if (keyBtn && keyBtn.id.startsWith('key-')) {
            const note = keyBtn.id.replace('key-', '');
            if (lastTouchedKey !== note) {
                if (lastTouchedKey) stopNote(lastTouchedKey);
                startNote(note);
                lastTouchedKey = note;
            }
        } else if (lastTouchedKey) {
            stopNote(lastTouchedKey);
            lastTouchedKey = null;
        }
    }

    function handleTouchEnd(e) { e.preventDefault(); activeOscillators.forEach((_, note) => stopNote(note)); lastTouchedKey = null; }

    function updateKeyVisual(note, isActive) {
        const keyEl = document.getElementById(`key-${note}`);
        if (!keyEl) return;
        const isWhite = !note.includes('#');
        const reflection = keyEl.querySelector('.glass-reflection');
        const labelKey = keyEl.querySelector('span:first-child');
        const labelNote = keyEl.querySelector('span:nth-child(2)');

        if (isActive) {
            if (isWhite) {
                keyEl.classList.remove('bg-white/90', 'border-white/20', 'shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_-10px_20px_rgba(255,255,255,0.8)]');
                keyEl.classList.add('bg-gradient-to-b', 'from-cyan-200/90', 'to-blue-300/90', 'shadow-[0_0_30px_rgba(6,182,212,0.6)]', 'border-cyan-300');
                if(labelKey) { labelKey.classList.remove('text-gray-400'); labelKey.classList.add('text-blue-900'); }
                if(labelNote) { labelNote.classList.remove('text-cyan-600/60'); labelNote.classList.add('text-blue-800'); }
            } else {
                keyEl.classList.remove('from-gray-700', 'via-gray-900', 'to-black', 'border-gray-600', 'shadow-[0_10px_20px_rgba(0,0,0,0.5)]');
                keyEl.classList.add('from-fuchsia-500', 'to-purple-600', 'shadow-[0_0_25px_rgba(219,39,119,0.8)]', 'border-fuchsia-900');
                if(labelKey) { labelKey.classList.remove('text-gray-400'); labelKey.classList.add('text-white'); }
            }
            keyEl.style.transform = isWhite ? 'translateY(2px)' : 'translate(50%, 2px)';
            if(reflection) reflection.style.opacity = '0';
        } else {
            if (isWhite) {
                keyEl.classList.add('bg-white/90', 'border-white/20', 'shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_-10px_20px_rgba(255,255,255,0.8)]');
                keyEl.classList.remove('bg-gradient-to-b', 'from-cyan-200/90', 'to-blue-300/90', 'shadow-[0_0_30px_rgba(6,182,212,0.6)]', 'border-cyan-300');
                if(labelKey) { labelKey.classList.add('text-gray-400'); labelKey.classList.remove('text-blue-900'); }
                if(labelNote) { labelNote.classList.add('text-cyan-600/60'); labelNote.classList.remove('text-blue-800'); }
            } else {
                keyEl.classList.add('from-gray-700', 'via-gray-900', 'to-black', 'border-gray-600', 'shadow-[0_10px_20px_rgba(0,0,0,0.5)]');
                keyEl.classList.remove('from-fuchsia-500', 'to-purple-600', 'shadow-[0_0_25px_rgba(219,39,119,0.8)]', 'border-fuchsia-900');
                if(labelKey) { labelKey.classList.add('text-gray-400'); labelKey.classList.remove('text-white'); }
            }
            keyEl.style.transform = isWhite ? 'none' : 'translateX(50%)';
            if(reflection) reflection.style.opacity = '0.5';
        }
    }

    function renderSongLibrary() {
        const container = document.getElementById('song-library-container');
        if(!container) return;
        container.innerHTML = '';
        Object.values(SONG_LIBRARY).forEach(song => {
            const btn = document.createElement('button');
            btn.className = "px-5 py-2 bg-white/5 hover:bg-white/20 text-cyan-100 border border-white/10 rounded-full text-xs font-bold tracking-wide transition-all shadow-lg backdrop-blur-sm";
            btn.textContent = song.title.toUpperCase();
            btn.onclick = () => {
                stopSong();
                currentSong = song;
                document.getElementById('player-status').classList.remove('hidden');
                document.getElementById('current-song-title').textContent = song.title;
                document.getElementById('current-song-notes').textContent = `${song.notes.length} NOTES`;
                updatePlayButtonState();
                setTimeout(() => playParsedSong(song), 100);
            };
            container.appendChild(btn);
        });
    }

    function playParsedSong(songData) {
        if (!songData) return;
        stopSong(); isPlaying = true; updatePlayButtonState();
        const adjustedNotes = songData.notes.map(note => ({ ...note, time: note.time / playbackSpeed, duration: note.duration / playbackSpeed }));
        adjustedNotes.forEach(note => { sequenceTimeouts.push(setTimeout(() => { if(isPlaying) playTone(note.note, note.duration); }, note.time * 1000)); });
        const totalDuration = Math.max(...adjustedNotes.map(n => n.time + n.duration));
        sequenceTimeouts.push(setTimeout(() => { isPlaying = false; updatePlayButtonState(); }, (totalDuration + 0.5) * 1000));
    }

    function stopSong() { isPlaying = false; sequenceTimeouts.forEach(clearTimeout); sequenceTimeouts = []; updatePlayButtonState(); }
    function togglePlay() { if (isPlaying) stopSong(); else if (currentSong) playParsedSong(currentSong); }
    
    function updatePlayButtonState() {
        const btn = document.getElementById('play-stop-btn');
        const iconSpan = document.getElementById('btn-icon');
        const textSpan = document.getElementById('btn-text');
        const indicator = document.getElementById('status-indicator');
        if (!btn) return;
        if (isPlaying) {
            iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>';
            textSpan.textContent = "STOP";
            indicator.className = "w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_currentColor]";
        } else {
            iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
            textSpan.textContent = "PLAY";
            indicator.className = "w-3 h-3 rounded-full bg-gray-500";
        }
    }

    window.initPianoGame = function() {
        renderKeys();
        renderSongLibrary();
        
        // --- Fixed: Add Listeners by Reference ---
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        // -----------------------------------------

        window.addEventListener('mouseup', handleGlobalMouseUp);

        const pianoArea = document.getElementById('piano-keys-area');
        if(pianoArea) {
            pianoArea.addEventListener('touchstart', handleTouchStart, {passive: false});
            pianoArea.addEventListener('touchmove', handleTouchMove, {passive: false});
            pianoArea.addEventListener('touchend', handleTouchEnd);
        }

        const hint = document.getElementById('keyboard-hint');
        if(hint) hint.addEventListener('click', () => { hint.style.display = 'none'; initAudio(); });
        
        const form = document.getElementById('song-form');
        if(form) form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('song-input');
            const term = input.value.trim().toLowerCase();
            let song = SONG_LIBRARY[term] || Object.values(SONG_LIBRARY).find(s => s.title.toLowerCase().includes(term));
            if(!song) return;
            stopSong(); currentSong = song;
            document.getElementById('player-status').classList.remove('hidden');
            document.getElementById('current-song-title').textContent = song.title;
            document.getElementById('current-song-notes').textContent = `${song.notes.length} NOTES`;
            updatePlayButtonState();
            setTimeout(() => playParsedSong(song), 100);
            input.value = '';
        });

        const playBtn = document.getElementById('play-stop-btn');
        if(playBtn) playBtn.addEventListener('click', togglePlay);
    };

    window.stopPianoGame = function() {
        stopSong();
        if(audioContextRef.current) audioContextRef.current.suspend();
        
        // --- Fixed: Remove Listeners by Reference ---
        // คำสั่งนี้จะทำงานได้ถูกต้องแล้วเพราะเราแยกฟังก์ชันออกมา
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        // --------------------------------------------
        
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
})();