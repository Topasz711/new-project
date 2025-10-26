// labQuiz.js

// ฟังก์ชันที่เกี่ยวข้องกับ Lab Quiz โดยเฉพาะ
// (หมายเหตุ: quizState, updateProgressBar, restoreQuiz ถูกกำหนดไว้ใน main.js และสามารถเข้าถึงได้)


/**
 * Initializes the quiz state specifically for Lab Quizzes.
 */
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
    
    const tracker = document.getElementById('progress-tracker');
    const retryButtons = document.getElementById('retry-buttons');
    if (tracker) tracker.classList.remove('hidden');
    if (retryButtons) retryButtons.classList.remove('hidden');

    updateProgressBar();
}


/**
 * Builds the HTML structure for the Lab Quiz based on quizData.
 */
function buildLabQuiz(quizData, containerId) {
    const quizContainer = document.getElementById(containerId);
    if (!quizContainer) return;

    quizContainer.innerHTML = '';
    const fragment = document.createDocumentFragment(); 
    quizData.forEach(q => {
        const card = document.createElement('div');
        card.className = 'lab-question-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md';
        card.dataset.questionNumber = q.questionNumber;

        let headerImageElement = document.createElement('div'); 
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
             sourceP.textContent = `Source: ${q.headerImage.source}`; 

             headerImageElement.appendChild(sourceP);
             if (q.headerImage.caption) {
                 const captionP = document.createElement('p');
                 captionP.className = 'text-center text-gray-600 dark:text-gray-300 mt-2 italic';
                 captionP.textContent = q.headerImage.caption; 
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
                if (sq.imageUrl) { 
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
                        sourceP.textContent = `Source: ${sq.imageSource}`; 
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


/**
 * Handles the logic for checking a Lab Quiz answer (Short Answer/Matching/Keywords).
 */
function checkLabAnswer(event) {
    const button = event.target;
    const qNum = button.dataset.questionNumber;
    const card = button.closest('.lab-question-card');
    
    if (!card) return;

    const questionData = quizState.originalQuizDataRef.find(q => q.questionNumber === qNum);
    const isRestoring = !event.isTrusted;

    if (!questionData || (card.dataset.answered === 'true' && !isRestoring)) return;

    let isBlockIncorrect = false;
    let blockIsAnswered = card.dataset.answered === 'true';

    questionData.subQuestions.forEach(sq => {
        const subParts = questionData.type === 'matching_case_study' ? sq.parts : [sq];
        subParts.forEach(part => {
            const inputs = card.querySelectorAll(`input[data-id='${part.id}']`);
            
            let reasoningDiv = card.querySelector(`[data-part-id='${part.id}'] .reasoning`);
            if (!reasoningDiv) { 
                 reasoningDiv = card.querySelector(`.sub-question[data-id='${part.id}'] .reasoning`);
            }

            let isCorrect = false;
            let userAnswerValues = Array.from(inputs).map(i => i.value);

            // --- Determine correctness ---
            if (quizState.answers[part.id]?.status !== 'unchecked' && isRestoring) {
                isCorrect = quizState.answers[part.id].status === 'correct';
            } else {
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
                                const kwParts = kw.toLowerCase().split('|');
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
                    userAnswer: userAnswerValues
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
                    const answerArray = Array.isArray(part.answer) ? part.answer : [part.answer];
                    const correctAnswerText = answerArray.map(ans => Array.isArray(ans) ? ans[0] : ans.split('|')[0]).join(' / ');
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
    
    if (!isRestoring || (blockIsAnswered && isRestoring)) {
        if (button) {
             button.disabled = true;
             button.classList.add('bg-gray-400', 'dark:bg-gray-600', 'cursor-not-allowed');
        }
        card.dataset.answered = 'true';
    }

    if (!isRestoring) {
        updateProgressBar();
    }
}