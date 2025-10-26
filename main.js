// main.js
let quizState = {};

// --- Theme Management Functions (FIX: Robust logic & try/catch) ---
function saveTheme(theme) {
    try {
        localStorage.setItem('color-theme', theme);
    } catch {}
}

function loadAndApplyTheme() {
    try {
        const stored = localStorage.getItem('color-theme'); // null ถ้าไม่มี
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Use stored value if it exists, otherwise use system preference
        const theme = stored ? stored : (systemDark ? 'dark' : 'light');
        
        document.documentElement.classList.toggle('dark', theme === 'dark');
        return theme;
    } catch { 
        // Fallback if localStorage is disabled (e.g., Safari Private Mode)
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', systemDark);
        return systemDark ? 'dark' : 'light';
    }
}
// ------------------------------------------

// --- Local Storage Functions (FIX: Added try/catch to all) ---
function saveLastPage(pageId, quizFile = null) {
    try {
        // Save as object to remember both page and specific quiz file
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
        // Avoid storing large, redundant data
        const stateToSave = { ...state };
        delete stateToSave.currentQuizDataRef;
        delete stateToSave.originalQuizDataRef;
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
        // Re-apply the state to the UI after it's built
        setTimeout(() => restoreQuiz(containerId), 0);
    } else {
        quizState = {
            type: 'mcq', totalQuestions: quizData.length, answered: 0, correct: 0, incorrect: 0,
            incorrectIndices: [], currentQuizDataRef: quizData, originalQuizDataRef: originalDataRef || quizData,
            containerId: containerId, userAnswers: {}
        };
    }
    quizState.quizFile = quizFile; // Keep track of the current quiz file
}

function initializeLabQuizState(quizData, containerId, quizFile) {
    const savedState = loadQuizState(quizFile);

    if (savedState) {
        quizState = {
            ...savedState,
            originalQuizDataRef: quizData,
        };
         setTimeout(() => restoreQuiz(containerId), 0);
    } else {
        const totalSubQuestions = quizData.reduce((acc, q) => {
            if (q.type === 'matching_case_study') {
                return acc + q.subQuestions.reduce((subAcc, sq) => subAcc + sq.parts.length, 0);
            }
            return acc + (q.subQuestions?.length || 0);
        }, 0);

        quizState = {
            type: 'lab', totalQuestions: totalSubQuestions, answered: 0, correct: 0, incorrect: 0,
            incorrectQuestionBlocks: [], originalQuizDataRef: quizData, containerId: containerId, answers: {}
        };

        quizData.forEach(q => {
            const subQuestions = q.subQuestions || [];
            if (q.type === 'matching_case_study') {
                subQuestions.forEach(sq => sq.parts.forEach(part => {
                    quizState.answers[part.id] = { status: 'unchecked' };
                }));
            } else {
                subQuestions.forEach(sq => {
                    quizState.answers[sq.id] = { status: 'unchecked' };
                });
            }
        });
    }
    quizState.quizFile = quizFile; // Keep track of the current quiz file
    
    // FIX: Check element existence before class manipulation
    const tracker = document.getElementById('progress-tracker');
    const retryButtons = document.getElementById('retry-buttons');
    if (tracker) tracker.classList.remove('hidden');
    if (retryButtons) retryButtons.classList.remove('hidden');

    updateProgressBar();
}


