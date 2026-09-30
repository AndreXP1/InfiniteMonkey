import unicodedata
from pathlib import Path

def normalize_text(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )

def clean_dictionary(input_file: str, output_file: str, min_len: int = 3, max_len: int = 16):
    input_path = Path(input_file)
    output_path = Path(output_file)

    clean_words = set()

    with open(input_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            raw_word = line.strip()

            normalized = normalize_text(raw_word).upper()

            if normalized.isalpha() and min_len <= len(normalized) <= max_len:
                clean_words.add(normalized)


    with open(output_path, "w", encoding="utf-8") as f:
        for word in sorted(clean_words):
            f.write(f"{word}\n")

    print(f"Dictionary processed {len(clean_words)} words saved in {output_path}")