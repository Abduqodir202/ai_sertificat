// =====================================================
// AI SERTIFIKAT
// RUS TILI ESSE — FRONTEND
// 75 BALLIK TIZIM
// =====================================================

console.log("RUS ESSE JS ISHLAYAPTI");


// =====================================================
// ELEMENTLAR
// =====================================================

const essayText =
    document.getElementById("essayText");
    const essayFile =
    document.getElementById("essayFile");

const ocrStatus =
    document.getElementById("ocrStatus");

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
// 75 BALL NATIJASINI KO'RSATISH
// =====================================================

function displayOfficialResult(score75) {

    const score = Number(score75);

    if (score75Element) {

        score75Element.textContent =
            Number.isFinite(score)
                ? `${score} / 75`
                : "— / 75";
    }

    // Rasmiy daraja backenddan kelmasa,
    // avtomatik A/B/C chiqarmaymiz.
    if (scoreLevelElement) {

        scoreLevelElement.textContent =
            "—";
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


    if (wordCount) {

        wordCount.textContent =
            wordsNumber;
    }

    if (charCount) {

        charCount.textContent =
            charactersNumber;
    }

    if (paragraphCount) {

        paragraphCount.textContent =
            paragraphsNumber;
    }


    // =================================================
    // WORD STATUS
    // =================================================

    if (!wordStatus) {
        return;
    }

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

if (essayText) {

    essayText.addEventListener(
        "input",
        analyzeText
    );
}


// =====================================================
// ESSENI TEKSHIRISH
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


    if (!button) {

        console.error(
            "Кнопка .check-btn не найдена."
        );

        return;
    }


    const originalText =
        button.textContent;


    button.disabled =
        true;

    button.textContent =
        "⏳ Проверка...";


    try {

        // =================================================
        // DJANGO UCHUN MA'LUMOT
        // =================================================

        const requestData = {

            essay:
                text,

            topic:
                topic,

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


        if (totalScore) {

            totalScore.textContent =
                "—";
        }


        if (score75Element) {

            score75Element.textContent =
                "— / 75";
        }


        if (scoreLevelElement) {

            scoreLevelElement.textContent =
                "—";
        }


        if (reviewText) {

            reviewText.textContent =
                "Сервер проверки недоступен. " +
                "Проверьте Django backend.";
        }
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

    if (!result) {
        return;
    }


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
    // UMUMIY BALL — 75 BALL
    // =================================================

    if (
        data.total_score !== undefined
    ) {

        const score =
            Number(
                data.total_score
            );


        if (totalScore) {

            totalScore.textContent =
                Number.isFinite(score)
                    ? score
                    : "—";
        }


        displayOfficialResult(
            score
        );
    }


    // =================================================
    // REVIEW
    // =================================================

    if (
        data.review &&
        reviewText
    ) {

        reviewText.textContent =
            data.review;
    }


    // =================================================
    // 6 TA MEZON
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
// 6 TA MEZON
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

                const maxScore =
                    criterion.max_score !== undefined
                        ? criterion.max_score
                        : getMaxScore(index);


                scoreElement.textContent =
                    `${criterion.score} / ${maxScore}`;
            }


            // =========================================
            // IZOH
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
// MAX BALL
// =====================================================

function getMaxScore(index) {

    const maxScores = [

        20,

        15,

        10,

        10,

        10,

        10
    ];


    return (
        maxScores[index] || 0
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
                                index,

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
                    "Языковая ошибка";

                const correction =
                    error.correction ||
                    "";

                const explanation =
                    error.explanation ||
                    "";


                // =====================================
                // ERROR TYPE
                // =====================================

                const typeElement =
                    document.createElement(
                        "div"
                    );


                typeElement.className =
                    "error-type";


                typeElement.textContent =
                    `${index + 1}. ${type}`;


                errorItem.appendChild(
                    typeElement
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


    // =================================================
    // FRAGMENTLARNI TOPISH
    // =================================================

    const matches = [];


    fragments.forEach(
        item => {

            const fragment =
                item.fragment;


            if (!fragment) {

                return;
            }


            let searchStart =
                0;


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


    // =================================================
    // SARALASH
    // =================================================

    matches.sort(
        (a, b) =>
            a.start - b.start
    );


    // =================================================
    // OVERLAPNI OLIB TASHLASH
    // =================================================

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


    // =================================================
    // HTML QURISH
    // =================================================

    container.innerHTML =
        "";


    let currentPosition =
        0;


    cleanMatches.forEach(
        match => {

            // =========================================
            // ODDIY MATN
            // =========================================

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


            // =========================================
            // XATO FRAGMENT
            // =========================================

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


    // =================================================
    // QOLGAN MATN
    // =================================================

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

    // Eski popupni o'chirish

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


    // =================================================
    // TITLE
    // =================================================

    const title =
        document.createElement(
            "strong"
        );


    title.textContent =
        `Ошибка №${Number(error.index) + 1}`;


    popup.appendChild(
        title
    );


    // =================================================
    // CORRECTION
    // =================================================

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


    // =================================================
    // EXPLANATION
    // =================================================

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
                        !popup.contains(
                            event.target
                        ) &&
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
// OCR — RASM / PDF DAN MATN OLISH
// =====================================================

if (essayFile) {

    essayFile.addEventListener("change", async function () {

        const file = this.files[0];

        if (!file) {
            return;
        }

        if (ocrStatus) {
            ocrStatus.textContent =
                "⏳ Fayl o‘qilmoqda...";
        }

        const formData = new FormData();

        formData.append("file", file);

        try {

            const response = await fetch(
                "/api/ocr/",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "OCR xatosi"
                );
            }

            if (essayText) {

                essayText.value =
                    data.text || "";

                analyzeText();
            }

            if (ocrStatus) {

                ocrStatus.textContent =
                    "✅ Matn muvaffaqiyatli olindi.";
            }

        }
        catch (error) {

            console.error(
                "OCR error:",
                error
            );

            if (ocrStatus) {

                ocrStatus.textContent =
                    "❌ Faylni o‘qib bo‘lmadi.";
            }

            alert(
                "OCR xatosi: " +
                error.message
            );
        }

    });

}


// =====================================================
// BOSHLANG'ICH HOLAT
// =====================================================

analyzeText();