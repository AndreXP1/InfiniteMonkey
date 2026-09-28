import string

import numpy as np
import requests

CHAR_SET = np.frombuffer(string.ascii_uppercase.encode('ascii'), dtype = np.uint8)
rng = np.random.default_rng()
game_words = []

def generate_random_chars(size: int, size_block: int = 65536):
    generate = 0
    while generate < size:
        bytes_to_gen = min(size_block, size - generate)
        index = np.random.randint(0, len(CHAR_SET), size=bytes_to_gen)
        yield CHAR_SET[index].tobytes()
        generate += bytes_to_gen


def get_random_words():
    single_int = rng.integers(3, 10)
    length = rng.integers(3, 10)
    url = f"https://random-word-api.herokuapp.com/word?number={single_int}&length={length}"

    res = requests.get(url, timeout=10)
    res.raise_for_status()
    game_words = [word.upper() for word in res.json()]
    return game_words