from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .ocr import file_to_text


from django.contrib.auth.models import User

from .language_checker import detect_essay_language
from .models import Essay
from .ai_checker import check_essay_with_ai


# =====================================================
# 75 BALLIK RUS TILI ESSE TEKSHIRUVI
# =====================================================

class CheckEssayAPIView(APIView):

    def post(self, request):

        # =================================================
        # 1. KIRUVCHI MA'LUMOTLAR
        # =================================================

        essay_text = request.data.get(
            "essay",
            ""
        )

        topic = request.data.get(
            "topic",
            ""
        )

        student_name = request.data.get(
            "student_name",
            ""
        ).strip()

        # =================================================
        # 2. MATN BO'SHLIGINI TEKSHIRISH
        # =================================================

        if not isinstance(essay_text, str):
            essay_text = str(essay_text)

        if not essay_text.strip():
            return Response(
                {
                    "error": "Essay matni bo'sh."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(topic, str):
            topic = str(topic)

        # =================================================
        # 3. MATN STATISTIKASI
        # =================================================

        words = essay_text.split()

        word_count = len(words)

        character_count = len(essay_text)

        paragraphs = [
            p.strip()
            for p in essay_text.split("\n\n")
            if p.strip()
        ]

        paragraph_count = len(paragraphs)

        # =================================================
        # 4. TEST USER
        # =================================================

        user, created = User.objects.get_or_create(
            username="test_user"
        )

        # =================================================
        # 5. TILNI TEKSHIRISH
        # =================================================

        try:

            language_result = detect_essay_language(
                essay_text
            )

        except Exception as e:

            print(
                "========== LANGUAGE ERROR =========="
            )

            print(str(e))

            print(
                "===================================="
            )

            return Response(
                {
                    "error": "Tilni aniqlashda xatolik.",
                    "details": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        print(
            "========== LANGUAGE =========="
        )

        print(language_result)

        print(
            "=============================="
        )

        # =================================================
        # RUS TILI EMAS
        # =================================================

        if not isinstance(language_result, dict):

            return Response(
                {
                    "error": "Til tekshiruvi noto'g'ri javob qaytardi.",
                    "language": language_result
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not language_result.get("is_russian", False):

            return Response(
                {
                    "error":
                        "Эссе должно быть написано на русском языке.",

                    "language":
                        language_result
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =================================================
        # 6. AI ORQALI TEKSHIRISH
        # =================================================

        try:

            ai_result = check_essay_with_ai(
                essay_text=essay_text,
                topic=topic
            )

        except Exception as e:

            print(
                "========== AI ERROR =========="
            )

            print(str(e))

            print(
                "=============================="
            )

            return Response(
                {
                    "error":
                        "AI tekshiruvda xatolik.",

                    "details":
                        str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        print(
            "========== AI RESULT =========="
        )

        print(ai_result)

        print(
            "==============================="
        )

        # =================================================
        # AI RESULT DICT BO'LISHI KERAK
        # =================================================

        if not isinstance(ai_result, dict):

            return Response(
                {
                    "error":
                        "AI noto'g'ri formatda javob qaytardi.",

                    "ai_result":
                        ai_result
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # =================================================
        # 7. MAVZU MOSLIGINI TEKSHIRISH
        # =================================================

        topic_check = ai_result.get(
            "topic_check",
            {}
        )

        if not isinstance(topic_check, dict):

            return Response(
                {
                    "error":
                        "AI topic_check qaytarmadi.",

                    "ai_result":
                        ai_result
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        topic_valid = topic_check.get(
            "valid"
        )

        topic_match = topic_check.get(
            "match"
        )

        topic_reason = str(
            topic_check.get(
                "reason",
                ""
            ) or ""
        ).strip()

        # =================================================
        # VALID TEKSHIRISH
        # =================================================

        if not isinstance(
            topic_valid,
            bool
        ):

            return Response(
                {
                    "error":
                        "AI topic_check.valid noto'g'ri.",

                    "topic_check":
                        topic_check
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # =================================================
        # MATCH TEKSHIRISH
        # =================================================

        if topic_match not in {
            "full",
            "partial",
            "none"
        }:

            return Response(
                {
                    "error":
                        "AI topic_check.match noto'g'ri.",

                    "topic_check":
                        topic_check
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        print(
            "========== TOPIC CHECK =========="
        )

        print(
            "Valid:",
            topic_valid
        )

        print(
            "Match:",
            topic_match
        )

        print(
            "Reason:",
            topic_reason
        )

        print(
            "================================="
        )

        # =================================================
        # MAVZU NOTO'G'RI
        # =================================================

        if not topic_valid:

            return Response(
                {
                    "error":
                        "Тема письменной работы некорректна.",

                    "topic_check":
                        topic_check
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =================================================
        # ESSE MAVZUGA MOS EMAS
        # =================================================

        if topic_match == "none":

            return Response(
                {
                    "error":
                        "Эссе не соответствует теме.",

                    "topic_check":
                        topic_check
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =================================================
        # 8. 6 TA KRITERIYNI OLISH
        # =================================================

        criteria = ai_result.get(
            "criteria",
            []
        )

        print(
            "========== CRITERIA =========="
        )

        for i, criterion in enumerate(
            criteria,
            1
        ):

            print(
                f"K{i}: {criterion}"
            )

        print(
            "=============================="
        )

        # =================================================
        # 9. AYNAN 6 TA KRITERIY
        # =================================================

        if len(criteria) != 6:

            return Response(
                {
                    "error":
                        "AI 6 ta mezon bo'yicha natija qaytarmadi.",

                    "criteria_count":
                        len(criteria),

                    "ai_result":
                        ai_result
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # =================================================
        # 10. KRITERIY MAX BALLARI
        # =================================================

        max_scores = [
            20,
            15,
            10,
            10,
            10,
            10
        ]

        # =================================================
        # KRITERIY NOMLARI
        # =================================================

        criterion_names = [

            "Раскрытие темы (содержание)",

            "Аргументация и примеры",

            "Структура и логика",

            "Лексика и стилистика",

            "Грамотность",

            "Оригинальность (самостоятельность мысли)"
        ]

        # =================================================
        # 11. BALLARNI TEKSHIRISH
        # =================================================

        cleaned_criteria = []

        for index, criterion in enumerate(
            criteria
        ):

            # -------------------------------------------------
            # DICT TEKSHIRISH
            # -------------------------------------------------

            if not isinstance(
                criterion,
                dict
            ):

                return Response(
                    {
                        "error":
                            (
                                f"K{index + 1} kriteriy "
                                "noto'g'ri formatda."
                            ),

                        "criterion":
                            criterion
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # -------------------------------------------------
            # SCORE
            # -------------------------------------------------

            try:

                score = float(
                    criterion.get(
                        "score",
                        0
                    )
                )

            except (
                TypeError,
                ValueError
            ):

                return Response(
                    {
                        "error":
                            (
                                f"K{index + 1} kriteriy "
                                "uchun noto'g'ri ball qaytdi."
                            ),

                        "criterion":
                            criterion
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # -------------------------------------------------
            # MAX SCORE
            # -------------------------------------------------

            max_score = max_scores[index]

            # -------------------------------------------------
            # 0 DAN MAX GACHA
            # -------------------------------------------------

            if score < 0 or score > max_score:

                return Response(
                    {
                        "error":
                            (
                                f"K{index + 1} kriteriy uchun "
                                f"ball noto'g'ri: {score}. "
                                f"Ruxsat etilgan oraliq: "
                                f"0–{max_score}."
                            ),

                        "criterion":
                            criterion
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # -------------------------------------------------
            # 0.5 QADAM
            # -------------------------------------------------

            if not (
                abs(
                    score * 2
                    -
                    round(score * 2)
                )
                <
                1e-9
            ):

                return Response(
                    {
                        "error":
                            (
                                f"K{index + 1} kriteriy "
                                "uchun ball 0.5 qadamda "
                                "bo'lishi kerak."
                            ),

                        "criterion":
                            criterion
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # -------------------------------------------------
            # REASON
            # -------------------------------------------------

            reason = str(
                criterion.get(
                    "reason",
                    ""
                ) or ""
            ).strip()

            if not reason:

                return Response(
                    {
                        "error":
                            (
                                f"K{index + 1} kriteriy "
                                "uchun reason bo'sh."
                            ),

                        "criterion":
                            criterion
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # -------------------------------------------------
            # TOZALANGAN KRITERIY
            # -------------------------------------------------

            cleaned_score = (
                int(score)
                if score.is_integer()
                else score
            )

            cleaned_criteria.append(
                {
                    "name":
                        criterion_names[index],

                    "score":
                        cleaned_score,

                    "max_score":
                        max_score,

                    "reason":
                        reason
                }
            )

        # =================================================
        # 12. TOTAL SCORE
        # =================================================
        #
        # 20 + 15 + 10 + 10 + 10 + 10 = 75
        #
        # AI yuborgan total_score ishlatilmaydi.
        # Backend o'zi hisoblaydi.
        # =================================================

        total_score = sum(
            float(
                criterion["score"]
            )
            for criterion
            in cleaned_criteria
        )

        print(
            "========== TOTAL SCORE =========="
        )

        print(total_score)

        print(
            "================================="
        )

        # =================================================
        # 13. TOTAL SCORENI TEKSHIRISH
        # =================================================

        if (
            total_score < 0
            or
            total_score > 75
        ):

            return Response(
                {
                    "error":
                        "Hisoblangan umumiy ball noto'g'ri.",

                    "total_score":
                        total_score
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # =================================================
        # INTEGER QILISH
        # =================================================

        if total_score.is_integer():
            total_score = int(total_score)

        # =================================================
        # 14. AI REVIEW
        # =================================================

        ai_review = str(
            ai_result.get(
                "review",
                ""
            ) or ""
        ).strip()

        # =================================================
        # 15. ERRORS
        # =================================================

        errors = ai_result.get(
            "errors",
            []
        )

        if not isinstance(
            errors,
            list
        ):

            errors = []

        cleaned_errors = []

        for error in errors:

            if not isinstance(
                error,
                dict
            ):
                continue

            fragment = str(
                error.get(
                    "fragment",
                    ""
                ) or ""
            ).strip()

            if not fragment:
                continue

            # AI essayda yo'q fragmentni
            # qaytarmasligi uchun

            if fragment not in essay_text:
                continue

            cleaned_errors.append(
                {
                    "fragment":
                        fragment,

                    "type":
                        str(
                            error.get(
                                "type",
                                "Языковая ошибка"
                            )
                            or
                            "Языковая ошибка"
                        ).strip(),

                    "correction":
                        str(
                            error.get(
                                "correction",
                                ""
                            )
                            or
                            ""
                        ).strip(),

                    "explanation":
                        str(
                            error.get(
                                "explanation",
                                ""
                            )
                            or
                            ""
                        ).strip()
                }
            )

        # =================================================
        # 16. RECOMMENDATIONS
        # =================================================

        recommendations = ai_result.get(
            "recommendations",
            []
        )

        if not isinstance(
            recommendations,
            list
        ):

            recommendations = []

        recommendations = [

            str(item).strip()

            for item
            in recommendations

            if str(item).strip()
        ]

        # =================================================
        # 17. DATABASE GA SAQLASH
        # =================================================

        try:

            essay = Essay.objects.create(

                user=user,

                essay_text=
                    essay_text,

                topic=
                    topic,

                student_name=
                    student_name,

                word_count=
                    word_count,

                character_count=
                    character_count,

                paragraph_count=
                    paragraph_count,

                # =========================================
                # 75 BALL
                # =========================================

                total_score=
                    total_score,

                # =========================================
                # 6 TA CRITERION SCORE
                # =========================================

                criterion_1=
                    cleaned_criteria[0]["score"],

                criterion_2=
                    cleaned_criteria[1]["score"],

                criterion_3=
                    cleaned_criteria[2]["score"],

                criterion_4=
                    cleaned_criteria[3]["score"],

                criterion_5=
                    cleaned_criteria[4]["score"],

                criterion_6=
                    cleaned_criteria[5]["score"],

                # =========================================
                # 6 TA CRITERION REASON
                # =========================================

                criterion_1_reason=
                    cleaned_criteria[0]["reason"],

                criterion_2_reason=
                    cleaned_criteria[1]["reason"],

                criterion_3_reason=
                    cleaned_criteria[2]["reason"],

                criterion_4_reason=
                    cleaned_criteria[3]["reason"],

                criterion_5_reason=
                    cleaned_criteria[4]["reason"],

                criterion_6_reason=
                    cleaned_criteria[5]["reason"],

                # =========================================
                # REVIEW
                # =========================================

                ai_review=
                    ai_review,

                # =========================================
                # ERRORS
                # =========================================

                errors=
                    cleaned_errors,

                # =========================================
                # RECOMMENDATIONS
                # =========================================

                recommendations=
                    recommendations
            )

        except Exception as e:

            print(
                "========== DATABASE ERROR =========="
            )

            print(str(e))

            print(
                "===================================="
            )

            return Response(
                {
                    "error":
                        "Essayni databasega saqlashda xatolik.",

                    "details":
                        str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # =================================================
        # 18. FRONTENDGA NATIJA
        # =================================================

        return Response(
            {

                "id":
                    essay.id,

                # =========================================
                # UMUMIY BALL
                # =========================================

                "total_score":
                    essay.total_score,

                "max_score":
                    75,

                # =========================================
                # STATISTIKA
                # =========================================

                "word_count":
                    essay.word_count,

                "character_count":
                    essay.character_count,

                "paragraph_count":
                    essay.paragraph_count,

                # =========================================
                # REVIEW
                # =========================================

                "review":
                    essay.ai_review,

                # =========================================
                # TOPIC
                # =========================================

                "topic_check":
                    topic_check,

                # =========================================
                # ERRORS
                # =========================================

                "errors":
                    essay.errors,

                # =========================================
                # RECOMMENDATIONS
                # =========================================

                "recommendations":
                    essay.recommendations,

                # =========================================
                # 6 TA KRITERIY
                # =========================================

                "criteria": [

                    {
                        "name":
                            criterion_names[0],

                        "score":
                            essay.criterion_1,

                        "max_score":
                            20,

                        "reason":
                            essay.criterion_1_reason
                    },

                    {
                        "name":
                            criterion_names[1],

                        "score":
                            essay.criterion_2,

                        "max_score":
                            15,

                        "reason":
                            essay.criterion_2_reason
                    },

                    {
                        "name":
                            criterion_names[2],

                        "score":
                            essay.criterion_3,

                        "max_score":
                            10,

                        "reason":
                            essay.criterion_3_reason
                    },

                    {
                        "name":
                            criterion_names[3],

                        "score":
                            essay.criterion_4,

                        "max_score":
                            10,

                        "reason":
                            essay.criterion_4_reason
                    },

                    {
                        "name":
                            criterion_names[4],

                        "score":
                            essay.criterion_5,

                        "max_score":
                            10,

                        "reason":
                            essay.criterion_5_reason
                    },

                    {
                        "name":
                            criterion_names[5],

                        "score":
                            essay.criterion_6,

                        "max_score":
                            10,

                        "reason":
                            essay.criterion_6_reason
                    }
                ]
            },
            status=status.HTTP_200_OK
        )

class OCRAPIView(APIView):
    def post(self, request):
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response(
                {"error": "Fayl yuborilmadi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            text = file_to_text(uploaded_file)

            if not text.strip():
                return Response(
                    {"error": "Fayldan matn topilmadi."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response({
                "text": text,
                "word_count": len(text.split()),
                "character_count": len(text)
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            print("========== OCR ERROR ==========")
            print(str(e))
            print("===============================")

            return Response(
                {
                    "error": "OCR ishlashida xatolik.",
                    "details": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )