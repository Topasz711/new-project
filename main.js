// main.js
/**
 * @type {object}
 * @description Holds the state of the current quiz.
 */
let quizState = {};

/**
 * Initializes the state for a Multiple Choice Question (MCQ) quiz.
 * @param {Array<object>} quizData - The array of quiz questions.
 * @param {string} containerId - The ID of the container element for the quiz.
 * @param {Array<object>} [originalDataRef] - A reference to the original, unmodified quiz data for retries.
 */
function initializeQuizState(quizData, containerId, originalDataRef) {
    quizState = {
        type: 'mcq', totalQuestions: quizData.length, answered: 0, correct: 0, incorrect: 0,
        incorrectIndices: [], currentQuizDataRef: quizData, originalQuizDataRef: originalDataRef || quizData, containerId: containerId
    };
    document.getElementById('progress-tracker').classList.remove('hidden');
    document.getElementById('retry-buttons').classList.remove('hidden');
    updateProgressBar();
}

/**
 * Initializes the state for a Lab-style quiz, which may have complex sub-questions.
 * @param {Array<object>} quizData - The array of lab quiz questions.
 * @param {string} containerId - The ID of the container element for the quiz.
 */
function initializeLabQuizState(quizData, containerId) {
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
    document.getElementById('progress-tracker').classList.remove('hidden');
    document.getElementById('retry-buttons').classList.remove('hidden');
    updateProgressBar();
}

/**
 * Updates the progress bar and score display based on the current quiz state.
 */
