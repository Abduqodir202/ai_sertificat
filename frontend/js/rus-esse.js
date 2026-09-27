// =====================================================
// AI SERTIFIKAT
// RUS TILI ESSE — FRONTEND
// =====================================================

console.log("RUS ESSE JS ISHLAYAPTI");


// =====================================================
// ELEMENTLAR
// =====================================================

const essayText =
    document.getElementById("essayText");

const topicInput =
    document.getElementById("essayTopic");

const wordCount =
    document.getElementById("wordCount");

const charCount =
    document.getElementById("charCount");

const paragraphCount =
    document.getElementById("paragraphCount");

const wordStatus =
    document.getElementById("wordStatus");

const result =
    document.getElementById("result");

const totalScore =
    document.getElementById("totalScore");

const reviewText =
    document.getElementById("reviewText");

const studentNameInput =
    document.getElementById("studentName");

const score75Element =
    document.getElementById("score75");

const scoreLevelElement =
    document.getElementById("scoreLevel");


const API_URL =
    "/api/check-essay/";

// =====================================================
// 24 BALL → 75 BALL VA DARAJA
// =====================================================

function calculateOfficialResult(score24) {

    const score = Number(score24);

    if (Number.isNaN(score)) {
        return {
            score75: 0,
            level: "—"
        };
    }

    const conversionTable = {
        24: 75,
        23.5: 74,
        23: 73,
        22.5: 72,
        22: 71,
        21.5: 70,
        21: 69,
        20.5: 68,
        20: 67,
        19.5: 66,
        19: 65,
        18.5: 64,
        18: 63,
        17.5: 62,
        17: 61,
        16.5: 60,
        16: 59,
        15.5: 58,
        15: 57,
        14.5: 56,
        14: 55,
        13.5: 54,
        13: 53,
        12.5: 52,
        12: 51,
        11.5: 50,
        11: 49,
        10.5: 48,
        10: 47,
        9.5: 46
    };

    const score75 =
        conversionTable[score] ?? 0;

    let level = "—";

    if (score75 >= 70) {
        level = "A+";
    }
    else if (score75 >= 65) {
        level = "A";
    }
    else if (score75 >= 60) {
        level = "B+";
    }
    else if (score75 >= 55) {
        level = "B";
    }
    else if (score75 >= 50) {
        level = "C+";
    }
    else if (score75 >= 46) {
        level = "C";
    }

    return {
        score75: score75,
        level: level
    };
}


// =====================================================
// 75 BALL NATIJASINI KO'RSATISH
// =====================================================

function displayOfficialResult(score24) {

    const officialResult =
        calculateOfficialResult(score24);

    if (score75Element) {
        score75Element.textContent =
            `${officialResult.score75} / 75`;
    }

    if (scoreLevelElement) {
        scoreLevelElement.textContent =
            officialResult.level;
    }
}


// =====================================================
// MATN TAHLILI
// =====================================================

function analyzeText() {

    const text =
        essayText.value;

    const trimmedText =
        text.trim();

    let words = [];

    if (trimmedText.length > 0) {
        words =
            trimmedText.split(/\s+/);
    }

    const wordsNumber =
        words.length;

    const charactersNumber =
        text.length;

    let paragraphsNumber = 0;

    if (trimmedText.length > 0) {

        paragraphsNumber =
            trimmedText
                .split(/\n\s*\n/)
                .filter(
                    paragraph =>
                        paragraph.trim() !== ""
                )
                .length;
    }

    wordCount.textContent =
        wordsNumber;

    charCount.textContent =
        charactersNumber;

    paragraphCount.textContent =
        paragraphsNumber;


    // =================================================
    // WORD STATUS
    // =================================================

    wordStatus.className =
        "word-status";

    if (wordsNumber === 0) {

        wordStatus.classList.add(
            "neutral"
        );

        wordStatus.textContent =
            "Введите эссе для проверки объёма.";
    }

    else if (wordsNumber < 100) {

        wordStatus.classList.add(
            "warning"
        );

        wordStatus.textContent =
            "⚠️ Менее 100 слов. Работа будет оценена минимально.";
    }

    else {

        wordStatus.classList.add(
            "success"
        );

        wordStatus.textContent =
            "✓ Объём текста позволяет выполнить проверку.";
    }
}


// =====================================================
// INPUT
// =====================================================

essayText.addEventListener(
    "input",
    analyzeText
);


// =====================================================
// ПРОВЕРКА ЭССЕ
// =====================================================

