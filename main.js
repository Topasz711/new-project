// main.js - The Main Quiz Logic Orchestrator
let quizState = {};

// --- Theme Management Functions (FIX: Robust logic & try/catch) ---
function saveTheme(theme) {
    try {
        localStorage.setItem('color-theme', theme);
    } catch {}
}

function loadAndApplyTheme() {
    try {
        const stored = localStorage.getItem('color-theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const theme = stored ? stored : (systemDark ? 'dark' : 'light');
        
        document.documentElement.classList.toggle('dark', theme === 'dark');
        return theme;
    } catch { 
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', systemDark);
        return systemDark ? 'dark' : 'light';
    }
}
// ------------------------------------------

// --- Local Storage Functions (FIX: Added try/catch to all) ---
function saveLastPage(pageId, quizFile = null) {
    try {
        const lastPageState = { pageId, quizFile }; 
        localStorage.setItem('topazQuizLastPage', JSON.stringify(lastPageState));
    } catch {}
}

function loadLastPage() {
    try {
        const savedState = localStorage.getItem('topazQuizLastPage');
        return savedState ? JSON.parse(savedState) : null;
    } catch {
        return null;
    }
}

function saveQuizState(quizFile, state) {
    try {
        const stateToSave = { ...state };
        delete stateToSave.currentQuizDataRef;
        delete stateToSave.originalQuizDataRef;
        delete stateToSave.navLinks;
        localStorage.setItem(`topazQuizState_${quizFile}`, JSON.stringify(stateToSave));
    } catch {}
}

function loadQuizState(quizFile) {
    try {
        const savedState = localStorage.getItem(`topazQuizState_${quizFile}`);
        return savedState ? JSON.parse(savedState) : null;
    } catch {
        return null;
    }
}


function initializeQuizState(quizData, containerId, originalDataRef, quizFile) {
    const savedState = loadQuizState(quizFile);
    if (savedState) {
        quizState = {
            ...savedState,
            currentQuizDataRef: quizData,
            originalQuizDataRef: originalDataRef || quizData,
        };
        setTimeout(() => restoreQuiz(containerId), 0);
    } else {
        quizState = {
            type: 'mcq', totalQuestions: quizData.length, answered: 0, correct: 0, incorrect: 0,
            incorrectIndices: [], currentQuizDataRef: quizData, originalQuizDataRef: originalDataRef || quizData,
            containerId: containerId, userAnswers: {}
        };
    }
    quizState.quizFile = quizFile;
}

// -------------------------------------------------------------
// *** NOTE: initializeLabQuizState, buildLabQuiz, checkLabAnswer 
// are now in labQuiz.js ***
// -------------------------------------------------------------


function updateProgressBar() {
    const tracker = document.getElementById('progress-tracker');
    if (Object.keys(quizState).length === 0 || !quizState.totalQuestions) {
        if (tracker) tracker.classList.add('hidden');
        return;
    }
    if (!tracker) return;

    const remaining = quizState.totalQuestions - quizState.answered;
    const percentage = quizState.totalQuestions > 0 ? (quizState.answered / quizState.totalQuestions) * 100 : 0;
    
    const answered = document.getElementById('answered-count');
    const total = document.getElementById('total-count');
    const correct = document.getElementById('correct-count');
    const incorrect = document.getElementById('incorrect-count');
    const remainingEl = document.getElementById('remaining-count');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const retryIncorrectBtn = document.getElementById('retry-incorrect-btn');

    if (answered) answered.innerText = quizState.answered;
    if (total) total.innerText = quizState.totalQuestions;
    if (correct) correct.innerText = quizState.correct;
    if (incorrect) incorrect.innerText = quizState.incorrect;
    if (remainingEl) remainingEl.innerText = remaining;
    if (progressBarFill) progressBarFill.style.width = `${percentage}%`;


    if (retryIncorrectBtn) { 
        const hasIncorrect = (quizState.type === 'mcq' && quizState.incorrectIndices?.length > 0) || (quizState.type === 'lab' && quizState.incorrectQuestionBlocks?.length > 0);
        retryIncorrectBtn.disabled = !hasIncorrect;
        retryIncorrectBtn.classList.toggle('opacity-50', !hasIncorrect);
        retryIncorrectBtn.classList.toggle('cursor-not-allowed', !hasIncorrect);
    }

    if (quizState.quizFile) {
        saveQuizState(quizState.quizFile, quizState);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const startBtn = document.getElementById('start-btn');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const contentPanes = document.querySelectorAll('.main-content-pane');
    const progressTracker = document.getElementById('progress-tracker');
    const retryBtn = document.getElementById('retry-btn');
    const retryIncorrectBtn = document.getElementById('retry-incorrect-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const infectiousMenuBtn = document.getElementById('infectious-menu-btn');
    const backToMainMenuBtn = document.getElementById('back-to-main-menu');
    const cnsMenuBtn = document.getElementById('cns-menu-btn'); 
    const backToMainMenuBtnCns = document.getElementById('back-to-main-menu-cns'); 
    const mainMenu = document.getElementById('main-menu');
    const infectiousSubMenu = document.getElementById('infectious-sub-menu');
    const cnsSubMenu = document.getElementById('cns-sub-menu'); 
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- Theme Persistence (FIX 1: Robust logic) ---
    loadAndApplyTheme();
    updateThemeIcons(); 
    // ------------------------------------------------


    // --- Force hide sidebar and overlay on load (FIX: for unclickable buttons) ---
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
    // -----------------------------------------------------------------------------


    // --- Load last visited page (FIX 2 & 4) ---
    const lastPageState = loadLastPage();
    if (lastPageState && lastPageState.pageId && lastPageState.pageId !== 'homeContent') {
        const { pageId, quizFile } = lastPageState;
        
        const menuLink = document.querySelector(`.sidebar-link[data-target="${pageId}"]`);
        if (menuLink) {
            menuLink.click(); 
        }

        if (quizFile) {
            const quizButton = document.querySelector(`.lecture-btn[data-quiz-file="${quizFile}"]`);
            if (quizButton) {
                quizButton.click();
            } else {
                if (pageId === 'pharmacologyContent') {
                    const firstPharmaTab = document.querySelector('.pharma-tab-btn');
                    if (firstPharmaTab) { 
                        firstPharmaTab.click();
                    }
                }
            }
        } else if (pageId === 'pharmacologyContent') {
            const firstPharmaTab = document.querySelector('.pharma-tab-btn');
            if (firstPharmaTab) { 
                firstPharmaTab.click();
            }
        }
    }
    // ------------------------------------------


    // --- Business Logic Functions ---
    const startNewMcqQuiz = (quizData, containerId, quizFile, originalDataRef, navLinks) => {
    if (!quizData || quizData.length === 0) { showPlaceholder(containerId); return; }
    initializeQuizState(quizData, containerId, originalDataRef, quizFile);
    // <--- เพิ่มส่วนนี้: ถ้ามีปุ่มส่งมา ให้จำไว้ใน quizState ด้วย
    if (navLinks) {
        quizState.navLinks = navLinks;
    }
    // ใช้ปุ่มที่ส่งมา หรือถ้าไม่มีให้ไปดึงจากความจำเดิม (quizState)
    buildMcqQuiz(quizData, containerId, navLinks || quizState.navLinks);
        
        // --- START FIX for Progress Bar not showing on subsequent manual tab clicks ---
        const tracker = document.getElementById('progress-tracker');
        const retryButtons = document.getElementById('retry-buttons');
        if (tracker) tracker.classList.remove('hidden'); // *** เพิ่มการแสดงผลตรงนี้ ***
        if (retryButtons) retryButtons.classList.remove('hidden');
        // --- END FIX ---
        
        updateProgressBar();
    };

    // NOTE: startNewLabQuiz ต้องถูกประกาศใน Global Scope เพื่อให้ Event Listener ใน main.js เรียกได้
    // ดังนั้น เราต้องเช็คว่า initializeLabQuizState มีอยู่จริงก่อนเรียกใช้ 
    const startNewLabQuiz = (quizData, containerId, quizFile, navLinks) => {
    // ตรวจสอบว่าฟังก์ชัน Lab Quiz ถูกโหลดมาหรือไม่ (อยู่ใน labQuiz.js)
    if (typeof initializeLabQuizState === 'function') {
        if (!quizData || quizData.length === 0) { showPlaceholder(containerId); return; }
        initializeLabQuizState(quizData, containerId, quizFile);
        buildLabQuiz(quizData, containerId, navLinks);
        } else {
            console.error("Lab Quiz module not loaded.");
            showPlaceholder(containerId);
        }
    };


    // --- Placeholder Logic ---
    const showPlaceholder = (containerId) => {
        if (progressTracker) progressTracker.classList.add('hidden');
        
        let parentPaneId = '';
        const targetContainer = document.getElementById(containerId);
        if (targetContainer) {
            parentPaneId = targetContainer.closest('.main-content-pane')?.id;
        } else {
            parentPaneId = containerId;
        }
        
        const targetPane = document.getElementById(parentPaneId);

        if (targetPane) {
            contentPanes.forEach(p => p.classList.add('hidden'));
            targetPane.classList.remove('hidden');

            const placeholderHTML = `<div class="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md"><h2 class="text-2xl font-semibold text-gray-500 dark:text-gray-400">ยังไม่มี/อาจจะไม่ทำ</h2><p class="text-gray-400 dark:text-gray-500 mt-2">(Not yet available / Might not be created)</p></div>`;

            if (parentPaneId === 'infectiousContent') {
                document.querySelectorAll('.infectious-sub-pane').forEach(pane => pane.classList.add('hidden'));
                const placeholder = document.getElementById('infectiousPlaceholder');
                if (placeholder) placeholder.classList.remove('hidden');
            } else if (parentPaneId === 'epidemiologyContent') {
                const list = document.getElementById('epidemiologyListView');
                const quizView = document.getElementById('epidemiologyQuizView');
                const container = document.getElementById('epidemiologyQuizContainer');
                if (list) list.classList.add('hidden');
                if (quizView) quizView.classList.remove('hidden'); 
                if (container) container.innerHTML = placeholderHTML;
            } else if (parentPaneId === 'pharmacologyContent') {
                const container = document.getElementById('pharmaQuizContainer');
                const title = document.getElementById('pharma-quiz-title');
                const subtitle = document.getElementById('pharma-quiz-subtitle');
                if (container) container.innerHTML = placeholderHTML;
                if (title) title.textContent = 'Error';
                if (subtitle) subtitle.textContent = '';
            } else if (parentPaneId === 'skinContent') {
                const list = document.getElementById('skinListView');
                const quizView = document.getElementById('skinQuizView');
                const title = document.getElementById('skin-quiz-title');
                const subtitle = document.getElementById('skin-quiz-subtitle');
                const container = document.getElementById('skinQuizContainer');
                if (list) list.classList.add('hidden'); 
                if (quizView) quizView.classList.remove('hidden');
                if (title) title.textContent = '';
                if (subtitle) subtitle.textContent = '';
                if (container) container.innerHTML = placeholderHTML;
            } else if (parentPaneId === 'musculoskeletalContent') {
                const list = document.getElementById('musculoskeletalListView');
                const quizView = document.getElementById('musculoskeletalQuizView');
                const title = document.getElementById('musculoskeletal-quiz-title');
                const container = document.getElementById('musculoskeletalQuizContainer');

                if (list) list.classList.add('hidden'); 
                if (quizView) quizView.classList.remove('hidden');
                if (title) title.textContent = '';
                if (container) container.innerHTML = placeholderHTML;
            } else if (parentPaneId === 'cnsContent') {
                // ซ่อนรายการบทเรียน (Nervous 1 & 2)
                document.querySelectorAll('.cns-sub-pane').forEach(pane => pane.classList.add('hidden'));
                
                const quizView = document.getElementById('cnsQuizView');
                const title = document.getElementById('cns-quiz-title');
                const container = document.getElementById('cnsQuizContainer');

                // แสดงหน้า QuizView และใส่ข้อความ Placeholder
                if (quizView) quizView.classList.remove('hidden');
                if (title) title.textContent = '';
                if (container) container.innerHTML = placeholderHTML;
            }
        }
    };
    // ------------------------------------------------------------------

    // --- Sidebar and Navigation ---
    function openSidebar() { if (sidebar) sidebar.classList.remove('-translate-x-full'); if (overlay) overlay.classList.remove('hidden'); }
    function closeSidebar() { if (sidebar) sidebar.classList.add('-translate-x-full'); if (overlay) overlay.classList.add('hidden'); }

    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    if (startBtn) startBtn.addEventListener('click', openSidebar);
    
    if (infectiousMenuBtn && mainMenu && infectiousSubMenu) {
        infectiousMenuBtn.addEventListener('click', (e) => { e.preventDefault(); mainMenu.classList.add('hide-left'); infectiousSubMenu.classList.add('show'); });
    }
    if (backToMainMenuBtn && mainMenu && infectiousSubMenu) {
        backToMainMenuBtn.addEventListener('click', (e) => { e.preventDefault(); mainMenu.classList.remove('hide-left'); infectiousSubMenu.classList.remove('show'); });
    }

    // Logic ของ CNS Menu
    if (cnsMenuBtn && mainMenu && cnsSubMenu) {
        cnsMenuBtn.addEventListener('click', (e) => { e.preventDefault(); mainMenu.classList.add('hide-left'); cnsSubMenu.classList.add('show'); });
    }
    if (backToMainMenuBtnCns && mainMenu && cnsSubMenu) {
        backToMainMenuBtnCns.addEventListener('click', (e) => { e.preventDefault(); mainMenu.classList.remove('hide-left'); cnsSubMenu.classList.remove('show'); });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            // --- FIX: สั่งหยุดเกมทุกเกมทันที ที่มีการกดเปลี่ยนหน้า ---
            if (window.stopSpaceGame) window.stopSpaceGame();   // หยุดยานอวกาศ 🚀
            if (window.stopWhackGame) window.stopWhackGame();   // หยุดทุบเชื้อโรค 🔨
            if (window.stopSweeperGame) window.stopSweeperGame(); // หยุดกู้ระเบิด 💣
            if (window.stopCardioGame) window.stopCardioGame(); // หยุดเกมหัวใจ 💓
            if (window.stopImmuneGame) window.stopImmuneGame(); // หยุดเกมยิง 🛡️
            if (window.stopPianoGame) window.stopPianoGame();   // หยุดเปียโน 🎹
            if (window.stopSekaiGame) window.stopSekaiGame();
            const targetId = link.dataset.target;
            const subTargetId = link.dataset.subTarget;
            if (progressTracker) progressTracker.classList.add('hidden'); // *** ส่วนนี้คือส่วนที่ซ่อน Progress Bar เมื่อเปลี่ยนหน้าหลัก ***
            contentPanes.forEach(pane => pane.classList.add('hidden'));
            
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.remove('hidden');
            }

            if (targetId === 'pharmacologyContent') {
                const firstPharmaTab = document.querySelector('.pharma-tab-btn');
                if (firstPharmaTab && !firstPharmaTab.classList.contains('active')) {
                     firstPharmaTab.click();
                } else if (firstPharmaTab && firstPharmaTab.classList.contains('active')) {
                     // *** FIX: เมื่อกลับมาหน้า Pharmacology แล้ว Tab เดิม Active อยู่ ให้สั่งแสดง Progress Bar ซ้ำ ***
                     const tracker = document.getElementById('progress-tracker');
                     if (tracker && quizState.quizFile) {
                        tracker.classList.remove('hidden'); 
                        updateProgressBar();
                     }
                }
            } else if (targetId === 'infectiousContent') {
                document.querySelectorAll('.infectious-sub-pane').forEach(pane => pane.classList.add('hidden'));
                const subTarget = document.getElementById(subTargetId || 'theorySum1Content');
                if (subTarget) {
                    subTarget.classList.remove('hidden');
                }
            } else if (targetId === 'epidemiologyContent') {
                const list = document.getElementById('epidemiologyListView');
                const quizView = document.getElementById('epidemiologyQuizView');
                if (list) list.classList.remove('hidden');
                if (quizView) quizView.classList.add('hidden');
            } else if (targetId === 'skinContent') {
                const list = document.getElementById('skinListView');
                const quizView = document.getElementById('skinQuizView');
                if (list) list.classList.remove('hidden');
                if (quizView) quizView.classList.add('hidden');
            } else if (targetId === 'musculoskeletalContent') {
                const list = document.getElementById('musculoskeletalListView');
                const quizView = document.getElementById('musculoskeletalQuizView');
                if (list) list.classList.remove('hidden');
                if (quizView) quizView.classList.add('hidden');
            } else if (targetId === 'cnsContent') {
                // Reset CNS view
                document.querySelectorAll('.cns-sub-pane').forEach(pane => pane.classList.add('hidden'));
                const subTarget = document.getElementById(subTargetId);
                const quizView = document.getElementById('cnsQuizView');
                
                if (subTarget) {
                     subTarget.classList.remove('hidden');
                } else if (quizView && !quizView.classList.contains('hidden')) {
                     // ถ้าไม่มี subTarget แต่ quizView เปิดอยู่ ให้คง quizView ไว้ (กรณี refresh)
                }
            } else if (targetId === 'miniGameContent') {
                // Reset to menu view when entering Mini-Game tab
                document.getElementById('miniGameMenu').classList.remove('hidden');
                document.getElementById('snakeGameContainer').classList.add('hidden');
                document.getElementById('spaceGameContainer').classList.add('hidden');
                if(document.getElementById('whackGameContainer')) document.getElementById('whackGameContainer').classList.add('hidden');
                if(document.getElementById('sweeperGameContainer')) document.getElementById('sweeperGameContainer').classList.add('hidden');
                if(document.getElementById('pianoGameContainer')) document.getElementById('pianoGameContainer').classList.add('hidden');

                // Stop games
                if (window.stopSpaceGame) window.stopSpaceGame();
                if (window.stopWhackGame) window.stopWhackGame();
                if (window.stopSweeperGame) window.stopSweeperGame();
                if (window.stopPianoGame) window.stopPianoGame();
            }
            
            const isQuizLink = link.closest('.lecture-btn');
            if (!isQuizLink) {
                 saveLastPage(targetId);
            }
            
            closeSidebar();
        });
    });

    // --- Event Delegation for all Quiz Buttons ---
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.addEventListener('click', async (event) => {
    const button = event.target.closest('.lecture-btn');
    if (!button) return;

    // --- Start: Find Neighbors ---
    let prevButton = null;
    let nextButton = null;
    // Find the container (grid for lectures, flex for pharma tabs)
    const buttonListContainer = button.closest('.grid, .flex'); 
    if (buttonListContainer) {
        const allButtons = Array.from(buttonListContainer.querySelectorAll('.lecture-btn'));
        const currentIndex = allButtons.indexOf(button);
        if (currentIndex > 0) {
            prevButton = allButtons[currentIndex - 1];
        }
        if (currentIndex < allButtons.length - 1) {
            nextButton = allButtons[currentIndex + 1];
        }
    }
    const navLinks = { prev: prevButton, next: nextButton };
    // --- End: Find Neighbors ---

    const quizFile = button.dataset.quizFile;
        const quizContainerId = button.dataset.quizContainer;
        const quizTitle = button.dataset.quizTitle;
        const quizSubtitle = button.dataset.quizSubtitle;
        const quizType = button.dataset.quizType || 'mcq';
        const parentPane = button.closest('.main-content-pane');
        const parentPaneId = parentPane?.id;

        const loadingIndicator = document.getElementById('loading-indicator');
        contentPanes.forEach(p => p.classList.add('hidden'));
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');

        if (button.classList.contains('pharma-tab-btn')) {
            document.querySelectorAll('.pharma-tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }

        try {
            const response = await fetch(quizFile);
            if (!response.ok) throw new Error(`File not found: ${quizFile}`);
            const fetchedData = await response.json();
            if (!fetchedData || fetchedData.length === 0) throw new Error(`Quiz file is empty: ${quizFile}`);
            
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            if (parentPane) {
                parentPane.classList.remove('hidden');
            }

            if (quizType === 'lab') {
    // Call the separate Lab Quiz initialization function
    startNewLabQuiz(fetchedData, quizContainerId, quizFile, navLinks); 
}
            
            // Set Quiz Titles and Start MCQ
            if (parentPaneId === 'pharmacologyContent') {
                const titleEl = document.getElementById('pharma-quiz-title');
                const subtitleEl = document.getElementById('pharma-quiz-subtitle');
                if (titleEl) titleEl.textContent = quizTitle || 'Pharmacology Quiz';
                if (subtitleEl) subtitleEl.textContent = quizSubtitle || 'Test your knowledge.';
                if (quizType === 'mcq') startNewMcqQuiz(fetchedData, quizContainerId, quizFile, null, navLinks);
            } else if (parentPaneId === 'infectiousContent') {
                document.querySelectorAll('.infectious-sub-pane').forEach(pane => pane.classList.add('hidden'));
                if (quizType === 'lab') {
                    const titleEl = document.getElementById('infectious-lab-quiz-title');
                    const labView = document.getElementById('infectiousLabQuizView');
                    if (titleEl) titleEl.textContent = quizTitle || 'Infectious Disease Lab';
                    if (labView) labView.classList.remove('hidden');
                } else {
                    const titleEl = document.getElementById('infectious-quiz-title');
                    const quizView = document.getElementById('infectiousQuizView');
                    if (titleEl) titleEl.textContent = quizTitle || 'Infectious Disease Quiz';
                    if (quizView) quizView.classList.remove('hidden');
                    if (quizType === 'mcq') startNewMcqQuiz(fetchedData, quizContainerId, quizFile, null, navLinks);
                }
            } else if (parentPaneId === 'epidemiologyContent') {
                const listView = document.getElementById('epidemiologyListView');
                const titleEl = document.getElementById('epidemiology-quiz-title');
                const quizView = document.getElementById('epidemiologyQuizView');
                if (listView) listView.classList.add('hidden');
                if (titleEl) titleEl.textContent = quizTitle || 'Epidemiology Quiz';
                if (quizView) quizView.classList.remove('hidden');
                if (quizType === 'mcq') startNewMcqQuiz(fetchedData, quizContainerId, quizFile, null, navLinks);
            } else if (parentPaneId === 'skinContent') {
                const listView = document.getElementById('skinListView');
                const titleEl = document.getElementById('skin-quiz-title');
                const quizView = document.getElementById('skinQuizView');
                if (listView) listView.classList.add('hidden');
                if (titleEl) titleEl.textContent = quizTitle || 'Skin Quiz';
                if (quizView) quizView.classList.remove('hidden');
                if (quizType === 'mcq') startNewMcqQuiz(fetchedData, quizContainerId, quizFile, null, navLinks);
            } else if (parentPaneId === 'musculoskeletalContent') {
                const listView = document.getElementById('musculoskeletalListView');
                const titleEl = document.getElementById('musculoskeletal-quiz-title');
                const quizView = document.getElementById('musculoskeletalQuizView');
                if (listView) listView.classList.add('hidden');
                if (titleEl) titleEl.textContent = quizTitle || 'Musculoskeletal Quiz';
                if (quizView) quizView.classList.remove('hidden');
                if (quizType === 'mcq') startNewMcqQuiz(fetchedData, quizContainerId, quizFile, null, navLinks);
            } else if (parentPaneId === 'cnsContent') {
                const titleEl = document.getElementById('cns-quiz-title');
                const quizView = document.getElementById('cnsQuizView');
                // ซ่อนรายการเลือกบทเรียน
                document.querySelectorAll('.cns-sub-pane').forEach(pane => pane.classList.add('hidden')); 
                
                if (titleEl) titleEl.textContent = quizTitle || 'CNS Quiz';
                if (quizView) quizView.classList.remove('hidden');
                if (quizType === 'mcq') startNewMcqQuiz(fetchedData, quizContainerId, quizFile, null, navLinks);
            }
            
            saveLastPage(parentPaneId, quizFile);
            
        } catch (error) {
            console.error("Could not start quiz:", error.message);
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            showPlaceholder(parentPaneId || quizContainerId);
        }
    });

    if (retryBtn) retryBtn.addEventListener('click', () => {
        if (quizState.originalQuizDataRef) {
            try { localStorage.removeItem(`topazQuizState_${quizState.quizFile}`); } catch {}
            const currentNavLinks = quizState.navLinks;
            if (quizState.type === 'lab') {
                // ส่ง currentNavLinks เข้าไปเป็น parameter ตัวที่ 4
                startNewLabQuiz(quizState.originalQuizDataRef, quizState.containerId, quizState.quizFile, currentNavLinks);
            } else {
                // ส่ง currentNavLinks เข้าไปเป็น parameter ตัวที่ 5 (ตัวที่ 4 เป็น null เพราะเราใช้ data เดิม)
                startNewMcqQuiz(quizState.originalQuizDataRef, quizState.containerId, quizState.quizFile, null, currentNavLinks);
            }
        }
    });

    if (retryIncorrectBtn) retryIncorrectBtn.addEventListener('click', () => {
        if (quizState.type === 'mcq') {
            if (!quizState.incorrectIndices?.length) return;
            const indicesToReset = [...quizState.incorrectIndices];
            quizState.answered -= indicesToReset.length;
            quizState.incorrect -= indicesToReset.length;
            quizState.incorrectIndices = [];
            indicesToReset.forEach(originalIndex => {
                delete quizState.userAnswers[originalIndex];
                const card = document.querySelector(`#${quizState.containerId} .question-card[data-original-index='${originalIndex}']`);
                if (card) {
                    card.dataset.answered = 'false';
                    card.querySelectorAll('input[type="radio"]').forEach(radio => {
                        radio.disabled = false;
                        radio.checked = false;
                        radio.parentElement.classList.remove('bg-red-100', 'dark:bg-red-900/50', 'border-red-500', 'bg-blue-100', 'dark:bg-blue-900/50', 'border-blue-500');
                    });
                    const reasoningDiv = card.querySelector('.reasoning');
                    if (reasoningDiv) {
                        reasoningDiv.classList.add('hidden', 'opacity-0', 'max-h-0');
                        reasoningDiv.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/20', 'dark:border-red-500', 'border-blue-500', 'bg-blue-100', 'dark:bg-blue-900/50', 'dark:border-blue-500');
                    }
                    const btn = card.querySelector('.check-btn');
                    if (btn) {
                        btn.disabled = false;
                        btn.classList.remove('bg-gray-400', 'dark:bg-gray-600', 'cursor-not-allowed');
                    }
                }
            });
        } else if (quizState.type === 'lab') {
            if (!quizState.incorrectQuestionBlocks?.length) return;
            const blocksToReset = [...new Set(quizState.incorrectQuestionBlocks)];

            blocksToReset.forEach(qNum => {
                const card = document.querySelector(`#${quizState.containerId} .lab-question-card[data-question-number='${qNum}']`);
                if (card) {
                    card.dataset.answered = 'false';
                    const questionData = quizState.originalQuizDataRef.find(q => q.questionNumber === qNum);
                    const subQuestionsData = questionData.type === 'matching_case_study' ? questionData.subQuestions.flatMap(sq => sq.parts) : questionData.subQuestions;
                    let resetCount = 0;

                    subQuestionsData.forEach(sq => {
                        if (quizState.answers[sq.id]?.status !== 'unchecked') {
                            resetCount++;
                            if (quizState.answers[sq.id].status === 'incorrect') quizState.incorrect--;
                            if (quizState.answers[sq.id].status === 'correct') quizState.correct--;
                        }
                        quizState.answers[sq.id] = { status: 'unchecked' };
                    });

                    quizState.answered -= resetCount;

                    card.querySelectorAll('input[type="text"], textarea').forEach(input => {
                        input.value = '';
                        input.disabled = false;
                        input.classList.remove('border-green-500', 'dark:border-green-400', 'border-red-500', 'dark:border-red-400');
                    });
                    card.querySelectorAll('.reasoning, .reasoning-main').forEach(r => r.classList.add('hidden', 'opacity-0', 'max-h-0'));
                    const btn = card.querySelector('.check-lab-btn');
                    if (btn) {
                        btn.disabled = false;
                        btn.classList.remove('bg-gray-400', 'dark:bg-gray-600', 'cursor-not-allowed');
                    }
                }
            });
            quizState.incorrectQuestionBlocks = [];
        }
        updateProgressBar();
    });
    // --- เพิ่มโค้ดปุ่ม Shuffle ---
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
        // ทำงานเฉพาะเมื่อมีข้อมูล Quiz และเป็นแบบ MCQ
        if (quizState.originalQuizDataRef && quizState.type === 'mcq') {
            
            // 1. คัดลอกข้อมูลต้นฉบับออกมาเพื่อไม่ให้กระทบข้อมูลหลัก (Deep Copy)
            let shuffledData = JSON.parse(JSON.stringify(quizState.originalQuizDataRef));
            const currentNavLinks = quizState.navLinks;

            // 2. ฟังก์ชันสลับอาเรย์ (Fisher-Yates Shuffle)
            const shuffleArray = (array) => {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
            };

            // 3. สลับลำดับข้อคำถาม
            shuffleArray(shuffledData);

            // 4. สลับลำดับ Choice ภายในแต่ละข้อ
            shuffledData.forEach(question => {
                if (question.choices) {
                    // แปลง Object choices เป็น Array [key, value]
                    const entries = Object.entries(question.choices);
                    // สลับลำดับใน Array
                    shuffleArray(entries);
                    // แปลงกลับเป็น Object (ลำดับ key จะเปลี่ยนไปตามการสลับ)
                    question.choices = Object.fromEntries(entries);
                }
            });

            // 5. เคลียร์สถานะเก่า (ถ้ามี)
            try { localStorage.removeItem(`topazQuizState_${quizState.quizFile}`); } catch {}

            // 6. เริ่ม Quiz ใหม่ด้วยข้อมูลที่สลับแล้ว
            // เราไม่ส่ง originalDataRef พารามิเตอร์ที่ 4 เพื่อให้ Quiz จำว่าชุดที่สลับแล้วคือชุดปัจจุบัน (ถ้ากด Retry จะได้ชุดสลับเดิม)
            startNewMcqQuiz(shuffledData, quizState.containerId, quizState.quizFile, null, currentNavLinks);
        }
    });
    // --- จบโค้ดปุ่ม Shuffle ---
    // --- Mini Game Menu Logic ---
    const miniGameMenu = document.getElementById('miniGameMenu');
    // Containers
    const snakeContainer = document.getElementById('snakeGameContainer');
    const spaceContainer = document.getElementById('spaceGameContainer');
    const whackContainer = document.getElementById('whackGameContainer');
    const sweeperContainer = document.getElementById('sweeperGameContainer');
    const pianoContainer = document.getElementById('pianoGameContainer');
    
    // Helper to hide all games
    function hideAllGames() {
        [snakeContainer, spaceContainer, whackContainer, sweeperContainer, document.getElementById('cardioGameContainer'), document.getElementById('immuneGameContainer'), document.getElementById('pianoGameContainer'), document.getElementById('sekaiGameContainer')].forEach(el => {
            if(el) el.classList.add('hidden');
        });
        // Stop functions
        if(window.stopSpaceGame) window.stopSpaceGame();
        if(window.stopWhackGame) window.stopWhackGame();
        if(window.stopSweeperGame) window.stopSweeperGame();
        if(window.stopCardioGame) window.stopCardioGame(); 
        if(window.stopImmuneGame) window.stopImmuneGame();
        if(window.stopPianoGame) window.stopPianoGame();
    }

    // --- Button Listeners ---
    
    function forceStopAllGames() {
        // สั่งหยุดทุกเกมที่มี
        if (window.stopPianoGame) window.stopPianoGame();
        if (window.stopSpaceGame) window.stopSpaceGame();
        if (window.stopWhackGame) window.stopWhackGame();
        if (window.stopSweeperGame) window.stopSweeperGame();
        if (window.stopCardioGame) window.stopCardioGame();
        if (window.stopImmuneGame) window.stopImmuneGame();
        if (window.stopSekaiGame) window.stopSekaiGame();
        // ซ่อนทุก Container เพื่อความชัวร์
        [snakeContainer, spaceContainer, whackContainer, sweeperContainer, 
         document.getElementById('cardioGameContainer'), 
         document.getElementById('immuneGameContainer'), 
         document.getElementById('pianoGameContainer'),
         document.getElementById('sekaiGameContainer')
        ].forEach(el => {
            if(el) el.classList.add('hidden');
        });
    }

    // 2. อัปเดตปุ่มกดทุกเกม ให้เรียก forceStopAllGames() ก่อนเสมอ
    if (document.getElementById('btn-play-snake')) {
        document.getElementById('btn-play-snake').addEventListener('click', () => {
            forceStopAllGames(); // <--- ล้างเกมเก่า
            miniGameMenu.classList.add('hidden');
            snakeContainer.classList.remove('hidden');
            if (typeof initGame === 'function') initGame(); // Snake ใช้ชื่อ initGame
        });
    }

    if (document.getElementById('btn-play-space')) {
        document.getElementById('btn-play-space').addEventListener('click', () => {
            forceStopAllGames(); // <--- ล้างเกมเก่า
            miniGameMenu.classList.add('hidden');
            spaceContainer.classList.remove('hidden');
            if (typeof initSpaceGame === 'function') initSpaceGame();
        });
    }

    if (document.getElementById('btn-play-whack')) {
        document.getElementById('btn-play-whack').addEventListener('click', () => {
            forceStopAllGames();
            miniGameMenu.classList.add('hidden');
            whackContainer.classList.remove('hidden');
            if (typeof initWhackGame === 'function') initWhackGame();
        });
    }

    if (document.getElementById('btn-play-sweeper')) {
        document.getElementById('btn-play-sweeper').addEventListener('click', () => {
            forceStopAllGames();
            miniGameMenu.classList.add('hidden');
            sweeperContainer.classList.remove('hidden');
            if (typeof initSweeperGame === 'function') initSweeperGame();
        });
    }

    if (document.getElementById('btn-play-cardio')) {
        document.getElementById('btn-play-cardio').addEventListener('click', () => {
            forceStopAllGames();
            miniGameMenu.classList.add('hidden');
            document.getElementById('cardioGameContainer').classList.remove('hidden');
            if (typeof initCardioGame === 'function') initCardioGame();
        });
    }

    if (document.getElementById('btn-play-immune')) {
        document.getElementById('btn-play-immune').addEventListener('click', () => {
            forceStopAllGames();
            miniGameMenu.classList.add('hidden');
            document.getElementById('immuneGameContainer').classList.remove('hidden');
            if (typeof initImmuneGame === 'function') initImmuneGame();
        });
    }

    // ปุ่มเปียโน 
    if (document.getElementById('btn-play-piano')) {
        document.getElementById('btn-play-piano').addEventListener('click', () => {
            forceStopAllGames();
            miniGameMenu.classList.add('hidden');
            document.getElementById('pianoGameContainer').classList.remove('hidden');
            if (typeof initPianoGame === 'function') initPianoGame();
        });
    }

    if (document.getElementById('btn-play-sekai')) {
        document.getElementById('btn-play-sekai').addEventListener('click', () => {
            forceStopAllGames(); // หรือฟังก์ชันที่ใช้หยุดเกมอื่น
            miniGameMenu.classList.add('hidden');
            document.getElementById('sekaiGameContainer').classList.remove('hidden');
            if (typeof initSekaiGame === 'function') initSekaiGame();
        });
    }

    // ปุ่ม Back ก็ใช้ฟังก์ชันเดียวกันได้เลย
    document.querySelectorAll('.back-to-games-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            forceStopAllGames();
            miniGameMenu.classList.remove('hidden');
        });
    });
});

// --- MCQ Quiz Functions ---
function buildMcqQuiz(quizData, containerId, navLinks) {
    const quizContainer = document.getElementById(containerId);
    if (!quizContainer) return;

    quizContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();
    quizData.forEach((item, index) => {
        const originalIndex = quizState.originalQuizDataRef.findIndex(q => q.question === item.question);
        
        const imageElement = document.createElement('div');
        if (item.imageUrl) {
            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.alt = 'Question Image';
            img.className = 'max-w-sm h-auto rounded-lg mx-auto shadow-md';
            imageElement.className = 'my-4';
            imageElement.appendChild(img);
            if (item.imageSource) {
                const sourceP = document.createElement('p');
                sourceP.className = 'text-xs text-center text-gray-500 dark:text-gray-400 mt-2';
                sourceP.textContent = `Source: ${item.imageSource}`;
                imageElement.appendChild(sourceP);
            }
        }

        const choicesHTML = Object.entries(item.choices).map(([key, value]) => `<label class="quiz-option block p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"><input type="radio" name="${containerId}_question${index}" value="${key}" class="mr-3 text-blue-600 focus:ring-blue-500 dark:focus:ring-offset-gray-800"><span class="font-medium">${key}.</span> ${value}</label>`).join('');
        
        const questionElement = document.createElement('div');
        questionElement.className = 'question-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md';
        questionElement.dataset.originalIndex = originalIndex;

        const questionContent = document.createElement('h2');
        questionContent.className = 'text-xl font-semibold mb-4';
        const formattedQuestion = item.question.replace(/\n/g, '<br>');
        questionContent.innerHTML = `<span class="text-blue-600 dark:text-blue-400 font-bold">Question ${index + 1}:</span> ${formattedQuestion}`;

        questionElement.appendChild(questionContent);
        if (item.imageUrl) questionElement.appendChild(imageElement);
        questionElement.innerHTML += `<div class="choices space-y-3">${choicesHTML}</div><button class="check-btn mt-6 w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500" data-question-index="${index}">Check Answer</button><div class="reasoning hidden opacity-0 mt-6 p-4 border-l-4"><h3 class="font-bold text-lg mb-2"></h3><div></div></div>`;

        fragment.appendChild(questionElement);
    });

    quizContainer.appendChild(fragment);
    quizContainer.querySelectorAll('.check-btn').forEach(button => button.addEventListener('click', checkMcqAnswer));
    restoreQuiz(containerId);
    if (navLinks) {
        const navContainer = document.createElement('div');
        navContainer.className = 'flex justify-between mt-8 pt-4 border-t dark:border-gray-700';

        const prevNavButton = document.createElement('button');
        if (navLinks.prev) {
            prevNavButton.className = 'prev-lecture-btn text-left bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition-colors';
            prevNavButton.innerHTML = `⬅️ ${navLinks.prev.innerHTML}`;
            prevNavButton.onclick = () => navLinks.prev.click();
        } else {
            prevNavButton.className = 'prev-lecture-btn invisible'; // Keep layout
        }

        const nextNavButton = document.createElement('button');
        if (navLinks.next) {
            nextNavButton.className = 'next-lecture-btn text-right bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors';
            nextNavButton.innerHTML = `${navLinks.next.innerHTML} ➡️`;
            nextNavButton.onclick = () => navLinks.next.click();
        } else {
            nextNavButton.className = 'next-lecture-btn invisible';
        }

        navContainer.appendChild(prevNavButton);
        navContainer.appendChild(nextNavButton);
        quizContainer.appendChild(navContainer);
    }
    // --- End: Build Navigation ---
}

