from langdetect import detect_langs, DetectorFactory

DetectorFactory.seed = 0


def detect_essay_language(text):
    """
    Matnning qaysi til(lar)da yozilganini aniqlaydi.
    """

    text = text.strip()

    if not text:
        return {
            "language": "unknown",
            "is_russian": False,
            "mixed": False,
            "languages": []
        }

    try:
        detected = detect_langs(text)

        languages = []

        for item in detected:
            languages.append({
                "language": item.lang,
                "probability": round(item.prob, 3)
            })

        main_language = detected[0].lang

        return {
            "language": main_language,
            "is_russian": main_language == "ru",
            "mixed": len(detected) > 1,
            "languages": languages
        }

    except Exception:
        return {
            "language": "unknown",
            "is_russian": False,
            "mixed": False,
            "languages": []
        }