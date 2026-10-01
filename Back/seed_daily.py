import argparse
import hashlib
import random
from datetime import date
from pathlib import Path

from db import database_connection


DICTIONARY_FILE = Path(__file__).resolve().parent / "words_en_clean.txt"


def load_words() -> list[str]:
    return sorted(
        {
            word.strip().upper()
            for word in DICTIONARY_FILE.read_text(encoding="utf-8").splitlines()
            if word.strip().isalpha() and 3 <= len(word.strip()) <= 10
        }
    )

def choose_words(challenge_date: date, amount: int) -> list[str]:
    words = load_words()

    seed = hashlib.sha256(
        f"infinite-monkey:{challenge_date.isoformat()}".encode("utf-8")
    ).digest()

    generator = random.Random(seed)
    return generator.sample(words, amount)

def seed_challenge(
        challenge_date: date,
        word_count: int = 4,
        max_attempts: int = 10,
) -> None:
    selected_words = choose_words(challenge_date, word_count)

    with database_connection() as connection:
        with connection.cursor() as cursor:
            challenge = connection.execute(
                """
                insert into daily_challenges (
                    challenge_date,
                    max_attempts,
                    official_word_count
                )
                values (%s, %s, %s)
                on conflict (challenge_date) do update
                set max_attempts = excluded.max_attempts,
                    official_word_count = excluded.official_word_count
                returning id
                """,
                (challenge_date, max_attempts, word_count),
            ).fetchone()

            connection.execute(
                "delete from challenge_words where challenge_id = %s",
                (challenge["id"],),
            )
            cursor.executemany(
                """
                insert into challenge_words(
                    challenge_id,
                    word_order,
                    target_word
                )
                values (%s, %s, %s)
                """,
                [
                    (challenge["id"], order, word)
                    for order, word in enumerate(selected_words, start = 1)
                ],
            )

        print(f"Challenge date: {challenge_date}")
        print(f"Official words: {', '.join(selected_words)}")
        print(f"Maximum attempts: {max_attempts}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--date",
        type=date.fromisoformat,
        required=True,
        help="Challenge date in YYYY-MM-DD format",
    )
    parser.add_argument("--words", type=int, default=4)
    parser.add_argument("--attempts", type=int, default=10)

    arguments = parser.parse_args()

    seed_challenge(
        challenge_date=arguments.date,
        word_count=arguments.words,
        max_attempts=arguments.attempts,
    )