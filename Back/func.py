import numpy as np
from datetime import date, datetime
import string


CHAR_SET = np.frombuffer(string.ascii_letters.encode('ascii'), dtype = np.uint8)


def generate_random_chars(size: int, size_block: int = 65536):
    generate = 0
    while generate < size:
        bytes_to_gen = min(size_block, size - generate)
        index = np.random.randint(0, len(CHAR_SET), size=bytes_to_gen)
        yield CHAR_SET[index].tobytes()
        generate += bytes_to_gen

