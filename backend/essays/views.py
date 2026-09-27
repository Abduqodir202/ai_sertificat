from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User

from .language_checker import detect_essay_language
from .models import Essay
from .ai_checker import check_essay_with_ai


class CheckEssayAPIView(APIView):

    def post(self, request):
        essay_text = request.data.get("essay", "")
        topic = request.data.get("topic", "")
        student_name = request.data.get("student_name", "").strip()

        # ==========================================
        # 1. MATN BO'SHligini TEKSHIRISH
        # ==========================================

        if not essay_text.strip():
            return Response(
                {
                    "error": "Essay matni bo'sh."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # 2. MATN STATISTIKASI
        # ==========================================

        words = essay_text.split()
        word_count = len(words)
        character_count = len(essay_text)

        paragraphs = [
            p.strip()
            for p in essay_text.split("\n\n")
            if p.strip()
        ]

        paragraph_count = len(paragraphs)

        # ==========================================
        # 3. TEST USER
        # ==========================================

        user, created = User.objects.get_or_create(
            username="test_user"
        )

        # ==========================================
        # 4. TILNI TEKSHIRISH
        # ==========================================

        language_result = detect_essay_language(essay_text)

        print("========== LANGUAGE ==========")
        print(language_result)
        print("==============================")

        if not language_result["is_russian"]:
            return Response(
                {
                    "error": "Эссе должно быть написано на русском языке.",
                    "language": language_result
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # 5. AI ORQALI TEKSHIRISH
        # ==========================================

        try:
            ai_result = check_essay_with_ai(
                essay_text=essay_text,
                topic=topic
            )

            print("========== AI RESULT ==========")
            print(ai_result)
            print("===============================")

        except Exception as e:
            print("========== AI ERROR ==========")
            print(str(e))
            print("==============================")

            return Response(
                {
                    "error": "AI tekshiruvda xatolik.",
                    "details": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ==========================================
        # 6. MAVZU MOSLIGINI QAT'IY TEKSHIRISH
        # ==========================================

        topic_check = ai_result.get("topic_check", {})

        if not isinstance(topic_check, dict):
            return Response(
                {
                    "error": "AI topic_check qaytarmadi.",
                    "ai_result": ai_result
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        topic_valid = topic_check.get("valid")
        topic_match = topic_check.get("match")
        topic_reason = str(
            topic_check.get("reason") or ""
        ).strip()

        # valid faqat true/false bo'lishi kerak
        if not isinstance(topic_valid, bool):
            return Response(
                {
                    "error": "AI topic_check.valid noto'g'ri.",
                    "topic_check": topic_check
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if topic_match not in {"full", "partial", "none"}:
            return Response(
                {
                    "error": "AI topic_check.match noto'g'ri.",
                    "topic_check": topic_check
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        print("========== TOPIC CHECK ==========")
        print("Valid:", topic_valid)
        print("Match:", topic_match)
        print("Reason:", topic_reason)
        print("=================================")

        # Mavzuning o'zi noto'g'ri bo'lsa,
        # yuqori ball bilan saqlashga yo'l qo'ymaymiz.
        if not topic_valid:
            return Response(
                {
                    "error": "Тема письменной работы некорректна.",
                    "topic_check": topic_check
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Essay boshqa mavzuni yoritgan bo'lsa,
        # natijani saqlamaymiz.
        if topic_match == "none":
            return Response(
                {
                    "error": "Эссе не соответствует теме.",
                    "topic_check": topic_check
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # 7. 12 TA KRITERIYNI OLISH
        # ==========================================

        criteria = ai_result.get("criteria", [])

        print("========== CRITERIA ==========")

        for i, criterion in enumerate(criteria, 1):
            print(f"K{i}: {criterion}")

        print("==============================")

        # ==========================================
        # 7. 12 TA KRITERIY BORLIGINI TEKSHIRISH
        # ==========================================

        if len(criteria) != 12:
            return Response(
                {
                    "error": "AI 12 ta mezon bo'yicha natija qaytarmadi.",
                    "ai_result": ai_result
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ==========================================
        # 8. HAR BIR KRITERIY BALLINI TEKSHIRISH
        # ==========================================

        allowed_scores = {0, 0.5, 1, 1.5, 2}

        for index, criterion in enumerate(criteria, 1):

            try:
                score = float(criterion.get("score", 0))
            except (TypeError, ValueError):

                return Response(
                    {
                        "error": f"K{index} kriteriy uchun noto'g'ri ball qaytdi.",
                        "criterion": criterion
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            if score not in allowed_scores:

                return Response(
                    {
                        "error": (
                            f"K{index} kriteriy uchun ball "
                            f"noto'g'ri: {score}. "
                            f"Ruxsat etilgan ballar: "
                            f"0, 0.5, 1, 1.5, 2."
                        ),
                        "criterion": criterion
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # ==========================================
        # 9. TOTAL SCORE
        # ==========================================
        #
        # MUHIM:
        # AI yuborgan total_score ishlatilmaydi.
        #
        # Backend 12 ta kriteriyni o'zi qo'shadi.
        #
        # Maksimal:
        # 12 * 2 = 24
        #
        # ==========================================

        total_score = sum(
            float(criterion.get("score", 0))
            for criterion in criteria
        )

        print("========== TOTAL SCORE ==========")
        print(total_score)
        print("=================================")

        # ==========================================
        # 10. TOTAL SCORE NI TEKSHIRISH
        # ==========================================

        if total_score < 0 or total_score > 24:

            return Response(
                {
                    "error": "Hisoblangan umumiy ball noto'g'ri.",
                    "total_score": total_score
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ==========================================
        # 11. AI REVIEW
        # ==========================================

        ai_review = ai_result.get(
            "review",
            ""
        )

        # ==========================================
        # 12. ERRORS
        # ==========================================

        errors = ai_result.get(
            "errors",
            []
        )

        # ==========================================
        # 13. RECOMMENDATIONS
        # ==========================================

        recommendations = ai_result.get(
            "recommendations",
            []
        )

        # ==========================================
        # 14. DATABASE GA SAQLASH
        # ==========================================

        essay = Essay.objects.create(

            user=user,

            essay_text=essay_text,

            topic=topic,

            student_name=student_name,

            word_count=word_count,

            character_count=character_count,

            paragraph_count=paragraph_count,

            # AI emas,
            # backend hisoblagan ball
            total_score=total_score,

            # ======================================
            # CRITERIA SCORES
            # ======================================

            criterion_1=criteria[0].get("score", 0),

            criterion_2=criteria[1].get("score", 0),

            criterion_3=criteria[2].get("score", 0),

            criterion_4=criteria[3].get("score", 0),

            criterion_5=criteria[4].get("score", 0),

            criterion_6=criteria[5].get("score", 0),

            criterion_7=criteria[6].get("score", 0),

            criterion_8=criteria[7].get("score", 0),

            criterion_9=criteria[8].get("score", 0),

            criterion_10=criteria[9].get("score", 0),

            criterion_11=criteria[10].get("score", 0),

            criterion_12=criteria[11].get("score", 0),

            # ======================================
            # CRITERIA REASONS
            # ======================================

            criterion_1_reason=criteria[0].get(
                "reason",
                ""
            ),

            criterion_2_reason=criteria[1].get(
                "reason",
                ""
            ),

            criterion_3_reason=criteria[2].get(
                "reason",
                ""
            ),

            criterion_4_reason=criteria[3].get(
                "reason",
                ""
            ),

            criterion_5_reason=criteria[4].get(
                "reason",
                ""
            ),

            criterion_6_reason=criteria[5].get(
                "reason",
                ""
            ),

            criterion_7_reason=criteria[6].get(
                "reason",
                ""
            ),

            criterion_8_reason=criteria[7].get(
                "reason",
                ""
            ),

            criterion_9_reason=criteria[8].get(
                "reason",
                ""
            ),

            criterion_10_reason=criteria[9].get(
                "reason",
                ""
            ),

            criterion_11_reason=criteria[10].get(
                "reason",
                ""
            ),

            criterion_12_reason=criteria[11].get(
                "reason",
                ""
            ),

            # ======================================
            # REVIEW
            # ======================================

            ai_review=ai_review,

            # ======================================
            # ERRORS
            # ======================================

            errors=errors,

            # ======================================
            # RECOMMENDATIONS
            # ======================================

            recommendations=recommendations
        )

        # ==========================================
        # 15. FRONTENDGA NATIJA
        # ==========================================

        return Response(
            {
                "id": essay.id,

                "total_score": essay.total_score,

                "word_count": essay.word_count,

                "character_count": essay.character_count,

                "paragraph_count": essay.paragraph_count,

                "review": essay.ai_review,

                "topic_check": topic_check,

                "errors": essay.errors,

                "recommendations": essay.recommendations,

                "criteria": [

                    {
                        "score": essay.criterion_1,
                        "reason": essay.criterion_1_reason
                    },

                    {
                        "score": essay.criterion_2,
                        "reason": essay.criterion_2_reason
                    },

                    {
                        "score": essay.criterion_3,
                        "reason": essay.criterion_3_reason
                    },

                    {
                        "score": essay.criterion_4,
                        "reason": essay.criterion_4_reason
                    },

                    {
                        "score": essay.criterion_5,
                        "reason": essay.criterion_5_reason
                    },

                    {
                        "score": essay.criterion_6,
                        "reason": essay.criterion_6_reason
                    },

                    {
                        "score": essay.criterion_7,
                        "reason": essay.criterion_7_reason
                    },

                    {
                        "score": essay.criterion_8,
                        "reason": essay.criterion_8_reason
                    },

                    {
                        "score": essay.criterion_9,
                        "reason": essay.criterion_9_reason
                    },

                    {
                        "score": essay.criterion_10,
                        "reason": essay.criterion_10_reason
                    },

                    {
                        "score": essay.criterion_11,
                        "reason": essay.criterion_11_reason
                    },

                    {
                        "score": essay.criterion_12,
                        "reason": essay.criterion_12_reason
                    }

                ]
            }
        )