function checkMcqAnswer(event) {
    const button = event.target;
    const card = button.closest('.question-card');
    if (!card || card.dataset.answered === 'true') return;

    const questionIndex = parseInt(button.dataset.questionIndex, 10);
    const originalIndex = parseInt(card.dataset.originalIndex, 10);
    const questionData = quizState.currentQuizDataRef[questionIndex];
    const selectedOption = card.querySelector(`input[type="radio"]:checked`);
    if (!selectedOption) return;

    card.dataset.answered = 'true';
    quizState.answered++;
    const userAnswer = selectedOption.value;
    quizState.userAnswers[originalIndex] = userAnswer;
    const isCorrect = userAnswer === questionData.correctAnswer;

    if (isCorrect) { quizState.correct++; }
    else {
        quizState.incorrect++;
        if (originalIndex !== -1 && !quizState.incorrectIndices.includes(originalIndex)) {
            quizState.incorrectIndices.push(originalIndex);
        }
    }
    updateProgressBar();
    
    button.disabled = true;
    button.classList.add('bg-gray-400', 'dark:bg-gray-600', 'cursor-not-allowed');
    card.querySelectorAll('input[type="radio"]').forEach(radio => radio.disabled = true);

    showMcqResult(card, questionData, userAnswer, isCorrect);
}