async function checkEssay() {

    const text =
        essayText.value.trim();


    // =================================================
    // BO'SH MATN
    // =================================================

    if (!text) {

        alert(
            "Пожалуйста, напишите эссе."
        );

        return;
    }


    // =================================================
    // MAVZU
    // =================================================

    const topic =
        topicInput
            ? topicInput.value.trim()
            : "";


    if (!topic) {

        alert(
            "Пожалуйста, введите тему письменной работы."
        );

        if (topicInput) {
            topicInput.focus();
        }

        return;
    }


    // =================================================
    // SO'ZLAR
    // =================================================

    const words =
        text.split(/\s+/);

    const wordsNumber =
        words.length;


    // =================================================
    // O'QUVCHI ISMI
    // =================================================

    const studentName =
        studentNameInput
            ? studentNameInput.value.trim()
            : "";


    // =================================================
    // BUTTON
    // =================================================

    const button =
        document.querySelector(
            ".check-btn"
        );

    const originalText =
        button.textContent;

    button.disabled = true;

    button.textContent =
        "⏳ Проверка...";


    try {

        // =================================================
        // DJANGO UCHUN MA'LUMOT
        // =================================================

        const requestData = {

            // Foydalanuvchi yozgan esse
            essay: text,

            // Foydalanuvchi yozgan mavzu
            topic: topic,

            // O'quvchi ismi
            student_name:
                studentName,

            subject:
                "russian",

            language:
                "ru",

            word_count:
                wordsNumber,

            character_count:
                text.length,

            paragraph_count:
                text
                    .split(/\n\s*\n/)
                    .filter(
                        p =>
                            p.trim() !== ""
                    )
                    .length
        };


        console.log(
            "TOPIC:",
            requestData.topic
        );

        console.log(
            "STUDENT NAME:",
            requestData.student_name
        );

        console.log(
            "FULL DATA:",
            requestData
        );


        // =================================================
        // API
        // =================================================

        const response =
            await fetch(
                API_URL,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            requestData
                        )
                }
            );


        // =================================================
        // SERVER XATOSI
        // =================================================

        if (!response.ok) {

            let errorData = {};

            try {

                errorData =
                    await response.json();

            }
            catch (e) {

                console.error(
                    "JSON error:",
                    e
                );
            }

            console.error(
                "Server error:",
                errorData
            );

            throw new Error(
                `HTTP error: ${response.status}`
            );
        }


        // =================================================
        // JAVOB
        // =================================================

        const resultData =
            await response.json();


        console.log(
            "AI RESULT:",
            resultData
        );


        // =================================================
        // NATIJANI KO'RSATISH
        // =================================================

        showResult();

        displayResult(
            resultData
        );

    }


    // =====================================================
    // ERROR
    // =====================================================

    catch (error) {

        console.error(
            "Essay check error:",
            error
        );

        showResult();

        totalScore.textContent =
            "—";

        if (score75Element) {

            score75Element.textContent =
                "— / 75";
        }

        if (scoreLevelElement) {

            scoreLevelElement.textContent =
                "—";
        }

        reviewText.textContent =
            "Сервер проверки недоступен. " +
            "Проверьте Django backend.";
    }


    // =====================================================
    // BUTTONNI QAYTARISH
    // =====================================================

    finally {

        button.disabled =
            false;

        button.textContent =
            originalText;
    }
}


// =====================================================
// RESULTNI KO'RSATISH
// =====================================================

function showResult() {

    result.classList.add(
        "show"
    );

    result.scrollIntoView({
        behavior:
            "smooth",

        block:
            "start"
    });
}


// =====================================================
// AI NATIJASI
// =====================================================

function displayResult(data) {

    // =================================================
    // UMUMIY BALL
    // =================================================

    if (
        data.total_score !== undefined
    ) {

        totalScore.textContent =
            data.total_score;

        // 24 → 75
        displayOfficialResult(
            data.total_score
        );
    }


    // =================================================
    // REVIEW
    // =================================================

    if (data.review) {

        reviewText.textContent =
            data.review;
    }


    // =================================================
    // 12 MEZON
    // =================================================

    if (
        Array.isArray(
            data.criteria
        )
    ) {

        displayCriteria(
            data.criteria
        );
    }


    // =================================================
    // XATOLAR
    // =================================================

    if (
        Array.isArray(
            data.errors
        )
    ) {

        displayErrors(
            data.errors
        );
    }


    // =================================================
    // TAVSIYALAR
    // =================================================

    if (
        Array.isArray(
            data.recommendations
        )
    ) {

        displayRecommendations(
            data.recommendations
        );
    }
}


// =====================================================
// 12 TA MEZON
// =====================================================

