document.addEventListener('DOMContentLoaded', () => {
    const holesContainer = document.getElementById('whackGrid');
    const scoreBoard = document.getElementById('whackScore');
    const timeBoard = document.getElementById('whackTime');
    const modal = document.getElementById('whackModal');
    const modalTitle = document.getElementById('whackModalTitle');
    const modalDesc = document.getElementById('whackModalDesc');
    const startBtn = document.getElementById('btn-start-whack');
    
    let holes = [];
    let lastHole;
    let timeUp = false;
    let score = 0;
    let timeLeft = 30;
    let gameTimer;
    let peepTimer;

    const germSVGs = [
        `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="#ba68c8"/><path d="M22 22L29 29 M71 71L78 78 M22 78L29 71 M71 29L78 22" stroke="#8e24aa" stroke-width="5" stroke-linecap="round"/><circle cx="38" cy="45" r="4" fill="white"/><circle cx="62" cy="45" r="4" fill="white"/><path d="M45 60 Q50 58 55 60" stroke="white" stroke-width="2" fill="none"/></svg>`,
        `<svg viewBox="0 0 100 100"><rect x="25" y="20" width="50" height="60" rx="25" fill="#81c784"/><circle cx="40" cy="40" r="5" fill="white"/><circle cx="60" cy="40" r="5" fill="white"/><path d="M45 55 Q50 65 55 55" stroke="#1b5e20" stroke-width="2" fill="none"/></svg>`,
        `<svg viewBox="0 0 100 100"><path d="M50 20 Q80 30 80 70 Q50 85 20 70 Q20 30 50 20 Z" fill="#ef5350"/><circle cx="35" cy="40" r="6" fill="white"/><circle cx="65" cy="40" r="6" fill="white"/><circle cx="50" cy="60" r="5" fill="#ffebee"/></svg>`
    ];

    function createHoles() {
        if(!holesContainer) return;
        holesContainer.innerHTML = '';
        holes = [];
        for(let i=0; i<9; i++) {
            const hole = document.createElement('div');
            hole.classList.add('hole');
            hole.innerHTML = `<div class="germ"></div><div class="splash"></div>`;
            hole.addEventListener('mousedown', bonk);
            hole.addEventListener('touchstart', bonk, {passive: true});
            holesContainer.appendChild(hole);
            holes.push(hole);
        }
    }

    function randomTime(min, max) { return Math.round(Math.random() * (max - min) + min); }
    function randomHole(holes) {
        const idx = Math.floor(Math.random() * holes.length);
        const hole = holes[idx];
        if (hole === lastHole) return randomHole(holes);
        lastHole = hole;
        return hole;
    }

    function peep() {
        const time = randomTime(500, 1000);
        const hole = randomHole(holes);
        const germDiv = hole.querySelector('.germ');
        germDiv.innerHTML = germSVGs[Math.floor(Math.random() * germSVGs.length)];
        hole.classList.add('up');
        peepTimer = setTimeout(() => {
            hole.classList.remove('up');
            if (!timeUp) peep();
        }, time);
    }

    function startGame() {
        modal.classList.add('hidden');
        scoreBoard.textContent = 0;
        timeBoard.textContent = 30;
        timeUp = false;
        score = 0;
        timeLeft = 30;
        createHoles();
        peep();
        gameTimer = setInterval(() => {
            timeLeft--;
            timeBoard.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(gameTimer);
                timeUp = true;
                modalTitle.textContent = "Mission Complete!";
                modalDesc.innerHTML = `Score: <strong>${score}</strong> pathogens eliminated!`;
                modal.classList.remove('hidden');
            }
        }, 1000);
    }

    function bonk(e) {
        if(!e.isTrusted) return;
        if(!this.classList.contains('up')) return;
        score++;
        this.classList.remove('up');
        scoreBoard.textContent = score;
        const splash = this.querySelector('.splash');
        splash.classList.remove('active');
        void splash.offsetWidth;
        splash.classList.add('active');
    }

    if(startBtn) startBtn.addEventListener('click', startGame);

    window.initWhackGame = () => {
        createHoles();
        modal.classList.remove('hidden');
        modalTitle.textContent = "Ready?";
        modalDesc.textContent = "Hunt the pathogens!";
    };
    
    window.stopWhackGame = () => {
        timeUp = true;
        clearTimeout(peepTimer);
        clearInterval(gameTimer);
    };
});