function updateProgressBar() {
    if (Object.keys(quizState).length === 0 || !quizState.totalQuestions) {
        document.getElementById('progress-tracker').classList.add('hidden');
        return;
    }
    const remaining = quizState.totalQuestions - quizState.answered;
    const percentage = quizState.totalQuestions > 0 ? (quizState.answered / quizState.totalQuestions) * 100 : 0;
    document.getElementById('answered-count').innerText = quizState.answered;
    document.getElementById('total-count').innerText = quizState.totalQuestions;
    document.getElementById('correct-count').innerText = quizState.correct;
    document.getElementById('incorrect-count').innerText = quizState.incorrect;
    document.getElementById('remaining-count').innerText = remaining;
    document.getElementById('progress-bar-fill').style.width = `${percentage}%`;

    const retryIncorrectBtn = document.getElementById('retry-incorrect-btn');
    const hasIncorrect = (quizState.type === 'mcq' && quizState.incorrectIndices?.length > 0) || (quizState.type === 'lab' && quizState.incorrectQuestionBlocks?.length > 0);
    retryIncorrectBtn.disabled = !hasIncorrect;
    retryIncorrectBtn.classList.toggle('opacity-50', !hasIncorrect);
    retryIncorrectBtn.classList.toggle('cursor-not-allowed', !hasIncorrect);
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

    // --- Business Logic Functions ---
    /**
     * Starts a new MCQ quiz.
     * @param {Array<object>} quizData - The quiz data.
     * @param {string} containerId - The ID of the quiz container.
     * @param {Array<object>} [originalDataRef] - Optional reference to the original quiz data.
     */
    const startNewMcqQuiz = (quizData, containerId, originalDataRef) => {
        if (!quizData || quizData.length === 0) { showPlaceholder(containerId); return; }
        initializeQuizState(quizData, containerId, originalDataRef);
        buildMcqQuiz(quizData, containerId);
    };

    /**
     * Starts a new Lab quiz.
     * @param {Array<object>} quizData - The quiz data.
     * @param {string} containerId - The ID of the quiz container.
     */
    const startNewLabQuiz = (quizData, containerId) => {
        if (!quizData || quizData.length === 0) { showPlaceholder(containerId); return; }
        initializeLabQuizState(quizData, containerId);
        buildLabQuiz(quizData, containerId);
    };

    /**
     * Shows a placeholder message when a quiz is not available.
     * @param {string} containerId - The ID of the quiz container.
     */
    const showPlaceholder = (containerId) => {
        progressTracker.classList.add('hidden');
        const targetPane = document.getElementById(containerId)?.closest('.main-content-pane');
        if (targetPane) {
            targetPane.classList.remove('hidden');
            if (targetPane.id === 'infectiousContent') {
                document.querySelectorAll('.infectious-sub-pane').forEach(pane => pane.classList.add('hidden'));
                document.getElementById('infectiousPlaceholder').classList.remove('hidden');
            } else if (targetPane.id === 'epidemiologyContent') {
                document.getElementById('epidemiologyListView').classList.add('hidden');
                document.getElementById('epidemiologyQuizView').classList.add('hidden');
                document.getElementById('placeholderContent').classList.remove('hidden');
            } else if (targetPane.id === 'pharmacologyContent') {
                document.getElementById('pharmaQuizContainer').innerHTML = `<div class="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md"><h2 class="text-2xl font-semibold text-gray-500 dark:text-gray-400">ยังไม่มี/อาจจะไม่ทำ</h2><p class="text-gray-400 dark:text-gray-500 mt-2">(Not yet available / Might not be created)</p></div>`;
            }
        }
    };

    // --- Sidebar and Navigation ---
    /**
     * Opens the sidebar navigation menu.
     */
    function openSidebar() { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); }
    /**
     * Closes the sidebar navigation menu.
     */
    function closeSidebar() { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); }

    menuBtn.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);
    startBtn.addEventListener('click', openSidebar);

    infectiousMenuBtn.addEventListener('click', (e) => { e.preventDefault(); mainMenu.classList.add('hide-left'); infectiousSubMenu.classList.add('show'); });
    backToMainMenuBtn.addEventListener('click', (e) => { e.preventDefault(); mainMenu.classList.remove('hide-left'); infectiousSubMenu.classList.remove('show'); });

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.dataset.target;
            const subTargetId = link.dataset.subTarget;
            progressTracker.classList.add('hidden');
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
                document.getElementById('epidemiologyListView').classList.remove('hidden');
                document.getElementById('epidemiologyQuizView').classList.add('hidden');
            } else if (targetId === 'miniGameContent' && typeof initGame === 'function') {
                initGame();
            }
            closeSidebar();
        });
    });

    // --- Event Delegation for all Quiz Buttons ---
    document.getElementById('main-content').addEventListener('click', async (event) => {
        const button = event.target.closest('.lecture-btn');
        if (!button) return;

        const quizFile = button.dataset.quizFile;
        const quizContainerId = button.dataset.quizContainer;
        const quizTitle = button.dataset.quizTitle;
        const quizSubtitle = button.dataset.quizSubtitle;
        const quizType = button.dataset.quizType || 'mcq';
        const parentPane = button.closest('.main-content-pane');

        // Show loading indicator
        contentPanes.forEach(p => p.classList.add('hidden'));
        loadingIndicator.classList.remove('hidden');

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
            loadingIndicator.classList.add('hidden');
            if (parentPane) {
                parentPane.classList.remove('hidden');
            }

            if (parentPane.id === 'pharmacologyContent') {
                document.getElementById('pharma-quiz-title').innerHTML = quizTitle || 'Pharmacology Quiz';
                document.getElementById('pharma-quiz-subtitle').innerHTML = quizSubtitle || 'Test your knowledge.';
                startNewMcqQuiz(fetchedData, quizContainerId);
            } else if (parentPane.id === 'infectiousContent') {
                document.querySelectorAll('.infectious-sub-pane').forEach(pane => pane.classList.add('hidden'));
                if (quizType === 'lab') {
                    document.getElementById('infectious-lab-quiz-title').innerHTML = quizTitle || 'Infectious Disease Lab';
                    document.getElementById('infectiousLabQuizView').classList.remove('hidden');
                    startNewLabQuiz(fetchedData, quizContainerId);
                } else {
                    document.getElementById('infectious-quiz-title').innerHTML = quizTitle || 'Infectious Disease Quiz';
                    document.getElementById('infectiousQuizView').classList.remove('hidden');
                    startNewMcqQuiz(fetchedData, quizContainerId);
                }
            } else if (parentPane.id === 'epidemiologyContent') {
                document.getElementById('epidemiologyListView').classList.add('hidden');
                document.getElementById('epidemiology-quiz-title').innerHTML = quizTitle || 'Epidemiology Quiz';
                document.getElementById('epidemiologyQuizView').classList.remove('hidden');
                startNewMcqQuiz(fetchedData, quizContainerId);
            }

        } catch (error) {
            console.error("Could not start quiz:", error.message);
            loadingIndicator.classList.add('hidden');
            showPlaceholder(quizContainerId);
            const placeholderPane = document.getElementById('placeholderContent');
        if (placeholderPane) {
            placeholderPane.classList.remove('hidden');
    }
        }
    });

    retryBtn.addEventListener('click', () => {
        if (quizState.originalQuizDataRef) {
            if (quizState.type === 'lab') {
                startNewLabQuiz(quizState.originalQuizDataRef, quizState.containerId);
            } else {
                startNewMcqQuiz(quizState.originalQuizDataRef, quizState.containerId);
            }
        }
    });

    retryIncorrectBtn.addEventListener('click', () => {
        if (quizState.type === 'mcq') {
            if (!quizState.incorrectIndices?.length) return;
            const indicesToReset = [...quizState.incorrectIndices];
            quizState.answered -= indicesToReset.length;
            quizState.incorrect -= indicesToReset.length;
            quizState.incorrectIndices = [];
            indicesToReset.forEach(originalIndex => {
                const card = document.querySelector(`#${quizState.containerId} .question-card[data-original-index='${originalIndex}']`);
                if (card) {
                    card.dataset.answered = 'false';
                    card.querySelectorAll('input[type="radio"]').forEach(radio => {
                        radio.disabled = false;
                        radio.checked = false;
                        radio.parentElement.classList.remove('bg-red-100', 'dark:bg-red-900/50', 'border-red-500', 'bg-blue-100', 'dark:bg-blue-900/50', 'border-blue-500');
                    });
                    const reasoningDiv = card.querySelector('.reasoning');
                    reasoningDiv.classList.add('hidden', 'opacity-0', 'max-h-0');
                    reasoningDiv.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/20', 'dark:border-red-500', 'border-blue-500', 'bg-blue-100', 'dark:bg-blue-900/50', 'dark:border-blue-500');
                    const btn = card.querySelector('.check-btn');
                    btn.disabled = false;
                    btn.classList.remove('bg-gray-400', 'dark:bg-gray-600', 'cursor-not-allowed');
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
                        quizState.answers[sq.id].status = 'unchecked';
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
/**
 * Builds the HTML for an MCQ quiz and injects it into the container.
 * @param {Array<object>} quizData - The array of quiz questions.
 * @param {string} containerId - The ID of the element to contain the quiz.
 */
function buildMcqQuiz(quizData, containerId) {
    const quizContainer = document.getElementById(containerId);
    quizContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();
    quizData.forEach((item, index) => {
        const originalIndex = quizState.originalQuizDataRef.findIndex(q => q.question === item.question);
        let imageHTML = item.imageUrl ? `<div class="my-4"><img src="${item.imageUrl}" alt="Question Image" class="max-w-sm h-auto rounded-lg mx-auto shadow-md">${item.imageSource ? `<p class="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Source: ${item.imageSource}</p>` : ''}</div>` : '';
        const choicesHTML = Object.entries(item.choices).map(([key, value]) => `<label class="quiz-option block p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"><input type="radio" name="${containerId}_question${index}" value="${key}" class="mr-3 text-blue-600 focus:ring-blue-500 dark:focus:ring-offset-gray-800"><span class="font-medium">${key}.</span> ${value}</label>`).join('');
        const questionElement = document.createElement('div');
        questionElement.className = 'question-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md';
        questionElement.dataset.originalIndex = originalIndex;
        questionElement.innerHTML = `<h2 class="text-xl font-semibold mb-4"><span class="text-blue-600 dark:text-blue-400 font-bold">Question ${index + 1}:</span> ${item.question}</h2>${imageHTML}<div class="choices space-y-3">${choicesHTML}</div><button class="check-btn mt-6 w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500" data-question-index="${index}">Check Answer</button><div class="reasoning hidden opacity-0 max-h-0 mt-6 p-4 border-l-4"><h3 class="font-bold text-lg mb-2"></h3><div></div></div>`;
        fragment.appendChild(questionElement);
    });

    quizContainer.appendChild(fragment);
    quizContainer.querySelectorAll('.check-btn').forEach(button => button.addEventListener('click', checkMcqAnswer));
}

/**
 * Checks the selected answer for an MCQ question, updates state, and provides feedback.
 * @param {Event} event - The click event from the "Check Answer" button.
 */
function checkMcqAnswer(event) {
    const button = event.target;
    const card = button.closest('.question-card');
    if (card.dataset.answered === 'true') return;

    const questionIndex = parseInt(button.dataset.questionIndex, 10);
    const originalIndex = parseInt(card.dataset.originalIndex, 10);
    const questionData = quizState.currentQuizDataRef[questionIndex];
    const selectedOption = card.querySelector(`input[type="radio"]:checked`);
    if (!selectedOption) return;

    card.dataset.answered = 'true';
    quizState.answered++;
    const userAnswer = selectedOption.value;
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

    const reasoningDiv = card.querySelector('.reasoning');
    const resultTitle = reasoningDiv.querySelector('h3');
    const resultText = reasoningDiv.querySelector('div');
    let incorrectReasonsHTML = '<ul>';
    for (const key in questionData.reasoning.incorrect) {
        if (key !== questionData.correctAnswer) incorrectReasonsHTML += `<li class="mb-2"><strong>Why '${key}' is incorrect:</strong> ${questionData.reasoning.incorrect[key]}</li>`;
    }
    incorrectReasonsHTML += '</ul>';

    if (isCorrect) {
        resultTitle.textContent = '✅ Correct!';
        resultTitle.className = 'font-bold text-lg mb-2 text-blue-700 dark:text-blue-400';
        reasoningDiv.className = 'reasoning opacity-100 max-h-screen mt-6 p-4 border-l-4 border-blue-500 bg-blue-100 dark:bg-blue-900/50 dark:border-blue-500';
        resultText.innerHTML = `<p class="mb-3">${questionData.reasoning.correct}</p><h4 class="font-semibold mt-4 mb-2">Why other choices are incorrect:</h4>${incorrectReasonsHTML}`;
        selectedOption.parentElement.classList.add('bg-blue-100', 'dark:bg-blue-900/50', 'border-blue-500');
    } else {
        resultTitle.textContent = '❌ Incorrect';
        resultTitle.className = 'font-bold text-lg mb-2 text-red-700 dark:text-red-400';
        reasoningDiv.className = 'reasoning opacity-100 max-h-screen mt-6 p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500';
        resultText.innerHTML = `<p class="mb-3"><strong>The correct answer is ${questionData.correctAnswer}.</strong> ${questionData.reasoning.correct}</p><h4 class="font-semibold mt-4 mb-2">Why other choices are incorrect:</h4>${incorrectReasonsHTML}`;
        selectedOption.parentElement.classList.add('bg-red-100', 'dark:bg-red-900/50', 'border-red-500');
        card.querySelector(`input[value="${questionData.correctAnswer}"]`).parentElement.classList.add('bg-blue-100', 'dark:bg-blue-900/50', 'border-blue-500');
    }
}

// --- Lab Quiz Functions ---
/**
 * Builds the HTML for a lab-style quiz and injects it into the container.
 * @param {Array<object>} quizData - The array of lab quiz questions.
 * @param {string} containerId - The ID of the element to contain the quiz.
 */
function buildLabQuiz(quizData, containerId) {
    const quizContainer = document.getElementById(containerId);
    quizContainer.innerHTML = '';
    const fragment = document.createDocumentFragment(); // Create fragment for Lab Quiz
    quizData.forEach(q => {
        const card = document.createElement('div');
        card.className = 'lab-question-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md';
        card.dataset.questionNumber = q.questionNumber;

        let headerImageHTML = '';
        if (q.headerImage && !q.headerImage.insertAfter) {
            headerImageHTML = `<div class="my-4"><img src="${q.headerImage.url}" class="max-w-md h-auto rounded-lg mx-auto shadow-md"><p class="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Source: ${q.headerImage.source}</p>${q.headerImage.caption ? `<p class="text-center text-gray-600 dark:text-gray-300 mt-2 italic">${q.headerImage.caption}</p>` : ''}</div>`;
        }

        let headerHTML = `<h2 class="text-2xl font-bold mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">Question ${q.questionNumber}</h2>`;
        if (q.note) { headerHTML += `<p class="text-sm text-yellow-600 dark:text-yellow-400 italic my-2">${q.note}</p>`; }
        headerHTML += headerImageHTML;

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
                let imageHTML = sq.imageUrl ? `<div class="my-2"><img src="${sq.imageUrl}" alt="Question Image" class="max-w-xs h-auto rounded-lg mx-auto shadow-md">${sq.imageSource ? `<p class="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Source: ${sq.imageSource}</p>` : ''}</div>` : '';
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
                    subHTML += `<div class="my-4"><img src="${q.headerImage.url}" class="max-w-md h-auto rounded-lg mx-auto shadow-md"><p class="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Source: ${q.headerImage.source}</p>${q.headerImage.caption ? `<p class="text-center text-gray-600 dark:text-gray-300 mt-2 italic">${q.headerImage.caption}</p>` : ''}</div>`;
                }
                return subHTML;
            }).join('');
        }

        card.innerHTML = `${headerHTML}<div class="space-y-4">${subQuestionsHTML}</div><button class="check-lab-btn mt-6 w-full sm:w-auto bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 dark:hover:bg-green-500" data-question-number="${q.questionNumber}">Check</button>`;
        fragment.appendChild(card);
    });
    quizContainer.appendChild(fragment);
    quizContainer.querySelectorAll('.check-lab-btn').forEach(btn => btn.addEventListener('click', checkLabAnswer));
}


/**
 * Checks the answers for a lab question block, updates state, and provides feedback.
 * @param {Event} event - The click event from the "Check" button.
 */
function checkLabAnswer(event) {
    const button = event.target;
    const qNum = button.dataset.questionNumber;
    const card = button.closest('.lab-question-card');
    const questionData = quizState.originalQuizDataRef.find(q => q.questionNumber === qNum);
    if (!questionData || card.dataset.answered === 'true') return;

    let isBlockIncorrect = false;

    questionData.subQuestions.forEach(sq => {
        const subParts = questionData.type === 'matching_case_study' ? sq.parts : [sq];
        subParts.forEach(part => {
            if (quizState.answers[part.id]?.status !== 'unchecked') return;

            const inputs = card.querySelectorAll(`input[data-id='${part.id}']`);
            const reasoningDiv = card.querySelector(`[data-part-id='${part.id}'] .reasoning, .sub-question[data-id='${part.id}'] .reasoning`);
            let isCorrect = false;

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

            quizState.answered++;
            if (isCorrect) quizState.correct++; else quizState.incorrect++;
            quizState.answers[part.id] = { status: isCorrect ? 'correct' : 'incorrect' };

            inputs.forEach(input => {
                input.classList.remove('border-green-500', 'dark:border-green-400', 'border-red-500', 'dark:border-red-400');
                input.classList.add(isCorrect ? 'border-green-500' : 'border-red-500', isCorrect ? 'dark:border-green-400' : 'dark:border-red-400');
                input.disabled = true;
            });

            if (reasoningDiv) {
                let reasoningHTML = '';
                if (part.type === 'keywords' || (part.type === 'multi_short_answer' && !part.reasoning)) {
                    reasoningHTML = part.reasoning || questionData.reasoning || '';
                } else {
                    const answerArray = Array.isArray(part.answer) ? part.answer : [part.answer];
                    const correctAnswerText = answerArray.map(ans => Array.isArray(ans) ? ans[0] : ans.split('|')[0]).join(' / '); // Show first option for OR answers
                    reasoningHTML = `<p class="font-bold mb-2">Correct Answer: <span class="text-green-600 dark:text-green-400">${correctAnswerText}</span></p><p>${part.reasoning || ''}</p>`;
                }
                reasoningDiv.innerHTML = reasoningHTML;
                reasoningDiv.classList.remove('hidden', 'opacity-0', 'max-h-0');
                reasoningDiv.classList.add(isCorrect ? 'border-green-500' : 'border-red-500', isCorrect ? 'bg-green-50' : 'bg-red-50', isCorrect ? 'dark:bg-green-900/20' : 'dark:bg-red-900/20');
            }
            if (!isCorrect) isBlockIncorrect = true;
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

    button.disabled = true;
    button.classList.add('bg-gray-400', 'dark:bg-gray-600', 'cursor-not-allowed');
    card.dataset.answered = 'true';
    updateProgressBar();
}

// --- Global Theme Toggle ---
const themeToggleBtn = document.getElementById('theme-toggle');
const darkIcon = document.getElementById('theme-toggle-dark-icon');
const lightIcon = document.getElementById('theme-toggle-light-icon');

/**
 * Updates the theme toggle icon based on the current theme (dark/light).
 */
function updateIcon() {
    if (document.documentElement.classList.contains('dark')) {
        darkIcon.classList.add('hidden'); lightIcon.classList.remove('hidden');
    } else {
        darkIcon.classList.remove('hidden'); lightIcon.classList.add('hidden');
    }
}
themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark'); updateIcon();
});
updateIcon();