function displayCriteria(criteria) {

    const resultItems =
        document.querySelectorAll(
            ".result-item"
        );

    resultItems.forEach(
        (item, index) => {

            const criterion =
                criteria[index];

            if (!criterion) {
                return;
            }


            // =========================================
            // BALL
            // =========================================

            const scoreElement =
                item.querySelector(
                    "strong"
                );

            if (scoreElement) {

                scoreElement.textContent =
                    `${criterion.score} / 2`;
            }


            // =========================================
            // REASON
            // =========================================

            let reasonElement =
                item.querySelector(
                    ".criterion-reason"
                );

            if (!reasonElement) {

                reasonElement =
                    document.createElement(
                        "div"
                    );

                reasonElement.className =
                    "criterion-reason";

                item.appendChild(
                    reasonElement
                );
            }

            reasonElement.textContent =
                criterion.reason ||
                "Комментарий отсутствует.";
        }
    );
}


// =====================================================
// XATOLAR
// =====================================================

function displayErrors(errors) {

    const container =
        document.getElementById(
            "errorsList"
        );

    const essayContainer =
        document.getElementById(
            "highlightedEssay"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        "";

    const essay =
        essayText.value.trim();


    // =================================================
    // XATO YO'Q
    // =================================================

    if (
        !errors ||
        errors.length === 0
    ) {

        if (essayContainer) {

            essayContainer.textContent =
                essay;
        }

        container.innerHTML =
            "<p>Ошибок не найдено.</p>";

        return;
    }


    // =================================================
    // ESSENI HIGHLIGHT QILISH
    // =================================================

    if (essayContainer) {

        const fragments = [];

        errors.forEach(
            (error, index) => {

                if (
                    typeof error ===
                        "object" &&
                    error !== null
                ) {

                    const fragment =
                        error.fragment ||
                        "";

                    if (fragment) {

                        fragments.push({

                            fragment:
                                fragment,

                            index:
                                index + 1,

                            correction:
                                error.correction ||
                                "",

                            explanation:
                                error.explanation ||
                                ""
                        });
                    }
                }
            }
        );

        highlightEssay(
            essayContainer,
            essay,
            fragments
        );
    }


    // =================================================
    // XATOLAR RO'YXATI
    // =================================================

    errors.forEach(
        (error, index) => {

            const errorItem =
                document.createElement(
                    "div"
                );

            errorItem.className =
                "error-item";


            if (
                typeof error ===
                    "object" &&
                error !== null
            ) {

                const fragment =
                    error.fragment ||
                    "";

                const type =
                    error.type ||
                    "Ошибка";

                const correction =
                    error.correction ||
                    "";

                const explanation =
                    error.explanation ||
                    "";


                // =====================================
                // NUMBER
                // =====================================

                const number =
                    document.createElement(
                        "div"
                    );

                number.className =
                    "error-number";

                number.textContent =
                    `${index + 1}. ${type}`;

                errorItem.appendChild(
                    number
                );


                // =====================================
                // FRAGMENT
                // =====================================

                if (fragment) {

                    const fragmentElement =
                        document.createElement(
                            "div"
                        );

                    fragmentElement.className =
                        "error-fragment";

                    fragmentElement.textContent =
                        `❌ ${fragment}`;

                    errorItem.appendChild(
                        fragmentElement
                    );
                }


                // =====================================
                // CORRECTION
                // =====================================

                if (correction) {

                    const correctionElement =
                        document.createElement(
                            "div"
                        );

                    correctionElement.className =
                        "error-correction";

                    correctionElement.textContent =
                        `✅ ${correction}`;

                    errorItem.appendChild(
                        correctionElement
                    );
                }


                // =====================================
                // EXPLANATION
                // =====================================

                if (explanation) {

                    const explanationElement =
                        document.createElement(
                            "div"
                        );

                    explanationElement.className =
                        "error-explanation";

                    explanationElement.textContent =
                        explanation;

                    errorItem.appendChild(
                        explanationElement
                    );
                }

            }

            else {

                errorItem.textContent =
                    `${index + 1}. ${error}`;
            }

            container.appendChild(
                errorItem
            );
        }
    );
}


// =====================================================
// ESSENI XATOLAR BILAN BELGILASH
// =====================================================

function highlightEssay(
    container,
    essay,
    fragments
) {

    if (
        !fragments ||
        fragments.length === 0
    ) {

        container.textContent =
            essay;

        return;
    }


    // ================================================
    // FRAGMENTLARNI POZITSIYA BO'YICHA TOPISH
    // ================================================

    const matches = [];

    fragments.forEach(
        item => {

            const fragment =
                item.fragment;

            if (!fragment) {
                return;
            }

            let searchStart = 0;

            while (true) {

                const position =
                    essay.indexOf(
                        fragment,
                        searchStart
                    );

                if (position === -1) {
                    break;
                }

                matches.push({

                    start:
                        position,

                    end:
                        position +
                        fragment.length,

                    index:
                        item.index,

                    correction:
                        item.correction,

                    explanation:
                        item.explanation
                });

                searchStart =
                    position +
                    fragment.length;
            }
        }
    );


    // ================================================
    // POZITSIYA BO'YICHA SARALASH
    // ================================================

    matches.sort(
        (a, b) =>
            a.start - b.start
    );


    // ================================================
    // OVERLAPNI OLIB TASHLASH
    // ================================================

    const cleanMatches = [];

    matches.forEach(
        match => {

            const previous =
                cleanMatches[
                    cleanMatches.length - 1
                ];

            if (
                !previous ||
                match.start >= previous.end
            ) {

                cleanMatches.push(
                    match
                );
            }
        }
    );


    // ================================================
    // HTML QURISH
    // ================================================

    container.innerHTML =
        "";

    let currentPosition =
        0;

    cleanMatches.forEach(
        match => {

            // Oddiy matn
            if (
                currentPosition <
                match.start
            ) {

                const normalText =
                    document.createTextNode(
                        essay.substring(
                            currentPosition,
                            match.start
                        )
                    );

                container.appendChild(
                    normalText
                );
            }


            // Xato fragment
            const errorSpan =
                document.createElement(
                    "span"
                );

            errorSpan.className =
                "essay-error";

            errorSpan.textContent =
                essay.substring(
                    match.start,
                    match.end
                );

            errorSpan.dataset.errorNumber =
                match.index;

            errorSpan.title =
                match.correction
                    ? `Исправление: ${match.correction}`
                    : "Ошибка";

            errorSpan.addEventListener(
                "click",
                () => {

                    showErrorPopup(
                        errorSpan,
                        match
                    );
                }
            );

            container.appendChild(
                errorSpan
            );

            currentPosition =
                match.end;
        }
    );


    // ================================================
    // QOLGAN MATN
    // ================================================

    if (
        currentPosition <
        essay.length
    ) {

        const remainingText =
            document.createTextNode(
                essay.substring(
                    currentPosition
                )
            );

        container.appendChild(
            remainingText
        );
    }
}


// =====================================================
// XATO POPUP
// =====================================================

function showErrorPopup(
    element,
    error
) {

    // Eski popup
    const oldPopup =
        document.querySelector(
            ".essay-error-popup"
        );

    if (oldPopup) {
        oldPopup.remove();
    }


    const popup =
        document.createElement(
            "div"
        );

    popup.className =
        "essay-error-popup";


    const title =
        document.createElement(
            "strong"
        );

    title.textContent =
        `Ошибка №${error.index}`;

    popup.appendChild(
        title
    );


    if (error.correction) {

        const correction =
            document.createElement(
                "div"
            );

        correction.textContent =
            `Исправление: ${error.correction}`;

        popup.appendChild(
            correction
        );
    }


    if (error.explanation) {

        const explanation =
            document.createElement(
                "div"
            );

        explanation.textContent =
            error.explanation;

        popup.appendChild(
            explanation
        );
    }


    element.parentElement.appendChild(
        popup
    );


    setTimeout(
        () => {

            document.addEventListener(
                "click",
                function closePopup(event) {

                    if (
                        !popup.contains(event.target) &&
                        event.target !== element
                    ) {

                        popup.remove();

                        document.removeEventListener(
                            "click",
                            closePopup
                        );
                    }
                }
            );

        },
        0
    );
}


// =====================================================
// TAVSIYALAR
// =====================================================

function displayRecommendations(
    recommendations
) {

    const container =
        document.getElementById(
            "recommendationsList"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        "";


    if (
        !recommendations ||
        recommendations.length === 0
    ) {

        container.innerHTML =
            "<p>Рекомендаций нет.</p>";

        return;
    }


    recommendations.forEach(
        (recommendation, index) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "recommendation-item";


            if (
                typeof recommendation ===
                    "object" &&
                recommendation !== null
            ) {

                item.textContent =
                    recommendation.text ||
                    recommendation.recommendation ||
                    JSON.stringify(
                        recommendation
                    );

            }

            else {

                item.textContent =
                    `${index + 1}. ${recommendation}`;
            }

            container.appendChild(
                item
            );
        }
    );
}


// =====================================================
// BOSHLANG'ICH HOLAT
// =====================================================

analyzeText();