function showMcqResult(card, questionData, userAnswer, isCorrect) {
    const button = card.querySelector('.check-btn');
    const selectedOption = card.querySelector(`input[value='${userAnswer}']`);

    if (selectedOption) {
        selectedOption.checked = true;
    }

    card.dataset.answered = 'true';
    if (button) {
        button.disabled = true;
        button.classList.add('bg-gray-400', 'dark:bg-gray-600', 'cursor-not-allowed');
    }
    card.querySelectorAll('input[type="radio"]').forEach(radio => radio.disabled = true);

    const reasoningDiv = card.querySelector('.reasoning');
    if (!reasoningDiv) return;

    const resultTitle = reasoningDiv.querySelector('h3');
    const resultText = reasoningDiv.querySelector('div');
    
    if (resultTitle && resultText) {
         let incorrectReasonsHTML = '<ul>';
         for (const key in questionData.reasoning.incorrect) {
             if (key !== questionData.correctAnswer) {
                 const reason = document.createElement('li');
                 reason.innerHTML = `<strong>Why '${key}' is incorrect:</strong> `;
                 reason.appendChild(document.createTextNode(questionData.reasoning.incorrect[key]));
                 incorrectReasonsHTML += reason.outerHTML;
             }
         }
         incorrectReasonsHTML += '</ul>';

        if (isCorrect) {
            resultTitle.textContent = '✅ Correct!';
            resultTitle.className = 'font-bold text-lg mb-2 text-blue-700 dark:text-blue-400';
            reasoningDiv.className = 'reasoning opacity-100 mt-6 p-4 border-l-4 border-blue-500 bg-blue-100 dark:bg-blue-900/50 dark:border-blue-500';

            resultText.innerHTML = `<p class="mb-3"></p><h4 class="font-semibold mt-4 mb-2">Why other choices are incorrect:</h4>${incorrectReasonsHTML}`;
            resultText.querySelector('p').textContent = questionData.reasoning.correct;
            
            if (selectedOption) selectedOption.parentElement.classList.add('bg-blue-100', 'dark:bg-blue-900/50', 'border-blue-500');
        } else {
            resultTitle.textContent = '❌ Incorrect';
            resultTitle.className = 'font-bold text-lg mb-2 text-red-700 dark:text-red-400';
            reasoningDiv.className = 'reasoning opacity-100 mt-6 p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500';

            resultText.innerHTML = `<p class="mb-3"><strong>The correct answer is ${questionData.correctAnswer}.</strong> </p><h4 class="font-semibold mt-4 mb-2">Why other choices are incorrect:</h4>${incorrectReasonsHTML}`;
            resultText.querySelector('p').appendChild(document.createTextNode(questionData.reasoning.correct));

            if (selectedOption) selectedOption.parentElement.classList.add('bg-red-100', 'dark:bg-red-900/50', 'border-red-500');
            const correctOptionEl = card.querySelector(`input[value="${questionData.correctAnswer}"]`);
            if (correctOptionEl) correctOptionEl.parentElement.classList.add('bg-blue-100', 'dark:bg-blue-900/50', 'border-blue-500');
        }
    }
}

