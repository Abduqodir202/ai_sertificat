import io

import fitz  # PyMuPDF
import pytesseract
from PIL import Image, ImageOps, ImageFilter


# Windows'dagi Tesseract manzili
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def preprocess_image(image):
    """OCR uchun rasmni tayyorlash."""

    if image.mode != "RGB":
        image = image.convert("RGB")

    # Kulrang
    image = ImageOps.grayscale(image)

    # Kontrastni yaxshilash
    image = ImageOps.autocontrast(image)

    # Aniqlikni biroz oshirish
    image = image.filter(ImageFilter.SHARPEN)

    return image


def image_to_text(image_bytes):
    """JPG/PNG/WEBP rasmdan matn olish."""

    image = Image.open(io.BytesIO(image_bytes))

    image = preprocess_image(image)

    text = pytesseract.image_to_string(
        image,
        lang="rus+eng"
    )

    return text.strip()


def pdf_to_text(pdf_bytes):
    """
    PDF'dan matn olish.

    Oddiy PDF bo'lsa:
        PDF → matn

    Skan PDF bo'lsa:
        PDF → rasm → OCR → matn
    """

    document = fitz.open(
        stream=pdf_bytes,
        filetype="pdf"
    )

    all_text = []

    for page in document:

        # 1. Avval PDF ichidagi tayyor matnni olamiz
        text = page.get_text("text").strip()

        if text:
            all_text.append(text)
            continue

        # 2. Matn bo'lmasa, sahifani rasmga aylantiramiz
        pix = page.get_pixmap(
            matrix=fitz.Matrix(2, 2),
            alpha=False
        )

        image_bytes = pix.tobytes("png")

        # 3. OCR
        text = image_to_text(image_bytes)

        if text:
            all_text.append(text)

    document.close()

    return "\n\n".join(all_text).strip()


def file_to_text(file):
    """Rasm yoki PDF faylni matnga aylantirish."""

    filename = file.name.lower()

    file_bytes = file.read()

    # Rasm
    if filename.endswith(
        (".jpg", ".jpeg", ".png", ".webp")
    ):
        return image_to_text(file_bytes)

    # PDF
    if filename.endswith(".pdf"):
        return pdf_to_text(file_bytes)

    raise ValueError(
        "Faqat JPG, JPEG, PNG, WEBP yoki PDF "
        "fayl yuborish mumkin."
    )

if __name__ == "__main__":
    print("OCR ishlayapti!")
if __name__ == "__main__":
    with open("backend/essays/test_esse.pdf", "rb") as file:
        text = pdf_to_text(file.read())

    print("\n--- PDF OCR NATIJA ---\n")
    print(text)