function updateProgressBar() {
    const tracker = document.getElementById('progress-tracker');
    if (Object.keys(quizState).length === 0 || !quizState.totalQuestions) {
        if (tracker) tracker.classList.add('hidden'); // FIX: Safe access
        return;
    }
    if (!tracker) return; // Prevent further operations if tracker is missing

    const remaining = quizState.totalQuestions - quizState.answered;
    const percentage = quizState.totalQuestions > 0 ? (quizState.answered / quizState.totalQuestions) * 100 : 0;
    
    // FIX: Check element existence before assignment (Safe DOM Access)
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


    if (retryIncorrectBtn) { // FIX: Safe access
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
    const infectiousMenuBtn = document.getElementById('infectious-menu-btn');
    const backToMainMenuBtn = document.getElementById('back-to-main-menu');
    const mainMenu = document.getElementById('main-menu');
    const infectiousSubMenu = document.getElementById('infectious-sub-menu');
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
        
        // 1. Try to find the menu link for the main page (e.g., 'pharmacologyContent')
        const menuLink = document.querySelector(`.sidebar-link[data-target="${pageId}"]`);
        if (menuLink) {
            menuLink.click(); 
        }

        // 2. If a specific quiz file was saved, click the corresponding button to load content
        if (quizFile) {
            const quizButton = document.querySelector(`.lecture-btn[data-quiz-file="${quizFile}"]`);
            if (quizButton) {
                // If button is found, programmatically click it to fetch and load the quiz
                quizButton.click();
            } else {
                // Fallback for pages that require an explicit start (like Pharmacology without a saved quizFile)
                if (pageId === 'pharmacologyContent') {
                    const firstPharmaTab = document.querySelector('.pharma-tab-btn');
                    if (firstPharmaTab) { // If there's a button, click it (FIX 4)
                        firstPharmaTab.click();
                    }
                }
            }
        } else if (pageId === 'pharmacologyContent') { // Ensure Pharma always starts with first tab (FIX 4)
            const firstPharmaTab = document.querySelector('.pharma-tab-btn');
            if (firstPharmaTab) { 
                firstPharmaTab.click();
            }
        }
    }
    // ------------------------------------------


    // --- Business Logic Functions ---
    const startNewMcqQuiz = (quizData, containerId, quizFile, originalDataRef) => {
        if (!quizData || quizData.length === 0) { showPlaceholder(containerId); return; }
        initializeQuizState(quizData, containerId, originalDataRef, quizFile);
        buildMcqQuiz(quizData, containerId);
        
        const tracker = document.getElementById('progress-tracker');
        const retryButtons = document.getElementById('retry-buttons');
        if (tracker) tracker.classList.remove('hidden'); // FIX: Safe access
        if (retryButtons) retryButtons.classList.remove('hidden'); // FIX: Safe access
        
        updateProgressBar();
    };

    const startNewLabQuiz = (quizData, containerId, quizFile) => {
        if (!quizData || quizData.length === 0) { showPlaceholder(containerId); return; }
        initializeLabQuizState(quizData, containerId, quizFile);
        buildLabQuiz(quizData, containerId);
    };

    // --- Placeholder Logic (FIX 5: Safe Access) ---
    const showPlaceholder = (containerId) => {
        if (progressTracker) progressTracker.classList.add('hidden'); // FIX: Safe access
        
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

            // FIX: Safe access and use textContent where applicable for titles
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
            }
        }
    };
    // ------------------------------------------------------------------

    // --- Sidebar and Navigation ---
    function openSidebar() { if (sidebar) sidebar.classList.remove('-translate-x-full'); if (overlay) overlay.classList.remove('hidden'); }
    function closeSidebar() { if (sidebar) sidebar.classList.add('-translate-x-full'); if (overlay) overlay.classList.add('hidden'); }

    if (menuBtn) menuBtn.addEventListener('click', openSidebar); // FIX: Safe access
    if (overlay) overlay.addEventListener('click', closeSidebar); // FIX: Safe access
    if (startBtn) startBtn.addEventListener('click', openSidebar); // FIX: Safe access
    
    // FIX: Safe access for infectious menu buttons
    if (infectiousMenuBtn && mainMenu && infectiousSubMenu) {
        infectiousMenuBtn.addEventListener('click', (e) => { e.preventDefault(); mainMenu.classList.add('hide-left'); infectiousSubMenu.classList.add('show'); });
    }
    if (backToMainMenuBtn && mainMenu && infectiousSubMenu) {
        backToMainMenuBtn.addEventListener('click', (e) => { e.preventDefault(); mainMenu.classList.remove('hide-left'); infectiousSubMenu.classList.remove('show'); });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.dataset.target;
            const subTargetId = link.dataset.subTarget;
            if (progressTracker) progressTracker.classList.add('hidden');
            contentPanes.forEach(pane => pane.classList.add('hidden'));
            
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.remove('hidden');
            }

            if (targetId === 'pharmacologyContent') {
                const firstPharmaTab = document.querySelector('.pharma-tab-btn');
                if (firstPharmaTab && !firstPharmaTab.classList.contains('active')) {
                     firstPharmaTab.click();
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
            } else if (targetId === 'miniGameContent' && typeof initGame === 'function') {
                initGame();
            }
            
            const isQuizLink = link.closest('.lecture-btn');
            if (!isQuizLink) {
                 saveLastPage(targetId);
            }
            
            closeSidebar();
        });
    });

    // --- Event Delegation for all Quiz Buttons (FIX: Use textContent for titles) ---
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.addEventListener('click', async (event) => {
        const button = event.target.closest('.lecture-btn');
        if (!button) return;

        const quizFile = button.dataset.quizFile;
        const quizContainerId = button.dataset.quizContainer;
        const quizTitle = button.dataset.quizTitle;
        const quizSubtitle = button.dataset.quizSubtitle;
        const quizType = button.dataset.quizType || 'mcq';
        const parentPane = button.closest('.main-content-pane');
        const parentPaneId = parentPane?.id; // Get parent ID for saving state

        // Show loading indicator
        contentPanes.forEach(p => p.classList.add('hidden'));
        if (loadingIndicator) loadingIndicator.classList.remove('hidden'); // FIX: Safe access

        if (button.classList.contains('pharma-tab-btn')) {
            document.querySelectorAll('.pharma-tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }

        try {
            const response = await fetch(quizFile);
            if (!response.ok) throw new Error(`File not found: ${quizFile}`);
            const fetchedData = await response.json();
            if (!fetchedData || fetchedData.length === 0) throw new Error(`Quiz file is empty: ${quizFile}`);
            
            // Hide loading and show the correct content pane
            if (loadingIndicator) loadingIndicator.classList.add('hidden'); // FIX: Safe access
            if (parentPane) {
                parentPane.classList.remove('hidden');
            }

            if (parentPaneId === 'pharmacologyContent') {
                const titleEl = document.getElementById('pharma-quiz-title');
                const subtitleEl = document.getElementById('pharma-quiz-subtitle');
                if (titleEl) titleEl.textContent = quizTitle || 'Pharmacology Quiz'; // FIX: XSS safety
                if (subtitleEl) subtitleEl.textContent = quizSubtitle || 'Test your knowledge.'; // FIX: XSS safety
                startNewMcqQuiz(fetchedData, quizContainerId, quizFile);
            } else if (parentPaneId === 'infectiousContent') {
                document.querySelectorAll('.infectious-sub-pane').forEach(pane => pane.classList.add('hidden'));
                if (quizType === 'lab') {
                    const titleEl = document.getElementById('infectious-lab-quiz-title');
                    const labView = document.getElementById('infectiousLabQuizView');
                    if (titleEl) titleEl.textContent = quizTitle || 'Infectious Disease Lab'; // FIX: XSS safety
                    if (labView) labView.classList.remove('hidden');
                    startNewLabQuiz(fetchedData, quizContainerId, quizFile);
                } else {
                    const titleEl = document.getElementById('infectious-quiz-title');
                    const quizView = document.getElementById('infectiousQuizView');
                    if (titleEl) titleEl.textContent = quizTitle || 'Infectious Disease Quiz'; // FIX: XSS safety
                    if (quizView) quizView.classList.remove('hidden');
                    startNewMcqQuiz(fetchedData, quizContainerId, quizFile);
                }
            } else if (parentPaneId === 'epidemiologyContent') {
                const listView = document.getElementById('epidemiologyListView');
                const titleEl = document.getElementById('epidemiology-quiz-title');
                const quizView = document.getElementById('epidemiologyQuizView');
                if (listView) listView.classList.add('hidden');
                if (titleEl) titleEl.textContent = quizTitle || 'Epidemiology Quiz'; // FIX: XSS safety
                if (quizView) quizView.classList.remove('hidden');
                startNewMcqQuiz(fetchedData, quizContainerId, quizFile);
            } else if (parentPaneId === 'skinContent') {
                const listView = document.getElementById('skinListView');
                const titleEl = document.getElementById('skin-quiz-title');
                const quizView = document.getElementById('skinQuizView');
                if (listView) listView.classList.add('hidden');
                if (titleEl) titleEl.textContent = quizTitle || 'Skin Quiz'; // FIX: XSS safety
                if (quizView) quizView.classList.remove('hidden');
                startNewMcqQuiz(fetchedData, quizContainerId, quizFile);
            }
            
            // Save the detailed quiz state after successfully loading the quiz (FIX 2)
            saveLastPage(parentPaneId, quizFile);
            
        } catch (error) {
            console.error("Could not start quiz:", error.message);
            if (loadingIndicator) loadingIndicator.classList.add('hidden'); // FIX: Safe access
            showPlaceholder(parentPaneId || quizContainerId);
        }
    });

    // FIX: Safe access
    if (retryBtn) retryBtn.addEventListener('click', () => {
        if (quizState.originalQuizDataRef) {
            try { localStorage.removeItem(`topazQuizState_${quizState.quizFile}`); } catch {} // FIX: Safe localStorage
            if (quizState.type === 'lab') {
                startNewLabQuiz(quizState.originalQuizDataRef, quizState.containerId, quizState.quizFile);
            } else {
                startNewMcqQuiz(quizState.originalQuizDataRef, quizState.containerId, quizState.quizFile);
            }
        }
    });

    // FIX: Safe access
    if (retryIncorrectBtn) retryIncorrectBtn.addEventListener('click', () => {
        // ... (Logic remains the same, relies on existing quizState data)
        // ... (The key fixes for safe access were applied to updateProgressBar and DOM lookups inside)
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
                    if (reasoningDiv) { // FIX: Safe access
                        reasoningDiv.classList.add('hidden', 'opacity-0', 'max-h-0');
                        reasoningDiv.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/20', 'dark:border-red-500', 'border-blue-500', 'bg-blue-100', 'dark:bg-blue-900/50', 'dark:border-blue-500');
                    }
                    const btn = card.querySelector('.check-btn');
                    if (btn) { // FIX: Safe access
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
});

// --- MCQ Quiz Functions ---
function buildMcqQuiz(quizData, containerId) {
    const quizContainer = document.getElementById(containerId);
    if (!quizContainer) return; // FIX: Safe access

    quizContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();
    quizData.forEach((item, index) => {
        // NOTE ON FRAGILITY: Using question text to find index is fragile if question changes. 
        // Best practice is to use a stable ID from the JSON. Keeping current logic to avoid 
        // JSON changes, but it's the known weak point.
        const originalIndex = quizState.originalQuizDataRef.findIndex(q => q.question === item.question);
        
        // FIX: Image construction to prevent XSS via attributes.
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
                sourceP.textContent = `Source: ${item.imageSource}`; // FIX: XSS Safety (textContent)
                imageElement.appendChild(sourceP);
            }
        }

        const choicesHTML = Object.entries(item.choices).map(([key, value]) => `<label class="quiz-option block p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"><input type="radio" name="${containerId}_question${index}" value="${key}" class="mr-3 text-blue-600 focus:ring-blue-500 dark:focus:ring-offset-gray-800"><span class="font-medium">${key}.</span> ${value}</label>`).join('');
        
        const questionElement = document.createElement('div');
        questionElement.className = 'question-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md';
        questionElement.dataset.originalIndex = originalIndex;

        const questionContent = document.createElement('h2');
        questionContent.className = 'text-xl font-semibold mb-4';
        questionContent.innerHTML = `<span class="text-blue-600 dark:text-blue-400 font-bold">Question ${index + 1}:</span> `; // Use innerHTML only for safe static styling span
        questionContent.appendChild(document.createTextNode(item.question)); // FIX: XSS Safety (Question text)

        questionElement.appendChild(questionContent);
        if (item.imageUrl) questionElement.appendChild(imageElement); // Append safe image DOM
        questionElement.innerHTML += `<div class="choices space-y-3">${choicesHTML}</div><button class="check-btn mt-6 w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500" data-question-index="${index}">Check Answer</button><div class="reasoning hidden opacity-0 max-h-0 mt-6 p-4 border-l-4"><h3 class="font-bold text-lg mb-2"></h3><div></div></div>`;

        fragment.appendChild(questionElement);
    });

    quizContainer.appendChild(fragment);
    quizContainer.querySelectorAll('.check-btn').forEach(button => button.addEventListener('click', checkMcqAnswer));
    restoreQuiz(containerId);
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

    // --- Scoring Logic (should run only once) ---
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
    // ---------------------------------------------
    
    // UI Logic (can be separated for restoration)
    button.disabled = true;
    button.classList.add('bg-gray-400', 'dark:bg-gray-600', 'cursor-not-allowed');
    card.querySelectorAll('input[type="radio"]').forEach(radio => radio.disabled = true);

    showMcqResult(card, questionData, userAnswer, isCorrect);
}


// --- Lab Quiz Functions ---
function buildLabQuiz(quizData, containerId) {
    const quizContainer = document.getElementById(containerId);
    if (!quizContainer) return; // FIX: Safe access

    quizContainer.innerHTML = '';
    const fragment = document.createDocumentFragment(); // Create fragment for Lab Quiz
    quizData.forEach(q => {
        const card = document.createElement('div');
        card.className = 'lab-question-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md';
        card.dataset.questionNumber = q.questionNumber;

        let headerImageElement = document.createElement('div'); // FIX: Safer image DOM
        let headerHTML = `<h2 class="text-2xl font-bold mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">Question ${q.questionNumber}</h2>`;
        if (q.note) { headerHTML += `<p class="text-sm text-yellow-600 dark:text-yellow-400 italic my-2">${q.note}</p>`; }
        
        if (q.headerImage && !q.headerImage.insertAfter) {
             const img = document.createElement('img');
             img.src = q.headerImage.url;
             img.className = 'max-w-md h-auto rounded-lg mx-auto shadow-md';
             headerImageElement.className = 'my-4';
             headerImageElement.appendChild(img);

             const sourceP = document.createElement('p');
             sourceP.className = 'text-xs text-center text-gray-500 dark:text-gray-400 mt-2';
             sourceP.textContent = `Source: ${q.headerImage.source}`; // FIX: XSS Safety

             headerImageElement.appendChild(sourceP);
             if (q.headerImage.caption) {
                 const captionP = document.createElement('p');
                 captionP.className = 'text-center text-gray-600 dark:text-gray-300 mt-2 italic';
                 captionP.textContent = q.headerImage.caption; // FIX: XSS Safety
                 headerImageElement.appendChild(captionP);
             }
        }

        let subQuestionsHTML = '';
        if (q.type === 'matching_case_study') {
            subQuestionsHTML = q.subQuestions.map(caseStudy => {
                const partsHTML = caseStudy.parts.map(part => {
                    const inputHTML = `<input type="text" data-id="${part.id}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-200 dark:bg-gray-700 dark:border-gray-600">`;
                    return `
                        <div class="sub-question-part mt-2" data-part-id="${part.id}">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">${part.prompt}</label>
                            <div class="mt-1">${inputHTML}</div>
                            <div class="reasoning hidden whitespace-pre-wrap opacity-0 max-h-0 mt-2 p-3 text-sm border-l-4 rounded-r-lg"></div>
                        </div>`;
                }).join('');
                return `
                    <div class="sub-question case-study mt-4 p-4 border rounded-lg dark:border-gray-700" data-id="${caseStudy.id}">
                        <p class="font-semibold text-gray-800 dark:text-gray-200">${caseStudy.id}: <span class="font-normal">${caseStudy.case}</span></p>
                        ${partsHTML}
                        <div class="reasoning-main hidden whitespace-pre-wrap opacity-0 max-h-0 mt-4 p-3 text-sm border-l-4 rounded-r-lg bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"></div>
                    </div>`;
            }).join('');
        } else {
            subQuestionsHTML = q.subQuestions.map(sq => {
                let imageHTML = '';
                if (sq.imageUrl) { // FIX: Use safer DOM creation here too
                    const img = document.createElement('img');
                    img.src = sq.imageUrl;
                    img.alt = 'Question Image';
                    img.className = 'max-w-xs h-auto rounded-lg mx-auto shadow-md';
                    
                    const imageDiv = document.createElement('div');
                    imageDiv.className = 'my-2';
                    imageDiv.appendChild(img);
                    
                    if (sq.imageSource) {
                        const sourceP = document.createElement('p');
                        sourceP.className = 'text-xs text-center text-gray-500 dark:text-gray-400 mt-2';
                        sourceP.textContent = `Source: ${sq.imageSource}`; // FIX: XSS Safety
                        imageDiv.appendChild(sourceP);
                    }
                    imageHTML = imageDiv.outerHTML;
                }
                
                let fieldsHTML = '';
                if (sq.type === 'multi_short_answer') {
                    fieldsHTML = sq.fields.map((label, i) => `<label class="block mt-2"><span class="text-gray-700 dark:text-gray-300">${label}</span><input type="text" data-id="${sq.id}" data-index="${i}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-200 dark:bg-gray-700 dark:border-gray-600"></label>`).join('');
                } else {
                    fieldsHTML = Array.from({ length: sq.fields || 1 }, () => `<input type="text" data-id="${sq.id}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">`).join('');
                }

                let subHTML = `
                    <div class="sub-question mt-4" data-id="${sq.id}">
                        <label class="block text-md font-medium text-gray-800 dark:text-gray-200">${sq.id}: ${sq.prompt}</label>
                        ${imageHTML}
                        <div class="space-y-2 mt-2">${fieldsHTML}</div>
                        <div class="reasoning hidden whitespace-pre-wrap opacity-0 max-h-0 mt-2 p-3 text-sm border-l-4 rounded-r-lg"></div>
                    </div>`;
                if (q.headerImage?.insertAfter && sq.id === q.headerImage.insertAfter) {
                    // This section is now handled by the safer headerImageElement above if insertAfter is NOT used.
                    // If insertAfter IS used, we rely on string concatenation here, which is inherently risky, 
                    // but we will assume content in the JSON is trusted for now and focus on user-input XSS.
                    subHTML += headerImageElement.outerHTML;
                }
                return subHTML;
            }).join('');
        }

        card.innerHTML = `${headerHTML}${headerImageElement.outerHTML}<div class="space-y-4">${subQuestionsHTML}</div><button class="check-lab-btn mt-6 w-full sm:w-auto bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 dark:hover:bg-green-500" data-question-number="${q.questionNumber}">Check</button>`;
        fragment.appendChild(card);
    });
    quizContainer.appendChild(fragment);
    quizContainer.querySelectorAll('.check-lab-btn').forEach(btn => btn.addEventListener('click', checkLabAnswer));
    restoreQuiz(containerId);
}


function checkLabAnswer(event) {
    const button = event.target;
    const qNum = button.dataset.questionNumber;
    const card = button.closest('.lab-question-card');
    
    if (!card) return; // FIX: Safe access

    const questionData = quizState.originalQuizDataRef.find(q => q.questionNumber === qNum);
    const isRestoring = !event.isTrusted; // Check if the call is from a programmatic click (restore)

    if (!questionData || (card.dataset.answered === 'true' && !isRestoring)) return;

    let isBlockIncorrect = false;
    let blockIsAnswered = card.dataset.answered === 'true'; // Track if block was previously checked

    questionData.subQuestions.forEach(sq => {
        const subParts = questionData.type === 'matching_case_study' ? sq.parts : [sq];
        subParts.forEach(part => {
            const inputs = card.querySelectorAll(`input[data-id='${part.id}']`);
            
            // FIX: Safer selection of reasoning div
            let reasoningDiv = card.querySelector(`[data-part-id='${part.id}'] .reasoning`);
            if (!reasoningDiv) { 
                 reasoningDiv = card.querySelector(`.sub-question[data-id='${part.id}'] .reasoning`);
            }

            let isCorrect = false;
            let userAnswerValues = Array.from(inputs).map(i => i.value); // Capture current user input for UI/saving

            // --- Determine correctness based on saved answers or current input ---
            if (quizState.answers[part.id]?.status !== 'unchecked' && isRestoring) {
                // If restoring, use the saved status for coloring
                isCorrect = quizState.answers[part.id].status === 'correct';
            } else {
                // If original check or re-check after retry, recalculate correctness
                if (part.type === 'short_answer' || part.type === 'multi_short_answer') {
                    isCorrect = Array.from(inputs).every((input, i) => {
                        if (part.acceptAny?.includes(i)) return true;
                        const userAnswer = input.value.trim().toLowerCase();
                        const answerSet = part.answer[i] || part.answer;
                        const correctAnswers = Array.isArray(answerSet) ? answerSet.map(a => a.toLowerCase()) : [answerSet.toLowerCase()];
                        return correctAnswers.some(a => userAnswer.includes(a));
                    });
                } else if (part.type === 'keywords') {
                    let foundKeywords = new Set();
                    inputs.forEach(input => {
                        const userAnswer = input.value.trim().toLowerCase();
                        if (userAnswer) {
                            const keywords = part.answer.requiredKeywords || [];
                            keywords.forEach(kw => {
                                const kwParts = kw.toLowerCase().split('|'); // Handle OR conditions
                                if (kwParts.some(part => userAnswer.includes(part))) {
                                    foundKeywords.add(kw);
                                }
                            });
                        }
                    });
                    if (foundKeywords.size >= part.answer.requiredCount) isCorrect = true;
                }
            }


            // --- Scoring (FIX 3: Only update scores if not restoring AND not previously checked) ---
            if (!blockIsAnswered && quizState.answers[part.id]?.status === 'unchecked') {
                quizState.answered++;
                if (isCorrect) quizState.correct++; else quizState.incorrect++;
                quizState.answers[part.id] = { 
                    status: isCorrect ? 'correct' : 'incorrect',
                    userAnswer: userAnswerValues // Save the values user entered
                };
            }
            // --------------------------------------------------------------------------------------


            // --- UI Update (runs on check AND restore) ---
            const finalStatus = quizState.answers[part.id]?.status || (isCorrect ? 'correct' : 'incorrect');

            inputs.forEach(input => {
                input.classList.remove('border-green-500', 'dark:border-green-400', 'border-red-500', 'dark:border-red-400');
                input.classList.add(finalStatus === 'correct' ? 'border-green-500' : 'border-red-500', finalStatus === 'correct' ? 'dark:border-green-400' : 'dark:border-red-400');
                input.disabled = true;
            });

            if (reasoningDiv) {
                let reasoningHTML = '';
                if (part.type === 'keywords' || (part.type === 'multi_short_answer' && !part.reasoning)) {
                    reasoningHTML = part.reasoning || questionData.reasoning || '';
                } else {
                    // Show correct answer and rationale
                    const answerArray = Array.isArray(part.answer) ? part.answer : [part.answer];
                    const correctAnswerText = answerArray.map(ans => Array.isArray(ans) ? ans[0] : ans.split('|')[0]).join(' / '); // Show first option for OR answers
                    // FIX: Use textContent for answer text, but we need HTML for the span/p tags.
                    reasoningHTML = `<p class="font-bold mb-2">Correct Answer: <span class="text-green-600 dark:text-green-400">${correctAnswerText}</span></p><p>${part.reasoning || ''}</p>`;
                }
                reasoningDiv.innerHTML = reasoningHTML;
                reasoningDiv.classList.remove('hidden', 'opacity-0', 'max-h-0');
                reasoningDiv.classList.add(finalStatus === 'correct' ? 'border-green-500' : 'border-red-500', finalStatus === 'correct' ? 'bg-green-50' : 'bg-red-50', finalStatus === 'correct' ? 'dark:bg-green-900/20' : 'dark:bg-red-900/20');
            }
            if (finalStatus === 'incorrect') isBlockIncorrect = true;
        });

        if (questionData.type === 'matching_case_study' && sq.reasoning) {
            const caseReasoningDiv = card.querySelector(`.case-study[data-id='${sq.id}'] > .reasoning-main`);
            if (caseReasoningDiv) {
                caseReasoningDiv.innerHTML = `<p class="font-semibold mt-2">Case Rationale:</p><p>${sq.reasoning}</p>`;
                caseReasoningDiv.classList.remove('hidden', 'opacity-0', 'max-h-0');
            }
        }
    });

    if (isBlockIncorrect && !quizState.incorrectQuestionBlocks.includes(qNum)) {
        quizState.incorrectQuestionBlocks.push(qNum);
    }
    
    // Only disable button/mark block if this was an initial check or fully restored
    if (!isRestoring || (blockIsAnswered && isRestoring)) {
        if (button) { // FIX: Safe access
             button.disabled = true;
             button.classList.add('bg-gray-400', 'dark:bg-gray-600', 'cursor-not-allowed');
        }
        card.dataset.answered = 'true';
    }

    if (!isRestoring) {
        updateProgressBar();
    }
}
// --------------------------------------------------------------------------------------


function showMcqResult(card, questionData, userAnswer, isCorrect) {
    const button = card.querySelector('.check-btn');
    const selectedOption = card.querySelector(`input[value='${userAnswer}']`);

    if (selectedOption) {
        selectedOption.checked = true;
    }

    card.dataset.answered = 'true';
    if (button) { // FIX: Safe access
        button.disabled = true;
        button.classList.add('bg-gray-400', 'dark:bg-gray-600', 'cursor-not-allowed');
    }
    card.querySelectorAll('input[type="radio"]').forEach(radio => radio.disabled = true);

    const reasoningDiv = card.querySelector('.reasoning');
    if (!reasoningDiv) return; // FIX: Safe access

    const resultTitle = reasoningDiv.querySelector('h3');
    const resultText = reasoningDiv.querySelector('div');
    
    // FIX: Using textContent for reasoning elements where possible
    if (resultTitle && resultText) {
         let incorrectReasonsHTML = '<ul>';
         for (const key in questionData.reasoning.incorrect) {
             if (key !== questionData.correctAnswer) {
                 // FIX: Use textContent for text inside the list item for safety
                 const reason = document.createElement('li');
                 reason.innerHTML = `<strong>Why '${key}' is incorrect:</strong> `;
                 reason.appendChild(document.createTextNode(questionData.reasoning.incorrect[key]));
                 incorrectReasonsHTML += reason.outerHTML;
             }
         }
         incorrectReasonsHTML += '</ul>';

        if (isCorrect) {
            resultTitle.textContent = '✅ Correct!'; // FIX: XSS Safety
            resultTitle.className = 'font-bold text-lg mb-2 text-blue-700 dark:text-blue-400';
            reasoningDiv.className = 'reasoning opacity-100 max-h-screen mt-6 p-4 border-l-4 border-blue-500 bg-blue-100 dark:bg-blue-900/50 dark:border-blue-500';
            
            // FIX: Using textContent where possible
            resultText.innerHTML = `<p class="mb-3"></p><h4 class="font-semibold mt-4 mb-2">Why other choices are incorrect:</h4>${incorrectReasonsHTML}`;
            resultText.querySelector('p').textContent = questionData.reasoning.correct;
            
            if (selectedOption) selectedOption.parentElement.classList.add('bg-blue-100', 'dark:bg-blue-900/50', 'border-blue-500');
        } else {
            resultTitle.textContent = '❌ Incorrect'; // FIX: XSS Safety
            resultTitle.className = 'font-bold text-lg mb-2 text-red-700 dark:text-red-400';
            reasoningDiv.className = 'reasoning opacity-100 max-h-screen mt-6 p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500';
            
            // FIX: Using textContent where possible
            resultText.innerHTML = `<p class="mb-3"><strong>The correct answer is ${questionData.correctAnswer}.</strong> </p><h4 class="font-semibold mt-4 mb-2">Why other choices are incorrect:</h4>${incorrectReasonsHTML}`;
            resultText.querySelector('p').appendChild(document.createTextNode(questionData.reasoning.correct));

            if (selectedOption) selectedOption.parentElement.classList.add('bg-red-100', 'dark:bg-red-900/50', 'border-red-500');
            const correctOptionEl = card.querySelector(`input[value="${questionData.correctAnswer}"]`);
            if (correctOptionEl) correctOptionEl.parentElement.classList.add('bg-blue-100', 'dark:bg-blue-900/50', 'border-blue-500'); // FIX: Safe access
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
    } else if (quizState.type === 'lab' && quizState.answers) {
        
        const checkedBlocks = new Set();
        Object.entries(quizState.answers).forEach(([partId, answerData]) => {
            if (answerData.status !== 'unchecked') {
                const inputs = quizContainer.querySelectorAll(`input[data-id='${partId}']`);
                if (inputs.length > 0) {
                    const card = inputs[0].closest('.lab-question-card');
                    if (card) { // FIX: Safe access
                        const qNum = card.dataset.questionNumber;
                        if (answerData.userAnswer) {
                            // Restore saved input values
                            inputs.forEach((input, i) => { input.value = answerData.userAnswer[i] || ''; });
                        }
                        checkedBlocks.add(qNum);
                    }
                }
            }
        });

        // Use setTimeout to allow DOM rendering before programmatically clicking
        setTimeout(() => {
            checkedBlocks.forEach(qNum => {
                const card = quizContainer.querySelector(`.lab-question-card[data-question-number='${qNum}']`);
                if (card) {
                    const button = card.querySelector('.check-lab-btn');
                    // Programmatically call checkLabAnswer to restore UI 
                    if (button) {
                        // Create a fake event object to signal it's a programmatic restore click
                        const fakeEvent = { target: button, isTrusted: false };
                        checkLabAnswer(fakeEvent);
                    }
                }
            });
        }, 100);
    }
    updateProgressBar(); // Final update after restoration
}


// --- Global Theme Toggle ---
const themeToggleBtn = document.getElementById('theme-toggle');
const darkIcon = document.getElementById('theme-toggle-dark-icon');
const lightIcon = document.getElementById('theme-toggle-light-icon');
function updateThemeIcons() {
    // FIX: Safe access (The variables are global in this scope but need to be checked)
    if (!darkIcon || !lightIcon) return; 

    const isDark = document.documentElement.classList.contains('dark');
    darkIcon.classList.toggle('hidden', isDark);
    lightIcon.classList.toggle('hidden', !isDark);
}
if (themeToggleBtn) { // FIX: Safe access
    themeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        saveTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light'); // FIX 1: Use new saveTheme function
        updateThemeIcons();
    });
}