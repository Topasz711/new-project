document.addEventListener('DOMContentLoaded', () => {
    const gridElement = document.getElementById('sweeperGrid');
    const virusCountEl = document.getElementById('sweeperVirusCount');
    const timerEl = document.getElementById('sweeperTimer');
    const faceBtn = document.getElementById('sweeperFaceBtn');
    const btnCheck = document.getElementById('sweeper-mode-check');
    const btnFlag = document.getElementById('sweeper-mode-flag');
    
    // Modal Elements
    const modal = document.getElementById('sweeperModal');
    const modalIcon = document.getElementById('sweeperModalIcon');
    const modalTitle = document.getElementById('sweeperModalTitle');
    const modalDesc = document.getElementById('sweeperModalDesc');
    const restartBtn = document.getElementById('btn-restart-sweeper');

    const ROWS = 10;
    const COLS = 10;
    const MINES = 12;
    let grid = [];
    let gameOver = false;
    let flagsLeft = MINES;
    let timer = 0;
    let timerInterval;
    let mode = 'check';
    let firstClick = true;

    function setMode(m) {
        mode = m;
        if(m === 'check') {
            btnCheck.classList.replace('bg-slate-200', 'bg-sky-500');
            btnCheck.classList.replace('text-slate-600', 'text-white');
            btnFlag.classList.replace('bg-sky-500', 'bg-slate-200');
            btnFlag.classList.replace('text-white', 'text-slate-600');
        } else {
            btnFlag.classList.replace('bg-slate-200', 'bg-sky-500');
            btnFlag.classList.replace('text-slate-600', 'text-white');
            btnCheck.classList.replace('bg-sky-500', 'bg-slate-200');
            btnCheck.classList.replace('text-white', 'text-slate-600');
        }
    }

    if(btnCheck) btnCheck.addEventListener('click', () => setMode('check'));
    if(btnFlag) btnFlag.addEventListener('click', () => setMode('flag'));
    if(faceBtn) faceBtn.addEventListener('click', initGame);
    if(restartBtn) restartBtn.addEventListener('click', initGame);

    function initGame() {
        if(!gridElement) return;
        grid = [];
        gameOver = false;
        firstClick = true;
        flagsLeft = MINES;
        timer = 0;
        clearInterval(timerInterval);
        timerEl.innerText = '000';
        virusCountEl.innerText = MINES;
        faceBtn.innerText = '👨‍⚕️';
        
        // Hide Modal
        if(modal) modal.classList.add('hidden');
        
        gridElement.innerHTML = '';
        
        for(let r=0; r<ROWS; r++) {
            let row = [];
            for(let c=0; c<COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'sweeper-cell sweeper-hidden w-full h-full';
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.onclick = () => handleClick(r, c);
                cell.oncontextmenu = (e) => { e.preventDefault(); toggleFlag(r, c); };
                gridElement.appendChild(cell);
                row.push({r, c, isMine: false, revealed: false, flagged: false, count: 0, element: cell});
            }
            grid.push(row);
        }
    }

    function placeMines(exR, exC) {
        let placed = 0;
        while(placed < MINES) {
            let r = Math.floor(Math.random()*ROWS);
            let c = Math.floor(Math.random()*COLS);
            if(!grid[r][c].isMine && (r!==exR || c!==exC)) {
                grid[r][c].isMine = true;
                placed++;
            }
        }
        for(let r=0; r<ROWS; r++) {
            for(let c=0; c<COLS; c++) {
                if(grid[r][c].isMine) continue;
                let count = 0;
                for(let i=-1; i<=1; i++) {
                    for(let j=-1; j<=1; j++) {
                        if(r+i>=0 && r+i<ROWS && c+j>=0 && c+j<COLS && grid[r+i][c+j].isMine) count++;
                    }
                }
                grid[r][c].count = count;
            }
        }
        timerInterval = setInterval(() => { timer++; timerEl.innerText = String(timer).padStart(3,'0'); }, 1000);
    }

    function handleClick(r, c) {
        if(gameOver) return;
        if(mode === 'flag') toggleFlag(r, c);
        else reveal(r, c);
    }

    function toggleFlag(r, c) {
        const cell = grid[r][c];
        if(cell.revealed) return;
        cell.flagged = !cell.flagged;
        cell.element.innerText = cell.flagged ? '🚩' : '';
        cell.element.classList.toggle('text-red-500', cell.flagged);
        flagsLeft += cell.flagged ? -1 : 1;
        virusCountEl.innerText = flagsLeft;
    }

    function reveal(r, c) {
        const cell = grid[r][c];
        if(cell.revealed || cell.flagged) return;
        if(firstClick) { firstClick = false; placeMines(r, c); }
        
        cell.revealed = true;
        cell.element.classList.replace('sweeper-hidden', 'sweeper-revealed');
        
        if(cell.isMine) {
            gameOver = true;
            clearInterval(timerInterval);
            faceBtn.innerText = '😵';
            cell.element.innerText = '🦠';
            cell.element.style.backgroundColor = '#fecaca';
            revealAll();
            
            // Show Game Over Modal
            setTimeout(() => {
                if(modal) {
                    modalIcon.innerText = '☣️';
                    modalTitle.innerText = 'Outbreak!';
                    modalTitle.className = 'text-2xl font-bold text-red-600 mb-2';
                    modalDesc.innerText = 'Virus containment failed.';
                    modal.classList.remove('hidden');
                }
            }, 800);

        } else {
            if(cell.count > 0) {
                cell.element.innerText = cell.count;
                cell.element.classList.add(`num-${cell.count}`);
            } else {
                for(let i=-1; i<=1; i++) {
                    for(let j=-1; j<=1; j++) {
                        if(r+i>=0 && r+i<ROWS && c+j>=0 && c+j<COLS) reveal(r+i, c+j);
                    }
                }
            }
            checkWin();
        }
    }

    function revealAll() {
        grid.flat().forEach(c => {
            if(c.isMine) {
                c.element.innerText = '🦠';
                c.element.classList.replace('sweeper-hidden', 'sweeper-revealed');
                if(c.flagged) c.element.style.backgroundColor = '#bbf7d0'; // Correctly flagged (greenish)
            }
        });
    }

    function checkWin() {
        const revealed = grid.flat().filter(c => c.revealed).length;
        if(revealed === (ROWS*COLS - MINES)) {
            gameOver = true;
            clearInterval(timerInterval);
            faceBtn.innerText = '😎';
            virusCountEl.innerText = "WIN";
            
            // Show Win Modal
            setTimeout(() => {
                if(modal) {
                    modalIcon.innerText = '🎉';
                    modalTitle.innerText = 'Zone Cleared!';
                    modalTitle.className = 'text-2xl font-bold text-green-600 mb-2';
                    modalDesc.innerText = 'Excellent work, Doctor!';
                    modal.classList.remove('hidden');
                }
            }, 500);
        }
    }

    window.initSweeperGame = initGame;
    window.stopSweeperGame = () => clearInterval(timerInterval);
});