function restoreQuiz(containerId) {
    const quizContainer = document.getElementById(containerId);
    if (!quizContainer) return;

    if (quizState.type === 'mcq' && quizState.userAnswers) {
        Object.entries(quizState.userAnswers).forEach(([originalIndex, userAnswer]) => {
            const card = quizContainer.querySelector(`.question-card[data-original-index='${originalIndex}']`);
            if (card) {
                const questionData = quizState.originalQuizDataRef[originalIndex];
                if (questionData) {
                    const isCorrect = userAnswer === questionData.correctAnswer;
                    showMcqResult(card, questionData, userAnswer, isCorrect);
                }
            }
        });
    } else if (quizState.type === 'lab' && quizState.answers && typeof checkLabAnswer === 'function') {
        
        const checkedBlocks = new Set();
        Object.entries(quizState.answers).forEach(([partId, answerData]) => {
            if (answerData.status !== 'unchecked') {
                const inputs = quizContainer.querySelectorAll(`input[data-id='${partId}']`);
                if (inputs.length > 0) {
                    const card = inputs[0].closest('.lab-question-card');
                    if (card) {
                        const qNum = card.dataset.questionNumber;
                        if (answerData.userAnswer) {
                            inputs.forEach((input, i) => { input.value = answerData.userAnswer[i] || ''; });
                        }
                        checkedBlocks.add(qNum);
                    }
                }
            }
        });

        setTimeout(() => {
            checkedBlocks.forEach(qNum => {
                const card = quizContainer.querySelector(`.lab-question-card[data-question-number='${qNum}']`);
                if (card) {
                    const button = card.querySelector('.check-lab-btn');
                    if (button) {
                        const fakeEvent = { target: button, isTrusted: false };
                        checkLabAnswer(fakeEvent); // Call function from labQuiz.js
                    }
                }
            });
        }, 100);
    }
    updateProgressBar();
}


// --- Global Theme Toggle ---
const themeToggleBtn = document.getElementById('theme-toggle');
const darkIcon = document.getElementById('theme-toggle-dark-icon');
const lightIcon = document.getElementById('theme-toggle-light-icon');
function updateThemeIcons() {
    if (!darkIcon || !lightIcon) return; 

    const isDark = document.documentElement.classList.contains('dark');
    darkIcon.classList.toggle('hidden', isDark);
    lightIcon.classList.toggle('hidden', !isDark);
}
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        saveTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        updateThemeIcons();
    });
}